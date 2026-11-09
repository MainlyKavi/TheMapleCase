// FILM BUILD ONLY (*.film.tsx is a route only when MAPLE_BUILD=film).
import type { Metadata } from 'next';
import { ProductionConsole } from '@private/stage/Console';
import { publicEvidence } from '@/lib/registry';

export const metadata: Metadata = { title: 'Production console', robots: { index: false } };

const slots = publicEvidence
  .filter((e) => e.mediaType !== 'document')
  .map(({ id, title, mediaType, filename }) => ({ id, title, mediaType, filename }));

export default function ProductionPage() {
  return <ProductionConsole slots={[...slots, { id: 'KC-E-001', title: 'Kavi case photograph', mediaType: 'image', filename: '[private]' }]} />;
}
