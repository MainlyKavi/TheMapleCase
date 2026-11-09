import type { PressItem } from './types';

// SAMPLE press records. Outlets, dates and headlines are proposals awaiting approval.
// Coverage of Adrian's own disappearance is intentionally absent: nobody updated the
// archive after he vanished (see docs/PLAN.md, question 4).

export const press: PressItem[] = [
  {
    id: 'P-01',
    date: '2011',
    dateConfidence: 'year',
    outlet: '[TBD: outlet]',
    headline: 'Finance executive’s daughter reported missing',
    category: 'Initial reports',
    format: 'Print',
    summary: 'Early report on Cristina’s disappearance and the family’s appeal for information.',
    relatedEvidenceIds: ['MC-E-001'],
    canonStatus: 'proposed',
  },
  {
    id: 'P-02',
    date: '[TBD: presumably 2011]',
    dateConfidence: 'unknown',
    outlet: '[TBD: outlet]',
    headline: 'Father offers $10 million reward for information on missing daughter',
    category: 'Reward announcement',
    format: 'Online',
    summary: 'Report on the reward announced by Adrian Maple and the public response to it.',
    relatedEvidenceIds: ['MC-E-002'],
    canonStatus: 'proposed',
  },
  {
    id: 'P-03',
    date: '[TBD]',
    dateConfidence: 'unknown',
    outlet: '[TBD: broadcaster]',
    headline: 'Adrian Maple appeals for information',
    category: 'Search updates',
    format: 'Television',
    summary: 'Broadcast report including Adrian Maple’s appeal to the public. A copy is held in this archive.',
    relatedEvidenceIds: ['MC-E-011'],
    canonStatus: 'proposed',
  },
  {
    id: 'P-04',
    date: '[TBD]',
    dateConfidence: 'unknown',
    outlet: '[TBD: outlet]',
    headline: 'The Maple case: what we still don’t know',
    category: 'Public speculation',
    format: 'Online',
    summary: 'Feature examining the unanswered questions and public speculation surrounding the case. [TBD: full text]',
    relatedEvidenceIds: [],
    canonStatus: 'proposed',
  },
  {
    id: 'P-05',
    date: '[TBD: archive launch date]',
    dateConfidence: 'unknown',
    outlet: '[TBD: outlet]',
    headline: 'Father of Cristina Maple launches online case archive',
    category: 'Archive launch',
    format: 'Online',
    summary: 'Short report on the launch of this website.',
    relatedEvidenceIds: ['MC-E-003'],
    canonStatus: 'proposed',
  },
];
