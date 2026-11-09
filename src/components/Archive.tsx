import Link from 'next/link';
import type { ReactNode } from 'react';
import type { EvidenceItem } from '@/content/types';
import { evidenceHref, MEDIA_LABEL } from '@/lib/archive';
import { formatDate } from '@/lib/format';
import { Thumb } from './MissingMedia';
import { Txt } from './Txt';

export function Panel({ title, aside, children, className = '' }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      <h2 className="panel-head">
        <span>{title}</span>
        {aside}
      </h2>
      {children}
    </section>
  );
}

export function SectionTitle({ children, more }: { children: ReactNode; more?: { href: string; label: string } }) {
  return (
    <h2 className="section-title">
      <span>{children}</span>
      {more && (
        <Link className="more" href={more.href}>
          {more.label} ›
        </Link>
      )}
    </h2>
  );
}

export function PageHead({ kicker, title, children }: { kicker: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-8 border-b border-rule pb-6">
      <p className="kicker">{kicker}</p>
      <h1 className="page-title mt-2">{title}</h1>
      {children && <div className="page-intro mt-3">{children}</div>}
    </header>
  );
}

/** A plain list of archive items: thumbnail, title, reference, type and date. */
export function EvidenceList({ items }: { items: EvidenceItem[] }) {
  if (!items.length) return <p className="text-[13px] italic text-ink-muted">No related items.</p>;
  return (
    <ul className="divide-y divide-fog border border-rule bg-white">
      {items.map((e) => (
        <li key={e.id} className="flex items-start gap-3 px-3 py-2.5">
          <Thumb kind={e.mediaType} id={e.id} src={e.mediaType === 'image' ? e.file?.src : e.file?.poster} />
          <div className="min-w-0 flex-1">
            <Link href={evidenceHref(e.id)} className="font-bold">
              {e.title}
            </Link>
            <div className="mt-0.5 text-[12px] text-ink-muted">
              <span className="file-id">{e.id}</span>
              <span className="mx-1.5 text-rule-dark">·</span>
              {MEDIA_LABEL[e.mediaType]}
              <span className="mx-1.5 text-rule-dark">·</span>
              <Txt>{formatDate(e.date, e.dateConfidence)}</Txt>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DocumentView({ item }: { item: EvidenceItem }) {
  return (
    <div>
      <div className="paper px-6 py-7 md:px-10 md:py-9">
        <div className="mb-6 flex justify-between gap-4 border-b border-[#dfe3e6] pb-2 font-narrow text-[11px] uppercase tracking-[.16em] text-ink-muted">
          <span>Transcription</span>
          <span className="file-id normal-case tracking-normal">
            <Txt>{item.filename}</Txt>
          </span>
        </div>
        {item.body?.length ? (
          <div className="prose-archive">
            {item.body.map((p, i) => (
              <p key={i}>
                <Txt>{p}</Txt>
              </p>
            ))}
          </div>
        ) : (
          <p className="italic text-ink-muted">A transcription of this document is not available.</p>
        )}
      </div>
      <p className="mt-2 text-[12px] text-ink-muted">Transcribed from the original. Original formatting is not preserved.</p>
    </div>
  );
}
