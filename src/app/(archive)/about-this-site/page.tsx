import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead } from '@/components/Archive';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata: Metadata = { title: 'About This Website' };

export default function AboutThisSitePage() {
  return (
    <>
      <Breadcrumbs trail={[['About This Website']]} />
      <div className="wrap pt-8">
        <PageHead kicker="Disclosure" title="About This Website" />
        <div className="prose-archive max-w-[640px]">
          <p>
            <strong>The Maple Case is a work of fiction.</strong> This website was made for a fictional short film and is
            published so that viewers can explore it.
          </p>
          <p>
            Cristina Maple, Adrian Maple and every other person, event, organisation, document, photograph and recording
            on this website are invented. Any resemblance to real people or real cases is coincidental. This is not an
            active investigation, and no reward is offered.
          </p>
          <p>
            Nothing you type into this website is sent or stored. The site uses no cookies, accounts or tracking. Please
            do not enter real personal information.
          </p>
          <p>
            If you have information about a real missing person, contact your local police or emergency services.
          </p>
        </div>
        <p className="mt-8 text-[13px]">
          <Link href="/home/">Return to the case overview</Link>
        </p>
      </div>
    </>
  );
}
