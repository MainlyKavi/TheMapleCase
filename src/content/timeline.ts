import type { TimelineEvent } from './types';

// The archive's own chronology, as Adrian kept it. It ends at the last update: nothing
// after Adrian's disappearance was ever added. Confirmed dates: see docs/CANON.md.

export const timeline: TimelineEvent[] = [
  {
    id: 'T-01',
    date: '2011-02-24',
    dateConfidence: 'exact',
    title: 'Cristina Maple goes missing',
    description:
      'Adrian Maple wakes one morning to discover that his daughter, Cristina, is missing. There is no evidence that she left the house. [TBD: place she was last seen]',
    relatedEvidenceIds: ['MC-E-001', 'MC-E-004'],
    relatedPressIds: ['P-01'],
    canonStatus: 'confirmed',
  },
  {
    id: 'T-02',
    date: '[TBD: presumably 2011]',
    dateConfidence: 'unknown',
    title: 'A reward of up to $10,000,000 is announced',
    description:
      'Adrian Maple offers a reward of up to $10,000,000 for information leading to Cristina’s return. The case receives wide public attention.',
    relatedEvidenceIds: ['MC-E-002', 'MC-E-011'],
    relatedPressIds: ['P-02'],
    canonStatus: 'confirmed',
  },
  {
    id: 'T-03',
    date: '[TBD]',
    dateConfidence: 'unknown',
    title: 'Public appeals and an information line',
    description:
      'The family appeals for information through the press and sets up an information line for the public.',
    relatedEvidenceIds: ['MC-E-008', 'MC-E-009'],
    relatedPressIds: ['P-03'],
    canonStatus: 'proposed',
  },
  {
    id: 'T-04',
    date: '[TBD]',
    dateConfidence: 'unknown',
    title: 'Press coverage declines',
    description: 'With no confirmed sightings, coverage of the case becomes infrequent.',
    relatedEvidenceIds: [],
    relatedPressIds: ['P-04'],
    canonStatus: 'confirmed',
  },
  {
    id: 'T-05',
    date: '2011-10',
    dateConfidence: 'month',
    title: 'The Maple Case archive is launched',
    description:
      'Adrian Maple establishes this website to keep the records of the case together and in public view.',
    relatedEvidenceIds: ['MC-E-003'],
    relatedPressIds: ['P-05'],
    canonStatus: 'confirmed',
  },
  {
    id: 'T-06',
    date: '2012-09-16',
    dateConfidence: 'exact',
    title: 'Archive update: the search to date',
    description: 'A summary of the search is posted to the archive.',
    relatedEvidenceIds: ['MC-E-012'],
    relatedPressIds: [],
    canonStatus: 'current',
  },
];
