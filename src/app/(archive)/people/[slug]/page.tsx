import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Fragment } from 'react';
import { EvidenceList, Panel, SectionTitle } from '@/components/Archive';
import { ArchiveImage } from '@/components/ArchiveImage';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DraftMark } from '@/components/DraftMark';
import { Txt } from '@/components/Txt';
import { people } from '@/content/people';
import { getEvidence, getPerson, relatedEvidence } from '@/lib/registry';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => people.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const person = getPerson((await params).slug);
  return { title: person?.name ?? 'Not found' };
}

export default async function PersonPage({ params }: Props) {
  const person = getPerson((await params).slug);
  if (!person) notFound();
  const photo = person.photoEvidenceId ? getEvidence(person.photoEvidenceId) : undefined;

  return (
    <>
      <Breadcrumbs trail={[['People', '/people/'], [person.name]]} />
      <div className="wrap pt-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <header className="mb-8 grid gap-7 border-b border-rule pb-8 sm:grid-cols-[200px_1fr]">
              <div className="max-w-[210px]">
                <ArchiveImage id={person.photoEvidenceId ?? person.slug} src={photo?.file?.src} alt={person.name} caption={photo?.caption} />
              </div>
              <div>
                <p className="kicker">Profile</p>
                <h1 className="page-title mt-2 !text-[40px]">
                  {person.name}
                  <DraftMark status={person.canonStatus} />
                </h1>
                <p className="mt-1.5 font-serif text-[16px] italic text-ink-muted">{person.role}</p>
                <dl className="facts mt-5 max-w-[460px]">
                  {person.facts.map(([k, v]) => (
                    <Fragment key={k}>
                      <dt>{k}</dt>
                      <dd>
                        <Txt>{v}</Txt>
                      </dd>
                    </Fragment>
                  ))}
                </dl>
              </div>
            </header>

            <section>
              <SectionTitle>Biography</SectionTitle>
              <div className="prose-archive max-w-[640px]">
                {person.biography.map((p, i) => (
                  <p key={i}>
                    <Txt>{p}</Txt>
                  </p>
                ))}
              </div>
            </section>

            <section className="mt-11">
              <SectionTitle more={{ href: '/evidence/', label: 'Evidence archive' }}>Related archive items</SectionTitle>
              <EvidenceList items={relatedEvidence(person.relatedEvidenceIds)} />
            </section>
          </div>

          <aside className="space-y-6">
            <Panel title="Family">
              <dl className="facts px-4 pb-2 pt-1">
                {person.relationships.map((r) => (
                  <Fragment key={r.label}>
                    <dt>{r.label}</dt>
                    <dd>{r.href ? <Link href={r.href}>{r.name}</Link> : <Txt>{r.name}</Txt>}</dd>
                  </Fragment>
                ))}
              </dl>
            </Panel>
            <Panel title="Other profiles">
              <ul className="py-2 text-[13px]">
                {people
                  .filter((p) => p.slug !== person.slug)
                  .map((p) => (
                    <li key={p.slug}>
                      <Link href={`/people/${p.slug}/`} className="block px-4 py-[5px] hover:bg-fog-light">
                        {p.name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </Panel>
          </aside>
        </div>
      </div>
    </>
  );
}
