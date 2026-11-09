'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { MenuItem } from '../store';
import { Icon } from './icons';

/** A dropdown, context or sub menu. Keyboard: arrows, Enter, Escape, Right/Left for submenus. */
export function Menu({
  items,
  style,
  context,
  onDone,
  label,
  autoFocus,
  onLeft,
  onRight,
}: {
  items: MenuItem[];
  style?: CSSProperties;
  context?: boolean;
  onDone: () => void;
  label: string;
  autoFocus?: boolean;
  onLeft?: () => void;
  onRight?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [sub, setSub] = useState<number | null>(null);
  const [pos, setPos] = useState<CSSProperties>(style ?? {});

  // Keep the menu on screen.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const next: CSSProperties = { ...style };
    if (r.right > window.innerWidth - 2) next.left = Math.max(2, window.innerWidth - r.width - 2);
    if (r.bottom > window.innerHeight - 2) next.top = Math.max(22, window.innerHeight - r.height - 2);
    setPos(next);
  }, [style]);

  useEffect(() => {
    // Focus the menu itself (keyboard ready) without highlighting an item, as on a mouse click.
    if (autoFocus) ref.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const buttons = () => [...(ref.current?.querySelectorAll<HTMLButtonElement>(':scope > .menu-entry > .menu-item:not(:disabled)') ?? [])];

  const onKey = (e: React.KeyboardEvent) => {
    const list = buttons();
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') list[(i + 1) % list.length]?.focus();
    else if (e.key === 'ArrowUp') list[(i - 1 + list.length) % list.length]?.focus();
    else if (e.key === 'Escape') onDone();
    else if (e.key === 'ArrowLeft') onLeft?.();
    else if (e.key === 'ArrowRight') {
      const idx = Number((document.activeElement as HTMLElement)?.dataset.index);
      if (items[idx]?.submenu) setSub(idx);
      else onRight?.();
    } else return;
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div ref={ref} tabIndex={-1} className={`menu${context ? ' context' : ''}`} style={pos} role="menu" aria-label={label} onKeyDown={onKey} onMouseDown={(e) => e.preventDefault()}>
      {items.map((it, i) =>
        it.separator ? (
          <div key={i} className="menu-sep" role="separator" />
        ) : (
          <div key={i} className="menu-entry" role="none" onMouseEnter={() => setSub(it.submenu ? i : null)}>
          <button
            type="button"
            role={it.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'}
            aria-checked={it.checked}
            aria-haspopup={it.submenu ? 'menu' : undefined}
            aria-expanded={it.submenu ? sub === i : undefined}
            data-index={i}
            className={`menu-item${sub === i ? ' active' : ''}`}
            disabled={it.disabled}
            onClick={() => {
              if (it.submenu) return setSub(i);
              onDone();
              it.action?.();
            }}
          >
            {it.checked && <span className="check">✓</span>}
            {it.icon && <Icon kind={it.icon} size={16} className="item-icon" />}
            {it.label}
            {it.shortcut && <span className="shortcut">{it.shortcut}</span>}
            {it.submenu && <span className="sub-arrow">▶</span>}
          </button>
            {it.submenu && sub === i && (
              <Menu
                items={it.submenu}
                label={it.label ?? ''}
                context
                onDone={onDone}
                autoFocus={false}
                onLeft={() => setSub(null)}
                style={{ left: '100%', top: -5, position: 'absolute' }}
              />
            )}
          </div>
        ),
      )}
    </div>
  );
}
