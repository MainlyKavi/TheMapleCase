import { evidence } from '@/content/evidence';
import { people } from '@/content/people';
import { press } from '@/content/press';
import type { EvidenceItem } from '@/content/types';

export { evidenceHref, MEDIA_LABEL } from './archive';

/** Only publicly visible records ever reach a page. */
export const publicEvidence = evidence.filter((e) => e.publicVisibility);

export const getEvidence = (id: string) =>
  publicEvidence.find((e) => e.id.toLowerCase() === id.toLowerCase());

export const relatedEvidence = (ids: string[]) =>
  ids.map(getEvidence).filter((e): e is EvidenceItem => Boolean(e));

export const getPerson = (slug: string) => people.find((p) => p.slug === slug);

export const getPress = (id: string) => press.find((p) => p.id === id);

export const categories = [...new Set(publicEvidence.map((e) => e.category))];

export const DATE_ACCURACY = {
  exact: 'Exact',
  month: 'Month only',
  approximate: 'Approximate',
  year: 'Year only',
  unknown: 'Not recorded',
} as const;
