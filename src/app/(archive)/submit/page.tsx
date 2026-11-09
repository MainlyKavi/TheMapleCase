import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead, Panel } from '@/components/Archive';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SubmitForm } from '@/components/SubmitForm';
import { site } from '@/content/site';
import { publicEvidence } from '@/lib/registry';

export const metadata: Metadata = { title: 'Submit a Solution' };

const items = publicEvidence.map((e) => ({ id: e.id, title: e.title }));

export default function SubmitPage() {
  return (
    <>
      <Breadcrumbs trail={[['Submit a Solution']]} />
      <div className="wrap pt-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <PageHead kicker={`Case ${site.caseReference}`} title="Submit a Solution">
              If you believe you know what happened to Cristina, describe your conclusion below. Be as specific as you
              can, and refer to items in the{' '}
              <Link href="/evidence/">evidence archive</Link> where possible.
            </PageHead>
            <SubmitForm items={items} />
          </div>

          <aside className="space-y-6 lg:pt-2">
            <Panel title="Before you submit">
              <ul className="list-disc space-y-2 py-3.5 pl-8 pr-4 text-[12.5px] leading-relaxed text-ink-muted">
                <li>Describe what you believe happened, and why.</li>
                <li>Refer to archive items by their reference, for example MC-E-004.</li>
                <li>Do not include personal information about yourself or anyone else.</li>
                <li>This form is not a reward claim.</li>
              </ul>
            </Panel>
            <section className="fiction-only border border-dashed border-rule-dark px-4 py-3.5 text-[12px] leading-relaxed text-ink-muted">
              <p className="font-bold text-ink">About this form</p>
              <p className="mt-1">
                This website is part of a work of fiction. Nothing you type here is sent anywhere or stored, and no
                reward exists. <Link href="/about-this-site/">About this website</Link>
              </p>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
