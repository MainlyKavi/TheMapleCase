import Link from 'next/link';
import { homeVariants } from '@stage';
import { EvidenceList, Panel, SectionTitle } from '@/components/Archive';
import { CaseOverview } from '@/components/CaseOverview';
import { Txt } from '@/components/Txt';
import { publicAccount, site } from '@/content/site';
import { timeline } from '@/content/timeline';
import { formatDate } from '@/lib/format';
import { categories, evidenceHref, getEvidence, getPerson, publicEvidence, relatedEvidence } from '@/lib/registry';
import { sceneProps, type CaseFile } from '@/stage/types';

const photo = getEvidence('MC-E-004');
const letter = getEvidence('MC-E-003');
const cristinaFacts = new Map(getPerson('cristina-maple')?.facts ?? []);

const maple: CaseFile = {
  identity: { title: site.name, subtitle: site.tagline, status: site.status, reward: site.reward },
  kicker: `Missing person · Case ${site.caseReference}`,
  heading: site.subject,
  subheading: `Missing since ${formatDate(site.missingSinceDate)}`,
  photo: { evidenceId: 'MC-E-004', src: photo?.file?.src, alt: 'Cristina Maple', caption: photo?.caption },
  facts: [
    ['Status', site.status],
    ['Missing since', formatDate(site.missingSinceDate)],
    ['Last seen', cristinaFacts.get('Last seen') ?? '[TBD]'],
    ['Age when reported missing', cristinaFacts.get('Age when reported missing') ?? '[TBD]'],
    ['Reward', `Up to ${site.reward}`],
  ],
  summary: publicAccount,
  showArchive: true,
};

const milestones = timeline.filter((t) => t.canonStatus === 'confirmed' || t.canonStatus === 'current');
const featured = relatedEvidence(['MC-E-001', 'MC-E-004', 'MC-E-007', 'MC-E-008', 'MC-E-009']);

function MapleArchive({ status }: { status: string }) {
  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-11">
        <section>
          <SectionTitle more={{ href: evidenceHref('MC-E-003'), label: 'Read the full letter' }}>
            A statement from Adrian Maple
          </SectionTitle>
          <blockquote className="prose-archive border-l-[3px] border-fog pl-6 text-[16.5px]">
            {letter?.body?.slice(0, 2).map((p, i) => (
              <p key={i}>
                <Txt>{p}</Txt>
              </p>
            ))}
          </blockquote>
          <p className="mt-3 pl-6 font-serif text-[14px] italic text-ink-muted">Adrian Maple, from his letter on opening this archive</p>
        </section>

        <section>
          <SectionTitle more={{ href: '/timeline/', label: 'Full timeline' }}>Investigation milestones</SectionTitle>
          <ol className="border border-rule bg-white">
            {milestones.map((t) => (
              <li key={t.id} className="grid grid-cols-[120px_1fr] gap-4 border-t border-fog px-4 py-3 first:border-t-0 md:grid-cols-[150px_1fr]">
                <span className="font-narrow text-[15px] font-bold text-navy">
                  <Txt>{formatDate(t.date, t.dateConfidence)}</Txt>
                </span>
                <span className="text-[14px]">{t.title}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <SectionTitle more={{ href: '/evidence/', label: `Browse all ${publicEvidence.length} items` }}>
            From the evidence archive
          </SectionTitle>
          <EvidenceList items={featured} />
        </section>
      </div>

      <aside className="space-y-6">
        <section className="panel panel-navy">
          <h2 className="panel-head">Reward</h2>
          <div className="px-5 pb-6 pt-5 text-center">
            <p className="font-narrow text-[42px] font-bold leading-none tracking-[.02em] text-white">{site.reward}</p>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[#c3cfdb]">
              Adrian Maple has offered a reward of up to {site.reward} for information leading to Cristina’s return.
            </p>
            <Link className="btn mt-5" href="/submit/">
              Submit information
            </Link>
          </div>
        </section>

        <Panel title="Case reference">
          <dl className="facts px-4 pb-2 pt-1">
            <dt>Reference</dt>
            <dd>{site.caseReference}</dd>
            <dt>Opened</dt>
            <dd>{site.missingSince}</dd>
            <dt>Location</dt>
            <dd>{site.location}</dd>
            <dt>Status</dt>
            <dd>{status}</dd>
            <dt>Archive items</dt>
            <dd>{publicEvidence.length}</dd>
            <dt>Last updated</dt>
            <dd>
              <Txt>{formatDate(site.lastUpdated)}</Txt>
            </dd>
          </dl>
        </Panel>

        <Panel title="Browse the archive">
          <ul className="py-2 text-[13px]">
            {categories.map((c) => (
              <li key={c}>
                <Link href={`/evidence/?category=${encodeURIComponent(c)}`} className="flex justify-between px-4 py-[5px] hover:bg-fog-light">
                  <span>{c}</span>
                  <span className="text-ink-muted">{publicEvidence.filter((e) => e.category === c).length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="People">
          <ul className="py-2 text-[13px]">
            <li>
              <Link href="/people/cristina-maple/" className="block px-4 py-[5px] hover:bg-fog-light">
                Cristina Maple
              </Link>
            </li>
            <li>
              <Link href="/people/adrian-maple/" className="block px-4 py-[5px] hover:bg-fog-light">
                Adrian Maple
              </Link>
            </li>
          </ul>
        </Panel>
      </aside>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="wrap pt-8">
      {homeVariants(maple).map((v, i) => (
        <div key={i} {...sceneProps(v.scenes)}>
          <CaseOverview file={v.value} />
          {/* A case without an archive shows its overview only (approved minimum). */}
          {v.value.showArchive && <MapleArchive status={v.value.identity.status} />}
        </div>
      ))}
    </div>
  );
}
