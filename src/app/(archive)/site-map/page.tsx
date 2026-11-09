import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead } from '@/components/Archive';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { people } from '@/content/people';
import { evidenceHref, publicEvidence } from '@/lib/registry';

export const metadata: Metadata = { title: 'Site Map' };

const PAGES = [
  ['/home/', 'Home: case overview'],
  ['/timeline/', 'Case timeline'],
  ['/people/', 'People'],
  ['/evidence/', 'Evidence archive'],
  ['/media/', 'Media'],
  ['/press/', 'Press archive'],
  ['/submit/', 'Submit a solution'],
] as const;

export default function SiteMapPage() {
  return (
    <>
      <Breadcrumbs trail={[['Site Map']]} />
      <div className="wrap pt-8">
        <PageHead kicker="Navigation" title="Site Map" />
        <div className="grid gap-10 text-[13.5px] md:grid-cols-3">
          <section>
            <h2 className="section-title !text-[17px]">Pages</h2>
            <ul className="space-y-1.5">
              {PAGES.map(([href, label]) => (
                <li key={href}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="section-title !text-[17px]">People</h2>
            <ul className="space-y-1.5">
              {people.map((p) => (
                <li key={p.slug}>
                  <Link href={`/people/${p.slug}/`}>{p.name}</Link>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="section-title !text-[17px]">Archive items</h2>
            <ul className="space-y-1.5">
              {publicEvidence.map((e) => (
                <li key={e.id}>
                  <span className="file-id mr-2">{e.id}</span>
                  <Link href={evidenceHref(e.id)}>{e.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
