'use client';

import { useRef } from 'react';
import * as A from '../actions';
import { children, displayName, iconFor, type VNode } from '../model/vfs';
import { useFs, useUI } from '../store';
import { Icon } from './icons';

/** Icons on the desktop: the startup volume, then the contents of ~/Desktop. */
export function DesktopIcons() {
  const fs = useFs();
  const selection = useUI((u) => u.selection);
  const compact = useUI((u) => u.compact);
  const list = useRef<HTMLDivElement>(null);
  const items: VNode[] = [fs.nodes[fs.root], ...children(fs, fs.desktop)].filter(Boolean);
  const selected = selection.scope === 'desktop' ? selection.ids : [];

  const menuFor = (n: VNode) => [
    { label: 'Open', action: () => A.openNode(n.id) },
    { separator: true },
    { label: 'Get Info', action: () => A.openPanel('finder', 'info', { info: n.id }) },
    ...(n.id !== fs.root ? [{ separator: true }, { label: 'Move to Trash', action: () => A.trashNode(n.id) }] : []),
  ];

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const btns = [...(list.current?.querySelectorAll<HTMLButtonElement>('.desk-icon') ?? [])];
    let next = i;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = Math.min(items.length - 1, i + 1);
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = Math.max(0, i - 1);
    else if (e.key === 'Enter' || ((e.metaKey || e.ctrlKey) && (e.key === 'o' || e.key === 'ArrowDown'))) {
      A.openNode(items[i].id);
      e.preventDefault();
      return;
    } else return;
    e.preventDefault();
    btns[next]?.focus();
    A.select('desktop', [items[next].id]);
  };

  return (
    <div ref={list} className="desk-icons" role="listbox" aria-label="Desktop" aria-orientation="vertical">
      {items.map((n, i) => (
        <button
          key={n.id}
          type="button"
          role="option"
          aria-selected={selected.includes(n.id)}
          className={`desk-icon${selected.includes(n.id) ? ' selected' : ''}`}
          onPointerDown={(e) => {
            e.stopPropagation();
            A.closeMenus();
            A.select('desktop', e.metaKey || e.ctrlKey || e.shiftKey ? [...new Set([...selected, n.id])] : [n.id]);
            A.activateFinder();
          }}
          onDoubleClick={() => A.openNode(n.id)}
          onKeyDown={(e) => onKey(e, i)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            A.select('desktop', [n.id]);
            A.openContextMenu(e.clientX, e.clientY, menuFor(n));
          }}
        >
          <span className="icon-wrap">
            <Icon kind={iconFor(fs, n)} size={compact ? 40 : 52} />
          </span>
          <span className="label">{displayName(n)}</span>
        </button>
      ))}
    </div>
  );
}
