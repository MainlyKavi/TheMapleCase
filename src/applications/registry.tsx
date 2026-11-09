'use client';

// Application registry. Adding an app = one entry here plus its folder; the shell, Dock,
// menus, Finder associations and shortcuts pick it up from this table.

import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { EDIT_MENU } from '@/desktop/shell/edit-menu';
import { displayName, getNode, type Fs, type IconKind } from '@/desktop/model/vfs';
import type { WinState } from '@/desktop/model/windows';
import { goTo, openFinder } from './finder/nav';
import { bookmarks, openUrl } from './safari/links';
import { newNote, STICKY_COLORS } from './stickies/notes';

export interface AppWindowProps {
  win: WinState;
  focused: boolean;
}

export interface AppMenuItem {
  label: string;
  shortcut?: string;
  /** Command handled by the focused window (registered with useCommands). */
  cmd?: string;
  /** App-level action that needs no window. */
  run?: () => void;
  separator?: boolean;
  checked?: () => boolean;
  enabled?: () => boolean;
  submenu?: AppMenuItem[];
}

export interface AppDef {
  id: string;
  name: string;
  icon: IconKind;
  chrome: 'aqua' | 'metal' | 'unified' | 'sticky';
  component: LazyExoticComponent<ComponentType<AppWindowProps>>;
  window: { w: number; h: number; minW?: number; minH?: number; resizable?: boolean; minimizable?: boolean; ideal?: { w: number; h: number } };
  menus: { title: string; items: AppMenuItem[] }[];
  defaultProps?: () => Record<string, unknown>;
  titleFor?: (props: Record<string, unknown>, fs: Fs) => string;
  singleWindow?: boolean;
  quitOnLastClose?: boolean;
  noDefaultWindow?: boolean;
  hiddenFromDock?: boolean;
  prefsCmd?: string;
  onLaunch?: () => void;
}

const SEP: AppMenuItem = { label: '', separator: true };
const CLOSE: AppMenuItem = { label: 'Close Window', shortcut: '⌘W', cmd: 'close' };
const EDIT = { title: 'Edit', items: EDIT_MENU };
const fileTitle = (key: string, fallback: string) => (props: Record<string, unknown>, fs: Fs) => {
  const n = getNode(fs, props[key] as string);
  return n ? displayName(n) : fallback;
};

export const APPS: Record<string, AppDef> = {
  finder: {
    id: 'finder',
    name: 'Finder',
    icon: 'app:finder',
    chrome: 'metal',
    component: lazy(() => import('./finder/Finder')),
    window: { w: 720, h: 440, minW: 360, minH: 220, ideal: { w: 900, h: 560 } },
    defaultProps: () => ({ dir: 'home' }),
    titleFor: (p, fs) => {
      if (p.panel === 'info') return `${fileTitle('info', 'Info')({ info: p.info }, fs)} Info`;
      if (p.panel) return '';
      return fileTitle('dir', 'Finder')(p, fs);
    },
    menus: [
      {
        title: 'File',
        items: [
          { label: 'New Finder Window', shortcut: '⌘N', run: () => openFinder('home') },
          { label: 'New Folder', shortcut: '⇧⌘N', cmd: 'newFolder' },
          { label: 'Open', shortcut: '⌘O', cmd: 'open' },
          CLOSE,
          SEP,
          { label: 'Get Info', shortcut: '⌘I', cmd: 'info' },
          SEP,
          { label: 'Move to Trash', shortcut: '⌘⌫', cmd: 'trash' },
          { label: 'Put Back', cmd: 'putBack' },
          SEP,
          { label: 'Find', shortcut: '⌘F', cmd: 'find' },
        ],
      },
      EDIT,
      {
        title: 'View',
        items: [
          { label: 'as Icons', shortcut: '⌘1', cmd: 'viewIcons' },
          { label: 'as List', shortcut: '⌘2', cmd: 'viewList' },
          { label: 'as Columns', shortcut: '⌘3', cmd: 'viewColumns' },
        ],
      },
      {
        title: 'Go',
        items: [
          { label: 'Back', shortcut: '⌘[', cmd: 'back' },
          { label: 'Forward', shortcut: '⌘]', cmd: 'forward' },
          { label: 'Enclosing Folder', shortcut: '⌘↑', cmd: 'up' },
          SEP,
          { label: 'Computer', shortcut: '⇧⌘C', run: () => goTo('root') },
          { label: 'Home', shortcut: '⇧⌘H', run: () => goTo('home') },
          { label: 'Desktop', shortcut: '⇧⌘D', run: () => goTo('desktop') },
          { label: 'Documents', run: () => goTo('documents') },
          { label: 'Applications', shortcut: '⇧⌘A', run: () => goTo('applications') },
          { label: 'Utilities', shortcut: '⇧⌘U', run: () => goTo('utilities') },
        ],
      },
    ],
  },
  safari: {
    id: 'safari',
    name: 'Safari',
    icon: 'app:safari',
    chrome: 'metal',
    component: lazy(() => import('./safari/Safari')),
    window: { w: 1000, h: 680, minW: 420, minH: 260, ideal: { w: 1100, h: 900 } },
    defaultProps: () => ({ url: '/home/' }),
    titleFor: () => 'Safari',
    menus: [
      {
        title: 'File',
        items: [
          { label: 'New Window', shortcut: '⌘N', run: () => openUrl('/home/', true) },
          { label: 'Open Location…', shortcut: '⌘L', cmd: 'openLocation' },
          CLOSE,
        ],
      },
      EDIT,
      { title: 'View', items: [{ label: 'Stop', shortcut: '⌘.', cmd: 'stop' }, { label: 'Reload Page', shortcut: '⌘R', cmd: 'reload' }] },
      {
        title: 'History',
        items: [
          { label: 'Back', shortcut: '⌘[', cmd: 'back' },
          { label: 'Forward', shortcut: '⌘]', cmd: 'forward' },
          { label: 'Home', shortcut: '⇧⌘H', cmd: 'home' },
        ],
      },
      {
        title: 'Bookmarks',
        items: [
          { label: 'Add Bookmark…', shortcut: '⌘D', cmd: 'addBookmark' },
          SEP,
          ...bookmarks.map((b) => ({ label: b.label, run: () => openUrl(b.url) })),
        ],
      },
    ],
  },
  mail: {
    id: 'mail',
    name: 'Mail',
    icon: 'app:mail',
    chrome: 'unified',
    component: lazy(() => import('./mail/Mail')),
    window: { w: 860, h: 560, minW: 520, minH: 320 },
    defaultProps: () => ({ mailbox: 'inbox' }),
    titleFor: () => 'Inbox (0 messages)',
    menus: [
      { title: 'File', items: [{ label: 'New Message', shortcut: '⌘N', cmd: 'compose' }, CLOSE] },
      EDIT,
      { title: 'Mailbox', items: [{ label: 'Get New Mail', shortcut: '⇧⌘N', cmd: 'getMail' }] },
      {
        title: 'Message',
        items: [
          { label: 'Reply', shortcut: '⌘R', cmd: 'reply' },
          { label: 'Reply All', shortcut: '⇧⌘R', cmd: 'replyAll' },
          { label: 'Forward', shortcut: '⇧⌘F', cmd: 'forward' },
        ],
      },
    ],
  },
  textedit: {
    id: 'textedit',
    name: 'TextEdit',
    icon: 'app:textedit',
    chrome: 'aqua',
    component: lazy(() => import('./textedit/TextEdit')),
    window: { w: 620, h: 520, minW: 300, minH: 200 },
    defaultProps: () => ({}),
    titleFor: fileTitle('nodeId', 'Untitled'),
    menus: [
      {
        title: 'File',
        items: [
          { label: 'New', shortcut: '⌘N', run: () => import('@/desktop/actions').then((A) => A.openWindow('textedit', {})) },
          { label: 'Open…', shortcut: '⌘O', run: () => openFinder('documents') },
          CLOSE,
          { label: 'Save', shortcut: '⌘S', cmd: 'save' },
          { label: 'Save As…', shortcut: '⇧⌘S', cmd: 'saveAs' },
        ],
      },
      EDIT,
      {
        title: 'Format',
        items: [
          { label: 'Bigger', shortcut: '⌘+', cmd: 'bigger' },
          { label: 'Smaller', shortcut: '⌘-', cmd: 'smaller' },
          SEP,
          { label: 'Wrap to Window', cmd: 'wrap' },
        ],
      },
    ],
  },
  preview: {
    id: 'preview',
    name: 'Preview',
    icon: 'app:preview',
    chrome: 'unified',
    component: lazy(() => import('./preview/Preview')),
    window: { w: 640, h: 600, minW: 300, minH: 240 },
    noDefaultWindow: true,
    titleFor: fileTitle('nodeId', 'Preview'),
    menus: [
      { title: 'File', items: [{ label: 'Open…', shortcut: '⌘O', run: () => openFinder('documents') }, CLOSE] },
      EDIT,
      {
        title: 'View',
        items: [
          { label: 'Actual Size', shortcut: '⌘0', cmd: 'actual' },
          { label: 'Zoom to Fit', cmd: 'fit' },
          { label: 'Zoom In', shortcut: '⌘+', cmd: 'zoomIn' },
          { label: 'Zoom Out', shortcut: '⌘-', cmd: 'zoomOut' },
        ],
      },
      { title: 'Go', items: [{ label: 'Previous', cmd: 'prev' }, { label: 'Next', cmd: 'next' }] },
      { title: 'Tools', items: [{ label: 'Get Info', shortcut: '⌘I', cmd: 'inspector' }] },
    ],
  },
  quicktime: {
    id: 'quicktime',
    name: 'QuickTime Player',
    icon: 'app:quicktime',
    chrome: 'metal',
    component: lazy(() => import('./quicktime/QuickTime')),
    window: { w: 560, h: 420, minW: 300, minH: 180 },
    noDefaultWindow: true,
    titleFor: fileTitle('nodeId', 'QuickTime Player'),
    menus: [
      { title: 'File', items: [{ label: 'Open File…', shortcut: '⌘O', run: () => openFinder('documents') }, CLOSE] },
      EDIT,
      { title: 'View', items: [{ label: 'Play / Pause', cmd: 'playPause' }] },
    ],
  },
  addressbook: {
    id: 'addressbook',
    name: 'Address Book',
    icon: 'app:addressbook',
    chrome: 'metal',
    component: lazy(() => import('./addressbook/AddressBook')),
    window: { w: 700, h: 440, minW: 480, minH: 260 },
    defaultProps: () => ({}),
    singleWindow: true,
    titleFor: () => 'Address Book',
    menus: [{ title: 'File', items: [CLOSE] }, EDIT, { title: 'Card', items: [{ label: 'Go to Next Card', cmd: 'nextCard' }, { label: 'Go to Previous Card', cmd: 'prevCard' }] }],
  },
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    icon: 'app:terminal',
    chrome: 'aqua',
    component: lazy(() => import('./terminal/Terminal')),
    window: { w: 590, h: 380, minW: 300, minH: 160 },
    defaultProps: () => ({}),
    titleFor: () => 'Terminal — bash — 80x24',
    menus: [
      { title: 'Shell', items: [{ label: 'New Window', shortcut: '⌘N', run: () => import('@/desktop/actions').then((A) => A.openWindow('terminal', {})) }, CLOSE] },
      EDIT,
      { title: 'Scrollback', items: [{ label: 'Clear Scrollback', shortcut: '⌘K', cmd: 'clear' }] },
    ],
  },
  stickies: {
    id: 'stickies',
    name: 'Stickies',
    icon: 'app:stickies',
    chrome: 'sticky',
    component: lazy(() => import('./stickies/Stickies')),
    window: { w: 240, h: 200, minW: 120, minH: 80 },
    defaultProps: () => ({ color: 'yellow' }),
    titleFor: () => 'Untitled',
    menus: [
      { title: 'File', items: [{ label: 'New Note', shortcut: '⌘N', run: () => newNote() }, { label: 'Close', shortcut: '⌘W', cmd: 'close' }] },
      EDIT,
      { title: 'Color', items: STICKY_COLORS.map((c) => ({ label: c[0].toUpperCase() + c.slice(1), cmd: `color:${c}` })) },
    ],
  },
  sysprefs: {
    id: 'sysprefs',
    name: 'System Preferences',
    icon: 'app:sysprefs',
    chrome: 'aqua',
    component: lazy(() => import('./sysprefs/SystemPreferences')),
    window: { w: 600, h: 420, resizable: false },
    defaultProps: () => ({ pane: null }),
    singleWindow: true,
    quitOnLastClose: true,
    titleFor: () => 'System Preferences',
    menus: [
      EDIT,
      {
        title: 'View',
        items: [
          { label: 'Show All Preferences', shortcut: '⌘L', cmd: 'pane:' },
          SEP,
          { label: 'Appearance', cmd: 'pane:appearance' },
          { label: 'Date & Time', cmd: 'pane:datetime' },
          { label: 'Desktop', cmd: 'pane:desktop' },
          { label: 'Dock', cmd: 'pane:dock' },
        ],
      },
    ],
  },
};

/** Apps kept in the Dock, in order. */
export const DOCK_APPS = ['finder', 'mail', 'safari', 'addressbook', 'textedit', 'preview', 'quicktime', 'terminal', 'stickies', 'sysprefs'];
