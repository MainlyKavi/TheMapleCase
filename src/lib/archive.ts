import type { EvidenceCategory, EvidenceItem, MediaType, Verification } from '../content/types';
import { dateKey, formatDate } from './format.ts';

/** The serialisable slice of an evidence record that the client-side archive needs. */
export interface EvidenceSummary {
  id: string;
  title: string;
  category: EvidenceCategory;
  description: string;
  date: string;
  displayDate: string;
  mediaType: MediaType;
  filename: string;
  source: string;
  verificationStatus: Verification;
  thumb: string | null;
}

export const summarize = (e: EvidenceItem): EvidenceSummary => ({
  id: e.id,
  title: e.title,
  category: e.category,
  description: e.description,
  date: e.date,
  displayDate: formatDate(e.date, e.dateConfidence),
  mediaType: e.mediaType,
  filename: e.filename,
  source: e.source,
  verificationStatus: e.verificationStatus,
  thumb: e.mediaType === 'image' ? (e.file?.src ?? null) : (e.file?.poster ?? null),
});

export type SortKey = 'id' | 'date' | 'title' | 'category';

export interface ArchiveQuery {
  q: string;
  category: string;
  type: string;
  sort: SortKey;
  dir: 'asc' | 'desc';
}

const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** Every search term must appear somewhere in the record (id, text, filename, dates…). */
export function matches(item: EvidenceSummary, q: string): boolean {
  const terms = normalize(q).split(' ').filter(Boolean);
  if (!terms.length) return true;
  const hay = normalize(
    [item.id, item.title, item.description, item.category, item.filename, item.source,
      item.mediaType, item.date, item.displayDate, item.verificationStatus].join(' '),
  );
  return terms.every((t) => hay.includes(t));
}

export function queryArchive(items: EvidenceSummary[], query: ArchiveQuery): EvidenceSummary[] {
  const found = items.filter(
    (i) =>
      (!query.category || i.category === query.category) &&
      (!query.type || i.mediaType === query.type) &&
      matches(i, query.q),
  );
  const key = (i: EvidenceSummary) =>
    query.sort === 'date' ? dateKey(i.date) : query.sort === 'title' ? i.title : query.sort === 'category' ? i.category : i.id;
  const sorted = found.sort((a, b) => key(a).localeCompare(key(b)) || a.id.localeCompare(b.id));
  return query.dir === 'desc' ? sorted.reverse() : sorted;
}

export const evidenceHref = (id: string) => `/evidence/${id.toLowerCase()}/`;

export const MEDIA_LABEL: Record<MediaType, string> = {
  document: 'Document',
  image: 'Photograph',
  video: 'Video',
  audio: 'Audio',
};
