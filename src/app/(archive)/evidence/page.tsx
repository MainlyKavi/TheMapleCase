import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHead } from '@/components/Archive';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EvidenceArchive } from '@/components/EvidenceArchive';
import { summarize } from '@/lib/archive';
import { publicEvidence } from '@/lib/registry';

export const metadata: Metadata = { title: 'Evidence Archive' };

const items = publicEvidence.map(summarize);

export default function EvidencePage() {
  return (
    <>
      <Breadcrumbs trail={[['Evidence Archive']]} />
      <div className="wrap pt-8">
        <PageHead kicker={`${items.length} items`} title="Evidence Archive">
          Notices, photographs, recordings and documents gathered in connection with Cristina’s disappearance. Each item
          records where it came from and how it reached this archive.
        </PageHead>
        <Suspense fallback={<p className="text-[13px] text-ink-muted">Loading the archive…</p>}>
          <EvidenceArchive items={items} />
        </Suspense>
      </div>
    </>
  );
}
