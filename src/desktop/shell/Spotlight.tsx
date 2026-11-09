'use client';

import { useMemo, useState } from 'react';
import * as A from '../actions';
import { displayName, iconFor, kindOf, search, type VNode } from '../model/vfs';
import { useFs } from '../store';
import { Icon } from './icons';

const CATEGORY = (n: VNode, kind: string) =>
  n.kind === 'dir' ? 'Folders' : kind === 'Application' ? 'Applications' : /Image/.test(kind) ? 'Images' : /Movie|audio/i.test(kind) ? 'Movies & Music' : 'Documents';

/** Tiger-style Spotlight menu: searches every visible file by name and text. */
export function Spotlight() {
  const fs = useFs();
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const hits = search(fs, q, 24);
    const out = new Map<string, VNode[]>();
    if (hits[0]) out.set('Top Hit', [hits[0]]);
    for (const n of hits.slice(1)) {
      const c = CATEGORY(n, kindOf(n));
      out.set(c, [...(out.get(c) ?? []), n]);
    }
    return [...out.entries()];
  }, [fs, q]);

  return (
    <div className="spotlight" role="dialog" aria-label="Spotlight" onMouseDown={(e) => e.stopPropagation()}>
      <div className="spotlight-head">
        <span>Spotlight</span>
        <div className="search-field" style={{ flex: 1, color: '#555' }}>
          <input
            autoFocus
            aria-label="Spotlight search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') A.closeMenus();
              if (e.key === 'Enter' && groups[0]) {
                A.closeMenus();
                A.openNode(groups[0][1][0].id);
              }
            }}
          />
        </div>
      </div>
      {q && !groups.length && <p style={{ padding: '10px 14px', color: '#777' }}>No results</p>}
      {groups.map(([cat, nodes]) => (
        <div key={cat} className="spotlight-row">
          <div className="spotlight-cat">{cat}</div>
          <div>
            {nodes.map((n) => (
              <button
                key={n.id}
                type="button"
                className="spotlight-hit"
                onClick={() => {
                  A.closeMenus();
                  A.openNode(n.id);
                }}
              >
                <Icon kind={iconFor(fs, n)} size={16} />
                {displayName(n)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
