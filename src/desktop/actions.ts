'use client';

// Desktop operations. Every change to windows, files, story state or dialogs goes through
// here, so applications never mutate shared state directly.

import { desktopStage } from '@stage/desktop';
import { fire, handle, initialStory, type StoryAction, type StoryEffect } from '@/investigation/engine';
import { appFor, canTrash, children, displayName, emptyOverlay, getNode, newUserId, uniqueName, type FileData, type VNode } from './model/vfs';
import * as W from './model/windows';
import { APPS } from '@/applications/registry';
import { currentFs, getCommands, overlay, prefs, story, ui, wm, type AlertSpec, type MenuItem } from './store';

const def = (appId: string) => APPS[appId];

// ---------------------------------------------------------------------------------------------
// Windows and applications

export function openWindow(appId: string, props: Record<string, unknown> = {}, at?: Partial<W.Bounds>): string {
  const d = def(appId);
  if (!d) throw new Error(`unknown app ${appId}`);
  const compact = ui.get().compact;
  const title = d.titleFor?.(props, currentFs()) ?? d.name;
  const { state, id } = W.openWindow(wm.get(), appId, {
    title,
    w: at?.w ?? d.window.w,
    h: at?.h ?? d.window.h,
    x: at?.x,
    y: at?.y,
    resizable: d.window.resizable ?? true,
    minW: d.window.minW,
    minH: d.window.minH,
    props,
    fill: compact && (d.window.resizable ?? true) && !at,
  });
  wm.set(state);
  ui.set((u) => ({ ...u, anim: { ...u.anim, [id]: 'open' }, menu: null }));
  setTimeout(() => ui.set((u) => {
    const { [id]: _done, ...anim } = u.anim;
    void _done;
    return { ...u, anim };
  }), 250);
  return id;
}

function bounce(appId: string) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  ui.set((u) => ({ ...u, bouncing: appId }));
  setTimeout(() => ui.set((u) => (u.bouncing === appId ? { ...u, bouncing: null } : u)), 1100);
}

/** Dock click / launch: activate if running, else start the app and open its default window. */
export function launchApp(appId: string, props?: Record<string, unknown>) {
  const d = def(appId);
  if (!d) return;
  storyAction({ type: 'open-app', appId });
  const s = wm.get();
  if (!props) {
    const activated = W.activateApp(s, appId);
    if (activated) return wm.set(activated);
  }
  const wasRunning = s.running.includes(appId);
  if (!wasRunning) bounce(appId);
  const singleton = d.singleWindow && s.windows.find((w) => w.appId === appId);
  if (singleton) {
    wm.set(W.focusWindow(W.setProps(s, singleton.id, props ?? {}), singleton.id));
    return;
  }
  if (d.noDefaultWindow && !props) {
    wm.set({ ...s, running: s.running.includes(appId) ? s.running : [...s.running, appId], activeAppOverride: appId, focused: null });
    d.onLaunch?.();
    return;
  }
  const open = () => openWindow(appId, props ?? d.defaultProps?.() ?? {});
  if (!wasRunning && !matchMedia('(prefers-reduced-motion: reduce)').matches) setTimeout(open, 350);
  else open();
}

export const focusWindow = (id: string) => wm.set((s) => W.focusWindow(s, id));

/** Close, unless the window asks first (e.g. unsaved TextEdit document). */
export function closeWindow(id: string) {
  const guard = getCommands(id).requestClose;
  if (guard) return guard();
  forceCloseWindow(id);
}

export function forceCloseWindow(id: string) {
  const w = wm.get().windows.find((x) => x.id === id);
  if (!w) return;
  wm.set((s) => W.closeWindow(s, id, def(w.appId)?.quitOnLastClose));
}

export function minimizeWindow(id: string) {
  const reduce = prefs.get().minimizeEffect === 'none' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return wm.set((s) => W.minimizeWindow(s, id));
  ui.set((u) => ({ ...u, anim: { ...u.anim, [id]: 'minimize' } }));
  setTimeout(() => {
    wm.set((s) => W.minimizeWindow(s, id));
    ui.set((u) => {
      const { [id]: _done, ...anim } = u.anim;
      void _done;
      return { ...u, anim };
    });
  }, 300);
}

export function restoreWindow(id: string) {
  wm.set((s) => W.restoreWindow(s, id));
  if (prefs.get().minimizeEffect === 'none' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  ui.set((u) => ({ ...u, anim: { ...u.anim, [id]: 'restore' } }));
  setTimeout(() => ui.set((u) => {
    const { [id]: _done, ...anim } = u.anim;
    void _done;
    return { ...u, anim };
  }), 300);
}

export const zoomWindow = (id: string, ideal?: { w: number; h: number }) => wm.set((s) => W.zoomWindow(s, id, ideal));
export const moveWindow = (id: string, x: number, y: number) => wm.set((s) => W.moveWindow(s, id, x, y));
export const resizeWindow = (id: string, w: number, h: number) => wm.set((s) => W.resizeWindow(s, id, w, h));
export const setWindowTitle = (id: string, title: string) => wm.set((s) => W.setTitle(s, id, title));
export const setWindowProps = (id: string, props: Record<string, unknown>) => wm.set((s) => W.setProps(s, id, props));
export const hideApp = (appId: string) => wm.set((s) => W.hideApp(s, appId));
export const hideOthers = (appId: string) => wm.set((s) => W.hideOthers(s, appId));
export const showAll = () => wm.set((s) => W.showAll(s));
export const quitApp = (appId: string) => wm.set((s) => W.quitApp(s, appId));

/** System panels (About, Force Quit, Get Info) owned by an app so its menus stay active. */
export const PANEL_SIZES: Record<string, { w: number; h: number }> = { about: { w: 300, h: 330 }, forcequit: { w: 360, h: 330 }, info: { w: 280, h: 420 } };

export function openPanel(appId: string, panel: string, props: Record<string, unknown> = {}) {
  const existing = wm.get().windows.find((w) => w.props.panel === panel && w.appId === appId && JSON.stringify({ ...w.props, panel: undefined }) === JSON.stringify({ ...props, panel: undefined }));
  if (existing) return focusWindow(existing.id);
  const size = PANEL_SIZES[panel];
  const { state, id } = W.openWindow(wm.get(), appId, { title: '', w: size.w, h: size.h, resizable: false, minW: size.w, minH: size.h, props: { ...props, panel } });
  wm.set(state);
  const d = def(appId);
  wm.set((s) => W.setTitle(s, id, d?.titleFor?.({ ...props, panel }, currentFs()) ?? ''));
  return id;
}

/** Clicking the desktop activates Finder without a window. */
export function activateFinder() {
  wm.set((s) => ({ ...s, focused: null, activeAppOverride: 'finder' }));
}

export function bringAllToFront(appId: string) {
  const act = W.activateApp(wm.get(), appId);
  if (act) wm.set(act);
}

// ---------------------------------------------------------------------------------------------
// Files

/** Opens a node with its application (folders open in Finder). */
export function openNode(nodeId: string, opts: { inWindow?: string } = {}) {
  const fs = currentFs();
  const n = getNode(fs, nodeId);
  if (!n) return;
  storyAction({ type: 'open-file', nodeId });
  if (n.kind === 'dir') {
    if (opts.inWindow) return setWindowProps(opts.inWindow, { dir: n.id });
    return launchApp('finder', { dir: n.id });
  }
  const app = appFor(n);
  if (!app) return;
  if (n.data.t === 'app') return launchApp(n.data.appId);
  if (n.data.t === 'link') return launchApp('safari', { url: n.data.url });
  // Reuse an existing window already showing this file.
  const existing = wm.get().windows.find((w) => w.appId === app && w.props.nodeId === nodeId);
  if (existing) return restoreWindow(existing.id);
  launchApp(app, { nodeId });
}

export function trashNode(nodeId: string, sheetFor?: string) {
  const fs = currentFs();
  const n = getNode(fs, nodeId);
  if (!n) return;
  const check = canTrash(fs, n);
  if (!check.ok) return alert({ title: check.reason, icon: 'caution', buttons: [{ label: 'OK', default: true }], sheetFor });
  overlay.set((o) => ({ ...o, trashed: { ...o.trashed, [nodeId]: n.parent ?? fs.home } }));
}

/** Restores an item from the Trash to where it came from. */
export function putBack(nodeId: string) {
  const o = overlay.get();
  if (o.trashed[nodeId]) {
    const { [nodeId]: _gone, ...trashed } = o.trashed;
    void _gone;
    overlay.set({ ...o, trashed });
    return;
  }
  if (story.get().trashed.includes(nodeId)) {
    alert({ title: `The item “${displayName(getNode(currentFs(), nodeId)!)}” can’t be put back.`, icon: 'caution', buttons: [{ label: 'OK', default: true }] });
  }
}

export function emptyTrash() {
  const fs = currentFs();
  const items = children(fs, fs.trash, true);
  if (!items.length) return;
  alert({
    title: 'Are you sure you want to remove the items in the Trash permanently?',
    message: 'You cannot undo this action.',
    icon: 'trash-full',
    buttons: [
      { label: 'Cancel', cancel: true },
      {
        label: 'OK',
        default: true,
        action: () => {
          // Only items the user made can be deleted; canonical records are protected.
          const deletable = items.filter((n) => n.user);
          const protectedCount = items.length - deletable.length;
          const ids = new Set<string>();
          const collect = (n: VNode) => {
            ids.add(n.id);
            for (const c of children(currentFs(), n.id, true)) collect(c);
          };
          deletable.forEach(collect);
          overlay.set((o) => {
            const trashed = { ...o.trashed };
            for (const id of ids) delete trashed[id];
            return { ...o, trashed, removed: [...o.removed, ...ids] };
          });
          if (protectedCount)
            setTimeout(() => alert({ title: 'Some items could not be deleted.', message: 'Items that are in use or locked were left in the Trash.', icon: 'caution', buttons: [{ label: 'OK', default: true }] }), 50);
        },
      },
    ],
  });
}

export function newFolder(dirId: string): string | null {
  const fs = currentFs();
  const dir = getNode(fs, dirId);
  if (!dir || dir.kind !== 'dir' || dir.role === 'trash' || dir.role === 'volume' || dir.role === 'applications' || dir.role === 'system') {
    alert({ title: 'The folder could not be created because you do not have permission to make changes here.', icon: 'caution', buttons: [{ label: 'OK', default: true }] });
    return null;
  }
  const id = newUserId('dir');
  const node: VNode = { kind: 'dir', id, name: uniqueName(fs, dirId, 'untitled folder'), parent: dirId, role: 'folder', user: true };
  overlay.set((o) => ({ ...o, added: { ...o.added, [id]: node } }));
  return id;
}

/** Saves a user document (TextEdit). Returns the node id. */
export function saveUserFile(dirId: string, name: string, data: FileData, existingId?: string): string {
  if (existingId && overlay.get().added[existingId]) {
    overlay.set((o) => ({ ...o, added: { ...o.added, [existingId]: { ...(o.added[existingId] as VNode & { kind: 'file' }), data } } }));
    return existingId;
  }
  const fs = currentFs();
  const id = newUserId('file');
  const node: VNode = { kind: 'file', id, name: uniqueName(fs, dirId, name), parent: dirId, data, user: true };
  overlay.set((o) => ({ ...o, added: { ...o.added, [id]: node } }));
  return id;
}

export function renameNode(nodeId: string, name: string) {
  const n = getNode(currentFs(), nodeId);
  const clean = name.trim().replace(/[/:]/g, '-');
  if (!n || n.locked || !n.user || !clean) return;
  overlay.set((o) => ({ ...o, renamed: { ...o.renamed, [nodeId]: clean } }));
}

// ---------------------------------------------------------------------------------------------
// Story

function applyShell(effects: StoryEffect[]) {
  for (const e of effects) {
    if (e.type === 'openApp') launchApp(e.appId, e.props);
    else if (e.type === 'openFile') openNode(e.nodeId);
    else if (e.type === 'notify') notify(e.title, e.body);
  }
}

export function storyAction(action: StoryAction) {
  const events = desktopStage.events;
  if (!events.length) return;
  const r = handle(story.get(), events, action);
  if (r.fired.length) {
    story.set(r.state);
    // Shell effects run after the triggering action has finished.
    setTimeout(() => applyShell(r.shell), 0);
  }
}

export function fireStoryEvent(id: string): string | null {
  const r = fire(story.get(), desktopStage.events, id);
  if (!r.ok) return r.reason;
  story.set(r.state);
  applyShell(r.shell);
  return null;
}

// ---------------------------------------------------------------------------------------------
// Dialogs, menus, notices

export function alert(spec: AlertSpec) {
  ui.set((u) => ({ ...u, dialogs: [...u.dialogs, spec], menu: null, contextMenu: null }));
}

export function dismissAlert(spec: AlertSpec) {
  ui.set((u) => ({ ...u, dialogs: u.dialogs.filter((d) => d !== spec) }));
}

let noticeId = 0;
export function notify(title: string, body: string) {
  const id = ++noticeId;
  ui.set((u) => ({ ...u, notices: [...u.notices, { id, title, body }] }));
  setTimeout(() => ui.set((u) => ({ ...u, notices: u.notices.filter((n) => n.id !== id) })), 6000);
}

export function openContextMenu(x: number, y: number, items: MenuItem[]) {
  ui.set((u) => ({ ...u, contextMenu: { x, y, items }, menu: null }));
}

export const closeMenus = () => ui.set((u) => (u.menu || u.contextMenu || u.spotlight ? { ...u, menu: null, contextMenu: null, spotlight: false } : u));

export function select(scope: string, ids: string[]) {
  ui.set((u) => ({ ...u, selection: { scope, ids } }));
}

// ---------------------------------------------------------------------------------------------
// Reset (Restart, production takes, tests)

export function resetDesktop() {
  const v = wm.get().viewport;
  wm.set(W.initialWM(v));
  overlay.set(emptyOverlay());
  story.set(initialStory());
  ui.set((u) => ({ ...u, menu: null, contextMenu: null, selection: { scope: 'desktop', ids: [] }, dialogs: [], switcher: null, spotlight: false, anim: {}, notices: [], bouncing: null }));
}
