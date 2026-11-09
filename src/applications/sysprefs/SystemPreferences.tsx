'use client';

import { useEffect, type ReactNode } from 'react';
import * as A from '@/desktop/actions';
import { HIGHLIGHTS, WALLPAPERS, type Prefs } from '@/desktop/model/prefs';
import { Glyph, Icon } from '@/desktop/shell/icons';
import { WALLPAPER_CSS } from '@/desktop/shell/wallpapers';
import { prefs, usePrefs } from '@/desktop/store';
import type { AppWindowProps } from '../registry';
import { useCommands } from '../useCommands';

type Pane = 'appearance' | 'desktop' | 'dock' | 'datetime';

const PANES: { id: Pane; label: string; group: 'Personal' | 'System'; icon: ReactNode }[] = [
  { id: 'appearance', label: 'Appearance', group: 'Personal', icon: <Swatch colors={['#4b8de8', '#c9d2dd']} /> },
  { id: 'desktop', label: 'Desktop', group: 'Personal', icon: <Swatch colors={['#1d5fc0', '#7fb8f0']} /> },
  { id: 'dock', label: 'Dock', group: 'Personal', icon: <Swatch colors={['#e6eaf0', '#7f8c9c']} dock /> },
  { id: 'datetime', label: 'Date & Time', group: 'System', icon: <ClockIcon /> },
];

function Swatch({ colors, dock }: { colors: [string, string]; dock?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
      <rect x="2" y="4" width="28" height="22" rx="3" fill={colors[0]} stroke="#555" />
      {dock ? <rect x="6" y="20" width="20" height="5" rx="1" fill={colors[1]} stroke="#666" strokeWidth=".6" /> : <path d="M2 18c8-6 16 4 28-4v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z" fill={colors[1]} opacity=".85" />}
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill="#fff" stroke="#555" strokeWidth="1.5" />
      <path d="M16 8v8l5 3" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const set = (patch: Partial<Prefs>) => prefs.set((p) => ({ ...p, ...patch }));

export default function SystemPreferences({ win }: AppWindowProps) {
  const pane = (win.props.pane as Pane | null) ?? null;
  const setPane = (p: Pane | null) => A.setWindowProps(win.id, { pane: p });
  useEffect(() => {
    A.setWindowTitle(win.id, PANES.find((p) => p.id === pane)?.label ?? 'System Preferences');
  }, [win.id, pane]);
  useCommands(win.id, Object.fromEntries([['pane:', () => setPane(null)], ...PANES.map((p) => [`pane:${p.id}`, () => setPane(p.id)])]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="toolbar" style={{ borderBottom: '1px solid #9a9a9a', background: 'linear-gradient(#e2e2e2, #cdcdcd)', paddingTop: 4 }}>
        <div className="seg">
          <button type="button" className="tb-btn" aria-label="Back" disabled={!pane} onClick={() => setPane(null)}>
            <span className="bezel">
              <Glyph name="back" />
            </span>
          </button>
          <button type="button" className="tb-btn" aria-label="Forward" disabled>
            <span className="bezel">
              <Glyph name="forward" />
            </span>
          </button>
        </div>
        <button type="button" className="tb-btn" onClick={() => setPane(null)}>
          <span className="bezel">
            <Glyph name="icons" />
          </span>
          <span>Show All</span>
        </button>
      </div>
      <div className="scroll" style={{ flex: 1, padding: pane ? '18px 26px' : '10px 0' }}>
        {!pane && <ShowAll onPick={setPane} />}
        {pane === 'appearance' && <AppearancePane />}
        {pane === 'desktop' && <DesktopPane />}
        {pane === 'dock' && <DockPane />}
        {pane === 'datetime' && <DateTimePane />}
      </div>
    </div>
  );
}

function ShowAll({ onPick }: { onPick: (p: Pane) => void }) {
  return (
    <>
      {(['Personal', 'System'] as const).map((g, i) => (
        <section key={g} style={{ padding: '6px 18px 14px', background: i % 2 ? 'rgba(255,255,255,.35)' : 'none', borderTop: i ? '1px solid #d0d0d0' : 0 }}>
          <h3 style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>{g}</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            {PANES.filter((p) => p.group === g).map((p) => (
              <button key={p.id} type="button" onClick={() => onPick(p.id)} style={{ width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, border: 0, background: 'none', fontSize: 11 }}>
                {p.icon}
                {p.label}
              </button>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 13 }}>
    <span style={{ textAlign: 'right' }}>{label}</span>
    <div>{children}</div>
  </div>
);

function AppearancePane() {
  const p = usePrefs();
  return (
    <>
      <Row label="Appearance:">
        <select className="aqua-popup" value={p.appearance} onChange={(e) => set({ appearance: e.target.value as Prefs['appearance'] })}>
          <option value="blue">Blue</option>
          <option value="graphite">Graphite</option>
        </select>
        <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>For the overall look of buttons, menus and windows</div>
      </Row>
      <Row label="Highlight Color:">
        <select className="aqua-popup" value={p.highlight} onChange={(e) => set({ highlight: e.target.value as Prefs['highlight'] })}>
          {Object.keys(HIGHLIGHTS).map((h) => (
            <option key={h} value={h}>
              {h[0].toUpperCase() + h.slice(1)}
            </option>
          ))}
        </select>
        <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>For selected text</div>
      </Row>
      <Row label="Finder:">
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" className="aqua-check" checked={p.showHidden} onChange={(e) => set({ showHidden: e.target.checked })} />
          Show hidden files in Finder
        </label>
      </Row>
    </>
  );
}

function DesktopPane() {
  const p = usePrefs();
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ width: 150, height: 100, flex: 'none', border: '1px solid #555', backgroundImage: WALLPAPER_CSS[p.wallpaper], backgroundSize: 'cover', boxShadow: '0 1px 4px rgba(0,0,0,.4)' }} aria-label="Current desktop picture" role="img" />
      <div role="radiogroup" aria-label="Desktop pictures" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, flex: 1 }}>
        {WALLPAPERS.map((w) => (
          <button
            key={w.id}
            type="button"
            role="radio"
            aria-checked={p.wallpaper === w.id}
            onClick={() => set({ wallpaper: w.id })}
            style={{ border: 0, background: 'none', padding: 0, fontSize: 10, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}
          >
            <span style={{ width: 84, height: 56, backgroundImage: WALLPAPER_CSS[w.id], backgroundSize: 'cover', outline: p.wallpaper === w.id ? '3px solid var(--sel)' : '1px solid #777', outlineOffset: 1 }} />
            {w.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function DockPane() {
  const p = usePrefs();
  return (
    <>
      <Row label="Dock Size:">
        <input type="range" className="aqua-slider" min={24} max={96} value={p.dockSize} aria-label="Dock size" onChange={(e) => set({ dockSize: Number(e.target.value), magnifySize: Math.max(Number(e.target.value), p.magnifySize) })} style={{ width: 220 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', width: 220, fontSize: 10 }}>
          <span>Small</span>
          <span>Large</span>
        </div>
      </Row>
      <Row label="">
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" className="aqua-check" checked={p.magnify} onChange={(e) => set({ magnify: e.target.checked })} />
          Magnification
        </label>
      </Row>
      <Row label="">
        <input type="range" className="aqua-slider" min={p.dockSize} max={128} value={p.magnifySize} disabled={!p.magnify} aria-label="Magnification size" onChange={(e) => set({ magnifySize: Number(e.target.value) })} style={{ width: 220 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', width: 220, fontSize: 10 }}>
          <span>Min</span>
          <span>Max</span>
        </div>
      </Row>
      <Row label="Minimize using:">
        <select className="aqua-popup" value={p.minimizeEffect} onChange={(e) => set({ minimizeEffect: e.target.value as Prefs['minimizeEffect'] })}>
          <option value="scale">Scale Effect</option>
          <option value="none">No Effect</option>
        </select>
      </Row>
    </>
  );
}

function DateTimePane() {
  const p = usePrefs();
  return (
    <>
      <Row label="">
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" className="aqua-check" checked={p.clock24} onChange={(e) => set({ clock24: e.target.checked })} />
          Use a 24-hour clock
        </label>
      </Row>
      <Row label="">
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" className="aqua-check" checked={p.showSeconds} onChange={(e) => set({ showSeconds: e.target.checked })} />
          Display the time with seconds
        </label>
      </Row>
      <Row label="">
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" className="aqua-check" checked={p.showDay} onChange={(e) => set({ showDay: e.target.checked })} />
          Show the day of the week
        </label>
      </Row>
      <p style={{ fontSize: 11, color: '#555', marginLeft: 180 }}>
        <Icon kind="app:sysprefs" size={14} /> The clock follows this computer’s time.
      </p>
    </>
  );
}
