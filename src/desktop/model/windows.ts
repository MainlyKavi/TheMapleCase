// Window-manager state machine. Pure and serialisable: the shell renders it, tests drive it.
// Every transition returns a new state; nothing here touches the DOM.

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Viewport {
  w: number;
  h: number;
  /** Menu bar height. */
  top: number;
  /** Space reserved for the Dock at the bottom. */
  bottom: number;
}

export interface WinState {
  id: string;
  appId: string;
  title: string;
  bounds: Bounds;
  z: number;
  minimized: boolean;
  /** Bounds before a classic zoom; null when not zoomed. */
  zoomedFrom: Bounds | null;
  resizable: boolean;
  minW: number;
  minH: number;
  /** Serialisable app-specific props (e.g. the file a document window shows). */
  props: Record<string, unknown>;
}

export interface WMState {
  windows: WinState[];
  focused: string | null;
  /** Apps that are running, in launch order. Finder is always running. */
  running: string[];
  hidden: string[];
  nextZ: number;
  nextId: number;
  viewport: Viewport;
  /** App activated without a window (e.g. Safari after its last window closed). */
  activeAppOverride?: string;
}

export interface OpenOptions {
  title: string;
  w: number;
  h: number;
  x?: number;
  y?: number;
  resizable?: boolean;
  minW?: number;
  minH?: number;
  props?: Record<string, unknown>;
  /** Open zoomed to fill the available area (compact screens). */
  fill?: boolean;
}

/** Title bar height: windows are kept so this strip stays reachable. */
export const TITLE_H = 22;
const KEEP_VISIBLE_X = 80;
const CASCADE = 22;

export const initialWM = (viewport: Viewport): WMState => ({
  windows: [],
  focused: null,
  running: ['finder'],
  hidden: [],
  nextZ: 1,
  nextId: 1,
  viewport,
});

/** Usable area between the menu bar and the Dock. */
export const workArea = (v: Viewport): Bounds => ({ x: 0, y: v.top, w: v.w, h: Math.max(120, v.h - v.top - v.bottom) });

/** Keeps a window's title bar on screen and its size within the screen. */
export function constrain(b: Bounds, v: Viewport, minW = 120, minH = 60): Bounds {
  const area = workArea(v);
  const w = Math.max(Math.min(minW, area.w), Math.min(b.w, area.w));
  const h = Math.max(Math.min(minH, v.h - v.top), Math.min(b.h, v.h - v.top));
  const x = Math.min(Math.max(b.x, KEEP_VISIBLE_X - w), v.w - KEEP_VISIBLE_X);
  const y = Math.min(Math.max(b.y, v.top), v.h - TITLE_H - 4);
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

const visible = (s: WMState) => s.windows.filter((w) => !w.minimized && !s.hidden.includes(w.appId));

/** Topmost visible window, used when focus has to move. */
export function topWindow(s: WMState, except?: string): WinState | null {
  return visible(s)
    .filter((w) => w.id !== except)
    .reduce<WinState | null>((top, w) => (!top || w.z > top.z ? w : top), null);
}

/** The app whose menus show in the menu bar. */
export function activeApp(s: WMState): string {
  const f = s.windows.find((w) => w.id === s.focused);
  return f?.appId ?? s.activeAppOverride ?? 'finder';
}


export function openWindow(s: WMState, appId: string, o: OpenOptions): { state: WMState; id: string } {
  const id = `w${s.nextId}`;
  const area = workArea(s.viewport);
  const last = [...s.windows].filter((w) => w.appId === appId && !w.minimized).sort((a, b) => b.z - a.z)[0];
  const ow = Math.min(o.w, area.w);
  const oh = Math.min(o.h, area.h);
  const x = o.x ?? (last ? last.bounds.x + CASCADE : Math.round(area.x + (area.w - ow) / 2));
  const free = area.h - oh;
  const y = o.y ?? (last ? last.bounds.y + CASCADE : Math.round(area.y + (free > 24 ? Math.max(8, free / 3) : free / 2)));
  const minW = o.minW ?? 200;
  const minH = o.minH ?? 120;
  let bounds = constrain({ x, y, w: ow, h: oh }, s.viewport, minW, minH);
  // Cascade wraps back to the top-left once it would run off the work area.
  if (bounds.y + bounds.h > area.y + area.h && last) bounds = constrain({ ...bounds, x: area.x + 40, y: area.y + 10 }, s.viewport, minW, minH);
  const fillBounds = o.fill ? { x: 0, y: area.y, w: area.w, h: area.h } : null;
  const win: WinState = {
    id,
    appId,
    title: o.title,
    bounds: fillBounds ?? bounds,
    z: s.nextZ,
    minimized: false,
    zoomedFrom: fillBounds ? bounds : null,
    resizable: o.resizable ?? true,
    minW,
    minH,
    props: o.props ?? {},
  };
  return {
    id,
    state: {
      ...s,
      windows: [...s.windows, win],
      focused: id,
      running: s.running.includes(appId) ? s.running : [...s.running, appId],
      hidden: s.hidden.filter((a) => a !== appId),
      nextZ: s.nextZ + 1,
      nextId: s.nextId + 1,
      activeAppOverride: undefined,
    },
  };
}

const patch = (s: WMState, id: string, p: Partial<WinState>): WMState => ({
  ...s,
  windows: s.windows.map((w) => (w.id === id ? { ...w, ...p } : w)),
});

export function focusWindow(s: WMState, id: string): WMState {
  const w = s.windows.find((x) => x.id === id);
  if (!w) return s;
  if (s.focused === id && !w.minimized && w.z === s.nextZ - 1 && !s.hidden.includes(w.appId)) return s;
  return {
    ...patch(s, id, { z: s.nextZ, minimized: false }),
    focused: id,
    nextZ: s.nextZ + 1,
    hidden: s.hidden.filter((a) => a !== w.appId),
    activeAppOverride: undefined,
  };
}

/** Closing keeps the app running (Mac behaviour) unless quitOnLastClose is set. */
export function closeWindow(s: WMState, id: string, quitOnLastClose = false): WMState {
  const w = s.windows.find((x) => x.id === id);
  if (!w) return s;
  let next: WMState = { ...s, windows: s.windows.filter((x) => x.id !== id) };
  const appStillHasWindows = next.windows.some((x) => x.appId === w.appId);
  if (!appStillHasWindows && quitOnLastClose && w.appId !== 'finder') next = { ...next, running: next.running.filter((a) => a !== w.appId) };
  if (s.focused === id) {
    // Focus stays with the same app if it has another window, else the topmost window.
    const sameApp = visible(next).filter((x) => x.appId === w.appId).sort((a, b) => b.z - a.z)[0];
    const top = sameApp ?? topWindow(next);
    next = { ...next, focused: top?.id ?? null };
    if (!top && next.running.includes(w.appId)) next.activeAppOverride = w.appId;
  }
  return next;
}

export function minimizeWindow(s: WMState, id: string): WMState {
  if (!s.windows.some((w) => w.id === id)) return s;
  const next = patch(s, id, { minimized: true });
  if (s.focused !== id) return next;
  const top = topWindow(next);
  const app = s.windows.find((w) => w.id === id)!.appId;
  return { ...next, focused: top?.id ?? null, activeAppOverride: top ? undefined : app };
}

export const restoreWindow = (s: WMState, id: string): WMState => focusWindow(s, id);

/** Classic zoom: toggle between the user's size and the best fit for the content. */
export function zoomWindow(s: WMState, id: string, ideal?: { w: number; h: number }): WMState {
  const w = s.windows.find((x) => x.id === id);
  if (!w || !w.resizable) return s;
  if (w.zoomedFrom) return focusWindow(patch(s, id, { bounds: w.zoomedFrom, zoomedFrom: null }), id);
  const area = workArea(s.viewport);
  const target = ideal
    ? constrain({ x: w.bounds.x, y: w.bounds.y, w: Math.min(ideal.w, area.w), h: Math.min(ideal.h, area.h) }, s.viewport)
    : { x: area.x + 4, y: area.y + 2, w: area.w - 8, h: area.h - 4 };
  // Keep the zoomed window fully inside the work area.
  const fitted = {
    ...target,
    x: Math.max(area.x, Math.min(target.x, area.x + area.w - target.w)),
    y: Math.max(area.y, Math.min(target.y, area.y + area.h - target.h)),
  };
  return focusWindow(patch(s, id, { bounds: fitted, zoomedFrom: w.bounds }), id);
}

export function moveWindow(s: WMState, id: string, x: number, y: number): WMState {
  const w = s.windows.find((q) => q.id === id);
  if (!w) return s;
  return patch(s, id, { bounds: constrain({ ...w.bounds, x, y }, s.viewport, w.minW, w.minH) });
}

export function resizeWindow(s: WMState, id: string, width: number, height: number): WMState {
  const w = s.windows.find((q) => q.id === id);
  if (!w || !w.resizable) return s;
  const b = constrain({ ...w.bounds, w: Math.max(w.minW, width), h: Math.max(w.minH, height) }, s.viewport, w.minW, w.minH);
  return patch(s, id, { bounds: b, zoomedFrom: null });
}

export const setTitle = (s: WMState, id: string, title: string): WMState => {
  const w = s.windows.find((q) => q.id === id);
  return !w || w.title === title ? s : patch(s, id, { title });
};

export const setProps = (s: WMState, id: string, props: Record<string, unknown>): WMState => {
  const w = s.windows.find((q) => q.id === id);
  return w ? patch(s, id, { props: { ...w.props, ...props } }) : s;
};

export function hideApp(s: WMState, appId: string): WMState {
  if (s.hidden.includes(appId)) return s;
  const next = { ...s, hidden: [...s.hidden, appId] };
  const top = topWindow(next);
  return { ...next, focused: top?.id ?? null, activeAppOverride: top ? undefined : 'finder' };
}

export function hideOthers(s: WMState, keep: string): WMState {
  const others = s.running.filter((a) => a !== keep);
  const next = { ...s, hidden: [...new Set([...s.hidden, ...others])] };
  const top = topWindow(next);
  return { ...next, focused: top?.id ?? null };
}

export const showAll = (s: WMState): WMState => ({ ...s, hidden: [] });

export function quitApp(s: WMState, appId: string): WMState {
  if (appId === 'finder') {
    // Finder cannot quit; closing its windows is the closest equivalent.
    let next = s;
    for (const w of s.windows.filter((x) => x.appId === 'finder')) next = closeWindow(next, w.id);
    return next;
  }
  const next: WMState = {
    ...s,
    windows: s.windows.filter((w) => w.appId !== appId),
    running: s.running.filter((a) => a !== appId),
    hidden: s.hidden.filter((a) => a !== appId),
  };
  const top = topWindow(next);
  return { ...next, focused: top?.id ?? null, activeAppOverride: undefined };
}

/** Activates an app (Dock click / app switcher). Returns null when a new window is needed. */
export function activateApp(s: WMState, appId: string): WMState | null {
  const wins = s.windows.filter((w) => w.appId === appId);
  const shown = wins.filter((w) => !w.minimized).sort((a, b) => b.z - a.z);
  let next: WMState = { ...s, hidden: s.hidden.filter((a) => a !== appId) };
  if (shown.length) {
    // Bring every window of the app forward, keeping their relative order.
    for (const w of [...shown].reverse()) next = focusWindow(next, w.id);
    return next;
  }
  const mini = wins.sort((a, b) => b.z - a.z)[0];
  if (mini) return restoreWindow(next, mini.id);
  if (!s.running.includes(appId)) return null;
  return null;
}

export function setViewport(s: WMState, v: Viewport): WMState {
  return {
    ...s,
    viewport: v,
    windows: s.windows.map((w) => ({ ...w, bounds: constrain(w.bounds, v, w.minW, w.minH) })),
  };
}

/** Running apps in switcher order: active first, then most recently used. */
export function switcherOrder(s: WMState): string[] {
  const recency = new Map<string, number>();
  for (const w of s.windows) recency.set(w.appId, Math.max(recency.get(w.appId) ?? 0, w.z));
  const active = activeApp(s);
  return [...s.running].sort((a, b) => (a === active ? -1 : b === active ? 1 : (recency.get(b) ?? 0) - (recency.get(a) ?? 0)));
}
