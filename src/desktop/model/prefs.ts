// Harmless user preferences (persisted per browser). Anything read back from storage is
// validated here, since localStorage is outside our control.

export const WALLPAPERS = [
  { id: 'aqua-blue', name: 'Aqua Blue' },
  { id: 'aqua-graphite', name: 'Aqua Graphite' },
  { id: 'jaguar-swirl', name: 'Early Aqua' },
  { id: 'solid-blue', name: 'Solid Aqua Blue' },
  { id: 'solid-gray', name: 'Solid Gray Medium' },
  { id: 'solid-gray-dark', name: 'Solid Gray Dark' },
] as const;

export type WallpaperId = (typeof WALLPAPERS)[number]['id'];

export interface Prefs {
  wallpaper: WallpaperId;
  /** Dock tile size in px (base). */
  dockSize: number;
  magnify: boolean;
  /** Magnified tile size in px. */
  magnifySize: number;
  minimizeEffect: 'scale' | 'none';
  appearance: 'blue' | 'graphite';
  highlight: 'blue' | 'graphite' | 'silver' | 'gold' | 'red' | 'orange' | 'green' | 'purple';
  clock24: boolean;
  showSeconds: boolean;
  showDay: boolean;
  /** Finder: show hidden items (dotfiles). */
  showHidden: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  wallpaper: 'aqua-blue',
  dockSize: 48,
  magnify: true,
  magnifySize: 80,
  minimizeEffect: 'scale',
  appearance: 'blue',
  highlight: 'blue',
  clock24: false,
  showSeconds: false,
  showDay: false,
  showHidden: false,
};

export const HIGHLIGHTS: Record<Prefs['highlight'], string> = {
  blue: '#b5d5ff',
  graphite: '#c7d0db',
  silver: '#d4d4d4',
  gold: '#fbe599',
  red: '#ffb18c',
  orange: '#ffd09b',
  green: '#c3f6a1',
  purple: '#e3c3ff',
};

const clamp = (n: unknown, lo: number, hi: number, d: number) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : d);
const oneOf = <T extends string>(v: unknown, list: readonly T[], d: T): T => (list.includes(v as T) ? (v as T) : d);
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);

export function sanitizePrefs(raw: unknown): Prefs {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_PREFS;
  const dockSize = clamp(r.dockSize, 24, 96, d.dockSize);
  return {
    wallpaper: oneOf(r.wallpaper, WALLPAPERS.map((w) => w.id), d.wallpaper),
    dockSize,
    magnify: bool(r.magnify, d.magnify),
    magnifySize: Math.max(dockSize, clamp(r.magnifySize, 24, 128, d.magnifySize)),
    minimizeEffect: oneOf(r.minimizeEffect, ['scale', 'none'] as const, d.minimizeEffect),
    appearance: oneOf(r.appearance, ['blue', 'graphite'] as const, d.appearance),
    highlight: oneOf(r.highlight, Object.keys(HIGHLIGHTS) as Prefs['highlight'][], d.highlight),
    clock24: bool(r.clock24, d.clock24),
    showSeconds: bool(r.showSeconds, d.showSeconds),
    showDay: bool(r.showDay, d.showDay),
    showHidden: bool(r.showHidden, d.showHidden),
  };
}

/** Dock magnification: tile sizes for a pointer position (null = not hovering). */
export function magnify(centers: number[], pointer: number | null, base: number, max: number): number[] {
  if (pointer === null || max <= base) return centers.map(() => base);
  const range = base * 3.2;
  return centers.map((c) => {
    const d = Math.abs(pointer - c);
    if (d >= range) return base;
    const f = (Math.cos((Math.PI * d) / range) + 1) / 2;
    return base + (max - base) * f;
  });
}
