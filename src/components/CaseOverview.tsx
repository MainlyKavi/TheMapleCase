import Link from 'next/link';
import { Fragment } from 'react';
import type { CaseFile } from '@/stage/types';
import { ArchiveImage } from './ArchiveImage';
import { Txt } from './Txt';

/** The case header block on the home page. The film build reuses it for later case files. */
export function CaseOverview({ file }: { file: CaseFile }) {
  return (
    <section className="panel" aria-label={`Case overview: ${file.heading}`}>
      <div className="panel-head">
        <span>
          <Txt>{file.kicker}</Txt>
        </span>
        <span className="tag tag-strong">{file.identity.status}</span>
      </div>
      <div className="grid gap-7 p-5 md:grid-cols-[250px_1fr] md:gap-9 md:p-7">
        <div className="max-w-[200px] sm:max-w-[260px]">
          <ArchiveImage id={file.photo.evidenceId} src={file.photo.src} alt={file.photo.alt} caption={file.photo.caption} />
        </div>
        <div className="min-w-0">
          <h1 className="font-narrow text-[44px] font-bold leading-none tracking-[.01em] text-navy">{file.heading}</h1>
          <p className="mt-2 font-serif text-[16px] italic text-ink-muted">
            <Txt>{file.subheading}</Txt>
          </p>
          <dl className="facts mt-6 max-w-[520px]">
            {file.facts.map(([k, v]) => (
              <Fragment key={k}>
                <dt>{k}</dt>
                <dd>
                  <Txt>{v}</Txt>
                </dd>
              </Fragment>
            ))}
          </dl>
          {file.summary.length > 0 && (
            <div className="prose-archive mt-6 max-w-[600px] text-[15.5px]">
              {file.summary.map((p, i) => (
                <p key={i}>
                  <Txt>{p}</Txt>
                </p>
              ))}
            </div>
          )}
          {file.showArchive && (
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link className="btn btn-primary" href="/evidence/">
                View the evidence archive
              </Link>
              <Link className="btn" href="/timeline/">
                Read the case timeline
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
