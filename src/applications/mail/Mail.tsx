'use client';

import { desktopStage } from '@stage/desktop';
import { useEffect, useMemo, useState } from 'react';
import { Txt } from '@/components/Txt';
import * as A from '@/desktop/actions';
import { displayName, getNode, iconFor } from '@/desktop/model/vfs';
import { Glyph, Icon } from '@/desktop/shell/icons';
import { useFs } from '@/desktop/store';
import type { AppWindowProps } from '../registry';
import { useCommands } from '../useCommands';
import { filterMessages, MAILBOXES, unreadCount, type MailboxId } from './model';

const fmt = (iso?: string) => (iso ? new Date(`${iso.length === 10 ? `${iso}T12:00:00` : iso}`).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }) : '--');

export default function Mail(props: AppWindowProps) {
  if (props.win.props.compose) return <Compose {...props} />;
  return <Viewer {...props} />;
}

function Viewer({ win }: AppWindowProps) {
  const fs = useFs();
  const all = desktopStage.mail;
  const [box, setBox] = useState<MailboxId>((win.props.mailbox as MailboxId) ?? 'inbox');
  const [query, setQuery] = useState('');
  const [selId, setSelId] = useState<string | null>(null);
  const [read, setRead] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(false);
  const list = useMemo(() => filterMessages(all, box, query), [all, box, query]);
  const sel = list.find((m) => m.id === selId) ?? null;
  const boxLabel = MAILBOXES.find((b) => b.id === box)!.label;

  useEffect(() => {
    A.setWindowTitle(win.id, `${boxLabel} (${list.length} message${list.length === 1 ? '' : 's'})`);
  }, [win.id, boxLabel, list.length]);

  const getMail = () => {
    setFetching(true);
    setTimeout(() => setFetching(false), 1200);
  };
  const compose = () => A.openWindow('mail', { compose: true }, { w: 560, h: 440 });
  const reply = sel ? () => A.openWindow('mail', { compose: true, to: sel.from, subject: `Re: ${sel.subject}` }, { w: 560, h: 440 }) : undefined;

  useCommands(win.id, {
    compose,
    getMail,
    reply,
    replyAll: reply,
    forward: sel ? () => A.openWindow('mail', { compose: true, subject: `Fwd: ${sel.subject}` }, { w: 560, h: 440 }) : undefined,
  });

  const tb = (label: string, glyph: Parameters<typeof Glyph>[0]['name'], onClick?: () => void) => (
    <button type="button" className="tb-btn" aria-label={label} onClick={onClick} disabled={!onClick}>
      <span className="bezel" style={{ borderRadius: 12, minWidth: 34 }}>
        <Glyph name={glyph} size={15} />
      </span>
      <span>{label}</span>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="toolbar" style={{ borderBottom: '1px solid #8a8a8a', paddingTop: 2 }}>
        {tb('Delete', 'delete', undefined)}
        {tb('Junk', 'junk', undefined)}
        {tb('Reply', 'reply', reply)}
        {tb('Reply All', 'replyall', reply)}
        {tb('Forward', 'forwardmail', undefined)}
        {tb('New', 'compose', compose)}
        {tb('Get Mail', 'getmail', getMail)}
        <div className="spacer" />
        <label className="search-field" style={{ width: 160, marginBottom: 14 }}>
          <Glyph name="search" size={12} />
          <input type="search" aria-label="Search mail" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <nav aria-label="Mailboxes" style={{ width: 150, flex: 'none', background: '#e8edf3', borderRight: '1px solid #8a8a8a', padding: '8px 0', fontSize: 12 }}>
          <div style={{ padding: '0 10px 4px', fontSize: 10, fontWeight: 'bold', color: '#6b7684', letterSpacing: '0.05em' }}>MAILBOXES</div>
          {MAILBOXES.map((b) => {
            const n = unreadCount(all, b.id, read);
            return (
              <button
                key={b.id}
                type="button"
                aria-current={box === b.id ? 'true' : undefined}
                onClick={() => {
                  setBox(b.id);
                  setSelId(null);
                }}
                style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 6, padding: '3px 12px', border: 0, background: box === b.id ? 'var(--sel)' : 'none', color: box === b.id ? '#fff' : '#000', textAlign: 'left' }}
              >
                <Icon kind={b.id === 'trash' ? 'trash' : 'app:mail'} size={16} />
                <span style={{ flex: 1 }}>{b.label}</span>
                {n > 0 && <span style={{ background: '#8a99ad', color: '#fff', borderRadius: 8, padding: '0 6px', fontSize: 10 }}>{n}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#fff' }}>
          <div style={{ height: '42%', minHeight: 80, display: 'flex', flexDirection: 'column', borderBottom: '1px solid #8a8a8a' }}>
            <div className="list-head">
              <button type="button" style={{ width: 22 }} aria-label="Unread" />
              <button type="button" style={{ flex: '0 0 30%' }}>From</button>
              <button type="button" className="sorted" style={{ flex: 1 }}>Subject</button>
              <button type="button" style={{ flex: '0 0 110px' }}>Date Received ▼</button>
            </div>
            <div className="scroll" style={{ flex: 1 }} role="listbox" aria-label={`${boxLabel} messages`}>
              {list.map((m, i) => (
                <div
                  key={m.id}
                  role="option"
                  aria-selected={selId === m.id}
                  className={`list-row${i % 2 ? ' alt' : ''}${selId === m.id ? ' selected' : ''}`}
                  onClick={() => {
                    setSelId(m.id);
                    setRead((r) => new Set(r).add(m.id));
                  }}
                >
                  <span style={{ width: 22, color: '#3a7be0' }}>{!m.read && !read.has(m.id) ? '●' : ''}</span>
                  <span style={{ flex: '0 0 30%' }}>{m.from}</span>
                  <span style={{ flex: 1 }}>{m.subject}</span>
                  <span style={{ flex: '0 0 110px' }}>{fmt(m.date)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="scroll selectable" style={{ flex: 1, padding: sel ? '12px 16px' : 0 }}>
            {!sel ? (
              <div className="placeholder-note" style={{ height: '100%', fontSize: 16, color: '#999' }}>
                No Message Selected
              </div>
            ) : (
              <article>
                <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 8px', fontSize: 12, borderBottom: '1px solid #ddd', paddingBottom: 8, marginBottom: 12 }}>
                  <dt style={{ color: '#777', textAlign: 'right' }}>From:</dt>
                  <dd style={{ fontWeight: 'bold' }}>{sel.from}</dd>
                  <dt style={{ color: '#777', textAlign: 'right' }}>Date:</dt>
                  <dd>{fmt(sel.date)}</dd>
                  <dt style={{ color: '#777', textAlign: 'right' }}>To:</dt>
                  <dd>{sel.to}</dd>
                  <dt style={{ color: '#777', textAlign: 'right' }}>Subject:</dt>
                  <dd style={{ fontWeight: 'bold' }}>{sel.subject}</dd>
                </dl>
                {sel.body.map((p, i) => (
                  <p key={i} style={{ fontSize: 13, marginBottom: 10, fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    <Txt>{p}</Txt>
                  </p>
                ))}
                {sel.attachments?.map((id) => {
                  const n = getNode(fs, id);
                  return n ? (
                    <button key={id} type="button" onDoubleClick={() => A.openNode(id)} onClick={() => A.openNode(id)} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2, border: 0, background: 'none', marginRight: 14, fontSize: 11 }}>
                      <Icon kind={iconFor(fs, n)} size={48} />
                      {displayName(n)}
                    </button>
                  ) : null;
                })}
              </article>
            )}
          </div>
        </div>
      </div>
      <div className="status-bar" style={{ justifyContent: 'flex-start', paddingLeft: 10 }}>
        {fetching ? 'Checking for new mail…' : ''}
      </div>
    </div>
  );
}

function Compose({ win }: AppWindowProps) {
  const [to, setTo] = useState(String(win.props.to ?? ''));
  const [subject, setSubject] = useState(String(win.props.subject ?? ''));
  const [body, setBody] = useState('');
  useEffect(() => {
    A.setWindowTitle(win.id, subject || 'New Message');
  }, [win.id, subject]);
  const send = () =>
    A.alert({
      title: 'This message can’t be sent.',
      message: 'No outgoing mail server is set up on this computer. Mail on this computer is an archive only.',
      icon: 'app:mail',
      sheetFor: win.id,
      buttons: [{ label: 'OK', default: true }],
    });
  const field = (label: string, value: string, set: (v: string) => void) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '3px 10px' }}>
      <span style={{ width: 54, textAlign: 'right', color: '#444' }}>{label}</span>
      <input className="aqua-field" value={value} onChange={(e) => set(e.target.value)} style={{ flex: 1 }} />
    </label>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="toolbar" style={{ borderBottom: '1px solid #8a8a8a' }}>
        <button type="button" className="tb-btn" onClick={send}>
          <span className="bezel" style={{ borderRadius: 12, minWidth: 34 }}>
            <Glyph name="getmail" size={15} />
          </span>
          <span>Send</span>
        </button>
      </div>
      <div style={{ padding: '6px 0', borderBottom: '1px solid #bbb' }}>
        {field('To:', to, setTo)}
        {field('Subject:', subject, setSubject)}
      </div>
      <textarea className="scroll selectable" aria-label="Message body" value={body} onChange={(e) => setBody(e.target.value)} style={{ flex: 1, border: 0, resize: 'none', padding: 12, fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 13 }} />
    </div>
  );
}
