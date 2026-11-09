import Link from 'next/link';
import { caseVariants } from '@stage';
import { site } from '@/content/site';
import { formatDate } from '@/lib/format';
import { sceneProps } from '@/stage/types';
import { SiteNav } from './SiteNav';
import { Txt } from './Txt';

export function SiteHeader() {
  const variants = caseVariants({ title: site.name, subtitle: site.tagline, status: site.status, reward: site.reward });
  return (
    <header className="site-header">
      <div className="utility-bar">
        <div className="wrap flex justify-between gap-4 py-[5px]">
          <span>
            Case reference {site.caseReference}
            <span className="mx-2 opacity-40">|</span>
            Last updated: <Txt>{formatDate(site.lastUpdated)}</Txt>
          </span>
          <span className="hidden sm:inline">
            <Link href="/site-map/">Site map</Link>
            <span className="mx-2 opacity-40">|</span>
            <Link href="/submit/">Submit information</Link>
          </span>
        </div>
      </div>
      {variants.map((v, i) => (
        <div key={i} {...sceneProps(v.scenes)}>
          <div className="wrap flex flex-col gap-5 pb-6 pt-8 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href="/home/" className="wordmark">
                {v.value.title}
              </Link>
              <p className="tagline mt-2.5">
                <Txt>{v.value.subtitle}</Txt>
              </p>
            </div>
            <div className="md:text-right">
              <div className="status-label">Case status</div>
              <div className="status-value mt-2">{v.value.status}</div>
              {v.value.reward && (
                <div className="mt-2.5 text-[12px] text-steel-light">
                  Reward offered
                  <strong className="ml-2 font-narrow text-[16px] tracking-[.05em] text-white">{v.value.reward}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      <SiteNav />
    </header>
  );
}
