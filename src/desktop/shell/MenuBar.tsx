'use client';

import { useMemo, useRef, useSyncExternalStore } from 'react';
import * as A from '../actions';
import { commandVersion, prefs, ui, useStore, useUI, usePrefs, useWM } from '../store';
import { AppleGlyph, SpotlightGlyph } from './icons';
import { Menu } from './Menu';
import { buildMenus } from './menus';
import { Spotlight } from './Spotlight';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LONG_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const tick = (cb: () => void) => {
  const t = setInterval(cb, 1000);
  return () => clearInterval(t);
};

/** Current time per the clock config: the viewer's clock, or a fixed fictional time. */
export function useClock(): { time: string; date: string | null } {
  const p = usePrefs();
  const cfg = useUI((u) => u.clock);
  const second = useSyncExternalStore(tick, () => Math.floor(Date.now() / 1000), () => 0);
  return useMemo(() => {
    if (!second) return { time: '', date: null };
    const now = new Date(second * 1000);
    let h = now.getHours();
    let m = now.getMinutes();
    if (cfg.time !== 'system') [h, m] = cfg.time.split(':').map(Number);
    const sec = cfg.time === 'system' && p.showSeconds ? `:${String(now.getSeconds()).padStart(2, '0')}` : '';
    const hh = p.clock24 ? String(h).padStart(2, '0') : String(h % 12 || 12);
    const time = `${hh}:${String(m).padStart(2, '0')}${sec}${p.clock24 ? '' : h < 12 ? ' AM' : ' PM'}`;
    let date: string | null = null;
    let day: string | null = null;
    if (cfg.date === 'system') {
      date = `${LONG_DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
      day = DAYS[now.getDay()];
    } else if (cfg.date && /^\d{4}-\d{2}-\d{2}$/.test(cfg.date)) {
      const d = new Date(`${cfg.date}T12:00:00`);
      date = `${LONG_DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
      day = DAYS[d.getDay()];
    }
    return { time: p.showDay && day ? `${day} ${time}` : time, date };
  }, [second, cfg, p.clock24, p.showSeconds, p.showDay]);
}

export function MenuBar() {
  const open = useUI((u) => u.menu);
  const spotlight = useUI((u) => u.spotlight);
  const compact = useUI((u) => u.compact);
  const appearance = usePrefs().appearance;
  // Re-render when the active app, windows or window commands change.
  useWM((s) => s.focused);
  useWM((s) => s.windows);
  useWM((s) => s.activeAppOverride);
  useWM((s) => s.hidden);
  useStore(commandVersion, (v) => v);
  usePrefs();
  const menus = buildMenus();
  const clock = useClock();
  const bar = useRef<HTMLDivElement>(null);
  const shown = compact ? menus.filter((m) => ['apple', 'app', 'm-File', 'window'].includes(m.id)) : menus;

  const setMenu = (id: string | null) => ui.set((u) => ({ ...u, menu: id, contextMenu: null, spotlight: false }));
  const step = (dir: 1 | -1) => {
    const ids = [...shown.map((m) => m.id), 'clock'];
    const i = ids.indexOf(open ?? '');
    setMenu(ids[(i + dir + ids.length) % ids.length]);
  };

  return (
    <div ref={bar} className="menubar" role="menubar" aria-label="Menu bar" onMouseDown={(e) => e.preventDefault()}>
      {shown.map((m) => {
        const isOpen = open === m.id;
        return (
          <div key={m.id} style={{ position: 'relative' }}>
            <button
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-label={m.id === 'apple' ? 'Apple' : undefined}
              className={`menubar-item${m.id === 'apple' ? ' apple' : ''}${m.bold ? ' app-name' : ''}`}
              onMouseDown={() => setMenu(isOpen ? null : m.id)}
              onMouseEnter={() => open && open !== m.id && setMenu(m.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  setMenu(m.id);
                }
              }}
            >
              {m.id === 'apple' ? <AppleGlyph graphite={appearance === 'graphite'} /> : m.title}
            </button>
            {isOpen && (
              <Menu
                items={m.items}
                label={m.title || 'Apple'}
                onDone={() => setMenu(null)}
                autoFocus
                onLeft={() => step(-1)}
                onRight={() => step(1)}
                style={{ left: 0, top: 22 }}
              />
            )}
          </div>
        );
      })}
      <div className="menubar-right">
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={open === 'clock'}
            className="menubar-item menubar-clock"
            onMouseDown={() => setMenu(open === 'clock' ? null : 'clock')}
            onMouseEnter={() => open && open !== 'clock' && setMenu('clock')}
          >
            {clock.time}
          </button>
          {open === 'clock' && (
            <Menu
              label="Date and time"
              onDone={() => setMenu(null)}
              autoFocus
              onLeft={() => step(-1)}
              style={{ right: 0, top: 22 }}
              items={[
                ...(clock.date ? [{ label: clock.date, disabled: true }, { separator: true }] : []),
                { label: 'View as Analog', disabled: true },
                { label: 'View as Digital', checked: true, action: () => {} },
                { separator: true },
                { label: 'Open Date & Time…', action: () => A.launchApp('sysprefs', { pane: 'datetime' }) },
              ]}
            />
          )}
        </div>
        <button
          type="button"
          className={`menubar-item${spotlight ? ' open' : ''}`}
          aria-label="Spotlight"
          aria-expanded={spotlight}
          onMouseDown={() => ui.set((u) => ({ ...u, spotlight: !u.spotlight, menu: null }))}
          style={{ padding: '0 9px' }}
        >
          <SpotlightGlyph />
        </button>
      </div>
      {spotlight && <Spotlight />}
    </div>
  );
}

/** Restores the menu clock defaults (used by System Preferences). */
export const setClockPrefs = (patch: Partial<ReturnType<typeof prefs.get>>) => prefs.set((p) => ({ ...p, ...patch }));
