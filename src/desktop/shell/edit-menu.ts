'use client';

// The standard Edit menu. Kept apart from menus.ts so the app registry can import it
// without an import cycle.

import type { AppMenuItem } from '@/applications/registry';

export function focusedEditable(): HTMLInputElement | HTMLTextAreaElement | HTMLElement | null {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return null;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el.isContentEditable) return el;
  return null;
}

export const EDIT_MENU: AppMenuItem[] = [
  { label: 'Undo', shortcut: '⌘Z', run: () => document.execCommand('undo') },
  { label: 'Redo', shortcut: '⇧⌘Z', run: () => document.execCommand('redo') },
  { separator: true, label: '' },
  { label: 'Cut', shortcut: '⌘X', run: () => document.execCommand('cut') },
  { label: 'Copy', shortcut: '⌘C', run: () => document.execCommand('copy') },
  {
    label: 'Paste',
    shortcut: '⌘V',
    run: () => {
      const el = focusedEditable();
      navigator.clipboard?.readText().then((t) => {
        if (el && t) {
          el.focus();
          document.execCommand('insertText', false, t);
        }
      }).catch(() => {});
    },
  },
  { label: 'Select All', shortcut: '⌘A', cmd: 'selectAll' },
];

