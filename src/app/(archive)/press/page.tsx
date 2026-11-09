import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead, Panel, SectionTitle } from '@/components/Archive';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DraftMark } from '@/components/DraftMark';
import { Txt } from '@/components/Txt';
import { press } from '@/content/press';
import type { PressCategory } from '@/content/types';
import { formatDate } from '@/lib/format';
import { evidenceHref, relatedEvidence } from '@/lib/registry';

export const metadata: Metadata = { title: 'Press Archive' };

const ORDER: PressCategory[] = ['Initial reports', 'Reward announcement', 'Search updates', 'Public speculation', 'Archive launch'];
const anchor = (c: string) => c.toLowerCase().replace(/[^a-z]+/g, '-');

export default function PressPage() {
  const groups = ORDER.map((c) => [c, press.filter((p) => p.category === c)] as const).filter(([, items]) => items.length);

  return (
    <>
      <Breadcrumbs trail={[['Press']]} />
      <div className="wrap pt-8">
        <PageHead kicker="Coverage" title="Press Archive">
          Reporting on the case, collected by the family. Articles are summarised here; an archived copy is linked where
          the archive holds one.
        </PageHead>

        <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
          <div className="min-w-0 space-y-12">
            {groups.map(([category, items]) => (
              <section key={category} id={anchor(category)} className="scroll-mt-6">
                <SectionTitle>{category}</SectionTitle>
                <ul>
                  {items.map((p) => {
                    const copies = relatedEvidence(p.relatedEvidenceIds);
                    return (
                      <li
                        key={p.id}
                        id={p.id.toLowerCase()}
                        className="grid scroll-mt-6 gap-1 border-b border-fog py-4 first:pt-1 md:grid-cols-[130px_1fr] md:gap-5"
                      >
                        <p className="pt-1 text-[12.5px] text-ink-muted">
                          <Txt>{formatDate(p.date, p.dateConfidence)}</Txt>
                        </p>
                        <div>
                          <h3 className="text-[19px] leading-snug">
                            {p.headline}
                            <DraftMark status={p.canonStatus} />
                          </h3>
                          <p className="mt-1 text-[12px] text-ink-muted">
                            <Txt>{p.outlet}</Txt>
                            <span className="mx-1.5 text-rule-dark">·</span>
                            {p.format}
                          </p>
                          <details className="mt-2 text-[13px]">
                            <summary className="cursor-pointer text-link">Summary</summary>
                            <p className="prose-archive mt-2 max-w-[600px] text-[14.5px]">
                              <Txt>{p.summary}</Txt>
                            </p>
                            {copies.length > 0 && (
                              <p className="mt-2 text-[12.5px]">
                                Archived copy:{' '}
                                {copies.map((e) => (
                                  <Link key={e.id} href={evidenceHref(e.id)} className="mr-3">
                                    <span className="file-id !text-link">{e.id}</span> {e.title}
                                  </Link>
                                ))}
                              </p>
                            )}
                          </details>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          <aside className="space-y-6">
            <Panel title="Categories">
              <ul className="py-2 text-[13px]">
                {groups.map(([c, items]) => (
                  <li key={c}>
                    <a href={`#${anchor(c)}`} className="flex justify-between px-4 py-[5px] hover:bg-fog-light">
                      <span>{c}</span>
                      <span className="text-ink-muted">{items.length}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Media enquiries">
              <p className="px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-muted">
                The family is not giving interviews at this time.
              </p>
            </Panel>
          </aside>
        </div>
      </div>
    </>
  );
}
