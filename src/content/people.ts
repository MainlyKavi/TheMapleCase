import type { Person } from './types';

// Profiles were written for Adrian's archive before he disappeared, so they stay in the
// present tense. Only canon-supported people appear here.

export const people: Person[] = [
  {
    slug: 'cristina-maple',
    name: 'Cristina Maple',
    role: 'Missing since February 24, 2011',
    photoEvidenceId: 'MC-E-004',
    facts: [
      ['Status', 'Missing'],
      ['Missing since', 'February 24, 2011'],
      ['Last seen', '[TBD]'],
      // Resolved 2026-11-09: born 1996, so 14 on February 24, 2011 (docs/CANON.md).
      ['Age when reported missing', '14'],
      ['Date of birth', 'May 15, 1996'],
      ['Height', '[TBD]'],
      ['Hair', 'Dark brown, nearly black; long wolf cut'],
      ['Eyes', 'Brown'],
    ],
    relationships: [
      { label: 'Father', name: 'Adrian Maple', href: '/people/adrian-maple/' },
      { label: 'Mother', name: '[TBD: how the archive presents Cristina’s mother]' },
    ],
    biography: [
      'Cristina Maple has been missing since February 24, 2011. Her father, Adrian Maple, woke one morning to find that she was gone, with no evidence that she had left the house.',
      'The details of her life presented in this archive are as provided by the family. [TBD: approved biography]',
    ],
    relatedEvidenceIds: ['MC-E-004', 'MC-E-006', 'MC-E-001', 'MC-E-007'],
    canonStatus: 'proposed',
  },
  {
    slug: 'adrian-maple',
    name: 'Adrian Maple',
    role: 'Father of Cristina Maple',
    photoEvidenceId: 'MC-E-005',
    facts: [
      ['Occupation', 'Finance executive'],
      ['Company', 'Seraphim Financial Group'],
      ['Relationship to case', 'Father; reported Cristina missing'],
    ],
    relationships: [
      { label: 'Daughter', name: 'Cristina Maple', href: '/people/cristina-maple/' },
      { label: 'Wife', name: 'Catherine Maple' },
    ],
    biography: [
      'Adrian Maple is a finance executive and the father of Cristina Maple.',
      'Following Cristina’s disappearance in 2011, he offered a reward of up to $10,000,000 for information leading to her return. When public attention declined, he established this archive to keep the investigation in view.',
      'He continues to review every submission made through this site.',
    ],
    relatedEvidenceIds: ['MC-E-003', 'MC-E-008', 'MC-E-010', 'MC-E-005', 'MC-E-002'],
    canonStatus: 'proposed',
  },
];
