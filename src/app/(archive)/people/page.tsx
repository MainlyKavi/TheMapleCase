import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead } from '@/components/Archive';
import { ArchiveImage } from '@/components/ArchiveImage';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DraftMark } from '@/components/DraftMark';
import { Txt } from '@/components/Txt';
import { people } from '@/content/people';
import { getEvidence } from '@/lib/registry';

export const metadata: Metadata = { title: 'People' };

export default function PeoplePage() {
  return (
    <>
      <Breadcrumbs trail={[['People']]} />
      <div className="wrap pt-8">
        <PageHead kicker="The case" title="People">
          The people at the centre of this case. Profiles are based on information provided by the family.
        </PageHead>
        <ul className="space-y-6">
          {people.map((p) => {
            const photo = p.photoEvidenceId ? getEvidence(p.photoEvidenceId) : undefined;
            return (
              <li key={p.slug} className="panel grid gap-6 p-5 sm:grid-cols-[150px_1fr] md:p-6">
                <div className="max-w-[160px]">
                  <ArchiveImage id={p.photoEvidenceId ?? p.slug} src={photo?.file?.src} alt={p.name} />
                </div>
                <div>
                  <h2 className="text-[28px]">
                    <Link href={`/people/${p.slug}/`} className="!text-navy">
                      {p.name}
                    </Link>
                    <DraftMark status={p.canonStatus} />
                  </h2>
                  <p className="kicker mt-1.5">{p.role}</p>
                  <p className="prose-archive mt-3 max-w-[640px] text-[15px]">
                    <Txt>{p.biography[0]}</Txt>
                  </p>
                  <Link href={`/people/${p.slug}/`} className="btn mt-4">
                    View profile
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
