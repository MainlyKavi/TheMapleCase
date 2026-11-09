import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead, Panel } from '@/components/Archive';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DraftMark } from '@/components/DraftMark';
import { Txt } from '@/components/Txt';
import { timeline } from '@/content/timeline';
import { formatDate } from '@/lib/format';
import { evidenceHref, getPress, relatedEvidence } from '@/lib/registry';

export const metadata: Metadata = { title: 'Case Timeline' };

export default function TimelinePage() {
  return (
    <>
      <Breadcrumbs trail={[['Case Timeline']]} />
      <div className="wrap pt-8">
        <PageHead kicker="The investigation" title="Case Timeline">
          A chronological record of the investigation into Cristina’s disappearance, as kept by this archive. Each entry
          lists the archive items and press reports it draws on.
        </PageHead>

        <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
          <ol aria-label="Timeline">
            {timeline.map((t) => {
              const items = relatedEvidence(t.relatedEvidenceIds);
              const articles = t.relatedPressIds.map(getPress).filter((p) => p !== undefined);
              return (
                <li key={t.id} className="grid grid-cols-[96px_1fr] gap-4 md:grid-cols-[150px_1fr] md:gap-6">
                  <div className="pt-0.5 text-right">
                    <p className="font-narrow text-[17px] font-bold leading-tight text-navy">
                      <Txt>{formatDate(t.date, t.dateConfidence)}</Txt>
                    </p>
                    {t.dateConfidence === 'approximate' && <p className="tag mt-1.5">Approx.</p>}
                  </div>
                  <div className="relative border-l-2 border-rule pb-10 pl-6 md:pl-7">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[7px] top-[5px] size-3 rounded-full border-2 border-navy bg-paper"
                    />
                    <h2 className="text-[21px]">
                      {t.title}
                      <DraftMark status={t.canonStatus} />
                    </h2>
                    <p className="prose-archive mt-2 max-w-[600px] text-[15.5px]">
                      <Txt>{t.description}</Txt>
                    </p>
                    {(items.length > 0 || articles.length > 0) && (
                      <div className="mt-3.5 border-t border-dotted border-rule-dark pt-2.5 text-[12.5px]">
                        <span className="mr-2 font-narrow font-bold uppercase tracking-[.12em] text-ink-muted">Sources</span>
                        {items.map((e) => (
                          <Link key={e.id} href={evidenceHref(e.id)} className="mr-3.5 inline-block">
                            <span className="file-id !text-link">{e.id}</span> {e.title}
                          </Link>
                        ))}
                        {articles.map((p) => (
                          <Link key={p.id} href={`/press/#${p.id.toLowerCase()}`} className="mr-3.5 inline-block">
                            Press: “{p.headline}”
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
            <li className="grid grid-cols-[96px_1fr] gap-4 md:grid-cols-[150px_1fr] md:gap-6">
              <span />
              <p className="border-l-2 border-dotted border-rule pl-6 text-[12px] uppercase tracking-[.14em] text-ink-muted md:pl-7">
                End of record
              </p>
            </li>
          </ol>

          <aside className="space-y-6">
            <Panel title="Reading this timeline">
              <div className="space-y-2.5 px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-muted">
                <p>Entries are listed in the order they occurred. Where only the year is known, only the year is shown.</p>
                <p>
                  Dates marked <span className="tag">Approx.</span> are approximate.
                </p>
                <p>Sources link to the archive item or press report each entry is based on.</p>
              </div>
            </Panel>
            <Panel title="See also">
              <ul className="py-2 text-[13px]">
                <li>
                  <Link className="block px-4 py-[5px] hover:bg-fog-light" href="/evidence/">
                    Evidence archive
                  </Link>
                </li>
                <li>
                  <Link className="block px-4 py-[5px] hover:bg-fog-light" href="/press/">
                    Press archive
                  </Link>
                </li>
                <li>
                  <Link className="block px-4 py-[5px] hover:bg-fog-light" href="/people/">
                    People
                  </Link>
                </li>
              </ul>
            </Panel>
          </aside>
        </div>
      </div>
    </>
  );
}
