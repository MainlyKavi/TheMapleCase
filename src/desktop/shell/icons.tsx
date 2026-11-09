'use client';

// Original vector icons drawn in the spirit of Mac OS X 10.0–10.4 Aqua. No Apple artwork,
// logos or fonts are used or shipped.

import { useId, type ReactNode } from 'react';
import type { IconKind } from '../model/vfs';

type Draw = (id: (k: string) => string) => ReactNode;

const page = (id: (k: string) => string, inner?: ReactNode) => (
  <>
    <defs>
      <linearGradient id={id('pg')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#e9edf2" />
      </linearGradient>
    </defs>
    <path d="M28 8h52l24 24v86a4 4 0 0 1-4 4H28a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill={`url(#${id('pg')})`} stroke="#8d96a1" strokeWidth="2" />
    <path d="M80 8v20a4 4 0 0 0 4 4h20" fill="#dfe5ec" stroke="#8d96a1" strokeWidth="2" strokeLinejoin="round" />
    {inner}
  </>
);

const textLines = (from: number, to: number, x1 = 36, x2 = 92) =>
  Array.from({ length: Math.floor((to - from) / 8) + 1 }, (_, i) => (
    <rect key={i} x={x1} y={from + i * 8} width={i % 4 === 3 ? (x2 - x1) * 0.6 : x2 - x1} height="3" rx="1.5" fill="#a9b1bb" />
  ));

const folder = (id: (k: string) => string, emblem?: ReactNode, tint: 'blue' | 'gray' = 'blue') => {
  const [a, b, c, edge] = tint === 'blue' ? ['#b8d6f8', '#86b6ef', '#5b97e3', '#3f78c4'] : ['#e2e5e9', '#c3c8cf', '#9ea6b0', '#7b838e'];
  return (
    <>
      <defs>
        <linearGradient id={id('back')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
        <linearGradient id={id('front')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset=".5" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
        <linearGradient id={id('gloss')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M10 30a6 6 0 0 1 6-6h30l8 8h58a6 6 0 0 1 6 6v68a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6z" fill={`url(#${id('back')})`} stroke={edge} strokeWidth="2" />
      <path d="M8 46a6 6 0 0 1 6-6h100a6 6 0 0 1 6 6l-3 62a6 6 0 0 1-6 6H17a6 6 0 0 1-6-6z" fill={`url(#${id('front')})`} stroke={edge} strokeWidth="2" />
      <path d="M12 46a4 4 0 0 1 4-4h96a4 4 0 0 1 4 4v10H12z" fill={`url(#${id('gloss')})`} />
      {emblem && <g opacity=".55">{emblem}</g>}
    </>
  );
};

const ICONS: Record<string, Draw> = {
  folder: (id) => folder(id),
  'apps-folder': (id) =>
    folder(
      id,
      <path d="M64 56 46 98h9l4-10h18l4 10h9L72 56zm-2 24 6-15 6 15z" fill="#1d4f91" />,
    ),
  'system-folder': (id) => folder(id, <path d="M48 58h10l6 10 6-10h10L69 76l11 18H70l-6-10-6 10H48l11-18z" fill="#4a5360" />, 'gray'),
  home: (id) => (
    <>
      <defs>
        <linearGradient id={id('roof')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fb3ee" />
          <stop offset="1" stopColor="#2f6fc6" />
        </linearGradient>
        <linearGradient id={id('wall')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d5dbe3" />
        </linearGradient>
      </defs>
      <path d="M26 62h76v52a4 4 0 0 1-4 4H30a4 4 0 0 1-4-4z" fill={`url(#${id('wall')})`} stroke="#7d8794" strokeWidth="2" />
      <path d="M12 66 64 20l52 46-8 8-44-38-44 38z" fill={`url(#${id('roof')})`} stroke="#22579f" strokeWidth="2" strokeLinejoin="round" />
      <rect x="54" y="84" width="20" height="34" rx="2" fill="#8a5a2b" stroke="#5d3a19" strokeWidth="2" />
      <rect x="34" y="74" width="14" height="14" fill="#bfe0ff" stroke="#7d8794" strokeWidth="2" />
      <rect x="80" y="74" width="14" height="14" fill="#bfe0ff" stroke="#7d8794" strokeWidth="2" />
    </>
  ),
  volume: (id) => (
    <>
      <defs>
        <linearGradient id={id('top')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbfbfb" />
          <stop offset="1" stopColor="#c9cdd2" />
        </linearGradient>
        <linearGradient id={id('front')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9bec5" />
          <stop offset=".5" stopColor="#9aa1aa" />
          <stop offset="1" stopColor="#7c838d" />
        </linearGradient>
      </defs>
      <path d="M18 54 34 34h60l16 20z" fill={`url(#${id('top')})`} stroke="#6f7680" strokeWidth="2" strokeLinejoin="round" />
      <rect x="14" y="54" width="100" height="38" rx="5" fill={`url(#${id('front')})`} stroke="#5e656e" strokeWidth="2" />
      <rect x="22" y="64" width="54" height="5" rx="2" fill="#5f666f" opacity=".6" />
      <rect x="22" y="74" width="40" height="5" rx="2" fill="#5f666f" opacity=".45" />
      <circle cx="100" cy="80" r="4" fill="#5fd35a" stroke="#2f7d2b" strokeWidth="1.5" />
      <path d="M20 56h88" stroke="#fff" strokeOpacity=".7" strokeWidth="2" />
    </>
  ),
  trash: (id) => (
    <>
      <defs>
        <linearGradient id={id('body')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9aa3ad" stopOpacity=".55" />
          <stop offset=".45" stopColor="#f4f6f8" stopOpacity=".55" />
          <stop offset="1" stopColor="#7d8692" stopOpacity=".6" />
        </linearGradient>
        <pattern id={id('mesh')} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 0l6 6M6 0 0 6" stroke="#5d6672" strokeWidth=".8" opacity=".55" />
        </pattern>
      </defs>
      <path d="M22 30h84l-8 84a6 6 0 0 1-6 5H36a6 6 0 0 1-6-5z" fill={`url(#${id('body')})`} />
      <path d="M22 30h84l-8 84a6 6 0 0 1-6 5H36a6 6 0 0 1-6-5z" fill={`url(#${id('mesh')})`} stroke="#59616c" strokeWidth="2" />
      <ellipse cx="64" cy="30" rx="44" ry="9" fill="#dfe3e8" fillOpacity=".7" stroke="#59616c" strokeWidth="2.5" />
      <ellipse cx="64" cy="30" rx="38" ry="6" fill="#4b525c" fillOpacity=".35" />
    </>
  ),
  'trash-full': (id) => (
    <>
      {ICONS.trash(id)}
      <path d="M34 30c4-14 18-20 28-14 6-8 22-6 26 4 8 0 14 6 12 12l-4 4H32z" fill="#fbfbf7" stroke="#8b9097" strokeWidth="1.5" />
      <path d="M48 22c6 4 10 2 14 6M70 18c2 6 8 8 14 6" stroke="#b9bdc3" strokeWidth="1.5" fill="none" />
    </>
  ),
  text: (id) => page(id, <>{textLines(40, 108)}</>),
  generic: (id) => page(id),
  html: (id) => page(id, <>{textLines(40, 60)}<g transform="translate(40 62) scale(.38)">{ICONS['app:safari']((k) => id(`s${k}`))}</g></>),
  pdf: (id) =>
    page(
      id,
      <>
        {textLines(40, 80)}
        <rect x="34" y="90" width="60" height="22" rx="3" fill="#c7302b" />
        <text x="64" y="106" textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontWeight="700" fontSize="15" fill="#fff">
          PDF
        </text>
      </>,
    ),
  image: (id) => (
    <>
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a8fe0" />
          <stop offset="1" stopColor="#bfe0ff" />
        </linearGradient>
      </defs>
      <g transform="rotate(-6 64 64)">
        <rect x="14" y="22" width="100" height="84" rx="2" fill="#fff" stroke="#8d96a1" strokeWidth="2" />
        <rect x="22" y="30" width="84" height="62" fill={`url(#${id('sky')})`} />
        <path d="M22 92 46 64l16 18 12-12 32 22z" fill="#4e9b3c" />
        <circle cx="88" cy="46" r="7" fill="#fff6c2" />
      </g>
    </>
  ),
  movie: (id) =>
    page(
      id,
      <>
        <rect x="34" y="44" width="58" height="50" rx="3" fill="#2b2f36" />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <rect x="37" y={47 + i * 9.5} width="5" height="5" fill="#d9dde3" />
            <rect x="84" y={47 + i * 9.5} width="5" height="5" fill="#d9dde3" />
          </g>
        ))}
        <path d="M56 58v22l18-11z" fill="#fff" />
      </>,
    ),
  audio: (id) =>
    page(
      id,
      <path d="M78 42v40a10 8 0 1 1-6-7V54l-24 6v30a10 8 0 1 1-6-7V50z" fill="#3a66b0" />,
    ),
  webloc: (id) => (
    <>
      <defs>
        <linearGradient id={id('tag')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dde6f1" />
        </linearGradient>
      </defs>
      <path d="M28 8h52l24 24v86a4 4 0 0 1-4 4H28a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill={`url(#${id('tag')})`} stroke="#7f8fa3" strokeWidth="2" />
      <path d="M80 8v20a4 4 0 0 0 4 4h20" fill="#d6e0ec" stroke="#7f8fa3" strokeWidth="2" />
      <text x="64" y="92" textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontWeight="700" fontSize="54" fill="#2f6fd0">
        @
      </text>
    </>
  ),
  'app:finder': (id) => (
    <>
      <defs>
        <linearGradient id={id('l')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fc6ff" />
          <stop offset="1" stopColor="#1f6fd8" />
        </linearGradient>
        <linearGradient id={id('r')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f9ff" />
          <stop offset="1" stopColor="#b9d3f2" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="108" height="108" rx="14" fill={`url(#${id('r')})`} stroke="#2d5f9e" strokeWidth="2.5" />
      <path d="M24 10h44c-6 16-10 32-8 48h10c-2 10-2 22 2 34-8 0-16 6-18 26H24a14 14 0 0 1-14-14V24a14 14 0 0 1 14-14z" fill={`url(#${id('l')})`} />
      <rect x="40" y="38" width="7" height="20" rx="3.5" fill="#10243f" />
      <rect x="82" y="38" width="7" height="20" rx="3.5" fill="#10243f" />
      <path d="M34 86c18 12 44 12 62-2" stroke="#10243f" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M14 22a12 12 0 0 1 12-10h76a12 12 0 0 1 12 10v18H14z" fill="#fff" opacity=".22" />
    </>
  ),
  'app:safari': (id) => (
    <>
      <defs>
        <radialGradient id={id('face')} cx=".4" cy=".35" r=".75">
          <stop offset="0" stopColor="#e6f4ff" />
          <stop offset=".55" stopColor="#5ba8f2" />
          <stop offset="1" stopColor="#1452b3" />
        </radialGradient>
        <linearGradient id={id('rim')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#9aa4b0" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="56" fill={`url(#${id('rim')})`} stroke="#6b7480" strokeWidth="2" />
      <circle cx="64" cy="64" r="47" fill={`url(#${id('face')})`} stroke="#2e5d9a" strokeWidth="1.5" />
      {Array.from({ length: 36 }, (_, i) => {
        const a = (i * Math.PI) / 18;
        const r1 = i % 9 === 0 ? 37 : 42;
        return <line key={i} x1={64 + Math.cos(a) * r1} y1={64 + Math.sin(a) * r1} x2={64 + Math.cos(a) * 46} y2={64 + Math.sin(a) * 46} stroke="#fff" strokeWidth={i % 9 === 0 ? 2.5 : 1.2} opacity=".9" />;
      })}
      <path d="M64 64 92 30 70 70z" fill="#e8322b" />
      <path d="M64 64 36 98l22-40z" fill="#f2f2f2" />
      <path d="M64 64 92 30 58 58z" fill="#ff6b5e" />
      <circle cx="64" cy="64" r="4" fill="#fff" stroke="#888" />
      <ellipse cx="56" cy="38" rx="30" ry="14" fill="#fff" opacity=".28" />
    </>
  ),
  'app:mail': (id) => (
    <>
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f73cf" />
          <stop offset="1" stopColor="#a9d2ff" />
        </linearGradient>
      </defs>
      <path
        d="M16 14h96v100H16z"
        fill="#fff"
        stroke="#9aa2ad"
        strokeWidth="2"
        strokeDasharray="5 3"
      />
      <rect x="24" y="22" width="80" height="84" fill={`url(#${id('sky')})`} />
      <path d="M34 74c12-10 24-14 32-26 2 8 0 14-4 18 10-2 22 2 32 10-12-2-22 0-30 4-10-4-20-6-30-6z" fill="#fff" opacity=".95" />
      <path d="M24 92c20-8 40-8 80 0v14H24z" fill="#1d4f91" opacity=".55" />
      <g stroke="#3c3c3c" strokeWidth="2" fill="none" opacity=".55">
        <circle cx="96" cy="34" r="16" />
        <path d="M60 30c8-4 16 4 24 0s16 4 24 0M60 38c8-4 16 4 24 0s16 4 24 0" />
      </g>
    </>
  ),
  'app:textedit': (id) => (
    <>
      <defs>
        <linearGradient id={id('pen')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3b3f46" />
          <stop offset=".5" stopColor="#8a929c" />
          <stop offset="1" stopColor="#2c3036" />
        </linearGradient>
      </defs>
      <rect x="20" y="10" width="80" height="106" rx="2" fill="#fff" stroke="#8d96a1" strokeWidth="2" />
      {textLines(24, 96, 30, 90)}
      <g transform="rotate(35 92 74)">
        <rect x="86" y="18" width="13" height="78" rx="4" fill={`url(#${id('pen')})`} />
        <path d="M86 96h13l-6.5 22z" fill="#d6b25a" stroke="#8a6b1e" />
        <rect x="86" y="18" width="13" height="10" fill="#c9a94b" />
      </g>
    </>
  ),
  'app:preview': (id) => (
    <>
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a8fe0" />
          <stop offset="1" stopColor="#cbe6ff" />
        </linearGradient>
        <radialGradient id={id('lens')} cx=".4" cy=".35" r=".7">
          <stop offset="0" stopColor="#fff" stopOpacity=".9" />
          <stop offset="1" stopColor="#bcd8f5" stopOpacity=".35" />
        </radialGradient>
      </defs>
      <g transform="rotate(8 64 60)">
        <rect x="22" y="14" width="80" height="64" fill="#fff" stroke="#8d96a1" strokeWidth="2" />
      </g>
      <g transform="rotate(-6 60 64)">
        <rect x="14" y="24" width="84" height="70" fill="#fff" stroke="#8d96a1" strokeWidth="2" />
        <rect x="20" y="30" width="72" height="50" fill={`url(#${id('sky')})`} />
        <path d="M20 80 42 56l14 14 10-8 26 18z" fill="#4e9b3c" />
      </g>
      <circle cx="82" cy="78" r="22" fill={`url(#${id('lens')})`} stroke="#3a3f46" strokeWidth="6" />
      <path d="M98 94 116 112" stroke="#3a3f46" strokeWidth="11" strokeLinecap="round" />
    </>
  ),
  'app:quicktime': (id) => (
    <>
      <defs>
        <radialGradient id={id('ball')} cx=".38" cy=".3" r=".8">
          <stop offset="0" stopColor="#bfe3ff" />
          <stop offset=".45" stopColor="#3b8ee8" />
          <stop offset="1" stopColor="#0d3f99" />
        </radialGradient>
      </defs>
      <circle cx="64" cy="62" r="50" fill={`url(#${id('ball')})`} stroke="#0b3478" strokeWidth="2" />
      <circle cx="64" cy="60" r="24" fill="none" stroke="#fff" strokeWidth="11" />
      <path d="M76 74 98 100" stroke="#fff" strokeWidth="11" strokeLinecap="round" />
      <ellipse cx="56" cy="32" rx="30" ry="14" fill="#fff" opacity=".35" />
    </>
  ),
  'app:addressbook': (id) => (
    <>
      <defs>
        <linearGradient id={id('cover')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b67a43" />
          <stop offset="1" stopColor="#6b3f1a" />
        </linearGradient>
      </defs>
      <rect x="26" y="10" width="84" height="108" rx="6" fill="#f3efe4" stroke="#7c6a4c" strokeWidth="2" />
      <rect x="18" y="14" width="84" height="104" rx="6" fill={`url(#${id('cover')})`} stroke="#4c2b10" strokeWidth="2" />
      <rect x="18" y="14" width="14" height="104" rx="4" fill="#4c2b10" opacity=".55" />
      <text x="68" y="84" textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontWeight="700" fontSize="52" fill="#f6e7c8" opacity=".9">
        @
      </text>
    </>
  ),
  'app:terminal': (id) => (
    <>
      <defs>
        <linearGradient id={id('case')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9ecef" />
          <stop offset="1" stopColor="#9aa1aa" />
        </linearGradient>
      </defs>
      <rect x="12" y="16" width="104" height="90" rx="8" fill={`url(#${id('case')})`} stroke="#5b626b" strokeWidth="2" />
      <rect x="20" y="24" width="88" height="70" rx="3" fill="#0e1012" />
      <text x="28" y="50" fontFamily="Monaco, Menlo, monospace" fontSize="20" fill="#e6e6e6">
        &gt;_
      </text>
      <rect x="20" y="24" width="88" height="22" fill="#fff" opacity=".06" />
    </>
  ),
  'app:stickies': () => (
    <>
      <rect x="30" y="16" width="84" height="80" fill="#c9e7ff" stroke="#8aa7bf" strokeWidth="1.5" transform="rotate(8 72 56)" />
      <rect x="22" y="26" width="84" height="80" fill="#d7f5c4" stroke="#93b07f" strokeWidth="1.5" transform="rotate(-5 64 66)" />
      <rect x="16" y="36" width="84" height="80" fill="#fff79a" stroke="#c2b247" strokeWidth="1.5" />
      <rect x="16" y="36" width="84" height="9" fill="#efe36e" />
      {[56, 66, 76, 86].map((y) => (
        <rect key={y} x="26" y={y} width={y === 86 ? 36 : 62} height="3" rx="1.5" fill="#9d9140" />
      ))}
    </>
  ),
  'app:sysprefs': (id) => (
    <>
      <defs>
        <linearGradient id={id('plate')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f3f5" />
          <stop offset="1" stopColor="#a8afb8" />
        </linearGradient>
        <linearGradient id={id('sw')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c5cbd3" />
        </linearGradient>
      </defs>
      <rect x="16" y="12" width="96" height="104" rx="12" fill={`url(#${id('plate')})`} stroke="#5f6670" strokeWidth="2" />
      <circle cx="30" cy="26" r="3" fill="#7a818a" />
      <circle cx="98" cy="102" r="3" fill="#7a818a" />
      <rect x="44" y="30" width="40" height="68" rx="6" fill="#4b525b" />
      <rect x="49" y="36" width="30" height="34" rx="4" fill={`url(#${id('sw')})`} stroke="#6c737c" />
      <rect x="49" y="70" width="30" height="22" rx="3" fill="#2f353c" />
    </>
  ),
  'app:dashboard': () => null,
};

export function Icon({ kind, size = 32, className, title }: { kind: IconKind | string; size?: number; className?: string; title?: string }) {
  const uid = useId().replace(/:/g, '');
  const draw = ICONS[kind] ?? ICONS.generic;
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} className={className} aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      {draw((k) => `${uid}-${k}`)}
    </svg>
  );
}

/** Menu-bar apple: an original apple-with-leaf glyph (not the trademark bitten apple). */
export function AppleGlyph({ graphite }: { graphite?: boolean }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 20 22" width="15" height="17" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={graphite ? '#c7ccd2' : '#8fc3ff'} />
          <stop offset=".5" stopColor={graphite ? '#7d858f' : '#2f7be6'} />
          <stop offset="1" stopColor={graphite ? '#5b626b' : '#1550b8'} />
        </linearGradient>
      </defs>
      <path d="M10 6.2c1.4-1.1 3.5-1.5 5.1-.5 2.2 1.4 2.7 4.6 1.6 7.9-.9 2.7-2.6 6-4.6 6.2-1 .1-1.4-.5-2.1-.5s-1.1.6-2.1.5c-2-.2-3.7-3.5-4.6-6.2-1.1-3.3-.6-6.5 1.6-7.9 1.6-1 3.7-.6 5.1.5z" fill={`url(#${uid}a)`} stroke={graphite ? '#4d545c' : '#1446a0'} strokeWidth=".7" />
      <path d="M10.4 5.6C10.6 3.4 12 1.6 14.3 1.2c-.1 2.3-1.6 4-3.9 4.4z" fill={graphite ? '#7d858f' : '#3a8a2f'} />
      <ellipse cx="7.5" cy="8.4" rx="2.4" ry="1.3" fill="#fff" opacity=".55" />
    </svg>
  );
}

export function SpotlightGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <defs>
        <radialGradient id="spot-b" cx=".4" cy=".3" r=".8">
          <stop offset="0" stopColor="#9cd0ff" />
          <stop offset="1" stopColor="#1b5fcc" />
        </radialGradient>
      </defs>
      <circle cx="10" cy="10" r="9" fill="url(#spot-b)" stroke="#164c9e" strokeWidth=".8" />
      <circle cx="9" cy="9" r="3.6" fill="none" stroke="#fff" strokeWidth="1.6" />
      <path d="M11.6 11.6 14.4 14.4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Small toolbar glyphs drawn as paths. */
export function Glyph({ name, size = 14 }: { name: 'back' | 'forward' | 'reload' | 'plus' | 'gear' | 'icons' | 'list' | 'columns' | 'search' | 'zoomin' | 'zoomout' | 'actual' | 'fit' | 'prev' | 'next' | 'info' | 'stop' | 'play' | 'pause' | 'delete' | 'reply' | 'replyall' | 'forwardmail' | 'compose' | 'getmail' | 'junk'; size?: number }) {
  const p: Record<string, ReactNode> = {
    back: <path d="M11 3 5 8l6 5z" />,
    forward: <path d="M5 3l6 5-6 5z" />,
    reload: <path d="M8 2.5a5.5 5.5 0 1 0 5.2 7.3l-1.8-.6A3.6 3.6 0 1 1 10.6 5L9 6.6h4.5V2l-1.5 1.5A5.5 5.5 0 0 0 8 2.5z" />,
    plus: <path d="M7 3h2v4h4v2H9v4H7V9H3V7h4z" />,
    gear: <path d="M7 1h2l.4 2 1.6.7 1.7-1.2 1.4 1.4-1.2 1.7.7 1.6 2 .4v2l-2 .4-.7 1.6 1.2 1.7-1.4 1.4-1.7-1.2-1.6.7L9 15H7l-.4-2-1.6-.7-1.7 1.2-1.4-1.4 1.2-1.7L2.4 9 .5 8.6v-2L2.4 6l.7-1.6L1.9 2.7l1.4-1.4 1.7 1.2L6.6 3zM8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />,
    icons: <path d="M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 0h5v5H9z" />,
    list: <path d="M2 3h12v2H2zm0 4h12v2H2zm0 4h12v2H2z" />,
    columns: <path d="M1 3h4v10H1zm5 0h4v10H6zm5 0h4v10h-4z" />,
    search: <path d="M6.5 2a4.5 4.5 0 0 1 3.7 7.1l3.4 3.4-1.1 1.1-3.4-3.4A4.5 4.5 0 1 1 6.5 2zm0 1.6a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8z" />,
    zoomin: <path d="M6.5 2a4.5 4.5 0 0 1 3.7 7.1l3.4 3.4-1.1 1.1-3.4-3.4A4.5 4.5 0 1 1 6.5 2zM6 4v2H4v1h2v2h1V7h2V6H7V4z" />,
    zoomout: <path d="M6.5 2a4.5 4.5 0 0 1 3.7 7.1l3.4 3.4-1.1 1.1-3.4-3.4A4.5 4.5 0 1 1 6.5 2zM4 6h5v1H4z" />,
    actual: <path d="M2 2h12v12H2zm2 2v8h8V4zm2 2h4v4H6z" />,
    fit: <path d="M2 2h4v1.5H3.5V6H2zm8 0h4v4h-1.5V3.5H10zM2 10h1.5v2.5H6V14H2zm10.5 0H14v4h-4v-1.5h2.5z" />,
    prev: <path d="M3 3h2v10H3zm9 0v10L6 8z" />,
    next: <path d="M11 3h2v10h-2zM4 3v10l6-5z" />,
    info: <path d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM7 7v5h2V7zm0-3v2h2V4z" />,
    stop: <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" />,
    play: <path d="M4 2.5v11l9-5.5z" />,
    pause: <path d="M4 3h3v10H4zm5 0h3v10H9z" />,
    delete: <path d="M5 2h6l.5 1H14v1.5H2V3h2.5zM3.5 5.5h9l-.7 8.5H4.2z" />,
    reply: <path d="M7 3 1.5 7.5 7 12V9c3.5 0 5.5 1 7.5 4-.5-4.5-3-7.5-7.5-8z" />,
    replyall: <path d="M6 3 .5 7.5 6 12V10L3 7.5 6 5zm4 0L4.5 7.5 10 12V9.2c2.5 0 4 .8 5.5 3.3-.4-3.8-2.4-6.3-5.5-6.8z" />,
    forwardmail: <path d="M9 3l5.5 4.5L9 12V9c-3.5 0-5.5 1-7.5 4 .5-4.5 3-7.5 7.5-8z" />,
    compose: <path d="M2 12.5V14h1.5l8-8L10 4.5zM11 3.5l1.5 1.5 1.2-1.2a.7.7 0 0 0 0-1l-.5-.5a.7.7 0 0 0-1 0z" />,
    getmail: <path d="M2 4h12v8H2zm1.2 1L8 8.6 12.8 5zM3 11h10V6.2L8 9.8 3 6.2z" />,
    junk: <path d="M8 1.5 15 14H1zM7.2 6v4h1.6V6zm0 5v1.6h1.6V11z" />,
  };
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" aria-hidden="true">
      {p[name]}
    </svg>
  );
}
