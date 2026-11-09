'use client';

// Small system panels owned by an app: About, Force Quit Applications, Get Info.

import { useState } from 'react';
import * as A from '@/desktop/actions';
import { displayName, getNode, iconFor, kindOf, pathOf, children } from '@/desktop/model/vfs';
import type { WinState } from '@/desktop/model/windows';
import { Icon } from '@/desktop/shell/icons';
import { useFs, useWM } from '@/desktop/store';
import { APPS } from './registry';
import { openUrl } from './safari/links';

const fmtDate = (iso?: string) => (iso ? new Date(`${iso.length === 10 ? `${iso}T12:00:00` : iso}`).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '--');

function About({ appId }: { appId: string }) {
  if (appId === 'mac')
    return (
      <div style={{ padding: '18px 22px', textAlign: 'center', fontSize: 11, lineHeight: 1.5 }}>
        <svg viewBox="0 0 20 22" width="58" height="64" aria-hidden="true" style={{ margin: '4px auto 6px', display: 'block' }}>
          <path d="M10 6.2c1.4-1.1 3.5-1.5 5.1-.5 2.2 1.4 2.7 4.6 1.6 7.9-.9 2.7-2.6 6-4.6 6.2-1 .1-1.4-.5-2.1-.5s-1.1.6-2.1.5c-2-.2-3.7-3.5-4.6-6.2-1.1-3.3-.6-6.5 1.6-7.9 1.6-1 3.7-.6 5.1.5z" fill="#9aa3ad" />
          <path d="M10.4 5.6C10.6 3.4 12 1.6 14.3 1.2c-.1 2.3-1.6 4-3.9 4.4z" fill="#9aa3ad" />
        </svg>
        <div style={{ fontSize: 26, fontWeight: 'bold', letterSpacing: '-0.5px', color: '#333' }}>Mac OS X</div>
        <div style={{ marginBottom: 12 }}>Version 10.4.11</div>
        <button type="button" className="aqua-btn small" disabled>
          Software Update…
        </button>
        <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 8px', textAlign: 'left', margin: '14px 6px 0' }}>
          <dt style={{ fontWeight: 'bold', textAlign: 'right' }}>Processor</dt>
          <dd>1.83 GHz Intel Core Duo</dd>
          <dt style={{ fontWeight: 'bold', textAlign: 'right' }}>Memory</dt>
          <dd>1 GB DDR2 SDRAM</dd>
          <dt style={{ fontWeight: 'bold', textAlign: 'right' }}>Startup Disk</dt>
          <dd>Macintosh HD</dd>
        </dl>
        <p style={{ marginTop: 16, color: '#666' }}>A simulated computer. Not affiliated with Apple Inc.</p>
      </div>
    );
  const app = APPS[appId];
  return (
    <div style={{ padding: 22, textAlign: 'center', fontSize: 11, lineHeight: 1.6 }}>
      <Icon kind={app?.icon ?? 'generic'} size={72} />
      <div style={{ fontSize: 14, fontWeight: 'bold', marginTop: 8 }}>{app?.name}</div>
      <div>Simulated application</div>
      <p style={{ marginTop: 18, color: '#666' }}>Part of a simulated Mac OS X desktop made for a work of fiction. Not affiliated with Apple Inc.</p>
    </div>
  );
}

function ForceQuit() {
  const running = useWM((s) => s.running);
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <p style={{ fontSize: 11 }}>If an application doesn’t respond for a while, select its name and click Force Quit.</p>
      <div className="panel-white scroll" style={{ flex: 1 }} role="listbox" aria-label="Running applications">
        {running.map((a) => (
          <div key={a} role="option" aria-selected={sel === a} className={`list-row${sel === a ? ' selected' : ''}`} style={{ height: 22, gap: 6, paddingLeft: 6 }} onClick={() => setSel(a)}>
            <Icon kind={APPS[a]?.icon ?? 'generic'} size={18} />
            <span>{APPS[a]?.name ?? a}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 10, color: '#555' }}>You can open this window by pressing Command-Option-Escape.</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="aqua-btn default" disabled={!sel} onClick={() => sel && (sel === 'finder' ? A.quitApp('finder') : A.quitApp(sel))}>
          {sel === 'finder' ? 'Relaunch' : 'Force Quit'}
        </button>
      </div>
    </div>
  );
}

function Info({ nodeId }: { nodeId: string }) {
  const fs = useFs();
  const n = getNode(fs, nodeId);
  if (!n) return <div className="placeholder-note">This item is no longer available.</div>;
  const row = (k: string, v: React.ReactNode) => (
    <>
      <dt style={{ textAlign: 'right', fontWeight: 'bold', color: '#333' }}>{k}</dt>
      <dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{v}</dd>
    </>
  );
  const parent = n.parent ? getNode(fs, n.parent) : undefined;
  return (
    <div className="scroll" style={{ padding: '12px 14px', fontSize: 11, height: '100%' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        <Icon kind={iconFor(fs, n)} size={40} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 'bold' }}>{displayName(n)}</div>
          <div>{n.kind === 'dir' ? `${children(fs, n.id).length} items` : n.kind === 'file' && n.size ? n.size : 'Size not recorded'}</div>
        </div>
      </div>
      <h3 style={{ fontSize: 11, fontWeight: 'bold', borderTop: '1px solid #bbb', paddingTop: 6 }}>▾ General:</h3>
      <dl style={{ display: 'grid', gridTemplateColumns: '78px 1fr', gap: '3px 8px', margin: '6px 0 10px' }}>
        {row('Kind:', kindOf(n))}
        {row('Size:', n.kind === 'file' ? n.size ?? '--' : '--')}
        {row('Where:', parent ? pathOf(fs, parent.id) || '/' : '--')}
        {row('Created:', fmtDate(n.created))}
        {row('Modified:', fmtDate(n.modified))}
        {n.evidenceId && row('Archive ref:', n.evidenceId)}
      </dl>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input type="checkbox" className="aqua-check" checked={Boolean(n.locked)} disabled readOnly /> Locked
      </label>
      {n.evidenceId && (
        <p style={{ marginTop: 12 }}>
          <button type="button" className="aqua-btn small" onClick={() => openUrl(`/evidence/${n.evidenceId!.toLowerCase()}/`)}>
            View in Archive
          </button>
        </p>
      )}
    </div>
  );
}

export function Panel({ win }: { win: WinState }) {
  const p = win.props;
  if (p.panel === 'about') return <About appId={String(p.about ?? 'mac')} />;
  if (p.panel === 'forcequit') return <ForceQuit />;
  if (p.panel === 'info') return <Info nodeId={String(p.info)} />;
  return null;
}
