'use client';

import { useMediaSource } from '@stage/client';
import { useRef, useState, type CSSProperties } from 'react';
import { Icon } from './Icon';

const clock = (s: number) => {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

/**
 * Period-style player (c. 2012 embedded players) over real HTML5 playback.
 * With no file it renders the unavailable state: no dead controls.
 */
export function MediaPlayer({
  id,
  kind,
  src,
  poster,
  filename,
}: {
  id: string;
  kind: 'video' | 'audio';
  src?: string;
  poster?: string;
  filename: string;
}) {
  const media = useMediaSource(id, src);
  const el = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState<'ready' | 'loading' | 'error'>('ready');

  // Unavailable: the embedded player's own error state, as period players showed it.
  if (!media.src) {
    return (
      <div className="player" role="img" aria-label={`${kind === 'video' ? 'Video' : 'Audio'} unavailable (${id})`}>
        <div
          className={`grid place-items-center text-center text-[#8d9aa8] ${kind === 'video' ? 'aspect-video max-h-[62vh] w-full' : 'h-[96px]'}`}
        >
          <div>
            <Icon name={kind} size={kind === 'video' ? 26 : 20} className="mx-auto text-[#5d6a78]" />
            <p className="mt-2 font-sans text-[13px] text-[#c3ccd5]">
              This {kind === 'video' ? 'video' : 'recording'} is currently unavailable.
            </p>
            <p className="file-id mt-1 !text-[11px] !text-[#6f7c8a]">{id}</p>
          </div>
        </div>
        <div className="player-bar opacity-40" aria-hidden="true">
          <Icon name="play" size={13} />
          <span className="player-time">0:00 / 0:00</span>
          <span className="h-1.5 flex-1 rounded-[3px] bg-[#11161c] shadow-[inset_0_1px_2px_rgba(0,0,0,.6)]" />
        </div>
      </div>
    );
  }

  const toggle = () => {
    const m = el.current;
    if (!m) return;
    if (m.paused) m.play().catch(() => setStatus('error'));
    else m.pause();
  };

  const events = {
    onLoadedMetadata: () => {
      const m = el.current!;
      setDuration(m.duration);
      if (media.startAt) m.currentTime = media.startAt;
    },
    onTimeUpdate: () => setTime(el.current?.currentTime ?? 0),
    onPlay: () => {
      setPlaying(true);
      setStarted(true);
    },
    onPause: () => setPlaying(false),
    onWaiting: () => setStatus('loading'),
    onPlaying: () => setStatus('ready'),
    onError: () => setStatus('error'),
  };

  const pct = duration ? (time / duration) * 100 : 0;

  const bar = (
    <div className="player-bar">
      <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
        <Icon name={playing ? 'pause' : 'play'} size={13} />
      </button>
      <span className="player-time" aria-hidden="true">
        {clock(time)} / {clock(duration)}
      </span>
      <input
        type="range"
        className="player-seek"
        aria-label="Seek"
        min={0}
        max={duration || 0}
        step={0.1}
        value={time}
        style={{ '--p': `${pct}%` } as CSSProperties}
        onChange={(e) => {
          const t = Number(e.target.value);
          if (el.current) el.current.currentTime = t;
          setTime(t);
        }}
      />
      <button
        type="button"
        aria-label={muted ? 'Unmute' : 'Mute'}
        aria-pressed={muted}
        onClick={() => {
          if (el.current) el.current.muted = !muted;
          setMuted(!muted);
        }}
      >
        <Icon name={muted ? 'mute' : 'volume'} size={14} />
      </button>
      {kind === 'video' && (
        <button type="button" aria-label="Full screen" onClick={() => frame.current?.requestFullscreen?.()}>
          <Icon name="fullscreen" size={12} />
        </button>
      )}
    </div>
  );

  if (kind === 'audio') {
    return (
      <div className="player">
        <div className="flex items-center gap-3 px-4 py-3 text-[12px] text-[#b9c4cf]">
          <Icon name="audio" size={18} className="text-[#8fa3b8]" />
          <span className="file-id !text-[#b9c4cf]">{filename}</span>
          {status === 'error' && <span className="ml-auto text-[#e0b4ae]">This file could not be played.</span>}
        </div>
        <audio ref={el} src={media.src} preload="metadata" {...events} onEnded={() => setPlaying(false)} />
        {bar}
      </div>
    );
  }

  return (
    <div className="player" ref={frame}>
      <div className="relative bg-black">
        <video
          ref={el}
          src={media.src}
          poster={poster}
          preload="metadata"
          playsInline
          onClick={toggle}
          className="block max-h-[78vh] w-full"
          style={duration ? undefined : { aspectRatio: '4 / 3' }}
          {...events}
          onEnded={() => setPlaying(false)}
        />
        {!started && status !== 'error' && (
          <button type="button" className="player-big" onClick={toggle} aria-label="Play video">
            <Icon name="play" size={22} />
          </button>
        )}
        {status === 'loading' && (
          <span className="absolute right-3 top-3 spinner !border-[#45505c] !border-t-white" aria-label="Loading" />
        )}
        {status === 'error' && (
          <p className="absolute inset-0 m-auto grid h-fit place-items-center text-[13px] text-[#e0b4ae]">
            This file could not be played.
          </p>
        )}
      </div>
      {bar}
    </div>
  );
}
