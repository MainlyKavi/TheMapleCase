import type { ReactNode } from 'react';

// A small 16px icon set in the spirit of 2012 UI kits: 1px strokes, white fills.
const PATHS = {
  document: (
    <>
      <path d="M3.5 1.5h6l3 3v10h-9z" fill="#fff" stroke="currentColor" />
      <path d="M9.5 1.5v3h3" fill="none" stroke="currentColor" />
      <path d="M5.5 7.5h5M5.5 9.5h5M5.5 11.5h3.5" stroke="currentColor" />
    </>
  ),
  image: (
    <>
      <rect x="1.5" y="2.5" width="13" height="11" fill="#fff" stroke="currentColor" />
      <path d="M2.5 12.5l3.5-4 2.5 2.5 2-2 3 3.5" fill="none" stroke="currentColor" />
      <circle cx="11" cy="5.5" r="1.2" fill="currentColor" />
    </>
  ),
  video: (
    <>
      <rect x="1.5" y="3.5" width="9" height="9" fill="#fff" stroke="currentColor" />
      <path d="M10.5 7l4-2.5v7l-4-2.5z" fill="#fff" stroke="currentColor" strokeLinejoin="round" />
      <path d="M3.5 5.5h2" stroke="currentColor" />
    </>
  ),
  audio: (
    <>
      <path d="M2.5 6h2.5l3.5-3v10l-3.5-3h-2.5z" fill="#fff" stroke="currentColor" strokeLinejoin="round" />
      <path d="M10.5 5.5a3.5 3.5 0 010 5M12 3.8a6 6 0 010 8.4" fill="none" stroke="currentColor" />
    </>
  ),
  search: (
    <>
      <circle cx="6.5" cy="6.5" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9.8 9.8l4.2 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  play: <path d="M4.5 2.5v11l9-5.5z" fill="currentColor" />,
  pause: <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor" />,
  volume: (
    <>
      <path d="M2 6h2.5L8 3v10l-3.5-3H2z" fill="currentColor" />
      <path d="M10.5 5.5a3.5 3.5 0 010 5M12 3.8a6 6 0 010 8.4" fill="none" stroke="currentColor" />
    </>
  ),
  mute: (
    <>
      <path d="M2 6h2.5L8 3v10l-3.5-3H2z" fill="currentColor" />
      <path d="M10.5 6l4 4M14.5 6l-4 4" stroke="currentColor" strokeWidth="1.4" />
    </>
  ),
  fullscreen: <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" fill="none" stroke="currentColor" strokeWidth="1.6" />,
  download: (
    <>
      <path d="M8 2v8M4.5 6.5L8 10l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 11v2.5h11V11" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </>
  ),
  menu: <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.8" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={className}>
      {PATHS[name]}
    </svg>
  );
}
