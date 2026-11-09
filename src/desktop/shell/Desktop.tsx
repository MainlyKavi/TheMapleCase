'use client';

import { useDesktopDirector } from '@stage/client';
import { desktopStage } from '@stage/desktop';
import { useEffect, useMemo } from 'react';
import type { DirectorApi } from '@/stage/desktop-types';
import { APPS } from '@/applications/registry';
import * as A from '../actions';
import { setViewport, switcherOrder } from '../model/windows';
import type { FsSnapshot } from '../model/vfs';
import { loadPrefs, snapshot, ui, usePrefs, useStore, useUI, wm } from '../store';
import { DesktopIcons } from './DesktopIcons';
import { Dock } from './Dock';
import { dispatchShortcut } from './menus';
import { MenuBar } from './MenuBar';
import { Overlays } from './Overlays';
import { WALLPAPER_CSS } from './wallpapers';
import { WindowLayer } from './WindowFrame';
import { HIGHLIGHTS } from '../model/prefs';
import '../aqua.css';

const COMPACT_W = 760;

/** The whole simulated computer. One instance per page; state lives in ../store. */
export function Desktop({ fs }: { fs: FsSnapshot }) {
  // Ready once the filesystem snapshot is installed (client only; avoids hydration mismatch).
  const ready = useStore(snapshot, (s) => s !== null);
  const p = usePrefs();
  const compact = useUI((u) => u.compact);

  useEffect(() => {
    // Never run the desktop inside its own Safari frame.
    if (window.top !== window.self) {
      window.location.replace('/home/');
      return;
    }
    snapshot.set(fs);
    ui.set((u) => ({ ...u, clock: desktopStage.clock }));
    loadPrefs();
    const sync = () => {
      const isCompact = window.innerWidth < COMPACT_W || window.innerHeight < 520;
      ui.set((u) => (u.compact === isCompact ? u : { ...u, compact: isCompact }));
      const dock = (isCompact ? 36 : wmDockSize()) + 22;
      wm.set((s) => setViewport(s, { w: window.innerWidth, h: window.innerHeight, top: 22, bottom: dock }));
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [fs]);

  // Re-measure the work area when the Dock size changes.
  useEffect(() => {
    if (!ready) return;
    const dock = (compact ? 36 : p.dockSize) + 22;
    wm.set((s) => setViewport(s, { ...s.viewport, bottom: dock }));
  }, [p.dockSize, compact, ready]);

  useKeyboard();

  const director: DirectorApi = useMemo(
    () => ({
      reset: A.resetDesktop,
      fire: (id) => {
        const err = A.fireStoryEvent(id);
        if (err) console.warn(`[desktop] ${err}`);
      },
      setClock: (clock) => ui.set((u) => ({ ...u, clock })),
      applyPreset: (id) => {
        const preset = desktopStage.presets.find((x) => x.id === id);
        if (!preset) return console.warn(`[desktop] unknown preset ${id}`);
        A.resetDesktop();
        for (const w of preset.windows) {
          const wid = A.openWindow(w.appId, w.props ?? APPS[w.appId]?.defaultProps?.() ?? {}, w.bounds);
          if (w.minimized) A.minimizeWindow(wid);
        }
        for (const e of preset.events ?? []) A.fireStoryEvent(e);
      },
    }),
    [],
  );
  useDesktopDirector(director);

  const accent = HIGHLIGHTS[p.highlight];
  return (
    <div
      className={`aqua${compact ? ' compact' : ''}`}
      data-appearance={p.appearance}
      style={{ ['--hl' as string]: accent }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="wallpaper"
        style={{ backgroundImage: WALLPAPER_CSS[p.wallpaper] }}
        onPointerDown={() => {
          A.closeMenus();
          A.select('desktop', []);
          A.activateFinder();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          A.openContextMenu(e.clientX, e.clientY, [
            { label: 'New Folder', action: () => A.newFolder(snapshot.get()!.desktop) },
            { separator: true },
            { label: 'Get Info', action: () => A.openPanel('finder', 'info', { info: snapshot.get()!.desktop }) },
            { separator: true },
            { label: 'Change Desktop Background…', action: () => A.launchApp('sysprefs', { pane: 'desktop' }) },
          ]);
        }}
      />
      {ready && (
        <>
          <DesktopIcons />
          <WindowLayer />
          <Dock />
          <MenuBar />
          <Overlays />
          <ClickAway />
        </>
      )}
    </div>
  );
}

const wmDockSize = () => {
  try {
    return JSON.parse(localStorage.getItem('maple.desktop.prefs.v1') ?? '{}').dockSize ?? 48;
  } catch {
    return 48;
  }
};

/** Closes open menus when clicking anywhere outside them. */
function ClickAway() {
  const open = useUI((u) => Boolean(u.menu || u.contextMenu || u.spotlight));
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('.menu, .menubar, .spotlight')) return;
      A.closeMenus();
    };
    const onBlur = () => A.closeMenus();
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('blur', onBlur);
    };
  }, [open]);
  return null;
}

/** Global shortcuts: menu shortcuts, the app switcher (Control-`), Escape. */
function useKeyboard() {
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const u = ui.get();
      if (u.power !== 'on') return;
      // App switcher: hold Control, press ` to cycle, release Control to switch.
      if (e.ctrlKey && (e.key === '`' || e.code === 'Backquote')) {
        e.preventDefault();
        const apps = switcherOrder(wm.get()).filter((a) => APPS[a]);
        if (apps.length < 2) return;
        ui.set((s) => ({
          ...s,
          switcher: s.switcher ? { ...s.switcher, index: (s.switcher.index + (e.shiftKey ? -1 : 1) + apps.length) % apps.length } : { apps, index: 1 },
        }));
        return;
      }
      if (e.key === 'Escape') {
        if (u.switcher) return ui.set((s) => ({ ...s, switcher: null }));
        if (u.menu || u.contextMenu || u.spotlight) return A.closeMenus();
      }
      if (u.dialogs.length) return;
      const inField = (e.target as HTMLElement).closest?.('input, textarea, select, [contenteditable="true"]');
      if (!(e.metaKey || e.ctrlKey)) return;
      // Let text fields keep their own editing shortcuts.
      if (inField && /^[azxcv]$/i.test(e.key) && !e.shiftKey) return;
      if (dispatchShortcut(e)) e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => {
      const s = ui.get().switcher;
      if (s && (e.key === 'Control' || !e.ctrlKey)) {
        ui.set((x) => ({ ...x, switcher: null }));
        A.launchApp(s.apps[s.index]);
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);
}
