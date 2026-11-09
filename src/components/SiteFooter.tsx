import Link from 'next/link';
import { site } from '@/content/site';
import { publicEvidence } from '@/lib/registry';
import { Txt } from './Txt';

const LINKS = [
  ['/timeline/', 'Case timeline'],
  ['/people/', 'People'],
  ['/evidence/', 'Evidence archive'],
  ['/media/', 'Media'],
  ['/press/', 'Press archive'],
  ['/submit/', 'Submit a solution'],
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer mt-16">
      <div className="wrap grid gap-8 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <section>
          <h2>{site.name}</h2>
          <p className="mt-3 max-w-[360px] leading-relaxed">
            This archive was established by Adrian Maple to keep the investigation into the disappearance of his
            daughter, Cristina, in public view.
          </p>
        </section>
        <section>
          <h2>The archive</h2>
          <ul className="mt-3 space-y-1.5">
            {LINKS.map(([href, label]) => (
              <li key={href}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Case reference</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5">
            <dt>Reference</dt>
            <dd className="text-[#dfe6ed]">{site.caseReference}</dd>
            <dt>Opened</dt>
            <dd className="text-[#dfe6ed]">{site.missingSince}</dd>
            <dt>Reward</dt>
            <dd className="text-[#dfe6ed]">{site.reward}</dd>
            <dt>Archive items</dt>
            <dd className="text-[#dfe6ed]">{publicEvidence.length}</dd>
          </dl>
        </section>
      </div>
      <div className="footer-base">
        <div className="wrap flex flex-col gap-1.5 py-3.5 md:flex-row md:justify-between">
          <span>
            © <Txt>{site.copyrightYears}</Txt> {site.owner}. All rights reserved.
            {site.designCredit && <span className="ml-3">{site.designCredit}</span>}
          </span>
          <span>
            <Link href="/site-map/">Site map</Link>
            <span className="fiction-only">
              <span className="mx-2 opacity-40">|</span>A work of fiction.{' '}
              <Link href="/about-this-site/">About this website</Link>
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
