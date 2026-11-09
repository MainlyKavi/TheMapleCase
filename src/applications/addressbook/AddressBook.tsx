'use client';

import { desktopStage } from '@stage/desktop';
import { useMemo, useState } from 'react';
import { Txt } from '@/components/Txt';
import { people } from '@/content/people';
import { Glyph, Icon } from '@/desktop/shell/icons';
import type { AppWindowProps } from '../registry';
import { openUrl } from '../safari/links';
import { useCommands } from '../useCommands';

interface Card {
  id: string;
  name: string;
  group: 'me' | 'maple';
  company?: string;
  role?: string;
  fields: [string, string][];
  profile?: string;
}

// Cards come only from the archive's public people records: no invented phone numbers,
// addresses or biographies.
const CARDS: Card[] = [
  { id: 'me', name: desktopStage.account.fullName, group: 'me', fields: [], role: 'My Card' },
  ...people.map(
    (p): Card => ({
      id: p.slug,
      name: p.name,
      group: 'maple',
      company: p.facts.find(([k]) => k === 'Company')?.[1],
      role: p.role,
      fields: p.facts.filter(([k]) => k !== 'Company'),
      profile: `/people/${p.slug}/`,
    }),
  ),
];

const GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'maple', label: 'The Maple Case' },
] as const;

const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export default function AddressBook({ win }: AppWindowProps) {
  const [group, setGroup] = useState<'all' | 'maple'>('all');
  const [query, setQuery] = useState('');
  const list = useMemo(
    () => CARDS.filter((c) => (group === 'all' || c.group === group) && c.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.name.split(' ').pop()!.localeCompare(b.name.split(' ').pop()!)),
    [group, query],
  );
  const [selId, setSelId] = useState<string>(CARDS[1]?.id ?? 'me');
  const sel = list.find((c) => c.id === selId) ?? list[0];
  const idx = sel ? list.indexOf(sel) : -1;
  useCommands(win.id, {
    nextCard: idx < list.length - 1 && (() => setSelId(list[idx + 1].id)),
    prevCard: idx > 0 && (() => setSelId(list[idx - 1].id)),
  });

  const col = { background: '#fff', border: '1px solid #8e8e8e' } as const;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 8px 8px' }}>
      <div className="toolbar" style={{ padding: '2px 2px 6px' }}>
        <div className="spacer" />
        <label className="search-field" style={{ width: 170 }}>
          <Glyph name="search" size={12} />
          <input type="search" aria-label="Search contacts" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '130px 170px 1fr', gap: 6 }}>
        <div className="scroll" style={col} role="listbox" aria-label="Groups">
          <div className="list-head" style={{ paddingLeft: 6, alignItems: 'center' }}>Group</div>
          {GROUPS.map((g) => (
            <div key={g.id} role="option" aria-selected={group === g.id} className={`list-row${group === g.id ? ' selected' : ''}`} style={{ paddingLeft: 6 }} onClick={() => setGroup(g.id)}>
              {g.label}
            </div>
          ))}
        </div>
        <div className="scroll" style={col} role="listbox" aria-label="Names">
          <div className="list-head" style={{ paddingLeft: 6, alignItems: 'center' }}>Name</div>
          {list.map((c) => (
            <div key={c.id} role="option" aria-selected={sel?.id === c.id} className={`list-row${sel?.id === c.id ? ' selected' : ''}`} style={{ paddingLeft: 6 }} onClick={() => setSelId(c.id)}>
              {c.name}
            </div>
          ))}
        </div>
        <div className="scroll selectable" style={{ ...col, padding: 16 }}>
          {sel && (
            <article>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                <div aria-hidden="true" style={{ width: 64, height: 64, borderRadius: 4, border: '1px solid #aaa', background: 'linear-gradient(#e9eef5,#c7d1de)', display: 'grid', placeItems: 'center', fontSize: 22, color: '#5d6b7d' }}>
                  {sel.group === 'me' ? <Icon kind="app:addressbook" size={40} /> : initials(sel.name)}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 'bold' }}>{sel.name}</div>
                  {sel.company && <div style={{ fontSize: 12 }}>{sel.company}</div>}
                  {sel.role && <div style={{ fontSize: 11, color: '#666' }}>{sel.role}</div>}
                </div>
              </div>
              <dl style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '5px 10px', fontSize: 12 }}>
                {sel.fields.map(([k, v]) => (
                  <div key={k} style={{ display: 'contents' }}>
                    <dt style={{ textAlign: 'right', color: '#7a7a7a', fontWeight: 'bold', fontSize: 11 }}>{k.toLowerCase()}</dt>
                    <dd>
                      <Txt>{v}</Txt>
                    </dd>
                  </div>
                ))}
              </dl>
              {sel.profile && (
                <p style={{ marginTop: 16, fontSize: 11, color: '#555' }}>
                  Note: from the public Maple Case archive.{' '}
                  <button type="button" className="aqua-btn small" onClick={() => openUrl(sel.profile!)}>
                    Open Archive Profile
                  </button>
                </p>
              )}
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
