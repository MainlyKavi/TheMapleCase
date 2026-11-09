'use client';

import { Suspense, useId, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { Panel } from '@/applications/panels';
import { APPS } from '@/applications/registry';
import * as A from '../actions';
import { constrain, type WinState } from '../model/windows';
import { useUI, useWM, wm } from '../store';
import { AlertPanel } from './Overlays';

export function WindowLayer() {
  const windows = useWM((s) => s.windows);
  const focused = useWM((s) => s.focused);
  const hidden = useWM((s) => s.hidden);
  return (
    <div className="window-layer">
      {windows.map((w) => (
        <WindowFrame key={w.id} win={w} focused={focused === w.id} hidden={hidden.includes(w.appId)} />
      ))}
    </div>
  );
}

function WindowFrame({ win, focused, hidden }: { win: WinState; focused: boolean; hidden: boolean }) {
  const def = APPS[win.appId];
  const ref = useRef<HTMLElement>(null);
  const titleId = useId();
  const anim = useUI((u) => u.anim[win.id]);
  const target = useUI((u) => u.dockTargets[`win:${win.id}`] ?? u.dockTargets.trash);
  const dialogs = useUI((u) => u.dialogs);
  const sheets = dialogs.filter((d) => d.sheetFor === win.id);
  const App = def.component;

  // Minimize / restore "scale" effect toward the Dock.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || (anim !== 'minimize' && anim !== 'restore')) return;
    const to = target ?? { x: window.innerWidth / 2, y: window.innerHeight, w: 40, h: 40 };
    const sx = Math.max(0.05, to.w / win.bounds.w);
    const sy = Math.max(0.05, to.h / win.bounds.h);
    const tx = to.x - win.bounds.x;
    const ty = to.y - win.bounds.y;
    const away = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
    el.style.transformOrigin = '0 0';
    if (anim === 'minimize') {
      el.classList.add('minimizing');
      requestAnimationFrame(() => {
        el.style.transform = away;
        el.style.opacity = '0.6';
      });
    } else {
      el.style.transform = away;
      el.style.opacity = '0.6';
      requestAnimationFrame(() => {
        el.classList.add('restoring');
        el.style.transform = '';
        el.style.opacity = '';
      });
    }
    return () => {
      el.classList.remove('minimizing', 'restoring');
      el.style.transform = '';
      el.style.opacity = '';
    };
  }, [anim, target, win.bounds]);

  if (!def) return null;

  const startDrag = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    const el = ref.current!;
    const sx = e.clientX;
    const sy = e.clientY;
    const v = wm.get().viewport;
    let last = win.bounds;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      last = constrain({ ...win.bounds, x: win.bounds.x + ev.clientX - sx, y: win.bounds.y + ev.clientY - sy }, v, win.minW, win.minH);
      el.style.transform = `translate(${last.x - win.bounds.x}px, ${last.y - win.bounds.y}px)`;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      el.style.transform = '';
      if (last !== win.bounds) A.moveWindow(win.id, last.x, last.y);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const startResize = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const el = ref.current!;
    const sx = e.clientX;
    const sy = e.clientY;
    const v = wm.get().viewport;
    let w = win.bounds.w;
    let h = win.bounds.h;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      w = Math.max(win.minW, Math.min(v.w - win.bounds.x, win.bounds.w + ev.clientX - sx));
      h = Math.max(win.minH, Math.min(v.h - win.bounds.y, win.bounds.h + ev.clientY - sy));
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      A.resizeWindow(win.id, w, h);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const style: CSSProperties = {
    left: win.bounds.x,
    top: win.bounds.y,
    width: win.bounds.w,
    height: win.bounds.h,
    zIndex: 10 + win.z,
    display: hidden || (win.minimized && anim !== 'minimize') ? 'none' : undefined,
    ...(def.chrome === 'sticky' ? ({ '--sticky': STICKY[String(win.props.color)]?.[0], '--sticky-bar': STICKY[String(win.props.color)]?.[1] } as CSSProperties) : {}),
  };

  return (
    <section
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      data-window={win.id}
      data-app={win.appId}
      className={`win win--${win.props.panel ? 'aqua' : def.chrome}${focused ? '' : ' inactive'}${anim === 'open' ? ' anim-open' : ''}`}
      style={style}
      onPointerDownCapture={(e) => {
        if (!focused && !(e.target as HTMLElement).closest('.traffic')) A.focusWindow(win.id);
      }}
    >
      <div className="win-titlebar" onPointerDown={startDrag} onDoubleClick={(e) => !(e.target as HTMLElement).closest('button') && A.minimizeWindow(win.id)}>
        <div className="traffic">
          {def.chrome === 'sticky' && <button type="button" className="sticky-close" aria-label="Close note" onClick={() => A.closeWindow(win.id)} />}
          <button type="button" className="tl close" aria-label="Close" onClick={() => A.closeWindow(win.id)}>
            <span className="glyph">×</span>
          </button>
          <button type="button" className="tl min" aria-label="Minimize" disabled={def.window.minimizable === false} onClick={() => A.minimizeWindow(win.id)}>
            <span className="glyph">−</span>
          </button>
          <button type="button" className="tl zoom" aria-label="Zoom" disabled={!win.resizable} onClick={() => A.zoomWindow(win.id, def.window.ideal)}>
            <span className="glyph">+</span>
          </button>
        </div>
        <div className="win-title" id={titleId}>
          {win.title}
        </div>
      </div>
      <div className="win-body">
        <Suspense fallback={<div className="placeholder-note" style={{ flex: 1 }}><span className="spinner" /></div>}>
          {win.props.panel ? <Panel win={win} /> : <App win={win} focused={focused} />}
        </Suspense>
        {sheets.map((s, i) => (
          <AlertPanel key={i} spec={s} sheet />
        ))}
      </div>
      {win.resizable && <div className="resize-grip" onPointerDown={startResize} aria-hidden="true" />}
    </section>
  );
}

export const STICKY: Record<string, [string, string]> = {
  yellow: ['#fff79a', '#efe36e'],
  blue: ['#c9e7ff', '#a9d2f5'],
  green: ['#d7f5c4', '#b8e5a0'],
  pink: ['#ffd1e3', '#f5b1cc'],
  purple: ['#e3d3ff', '#ccb7f5'],
  gray: ['#ececec', '#d4d4d4'],
};
