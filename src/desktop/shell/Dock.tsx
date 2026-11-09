'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { APPS, DOCK_APPS } from '@/applications/registry';
import * as A from '../actions';
import { magnify } from '../model/prefs';
import { children } from '../model/vfs';
import { ui, useFs, usePrefs, useUI, useWM, type MenuItem } from '../store';
import { Icon } from './icons';

type Tile =
  | { key: string; kind: 'app'; appId: string; label: string }
  | { key: string; kind: 'mini'; winId: string; appId: string; label: string }
  | { key: string; kind: 'trash'; label: string }
  | { key: string; kind: 'sep' };

const GAP = 4;
const SEP_W = 13;

export function Dock() {
  const p = usePrefs();
  const compact = useUI((u) => u.compact);
  const bouncing = useUI((u) => u.bouncing);
  const running = useWM((s) => s.running);
  const windows = useWM((s) => s.windows);
  const fs = useFs();
  const [pointer, setPointer] = useState<number | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const raf = useRef(0);
  const dockRef = useRef<HTMLDivElement>(null);

  const base = compact ? Math.min(p.dockSize, 36) : p.dockSize;
  const max = p.magnify && !compact ? p.magnifySize : base;

  const tiles: Tile[] = useMemo(() => {
    const apps = [...DOCK_APPS, ...running.filter((a) => !DOCK_APPS.includes(a) && APPS[a] && !APPS[a].hiddenFromDock)];
    const minis = windows.filter((w) => w.minimized).sort((a, b) => a.z - b.z);
    return [
      ...apps.map((a): Tile => ({ key: `app-${a}`, kind: 'app', appId: a, label: APPS[a].name })),
      { key: 'sep', kind: 'sep' },
      ...minis.map((w): Tile => ({ key: `mini-${w.id}`, kind: 'mini', winId: w.id, appId: w.appId, label: w.title })),
      { key: 'trash', kind: 'trash', label: 'Trash' },
    ];
  }, [running, windows]);

  // Stable tile centres in the un-magnified layout drive the magnification curve.
  const centers = useMemo(() => {
    let x = 0;
    return tiles.map((t) => {
      const w = t.kind === 'sep' ? SEP_W : base;
      const c = x + w / 2;
      x += w + GAP;
      return c;
    });
  }, [tiles, base]);
  const sizes = magnify(centers, pointer, base, max);

  // Publish tile rectangles for minimize/restore animations.
  useLayoutEffect(() => {
    const el = dockRef.current;
    if (!el || pointer !== null) return;
    const targets: Record<string, { x: number; y: number; w: number; h: number }> = {};
    el.querySelectorAll<HTMLElement>('[data-tile]').forEach((t) => {
      const r = t.getBoundingClientRect();
      targets[t.dataset.tile!] = { x: r.left, y: r.top, w: r.width, h: r.height };
    });
    ui.set((u) => ({ ...u, dockTargets: targets }));
  }, [tiles, base, pointer]);

  const trashFull = children(fs, fs.trash, true).length > 0;

  const onMove = (e: React.PointerEvent) => {
    if (max === base || e.pointerType === 'touch') return;
    // Map the pointer onto the un-magnified layout. The Dock stays centred, so measuring from the
    // screen centre keeps the curve stable while the Dock widens.
    const baseWidth = centers.length ? centers[centers.length - 1] + base / 2 : 0;
    const x = e.clientX - (window.innerWidth / 2 - baseWidth / 2 - GAP / 2);
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => setPointer(x));
  };

  const menuFor = (t: Tile): MenuItem[] => {
    if (t.kind === 'trash') return [{ label: 'Open', action: () => A.openNode(fs.trash) }, { label: 'Empty Trash', action: A.emptyTrash, disabled: !trashFull }];
    if (t.kind !== 'app') return [];
    const wins = windows.filter((w) => w.appId === t.appId);
    const isRunning = running.includes(t.appId);
    return [
      ...wins.map((w) => ({ label: w.title, checked: false, action: () => A.restoreWindow(w.id) })),
      ...(wins.length ? [{ separator: true }] : []),
      { label: 'Keep in Dock', checked: DOCK_APPS.includes(t.appId), disabled: true },
      ...(t.appId !== 'finder' ? [{ label: 'Show in Finder', action: () => A.openNode(`app:${t.appId}` in fs.nodes ? fs.nodes[`app:${t.appId}`].parent! : fs.applications) }] : []),
      { separator: true },
      ...(isRunning
        ? [{ label: 'Hide', action: () => A.hideApp(t.appId) }, ...(t.appId !== 'finder' ? [{ label: 'Quit', action: () => A.quitApp(t.appId) }] : [])]
        : [{ label: 'Open', action: () => A.launchApp(t.appId) }]),
    ];
  };

  const activate = (t: Tile) => {
    if (t.kind === 'app') A.launchApp(t.appId);
    else if (t.kind === 'mini') A.restoreWindow(t.winId);
    else if (t.kind === 'trash') A.openNode(fs.trash);
  };

  return (
    <div className="dock-wrap">
      <nav
        ref={dockRef}
        className="dock"
        aria-label="Dock"
        onPointerMove={onMove}
        onPointerLeave={() => {
          cancelAnimationFrame(raf.current);
          setPointer(null);
          setHover(null);
        }}
      >
        <div className="dock-shelf" style={{ height: base + 8 }} />
        {tiles.map((t, i) => {
          if (t.kind === 'sep') return <div key={t.key} className="dock-sep" style={{ height: base }} aria-hidden="true" />;
          const size = sizes[i];
          const running_ = t.kind === 'app' && running.includes(t.appId);
          return (
            <button
              key={t.key}
              type="button"
              data-tile={t.kind === 'mini' ? `win:${t.winId}` : t.kind === 'app' ? `app:${t.appId}` : 'trash'}
              className={`dock-tile${t.kind === 'app' && bouncing === t.appId ? ' bounce' : ''}`}
              style={{ width: size, marginRight: GAP, paddingBottom: 4 }}
              aria-label={`${t.label}${running_ ? ', running' : ''}${t.kind === 'mini' ? ', minimized window' : ''}`}
              onMouseEnter={() => setHover(t.key)}
              onMouseLeave={() => setHover((h) => (h === t.key ? null : h))}
              onFocus={() => setHover(t.key)}
              onBlur={() => setHover(null)}
              onClick={() => activate(t)}
              onContextMenu={(e) => {
                e.preventDefault();
                const items = menuFor(t);
                if (items.length) A.openContextMenu(e.clientX, Math.max(24, e.clientY - 20 * items.length), items);
              }}
            >
              {hover === t.key && <span className="dock-label">{t.label}</span>}
              {t.kind === 'mini' ? (
                <MiniWindow appId={t.appId} size={size} />
              ) : (
                <span className="tile-img" style={{ width: size, height: size }}>
                  <Icon kind={t.kind === 'trash' ? (trashFull ? 'trash-full' : 'trash') : APPS[t.appId].icon} size={size} />
                </span>
              )}
              {running_ && <span className="dock-ind" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}


function MiniWindow({ appId, size }: { appId: string; size: number }) {
  const metal = APPS[appId]?.chrome === 'metal';
  return (
    <span className="tile-img" style={{ width: size, height: size, display: 'grid', placeItems: 'center', position: 'relative' }}>
      <span className={`mini-thumb${metal ? ' metal' : ''}`} style={{ width: size * 0.9, height: size * 0.72 }}>
        <span className="bar" />
      </span>
      <span style={{ position: 'absolute', right: 0, bottom: 0 }}>
        <Icon kind={APPS[appId]?.icon ?? 'generic'} size={size * 0.42} />
      </span>
    </span>
  );
}
