'use client';

import { useEffect, useState } from 'react';
import { Reviewing } from '@/components/Reviewing';
import type { MediaSource, Submission, SubmitResponseProps } from './types';

// PUBLIC stage (client side). Replaced by private/stage/client.tsx in the film build.

export function StageRuntime() {
  return null;
}

export function useStagedSubmission(): Submission | null {
  return null;
}

export function useMediaSource(id: string, src?: string): MediaSource {
  return { src };
}

/** Public visitors get a neutral, in-world acknowledgement. Nothing is sent or stored. */
export function SubmitResponse({ submission }: SubmitResponseProps) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 900);
    return () => clearTimeout(t);
  }, []);
  if (!done) return <Reviewing label="Submitting…" />;
  const excerpt = submission.conclusion.length > 140 ? `${submission.conclusion.slice(0, 140)}…` : submission.conclusion;
  return (
    <div className="notice-box" role="status">
      <p className="font-narrow text-[16px] font-bold uppercase tracking-[.1em]">Submission received</p>
      <p className="mt-1.5">Thank you. Submissions are not currently being reviewed.</p>
      <p className="mt-3 border-l-2 border-[#b9cadb] pl-3 font-serif text-[13.5px] italic text-ink-muted">“{excerpt}”</p>
      <p className="fiction-only mt-3 text-[12px] text-ink-muted">This website is fiction. Nothing you entered was sent or stored.</p>
    </div>
  );
}
