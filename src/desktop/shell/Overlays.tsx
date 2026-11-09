'use client';

import { useEffect, useRef } from 'react';
import { APPS } from '@/applications/registry';
import * as A from '../actions';
import { ui, useUI, type AlertSpec } from '../store';
import { Icon } from './icons';
import { Menu } from './Menu';

function Caution() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
      <defs>
        <linearGradient id="caution-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe36b" />
          <stop offset="1" stopColor="#f2b111" />
        </linearGradient>
      </defs>
      <path d="M32 5 61 57H3z" fill="url(#caution-g)" stroke="#8b6400" strokeWidth="2" strokeLinejoin="round" />
      <path d="M29 22h6l-1 20h-4zM29 46h6v6h-6z" fill="#1a1a1a" />
    </svg>
  );
}

export function AlertPanel({ spec, sheet }: { spec: AlertSpec; sheet?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('.aqua-btn.default')?.focus();
  }, []);
  const press = (b: AlertSpec['buttons'][number]) => {
    A.dismissAlert(spec);
    b.action?.();
  };
  return (
    <div
      ref={ref}
      className={`alert-panel${sheet ? ' sheet' : ''}`}
      role="alertdialog"
      aria-modal="true"
      aria-label={spec.title}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          const c = spec.buttons.find((b) => b.cancel) ?? spec.buttons[0];
          press(c);
          e.stopPropagation();
        }
        if (e.key === 'Enter') {
          const d = spec.buttons.find((b) => b.default);
          if (d) {
            press(d);
            e.preventDefault();
          }
        }
      }}
    >
      <div>{!spec.icon || spec.icon === 'caution' ? <Caution /> : <Icon kind={spec.icon === 'note' ? 'app:finder' : spec.icon} size={64} />}</div>
      <div>
        <h2>{spec.title}</h2>
        {spec.message && <p>{spec.message}</p>}
      </div>
      <div className="alert-buttons">
        {spec.buttons.map((b) => (
          <button key={b.label} type="button" className={`aqua-btn${b.default ? ' default' : ''}`} onClick={() => press(b)}>
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Overlays() {
  const dialogs = useUI((u) => u.dialogs);
  const ctx = useUI((u) => u.contextMenu);
  const switcher = useUI((u) => u.switcher);
  const notices = useUI((u) => u.notices);
  const power = useUI((u) => u.power);
  const global = dialogs.filter((d) => !d.sheetFor || !document.querySelector(`[data-window="${d.sheetFor}"]`));

  return (
    <>
      {global.length > 0 && (
        <>
          <div className="modal-veil" />
          <AlertPanel key={dialogs.indexOf(global[0])} spec={global[0]} />
        </>
      )}
      {ctx && <ContextMenuLayer x={ctx.x} y={ctx.y} />}
      {switcher && (
        <div className="switcher" role="listbox" aria-label="Applications">
          {switcher.apps.map((a, i) => (
            <div key={a} role="option" aria-selected={i === switcher.index} className={`switcher-item${i === switcher.index ? ' on' : ''}`}>
              <Icon kind={APPS[a].icon} size={84} />
              <span>{APPS[a].name}</span>
            </div>
          ))}
        </div>
      )}
      {notices.length > 0 && (
        <div className="notices" aria-live="polite">
          {notices.map((n) => (
            <div key={n.id} className="notice">
              <b>{n.title}</b>
              {n.body}
            </div>
          ))}
        </div>
      )}
      {power !== 'on' && (
        <div
          className={`power-screen ${power}`}
          role="button"
          tabIndex={0}
          aria-label={power === 'restarting' ? 'Restarting' : 'Wake the computer'}
          onClick={() => {
            if (power === 'sleep') ui.set((u) => ({ ...u, power: 'on' }));
            if (power === 'off') {
              ui.set((u) => ({ ...u, power: 'restarting' }));
              setTimeout(() => ui.set((u) => ({ ...u, power: 'on' })), 1800);
            }
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLElement).click()}
        >
          {power === 'restarting' && (
            <div style={{ display: 'grid', justifyItems: 'center', gap: 40 }}>
              <svg viewBox="0 0 20 22" width="90" height="100" aria-hidden="true">
                <path d="M10 6.2c1.4-1.1 3.5-1.5 5.1-.5 2.2 1.4 2.7 4.6 1.6 7.9-.9 2.7-2.6 6-4.6 6.2-1 .1-1.4-.5-2.1-.5s-1.1.6-2.1.5c-2-.2-3.7-3.5-4.6-6.2-1.1-3.3-.6-6.5 1.6-7.9 1.6-1 3.7-.6 5.1.5z" fill="#6f6f6f" />
                <path d="M10.4 5.6C10.6 3.4 12 1.6 14.3 1.2c-.1 2.3-1.6 4-3.9 4.4z" fill="#6f6f6f" />
              </svg>
              <span className="spinner" />
            </div>
          )}
        </div>
      )}
    </>
  );
}


function ContextMenuLayer({ x, y }: { x: number; y: number }) {
  const ctx = useUI((u) => u.contextMenu)!;
  return <Menu items={ctx.items} context label="Context menu" autoFocus onDone={() => ui.set((u) => ({ ...u, contextMenu: null }))} style={{ left: x, top: y }} />;
}
