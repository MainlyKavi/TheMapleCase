'use client';

import { useEffect, useRef, useState } from 'react';
import { Txt } from '@/components/Txt';
import { useMediaSource } from '@stage/client';
import * as A from '@/desktop/actions';
import { appFor, children, displayName, getNode, kindOf, type VFile } from '@/desktop/model/vfs';
import { Glyph } from '@/desktop/shell/icons';
import { useFs } from '@/desktop/store';
import type { AppWindowProps } from '../registry';
import { useCommands } from '../useCommands';

const PAGE_W = 612;
const PAGE_H = 792;

/** Preview: photographs and documents. Missing assets show an honest placeholder. */
export default function Preview({ win }: AppWindowProps) {
  const fs = useFs();
  const node = getNode(fs, win.props.nodeId as string);
  const file = node?.kind === 'file' ? node : undefined;
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [inspector, setInspector] = useState(false);
  const [box, setBox] = useState({ w: 600, h: 500 });
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (file) A.setWindowTitle(win.id, displayName(file));
  }, [win.id, file]);

  const siblings = file ? children(fs, file.parent!).filter((n) => n.kind === 'file' && appFor(n) === 'preview') : [];
  const idx = file ? siblings.findIndex((n) => n.id === file.id) : -1;
  const step = (d: number) => {
    const next = siblings[idx + d];
    if (next) A.setWindowProps(win.id, { nodeId: next.id });
  };

  const isDoc = file?.data.t === 'doc';
  const natural = isDoc ? { w: PAGE_W, h: PAGE_H } : { w: 640, h: 800 };
  const fitScale = Math.min((box.w - 40) / natural.w, (box.h - 40) / natural.h, isDoc ? 1.5 : 1);
  const scale = zoom === 'fit' ? Math.max(0.1, fitScale) : zoom;
  const setScale = (s: number) => setZoom(Math.min(4, Math.max(0.1, Math.round(s * 100) / 100)));

  useCommands(win.id, {
    actual: () => setZoom(1),
    fit: () => setZoom('fit'),
    zoomIn: () => setScale(scale * 1.25),
    zoomOut: () => setScale(scale / 1.25),
    prev: idx > 0 && (() => step(-1)),
    next: idx >= 0 && idx < siblings.length - 1 && (() => step(1)),
    inspector: () => setInspector((v) => !v),
  });

  const tb = (label: string, glyph: Parameters<typeof Glyph>[0]['name'], onClick: () => void, disabled = false) => (
    <button type="button" className="tb-btn" onClick={onClick} disabled={disabled} aria-label={label}>
      <span className="bezel">
        <Glyph name={glyph} />
      </span>
      <span>{label}</span>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="toolbar" style={{ background: 'linear-gradient(#dadada, #c3c3c3)', borderBottom: '1px solid #8a8a8a', paddingTop: 4 }}>
        <div className="seg">
          {tb('Previous', 'prev', () => step(-1), idx <= 0)}
          {tb('Next', 'next', () => step(1), idx < 0 || idx >= siblings.length - 1)}
        </div>
        <div className="seg">
          {tb('Zoom Out', 'zoomout', () => setScale(scale / 1.25))}
          {tb('Zoom In', 'zoomin', () => setScale(scale * 1.25))}
        </div>
        {tb('Actual Size', 'actual', () => setZoom(1))}
        {tb('Zoom to Fit', 'fit', () => setZoom('fit'))}
        <div className="spacer" />
        {tb('Inspector', 'info', () => setInspector((v) => !v))}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <div ref={stage} className="scroll" style={{ flex: 1, background: '#8a8a8a', display: 'flex', alignItems: 'safe center', justifyContent: 'safe center', padding: 20 }}>
          {!file ? (
            <p className="placeholder-note" style={{ color: '#eee' }}>No file selected.</p>
          ) : (
            <div style={{ width: natural.w * scale, height: isDoc ? natural.h * scale : undefined, flex: 'none' }}>
              <div style={{ width: natural.w, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
                <Content file={file} />
              </div>
            </div>
          )}
        </div>
        {inspector && file && (
          <aside className="scroll" style={{ width: 210, flex: 'none', borderLeft: '1px solid #8a8a8a', background: '#ececec', padding: 12, fontSize: 11 }} aria-label="Inspector">
            <h3 style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 8 }}>{displayName(file)}</h3>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 8px' }}>
              <dt style={{ color: '#666' }}>Kind</dt>
              <dd>{kindOf(file)}</dd>
              <dt style={{ color: '#666' }}>Size</dt>
              <dd>{file.size ?? '--'}</dd>
              {file.evidenceId && (
                <>
                  <dt style={{ color: '#666' }}>Archive</dt>
                  <dd>{file.evidenceId}</dd>
                </>
              )}
              <dt style={{ color: '#666' }}>Zoom</dt>
              <dd>{Math.round(scale * 100)}%</dd>
            </dl>
          </aside>
        )}
      </div>
    </div>
  );
}

function Content({ file }: { file: VFile }) {
  const d = file.data;
  const media = useMediaSource(file.evidenceId ?? file.id, d.t === 'image' ? d.src : undefined);
  const [failed, setFailed] = useState(false);
  if (d.t === 'doc')
    return (
      <article style={{ width: PAGE_W, minHeight: PAGE_H, background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,.45)', padding: '72px 72px', fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.5, color: '#111' }} className="selectable">
        {d.note && <p style={{ fontFamily: 'var(--ui)', fontSize: 9, color: '#888', marginBottom: 28 }}>{d.note}</p>}
        <h1 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 18 }}>{d.title}</h1>
        {d.paragraphs.map((p, i) => (
          <p key={i} style={{ marginBottom: 12 }}>
            <Txt>{p}</Txt>
          </p>
        ))}
      </article>
    );
  if (d.t === 'image' && media.src && !failed) return <img src={media.src} alt={d.alt} onError={() => setFailed(true)} style={{ width: 640, display: 'block', boxShadow: '0 2px 10px rgba(0,0,0,.45)' }} />;
  const label = d.t === 'image' ? 'Photograph not available' : 'File unavailable';
  return (
    <div style={{ width: 640, height: 480, background: '#f4f4f4', border: '1px solid #bbb', display: 'grid', placeItems: 'center', textAlign: 'center', color: '#666' }} role="img" aria-label={`${label} (${file.evidenceId ?? displayName(file)})`}>
      <div>
        <div style={{ fontSize: 22, marginBottom: 8 }}>{label}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 16 }}>{file.evidenceId ?? displayName(file)}</div>
        {d.t === 'image' && d.caption && (
          <div style={{ marginTop: 14, fontSize: 15, fontStyle: 'italic' }}>
            <Txt>{d.caption}</Txt>
          </div>
        )}
      </div>
    </div>
  );
}
