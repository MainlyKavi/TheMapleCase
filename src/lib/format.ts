import type { DateConfidence } from '../content/types';

export const TBD_PATTERN = /\[TBD[^\]]*\]/g;

export const isTbd = (value: string) => value.trimStart().startsWith('[TBD');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "2011-06-14" → "June 14, 2011"; "2011" → "2011"; TBD values pass through unchanged. */
export function formatDate(date: string, confidence?: DateConfidence): string {
  if (isTbd(date)) return date;
  const [y, m, d] = date.split('-');
  const text = d ? `${MONTHS[+m - 1]} ${+d}, ${y}` : m ? `${MONTHS[+m - 1]} ${y}` : y;
  return confidence === 'approximate' ? `c. ${text}` : text;
}

/** Sortable key; unknown dates sort last. */
export const dateKey = (date: string) => (isTbd(date) ? '9999' : date);

export const year = (date: string) => (isTbd(date) ? null : date.slice(0, 4));
