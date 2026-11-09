'use client';

import { useEffect, useRef } from 'react';
import { registerCommands } from '@/desktop/store';

/**
 * Registers menu/shortcut command handlers for a window. Handlers always see the latest
 * render; pass undefined for a command that is currently unavailable (menu item disabled).
 */
export function useCommands(winId: string, cmds: Record<string, (() => void) | undefined | false>) {
  const latest = useRef(cmds);
  useEffect(() => {
    latest.current = cmds;
  });
  const keys = Object.entries(cmds)
    .filter(([, v]) => Boolean(v))
    .map(([k]) => k)
    .join('|');
  useEffect(() => {
    const table: Record<string, () => void> = {};
    for (const k of keys ? keys.split('|') : []) table[k] = () => (latest.current[k] as (() => void) | undefined)?.();
    return registerCommands(winId, table);
  }, [winId, keys]);
}
