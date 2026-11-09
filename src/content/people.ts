import type { Person } from './types';

// Profiles were written for Adrian's archive before he disappeared, so they stay in the
// present tense. Only canon-supported people appear here.

export const people: Person[] = [
  {
    slug: 'cristina-maple',
    name: 'Cristina Maple',
    role: 'Missing since 2011',
    photoEvidenceId: 'MC-E-004',
    facts: [
      ['Status', 'Missing'],
      ['Reported missing', '2011 [TBD: exact date]'],
      ['Last seen', '[TBD]'],
      ['Age when reported missing', '[TBD]'],
      ['Height', '[TBD]'],
      ['Hair', '[TBD]'],
      ['Eyes', '[TBD]'],
    ],
    relationships: [
      { label: 'Father', name: 'Adrian Maple', href: '/people/adrian-maple/' },
      { label: 'Mother', name: '[TBD: name]' },
    ],
    biography: [
      'Cristina Maple was reported missing by her father, Adrian Maple, in 2011.',
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
      ['Company', '[TBD]'],
      ['Relationship to case', 'Father; reported Cristina missing'],
    ],
    relationships: [
      { label: 'Daughter', name: 'Cristina Maple', href: '/people/cristina-maple/' },
      { label: 'Wife', name: '[TBD: name]' },
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
