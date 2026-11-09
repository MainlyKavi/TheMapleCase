// Site-wide facts. CONFIRMED values are canon; everything else is marked [TBD] or proposed.
export const site = {
  name: 'The Maple Case', // CONFIRMED
  status: 'Unsolved', // CONFIRMED (public state)
  subject: 'Cristina Maple', // CONFIRMED
  tagline: 'The disappearance of Cristina Maple',
  reward: '$10,000,000', // CONFIRMED
  missingSince: '2011', // CONFIRMED (year only)
  caseReference: 'MC-2011', // proposed: the archive's own reference, not a police number
  archiveLaunched: '[TBD: date Adrian launched the archive (undecided)]',
  lastUpdated: '[TBD: date of the final archive update]',
  copyrightYears: '[TBD: copyright years, e.g. 2012–2013]',
  owner: 'The Maple Family', // proposed
  designCredit: '', // optional period credit, e.g. "Site design: …" (proposed; left empty)
};

/** Adrian's public account, shown on the home page. Proposed copy, canon-safe. */
export const publicAccount = [
  'In 2011, Adrian Maple reported that his daughter, Cristina, had disappeared. [TBD: circumstances, date and place she was last seen.]',
  'The disappearance drew wide public attention, and Adrian offered a reward of up to $10,000,000 for information leading to her return. No confirmed trace of Cristina has ever been found.',
  'When press coverage declined, Adrian established this archive so that every record of the case would remain in one place and in public view.',
];
