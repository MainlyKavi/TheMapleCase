'use client';

// Builds the menu bar for the active application and resolves keyboard shortcuts from it, so
// menus are the single source of truth for commands.

import { APPS, type AppMenuItem } from '@/applications/registry';
import { focusedEditable } from './edit-menu';
import * as A from '../actions';
import { activeApp } from '../model/windows';
import { getCommands, prefs, ui, wm, type MenuItem } from '../store';

export interface BarMenu {
  id: string;
  title: string;
  items: MenuItem[];
  bold?: boolean;
}

const BUILTIN: Record<string, (winId: string) => void> = {
  close: (id) => A.closeWindow(id),
  minimize: (id) => A.minimizeWindow(id),
  zoom: (id) => A.zoomWindow(id),
};

function resolve(items: AppMenuItem[], winId: string | null): MenuItem[] {
  const cmds = getCommands(winId);
  return items.map((it): MenuItem => {
    if (it.separator) return { separator: true };
    let action = it.run;
    if (!action && it.cmd) {
      if (cmds[it.cmd]) action = cmds[it.cmd];
      else if (it.cmd === 'selectAll' && focusedEditable()) action = () => document.execCommand('selectAll');
      else if (BUILTIN[it.cmd] && winId) action = () => BUILTIN[it.cmd!](winId);
    }
    return {
      label: it.label,
      shortcut: it.shortcut,
      action,
      checked: it.checked?.(),
      disabled: it.submenu ? false : !action || it.enabled?.() === false,
      submenu: it.submenu ? resolve(it.submenu, winId) : undefined,
    };
  });
}

export function buildMenus(): BarMenu[] {
  const s = wm.get();
  const appId = activeApp(s);
  const app = APPS[appId] ?? APPS.finder;
  const focused = s.focused;
  const appWindows = s.windows.filter((w) => w.appId === appId);
  const p = prefs.get();

  const apple: MenuItem[] = [
    { label: 'About This Mac', action: () => A.openPanel('finder', 'about', { about: 'mac' }) },
    { label: 'Software Update…', disabled: true },
    { label: 'Mac OS X Software…', disabled: true },
    { separator: true },
    { label: 'System Preferences…', action: () => A.launchApp('sysprefs') },
    {
      label: 'Dock',
      submenu: [
        { label: p.magnify ? 'Turn Magnification Off' : 'Turn Magnification On', action: () => prefs.set((x) => ({ ...x, magnify: !x.magnify })) },
        { separator: true },
        { label: 'Dock Preferences…', action: () => A.launchApp('sysprefs', { pane: 'dock' }) },
      ],
    },
    { label: 'Location', submenu: [{ label: 'Automatic', checked: true, action: () => {} }] },
    { separator: true },
    {
      label: 'Recent Items',
      submenu: (() => {
        const recent = s.running.filter((a) => a !== 'finder' && APPS[a]);
        return recent.length
          ? [{ label: 'Applications', disabled: true }, ...recent.map((a) => ({ label: APPS[a].name, icon: APPS[a].icon, action: () => A.launchApp(a) }))]
          : [{ label: 'No Recent Items', disabled: true }];
      })(),
    },
    { separator: true },
    { label: 'Force Quit…', shortcut: '⌥⌘⎋', action: () => A.openPanel('finder', 'forcequit') },
    { separator: true },
    { label: 'Sleep', action: () => ui.set((u) => ({ ...u, power: 'sleep', menu: null })) },
    {
      label: 'Restart…',
      action: () =>
        A.alert({
          title: 'Are you sure you want to restart your computer now?',
          message: 'Open windows will be closed and the desktop returned to its starting state.',
          icon: 'caution',
          buttons: [
            { label: 'Cancel', cancel: true },
            { label: 'Restart', default: true, action: restart },
          ],
        }),
    },
    {
      label: 'Shut Down…',
      action: () =>
        A.alert({
          title: 'Are you sure you want to shut down your computer now?',
          icon: 'caution',
          buttons: [
            { label: 'Cancel', cancel: true },
            { label: 'Shut Down', default: true, action: () => { A.resetDesktop(); ui.set((u) => ({ ...u, power: 'off' })); } },
          ],
        }),
    },
    { separator: true },
    { label: `Log Out ${'User'}…`, shortcut: '⇧⌘Q', disabled: true },
  ];

  const appMenu: MenuItem[] = [
    { label: `About ${app.name}`, action: () => A.openPanel(appId, 'about', { about: appId }) },
    { separator: true },
    ...resolve(app.prefsCmd ? [{ label: 'Preferences…', shortcut: '⌘,', cmd: app.prefsCmd }] : [], focused),
    ...(app.prefsCmd ? [{ separator: true } as MenuItem] : []),
    { label: 'Services', submenu: [{ label: 'No Services Apply', disabled: true }] },
    { separator: true },
    { label: `Hide ${app.name}`, shortcut: '⌘H', action: () => A.hideApp(appId), disabled: appId === 'finder' && !appWindows.length },
    { label: 'Hide Others', shortcut: '⌥⌘H', action: () => A.hideOthers(appId) },
    { label: 'Show All', action: A.showAll, disabled: !s.hidden.length },
    ...(appId === 'finder'
      ? [{ separator: true } as MenuItem, { label: 'Secure Empty Trash…', disabled: true }, { label: 'Empty Trash…', shortcut: '⇧⌘⌫', action: A.emptyTrash }]
      : [{ separator: true } as MenuItem, { label: `Quit ${app.name}`, shortcut: '⌘Q', action: () => A.quitApp(appId) }]),
  ];

  const windowMenu: MenuItem[] = [
    { label: 'Minimize', shortcut: '⌘M', action: focused ? () => A.minimizeWindow(focused) : undefined, disabled: !focused },
    { label: 'Zoom', action: focused ? () => A.zoomWindow(focused) : undefined, disabled: !focused },
    { separator: true },
    { label: 'Cycle Through Applications', shortcut: '⌃`', action: () => cycleApps(1) },
    { label: 'Bring All to Front', action: () => A.bringAllToFront(appId), disabled: !appWindows.length },
    ...(appWindows.length ? [{ separator: true } as MenuItem] : []),
    ...appWindows.map((w) => ({ label: w.title, checked: w.id === focused, action: () => A.restoreWindow(w.id) })),
  ];

  return [
    { id: 'apple', title: '', items: apple },
    { id: 'app', title: app.name, items: appMenu, bold: true },
    ...app.menus.map((m) => ({ id: `m-${m.title}`, title: m.title, items: resolve(m.items, focused) })),
    { id: 'window', title: 'Window', items: windowMenu },
    { id: 'help', title: 'Help', items: [{ label: `${app.name} Help`, shortcut: '⌘?', disabled: true }] },
  ];
}

function restart() {
  ui.set((u) => ({ ...u, power: 'restarting' }));
  A.resetDesktop();
  setTimeout(() => ui.set((u) => ({ ...u, power: 'on' })), 1800);
}

export function cycleApps(dir: 1 | -1) {
  const s = wm.get();
  const running = s.running.filter((a) => APPS[a]);
  if (running.length < 2) return;
  const i = running.indexOf(activeApp(s));
  const next = running[(i + dir + running.length) % running.length];
  A.launchApp(next);
}

/** Matches a keyboard event against a menu shortcut like "⌘N", "⇧⌘N", "⌥⌘H". */
export function matchShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const mods = { cmd: shortcut.includes('⌘'), shift: shortcut.includes('⇧'), alt: shortcut.includes('⌥'), ctrl: shortcut.includes('⌃') };
  const key = shortcut.replace(/[⌘⇧⌥⌃]/g, '');
  const cmd = e.metaKey || (e.ctrlKey && !mods.ctrl);
  if (mods.cmd !== cmd || mods.shift !== e.shiftKey || mods.alt !== e.altKey) return false;
  const k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  const map: Record<string, string> = { '⌫': 'Backspace', '⎋': 'Escape', '?': '?' };
  const want = map[key] ?? key.toUpperCase();
  return k === want || (want === ',' && e.key === ',') || (e.code === `Key${want}` && want.length === 1);
}

/** Runs the menu command for a shortcut. Returns true when one matched. */
export function dispatchShortcut(e: KeyboardEvent): boolean {
  const visit = (items: MenuItem[]): MenuItem | null => {
    for (const it of items) {
      if (it.submenu) {
        const hit = visit(it.submenu);
        if (hit) return hit;
      } else if (it.shortcut && !it.disabled && it.action && matchShortcut(e, it.shortcut)) return it;
    }
    return null;
  };
  for (const m of buildMenus()) {
    const hit = visit(m.items);
    if (hit) {
      hit.action!();
      return true;
    }
  }
  return false;
}
