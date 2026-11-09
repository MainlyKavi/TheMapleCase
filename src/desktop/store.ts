'use client';

// Tiny external stores (useSyncExternalStore). Each store holds immutable state; components
// subscribe to the slice they render. No dependency needed.

import { useMemo, useSyncExternalStore } from 'react';
import type { ClockConfig } from '@/stage/desktop-types';
import { initialStory, type StoryState } from '@/investigation/engine';
import { DEFAULT_PREFS, sanitizePrefs, type Prefs } from './model/prefs';
import { composeFs, emptyOverlay, type Fs, type FsOverlay, type FsSnapshot } from './model/vfs';
import { initialWM, type Bounds, type WMState } from './model/windows';
import type { IconKind } from './model/vfs';

export interface Store<T> {
  get(): T;
  set(next: T | ((s: T) => T)): void;
  subscribe(l: () => void): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next) {
      const value = typeof next === 'function' ? (next as (s: T) => T)(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      listeners.forEach((l) => l());
    },
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

/** Subscribe to a slice. The selector must return a stable value (primitive or existing reference). */
export function useStore<T, S>(store: Store<T>, select: (s: T) => S): S {
  return useSyncExternalStore(
    store.subscribe,
    () => select(store.get()),
    () => select(store.get()),
  );
}

// ---------------------------------------------------------------------------------------------
// Menus and dialogs (shared shapes)

export interface MenuItem {
  label?: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  checked?: boolean;
  separator?: boolean;
  submenu?: MenuItem[];
  icon?: IconKind;
}

export interface AlertSpec {
  title: string;
  message?: string;
  icon?: 'caution' | 'note' | IconKind;
  buttons: { label: string; default?: boolean; cancel?: boolean; action?: () => void }[];
  /** Attach as a sheet to this window instead of a centred alert. */
  sheetFor?: string;
}

export interface UIState {
  menu: string | null;
  contextMenu: { x: number; y: number; items: MenuItem[] } | null;
  /** Selection on the desktop (scope 'desktop') or in a Finder window (scope = window id). */
  selection: { scope: string; ids: string[] };
  dialogs: AlertSpec[];
  switcher: { apps: string[]; index: number } | null;
  spotlight: boolean;
  power: 'on' | 'sleep' | 'off' | 'restarting';
  compact: boolean;
  /** App whose Dock icon is bouncing (launch feedback). */
  bouncing: string | null;
  /** Window id → animation in progress. */
  anim: Record<string, 'minimize' | 'restore' | 'open' | 'close'>;
  clock: ClockConfig;
  notices: { id: number; title: string; body: string }[];
  /** Dock tile screen positions, for minimize/restore animations. */
  dockTargets: Record<string, Bounds>;
}

// ---------------------------------------------------------------------------------------------
// Store instances (one desktop per page)

const VIEWPORT = { w: 1280, h: 800, top: 22, bottom: 70 };

export const wm = createStore<WMState>(initialWM(VIEWPORT));
export const overlay = createStore<FsOverlay>(emptyOverlay());
export const story = createStore<StoryState>(initialStory());
export const snapshot = createStore<FsSnapshot | null>(null);
export const prefs = createStore<Prefs>(DEFAULT_PREFS);
export const ui = createStore<UIState>({
  menu: null,
  contextMenu: null,
  selection: { scope: 'desktop', ids: [] },
  dialogs: [],
  switcher: null,
  spotlight: false,
  power: 'on',
  compact: false,
  bouncing: null,
  anim: {},
  clock: { time: 'system', date: 'system' },
  notices: [],
  dockTargets: {},
});

const PREFS_KEY = 'maple.desktop.prefs.v1';

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) prefs.set(sanitizePrefs(JSON.parse(raw)));
  } catch {
    /* storage blocked or corrupt: defaults */
  }
  prefs.subscribe(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs.get()));
    } catch {
      /* ignore */
    }
  });
}

// Composed filesystem, memoised on the three inputs.
let fsCache: { snap: FsSnapshot | null; ov: FsOverlay; st: StoryState; fs: Fs | null } = { snap: null, ov: overlay.get(), st: story.get(), fs: null };

export function currentFs(): Fs {
  const snap = snapshot.get();
  const ov = overlay.get();
  const st = story.get();
  if (!snap) throw new Error('filesystem not loaded');
  if (fsCache.fs && fsCache.snap === snap && fsCache.ov === ov && fsCache.st === st) return fsCache.fs;
  const fs = composeFs(snap, ov, st);
  fsCache = { snap, ov, st, fs };
  return fs;
}

/** The visible filesystem; re-renders when files, trash or story state change. */
export function useFs(): Fs {
  const snap = useStore(snapshot, (s) => s);
  const ov = useStore(overlay, (s) => s);
  const st = useStore(story, (s) => s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => currentFs(), [snap, ov, st]);
}

export const usePrefs = () => useStore(prefs, (s) => s);
export const useUI = <S,>(select: (s: UIState) => S) => useStore(ui, select);
export const useWM = <S,>(select: (s: WMState) => S) => useStore(wm, select);

// ---------------------------------------------------------------------------------------------
// Per-window command handlers (menus and shortcuts dispatch to the focused window)

type Commands = Record<string, (() => void) | undefined>;
const windowCommands = new Map<string, Commands>();
export const commandVersion = createStore(0);

export function registerCommands(winId: string, cmds: Commands) {
  windowCommands.set(winId, cmds);
  commandVersion.set((v) => v + 1);
  return () => {
    if (windowCommands.get(winId) === cmds) windowCommands.delete(winId);
    commandVersion.set((v) => v + 1);
  };
}

export const getCommands = (winId: string | null): Commands => (winId ? windowCommands.get(winId) ?? {} : {});
