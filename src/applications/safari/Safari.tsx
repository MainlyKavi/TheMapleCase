'use client';

import { useEffect, useRef, useState } from 'react';
import * as A from '@/desktop/actions';
import { createStore, useStore } from '@/desktop/store';
import { Glyph, Icon } from '@/desktop/shell/icons';
import type { AppWindowProps } from '../registry';
import { useCommands } from '../useCommands';
import { ARCHIVE_PATH, fromAddress, HOST, toAddress } from './address';
import { bookmarks as defaultBookmarks } from './links';

// Safari is scoped to the Maple Case website: it shows the archive routes of this same origin
// in a frame. It never renders the desktop itself, never loads other origins.

const session = createStore<{ label: string; url: string }[]>(defaultBookmarks);

interface Nav {
  entries: string[];
  index: number;
}

export default function Safari({ win }: AppWindowProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const initial = fromAddress(String(win.props.url ?? '/home/')) ?? '/home/';
  const [nav, setNav] = useState<Nav>({ entries: [initial], index: 0 });
  const [address, setAddress] = useState(toAddress(initial));
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const pending = useRef<string | null>(initial);
  const addressRef = useRef<HTMLInputElement>(null);
  const marks = useStore(session, (s) => s);
  const current = nav.entries[nav.index];

  function load(path: string) {
    const w = frame.current?.contentWindow;
    if (!w) return;
    pending.current = path;
    setLoading(true);
    setError(null);
    w.location.replace(path);
  }

  /** User-initiated navigation (address bar, bookmarks, Home). */
  function go(input: string) {
    const path = fromAddress(input);
    if (!path) {
      setError(input.trim());
      setLoading(false);
      setAddress(input.trim());
      return;
    }
    setNav((n) => ({ entries: [...n.entries.slice(0, n.index + 1), path], index: n.index + 1 }));
    setAddress(toAddress(path));
    load(path);
  }
  // Effects call the latest navigation functions through refs.
  const goRef = useRef(go);
  const loadRef = useRef(load);
  useEffect(() => {
    goRef.current = go;
    loadRef.current = load;
  });

  // External requests (bookmark files, Spotlight, Get Info "View in Archive").
  const lastNav = useRef(win.props.nav);
  useEffect(() => {
    if (win.props.nav === lastNav.current) return;
    lastNav.current = win.props.nav;
    goRef.current(String(win.props.url));
  }, [win.props.nav, win.props.url]);

  // Page reports from the archive (FrameBridge). Accept only our own frame, same origin.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const d = e.data as { type?: unknown; path?: unknown; title?: unknown };
      if (d?.type !== 'maple:navigate' || typeof d.path !== 'string' || typeof d.title !== 'string') return;
      const path = d.path.slice(0, 300);
      setPageTitle(d.title.slice(0, 200));
      setLoading(false);
      if (!ARCHIVE_PATH.test(path)) {
        // Something tried to leave the archive (e.g. the desktop route): go back to the archive home.
        loadRef.current('/home/');
        return;
      }
      if (pending.current && path.split('?')[0] === pending.current.split('?')[0]) {
        pending.current = null;
      } else {
        // In-page link click: becomes a new history entry.
        setNav((n) => (n.entries[n.index] === path ? n : { entries: [...n.entries.slice(0, n.index + 1), path], index: n.index + 1 }));
      }
      if (!editing) setAddress(toAddress(path));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [editing]);

  useEffect(() => {
    A.setWindowTitle(win.id, error ? 'Failed to open page' : pageTitle || 'Loading…');
  }, [win.id, pageTitle, error]);

  const canBack = nav.index > 0;
  const canFwd = nav.index < nav.entries.length - 1;
  const goBack = () => {
    if (!canBack) return;
    const path = nav.entries[nav.index - 1];
    setNav({ ...nav, index: nav.index - 1 });
    setAddress(toAddress(path));
    load(path);
  };
  const goFwd = () => {
    if (!canFwd) return;
    const path = nav.entries[nav.index + 1];
    setNav({ ...nav, index: nav.index + 1 });
    setAddress(toAddress(path));
    load(path);
  };
  const reload = () => {
    if (error) return go(error);
    setLoading(true);
    pending.current = current;
    frame.current?.contentWindow?.location.reload();
  };
  const stop = () => {
    frame.current?.contentWindow?.stop();
    setLoading(false);
  };

  useCommands(win.id, {
    back: canBack && goBack,
    forward: canFwd && goFwd,
    reload,
    stop: loading && stop,
    home: () => go('/home/'),
    openLocation: () => {
      addressRef.current?.focus();
      addressRef.current?.select();
    },
    addBookmark: () => {
      if (!marks.some((m) => m.url === current)) session.set((s) => [...s, { label: pageTitle.replace(/ \| The Maple Case$/, '') || 'Untitled', url: current }]);
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="toolbar" style={{ alignItems: 'center', paddingBottom: 4 }}>
        <div className="seg" role="group" aria-label="Back and forward">
          <button type="button" className="tb-btn" aria-label="Back" disabled={!canBack} onClick={goBack}>
            <span className="bezel">
              <Glyph name="back" />
            </span>
          </button>
          <button type="button" className="tb-btn" aria-label="Forward" disabled={!canFwd} onClick={goFwd}>
            <span className="bezel">
              <Glyph name="forward" />
            </span>
          </button>
        </div>
        <button type="button" className="tb-btn" aria-label={loading ? 'Stop' : 'Reload'} onClick={loading ? stop : reload}>
          <span className="bezel">{loading ? <Glyph name="stop" /> : <Glyph name="reload" />}</span>
        </button>
        <button type="button" className="tb-btn" aria-label="Add bookmark" onClick={() => !marks.some((m) => m.url === current) && session.set((s) => [...s, { label: pageTitle.replace(/ \| The Maple Case$/, '') || 'Untitled', url: current }])}>
          <span className="bezel">
            <Glyph name="plus" />
          </span>
        </button>
        <form
          style={{ flex: 1, position: 'relative' }}
          onSubmit={(e) => {
            e.preventDefault();
            setEditing(false);
            go(address);
            addressRef.current?.blur();
          }}
        >
          <div aria-hidden="true" className="safari-progress" style={{ position: 'absolute', inset: 1, borderRadius: 2, pointerEvents: 'none', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: loading ? '78%' : '100%', opacity: loading ? 1 : 0, background: 'linear-gradient(#cfe4ff, #8fbdf5)', transition: loading ? 'width 2.5s cubic-bezier(.1,.6,.3,1)' : 'width .2s, opacity .4s .2s' }} />
          </div>
          <span style={{ position: 'absolute', left: 6, top: 4, pointerEvents: 'none' }}>
            <Icon kind="webloc" size={14} />
          </span>
          <input
            ref={addressRef}
            className="aqua-field"
            aria-label="Address"
            spellCheck={false}
            value={address}
            onFocus={(e) => {
              setEditing(true);
              e.currentTarget.select();
            }}
            onBlur={() => setEditing(false)}
            onChange={(e) => setAddress(e.target.value)}
            style={{ width: '100%', paddingLeft: 24, background: 'transparent', position: 'relative' }}
          />
        </form>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = String(new FormData(e.currentTarget).get('q') ?? '').trim();
            if (q) go(`/evidence/?q=${encodeURIComponent(q)}`);
          }}
        >
          <label className="search-field" style={{ width: 150 }}>
            <Glyph name="search" size={12} />
            <input name="q" type="search" aria-label="Search the archive" />
          </label>
        </form>
      </div>
      <nav aria-label="Bookmarks bar" style={{ display: 'flex', gap: 2, padding: '0 10px 5px', fontSize: 11, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {marks.map((b) => (
          <button key={b.url} type="button" onClick={() => go(b.url)} style={{ border: 0, background: 'none', padding: '1px 8px', borderRadius: 8 }} className="bookmark-btn">
            {b.label}
          </button>
        ))}
      </nav>
      <div style={{ flex: 1, minHeight: 0, position: 'relative', margin: '0 0 0', borderTop: '1px solid #6f6f6f', background: '#fff' }}>
        <iframe
          ref={frame}
          src={initial}
          title={pageTitle || 'Web page'}
          onLoad={() => {
            // Same-origin read of the loaded page; the bridge message also arrives.
            try {
              const doc = frame.current?.contentDocument;
              if (doc?.title) setPageTitle(doc.title);
            } catch {
              /* ignore */
            }
            setLoading(false);
          }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, visibility: error ? 'hidden' : 'visible' }}
        />
        {error !== null && (
          <div style={{ position: 'absolute', inset: 0, background: '#fff', display: 'grid', placeItems: 'center', padding: 24 }}>
            <div style={{ maxWidth: 520, display: 'flex', gap: 18 }}>
              <Icon kind="app:safari" size={64} />
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 'bold', margin: '4px 0 10px' }}>Safari can’t find the server.</h2>
                <p style={{ fontSize: 12, lineHeight: 1.5 }}>
                  Safari can’t open the page “{error || 'untitled'}” because it can’t find the server. Check the address and try again.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="status-bar" style={{ justifyContent: 'flex-start', paddingLeft: 10 }}>
        {loading ? `Contacting “${HOST}”…` : ''}
      </div>
    </div>
  );
}
