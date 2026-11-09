'use client';

import { useMediaSource } from '@stage/client';
import { useEffect, useRef, useState } from 'react';
import * as A from '@/desktop/actions';
import { displayName, getNode } from '@/desktop/model/vfs';
import { Glyph } from '@/desktop/shell/icons';
import { useFs } from '@/desktop/store';
import type { AppWindowProps } from '../registry';
import { useCommands } from '../useCommands';

const time = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00:00');

/** QuickTime Player. Uses the same media source as the archive (film overrides included), so a
 *  recording is one identical file wherever it is opened. */
export default function QuickTime({ win }: AppWindowProps) {
  const fs = useFs();
  const node = getNode(fs, win.props.nodeId as string);
  const file = node?.kind === 'file' ? node : undefined;
  const d = file?.data;
  const isAudio = (d?.t === 'media' && d.media === 'audio') || /\.(wav|mp3|m4a)$/i.test(file?.name ?? '');
  const media = useMediaSource(file?.evidenceId ?? file?.id ?? '', d?.t === 'media' ? d.src : undefined);
  const el = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const available = Boolean(media.src) && failedSrc !== media.src;
  const setFailed = () => setFailedSrc(media.src ?? null);

  useEffect(() => {
    if (file) A.setWindowTitle(win.id, displayName(file));
  }, [win.id, file]);

  const toggle = () => {
    const m = el.current;
    if (!m || !available) return;
    if (m.paused) m.play().catch(setFailed);
    else m.pause();
  };
  useCommands(win.id, { playPause: available && toggle });

  const Tag = isAudio ? 'audio' : 'video';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 8px 8px' }}>
      <div style={{ flex: isAudio ? 'none' : 1, minHeight: isAudio ? 0 : 120, background: '#000', position: 'relative', border: '1px solid #444' }}>
        {available && (
          <Tag
            ref={el}
            src={media.src}
            preload="metadata"
            playsInline
            onLoadedMetadata={(e) => {
              setDur(e.currentTarget.duration);
              if (media.startAt) e.currentTarget.currentTime = media.startAt;
            }}
            onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={setFailed}
            style={{ width: '100%', height: '100%', display: isAudio ? 'none' : 'block', objectFit: 'contain' }}
          />
        )}
        {!available && !isAudio && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#bbb', fontSize: 12, textAlign: 'center' }} role="img" aria-label={`Video unavailable (${file?.evidenceId ?? ''})`}>
            <div>
              <div style={{ fontSize: 14, marginBottom: 4 }}>Video unavailable</div>
              <div style={{ fontFamily: 'var(--mono)' }}>{file?.evidenceId ?? (file ? displayName(file) : '')}</div>
            </div>
          </div>
        )}
      </div>
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, paddingTop: 7 }}>
        <button type="button" className="tb-btn" aria-label={playing ? 'Pause' : 'Play'} disabled={!available} onClick={toggle}>
          <span className="bezel" style={{ borderRadius: 12, minWidth: 26, height: 22 }}>
            <Glyph name={playing ? 'pause' : 'play'} size={12} />
          </span>
        </button>
        <input
          type="range"
          className="aqua-slider"
          aria-label="Position"
          min={0}
          max={dur || 1}
          step={0.01}
          value={t}
          disabled={!available}
          onChange={(e) => {
            if (el.current) el.current.currentTime = Number(e.target.value);
          }}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', minWidth: 52 }}>{time(t)}</span>
      </div>
      {!available && isAudio && <p style={{ fontSize: 11, color: '#444', paddingTop: 4 }}>Audio unavailable ({file?.evidenceId})</p>}
    </div>
  );
}
