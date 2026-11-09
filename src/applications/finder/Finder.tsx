'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as A from '@/desktop/actions';
import { ancestors, children, displayName, getNode, iconFor, kindOf, search, type Fs, type VNode } from '@/desktop/model/vfs';
import { Glyph, Icon } from '@/desktop/shell/icons';
import { useFs, usePrefs } from '@/desktop/store';
import type { AppWindowProps } from '../registry';
import { useCommands } from '../useCommands';

type View = 'icons' | 'list' | 'columns';
type SortKey = 'name' | 'modified' | 'size' | 'kind';

const SIDEBAR_PLACES = ['desktop', 'home', 'applications', 'documents', 'movies', 'music', 'pictures'];

const fmt = (iso?: string) => (iso ? new Date(`${iso.length === 10 ? `${iso}T12:00:00` : iso}`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--');

export default function Finder({ win, focused }: AppWindowProps) {
  const fs = useFs();
  const prefs = usePrefs();
  const dir = getNode(fs, win.props.dir as string)?.kind === 'dir' ? (win.props.dir as string) : fs.home;
  const dirNode = fs.nodes[dir];
  const [view, setView] = useState<View>((win.props.view as View) ?? 'icons');
  const [back, setBack] = useState<string[]>([]);
  const [fwd, setFwd] = useState<string[]>([]);
  const [sel, setSel] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'name', dir: 1 });
  const prev = useRef(dir);
  const historyNav = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const content = useRef<HTMLDivElement>(null);

  // Track navigation (from double-clicks, the sidebar, the Go menu) for Back/Forward.
  useEffect(() => {
    if (prev.current === dir) return;
    if (!historyNav.current) {
      setBack((b) => [...b, prev.current]);
      setFwd([]);
    }
    historyNav.current = false;
    prev.current = dir;
    setSel([]);
    setQuery('');
  }, [dir]);

  const title = dirNode ? displayName(dirNode) : 'Finder';
  useEffect(() => {
    A.setWindowTitle(win.id, query ? `Searching “${query}”` : title);
  }, [win.id, title, query]);

  const go = (id: string) => A.setWindowProps(win.id, { dir: id });
  const goBack = () => {
    const t = back[back.length - 1];
    if (!t) return;
    historyNav.current = true;
    setBack(back.slice(0, -1));
    setFwd([dir, ...fwd]);
    go(t);
  };
  const goFwd = () => {
    const t = fwd[0];
    if (!t) return;
    historyNav.current = true;
    setFwd(fwd.slice(1));
    setBack([...back, dir]);
    go(t);
  };

  const items = useMemo(() => {
    const list = query ? search(fs, query, 200) : children(fs, dir, prefs.showHidden);
    if (view !== 'list') return list;
    const key = (n: VNode) => (sort.key === 'kind' ? kindOf(n) : sort.key === 'size' ? (n.kind === 'file' ? n.size ?? '' : '') : sort.key === 'modified' ? n.modified ?? '' : n.name.toLowerCase());
    return [...list].sort((a, b) => key(a).localeCompare(key(b)) * sort.dir || a.name.localeCompare(b.name));
  }, [fs, dir, query, prefs.showHidden, view, sort]);

  const open = (id: string) => {
    const n = getNode(fs, id);
    if (!n) return;
    if (n.kind === 'dir') {
      setQuery('');
      go(id);
    } else A.openNode(id);
  };

  const inTrash = dir === fs.trash;
  const selected = sel.filter((id) => fs.nodes[id]);
  const one = selected.length === 1 ? fs.nodes[selected[0]] : undefined;

  useCommands(win.id, {
    newFolder: !query && (() => {
      const id = A.newFolder(dir);
      if (id) setSel([id]);
    }),
    open: selected.length > 0 && (() => selected.forEach(open)),
    info: () => A.openPanel('finder', 'info', { info: one?.id ?? dir }),
    trash: selected.length > 0 && !inTrash && (() => selected.forEach((id) => A.trashNode(id, win.id))),
    putBack: inTrash && selected.length > 0 && (() => selected.forEach(A.putBack)),
    find: () => searchRef.current?.focus(),
    viewIcons: () => setView('icons'),
    viewList: () => setView('list'),
    viewColumns: () => setView('columns'),
    back: back.length > 0 && goBack,
    forward: fwd.length > 0 && goFwd,
    up: Boolean(dirNode?.parent) && (() => go(dirNode!.parent!)),
    selectAll: () => setSel(items.map((n) => n.id)),
  });

  const pick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.metaKey || e.ctrlKey) setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    else if (e.shiftKey && sel.length) {
      const ids = items.map((n) => n.id);
      const a = ids.indexOf(sel[sel.length - 1]);
      const b = ids.indexOf(id);
      setSel(ids.slice(Math.min(a, b), Math.max(a, b) + 1));
    } else setSel([id]);
  };

  const itemMenu = (n: VNode) => [
    { label: 'Open', action: () => open(n.id) },
    { separator: true },
    inTrash ? { label: 'Put Back', action: () => A.putBack(n.id) } : { label: 'Move to Trash', action: () => A.trashNode(n.id, win.id) },
    { separator: true },
    { label: 'Get Info', action: () => A.openPanel('finder', 'info', { info: n.id }) },
  ];
  const bgMenu = () => [
    { label: 'New Folder', action: () => A.newFolder(dir), disabled: Boolean(query) },
    { separator: true },
    { label: 'Get Info', action: () => A.openPanel('finder', 'info', { info: dir }) },
    ...(inTrash ? [{ separator: true }, { label: 'Empty Trash', action: A.emptyTrash }] : []),
  ];

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('input')) return;
    const ids = items.map((n) => n.id);
    const i = ids.indexOf(selected[selected.length - 1] ?? '');
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') setSel([ids[Math.min(ids.length - 1, i + 1)]].filter(Boolean));
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') setSel([ids[Math.max(0, i - 1)]].filter(Boolean));
    else if (e.key === 'Enter' && one) open(one.id);
    else return;
    e.preventDefault();
  };

  const free = '37.21 GB available';
  return (
    <div className="finder" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="toolbar">
        <div className="seg" role="group" aria-label="Back and forward">
          <button type="button" className="tb-btn" aria-label="Back" disabled={!back.length} onClick={goBack}>
            <span className="bezel">
              <Glyph name="back" />
            </span>
          </button>
          <button type="button" className="tb-btn" aria-label="Forward" disabled={!fwd.length} onClick={goFwd}>
            <span className="bezel">
              <Glyph name="forward" />
            </span>
          </button>
        </div>
        <div className="seg" role="radiogroup" aria-label="View">
          {(['icons', 'list', 'columns'] as View[]).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={view === v} aria-label={`View as ${v}`} className={`tb-btn${view === v ? ' on' : ''}`} onClick={() => setView(v)}>
              <span className="bezel">
                <Glyph name={v} />
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="tb-btn"
          aria-label="Action"
          onClick={(e) => {
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            A.openContextMenu(r.left, r.bottom + 2, one ? itemMenu(one) : bgMenu());
          }}
        >
          <span className="bezel">
            <Glyph name="gear" /> <span style={{ fontSize: 8, marginLeft: 3 }}>▼</span>
          </span>
        </button>
        <div className="spacer" />
        <label className="search-field" style={{ width: 170 }}>
          <Glyph name="search" size={12} />
          <input ref={searchRef} type="search" aria-label="Search" placeholder="" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setQuery('')} />
        </label>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 0, padding: '0 8px' }}>
        <Sidebar fs={fs} current={dir} onGo={(id) => (setQuery(''), go(id))} />
        <div
          ref={content}
          className="panel-white"
          style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}
          tabIndex={0}
          onKeyDown={onKey}
          onClick={() => setSel([])}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            A.openContextMenu(e.clientX, e.clientY, bgMenu());
          }}
          aria-label={`${title} contents`}
        >
          {view === 'icons' && <IconView fs={fs} items={items} sel={selected} onPick={pick} onOpen={open} onMenu={itemMenu} />}
          {view === 'list' && (
            <ListView fs={fs} items={items} sel={selected} sort={sort} onSort={(key) => setSort((s) => ({ key, dir: s.key === key ? (-s.dir as 1 | -1) : 1 }))} onPick={pick} onOpen={open} onMenu={itemMenu} />
          )}
          {view === 'columns' && <ColumnView fs={fs} dir={query ? null : dir} items={items} sel={selected} onPick={pick} onOpen={open} onGo={go} onMenu={itemMenu} showHidden={prefs.showHidden} />}
        </div>
      </div>
      <div className="status-bar">
        {query ? `${items.length} item${items.length === 1 ? '' : 's'} found` : `${items.length} item${items.length === 1 ? '' : 's'}${selected.length ? `, ${selected.length} selected` : ''}, ${free}`}
      </div>
      {!focused && null}
    </div>
  );
}

function Sidebar({ fs, current, onGo }: { fs: Fs; current: string; onGo: (id: string) => void }) {
  const row = (id: string) => {
    const n = fs.nodes[id];
    if (!n) return null;
    return (
      <li key={id}>
        <button
          type="button"
          onClick={() => onGo(id)}
          aria-current={current === id ? 'location' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            width: '100%',
            padding: '2px 8px',
            border: 0,
            fontSize: 12,
            textAlign: 'left',
            background: current === id ? 'var(--sel)' : 'none',
            color: current === id ? '#fff' : '#000',
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <Icon kind={iconFor(fs, n)} size={22} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName(n)}</span>
        </button>
      </li>
    );
  };
  return (
    <nav aria-label="Sidebar" className="scroll" style={{ width: 150, flex: 'none', marginRight: 6, background: '#f3f5f8', border: '1px solid #8e8e8e', padding: '6px 0' }}>
      <ul>{row(fs.root)}</ul>
      <div style={{ height: 1, background: '#c9ced6', margin: '6px 8px' }} />
      <ul>{SIDEBAR_PLACES.map(row)}</ul>
    </nav>
  );
}

interface ViewProps {
  fs: Fs;
  items: VNode[];
  sel: string[];
  onPick: (e: React.MouseEvent, id: string) => void;
  onOpen: (id: string) => void;
  onMenu: (n: VNode) => { label?: string; action?: () => void; separator?: boolean }[];
}

const ctx = (onMenu: ViewProps['onMenu'], n: VNode, onPick: ViewProps['onPick']) => (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  onPick(e, n.id);
  A.openContextMenu(e.clientX, e.clientY, onMenu(n));
};

function Empty() {
  return <div className="placeholder-note" style={{ flex: 1 }} />;
}

function IconView({ fs, items, sel, onPick, onOpen, onMenu }: ViewProps) {
  if (!items.length) return <Empty />;
  return (
    <div className="scroll" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))', alignContent: 'start', gap: '14px 4px', padding: 14 }}>
      {items.map((n) => {
        const on = sel.includes(n.id);
        return (
          <button
            key={n.id}
            type="button"
            className="finder-icon"
            aria-pressed={on}
            onClick={(e) => onPick(e, n.id)}
            onDoubleClick={() => onOpen(n.id)}
            onContextMenu={ctx(onMenu, n, onPick)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, border: 0, background: 'none', padding: 0 }}
          >
            <span style={{ padding: 3, borderRadius: 5, background: on ? 'rgba(0,0,0,.16)' : 'none', opacity: n.parent === fs.trash ? 0.9 : 1 }}>
              <Icon kind={iconFor(fs, n)} size={56} />
            </span>
            <span style={{ maxWidth: 100, padding: '0 5px', borderRadius: 8, fontSize: 12, lineHeight: '15px', textAlign: 'center', overflowWrap: 'anywhere', background: on ? 'var(--sel)' : 'none', color: on ? '#fff' : '#000' }}>
              {displayName(n)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ListView({ fs, items, sel, sort, onSort, onPick, onOpen, onMenu }: ViewProps & { sort: { key: SortKey; dir: 1 | -1 }; onSort: (k: SortKey) => void }) {
  const cols: [SortKey, string, string][] = [
    ['name', 'Name', '1 1 46%'],
    ['modified', 'Date Modified', '0 0 150px'],
    ['size', 'Size', '0 0 80px'],
    ['kind', 'Kind', '1 1 24%'],
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }} role="grid" aria-rowcount={items.length}>
      <div className="list-head" role="row">
        {cols.map(([k, label, flex]) => (
          <button key={k} type="button" role="columnheader" aria-sort={sort.key === k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={sort.key === k ? 'sorted' : ''} style={{ flex }} onClick={() => onSort(k)}>
            {label}
            {sort.key === k && <span style={{ marginLeft: 'auto', fontSize: 8 }}>{sort.dir === 1 ? '▲' : '▼'}</span>}
          </button>
        ))}
      </div>
      <div className="scroll" style={{ flex: 1 }}>
        {items.map((n) => (
          <div
            key={n.id}
            role="row"
            aria-selected={sel.includes(n.id)}
            className={`list-row${sel.includes(n.id) ? ' selected' : ''}`}
            onClick={(e) => onPick(e, n.id)}
            onDoubleClick={() => onOpen(n.id)}
            onContextMenu={ctx(onMenu, n, onPick)}
          >
            <span role="gridcell" style={{ flex: cols[0][2], display: 'flex', alignItems: 'center', gap: 5 }}>
              {n.kind === 'dir' ? <span style={{ fontSize: 8, width: 8 }}>▶</span> : <span style={{ width: 8 }} />}
              <Icon kind={iconFor(fs, n)} size={16} />
              {displayName(n)}
            </span>
            <span role="gridcell" style={{ flex: cols[1][2] }}>{fmt(n.modified)}</span>
            <span role="gridcell" style={{ flex: cols[2][2] }}>{n.kind === 'file' ? n.size ?? '--' : '--'}</span>
            <span role="gridcell" style={{ flex: cols[3][2] }}>{kindOf(n)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ColumnView({ fs, dir, items, sel, onPick, onOpen, onGo, onMenu, showHidden }: ViewProps & { dir: string | null; onGo: (id: string) => void; showHidden: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  const chain = dir ? ancestors(fs, dir) : [];
  const preview = sel.length === 1 ? fs.nodes[sel[0]] : undefined;
  useEffect(() => {
    scroller.current?.scrollTo({ left: scroller.current.scrollWidth });
  }, [dir, preview?.id]);
  const columns: { key: string; list: VNode[]; active?: string }[] = dir
    ? chain.map((d, i) => ({ key: d.id, list: children(fs, d.id, showHidden), active: chain[i + 1]?.id ?? (preview?.parent === d.id ? preview.id : undefined) }))
    : [{ key: 'search', list: items, active: preview?.id }];
  return (
    <div ref={scroller} className="scroll" style={{ flex: 1, display: 'flex', overflowY: 'hidden' }}>
      {columns.map((c) => (
        <div key={c.key} className="scroll" style={{ width: 200, flex: 'none', borderRight: '1px solid #c8c8c8', padding: '2px 0' }}>
          {c.list.map((n) => {
            const on = c.active === n.id;
            return (
              <div
                key={n.id}
                className={`list-row${on ? (sel.includes(n.id) || n.id === dir ? ' selected' : ' selected') : ''}`}
                style={{ paddingLeft: 4, gap: 4 }}
                onClick={(e) => {
                  if (n.kind === 'dir') {
                    e.stopPropagation();
                    onGo(n.id);
                  } else onPick(e, n.id);
                }}
                onDoubleClick={() => onOpen(n.id)}
                onContextMenu={ctx(onMenu, n, onPick)}
              >
                <Icon kind={iconFor(fs, n)} size={16} />
                <span style={{ flex: 1 }}>{displayName(n)}</span>
                {n.kind === 'dir' && <span style={{ fontSize: 8, paddingRight: 6 }}>▶</span>}
              </div>
            );
          })}
        </div>
      ))}
      {preview && preview.kind === 'file' && (
        <div style={{ width: 220, flex: 'none', padding: 16, textAlign: 'center', fontSize: 11 }}>
          <Icon kind={iconFor(fs, preview)} size={96} />
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 6px', textAlign: 'left', marginTop: 10 }}>
            <dt style={{ color: '#777', textAlign: 'right' }}>Name</dt>
            <dd style={{ overflowWrap: 'anywhere' }}>{displayName(preview)}</dd>
            <dt style={{ color: '#777', textAlign: 'right' }}>Kind</dt>
            <dd>{kindOf(preview)}</dd>
            <dt style={{ color: '#777', textAlign: 'right' }}>Size</dt>
            <dd>{preview.size ?? '--'}</dd>
            <dt style={{ color: '#777', textAlign: 'right' }}>Modified</dt>
            <dd>{fmt(preview.modified)}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
