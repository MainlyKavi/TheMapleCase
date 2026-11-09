import { Fragment } from 'react';

const SPLIT = /(\[TBD[^\]]*\])/g;

/** Production placeholder chip. Amber, so it can never pass for part of the design. */
export function Tbd({ note }: { note: string }) {
  const text = note.slice(1, -1).replace(/^TBD:?\s*/, '');
  return (
    <span className="tbd" title={text ? `To be decided: ${text}` : 'To be decided'}>
      TBD
    </span>
  );
}

/** Renders content text, turning inline "[TBD: note]" markers into TBD chips. */
export function Txt({ children }: { children: string }) {
  const parts = children.split(SPLIT);
  if (parts.length === 1) return <>{children}</>;
  return (
    <>
      {parts.map((p, i) => (p.startsWith('[TBD') ? <Tbd key={i} note={p} /> : <Fragment key={i}>{p}</Fragment>))}
    </>
  );
}

/** Plain-text form for attributes and <title>: markers become "TBD". */
export const plain = (s: string) => s.replace(/\[TBD[^\]]*\]/g, 'TBD');
