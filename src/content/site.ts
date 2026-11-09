// Site-wide facts. CONFIRMED values are canon; everything else is marked [TBD] or proposed.
// Canon reconciliation: docs/CANON.md.
export const site = {
  name: 'The Maple Case', // CONFIRMED
  status: 'Unsolved', // CONFIRMED (public state)
  subject: 'Cristina Maple', // CONFIRMED
  tagline: 'The disappearance of Cristina Maple',
  reward: '$10,000,000', // CONFIRMED
  missingSince: '2011', // CONFIRMED (year; exact date below)
  missingSinceDate: '2011-02-24', // CONFIRMED: February 24, 2011
  location: 'San Francisco, California', // CONFIRMED: main setting (exact addresses TBD)
  caseReference: 'MC-2011', // proposed: the archive's own reference, not a police number
  archiveLaunched: '2011-10', // CONFIRMED: October 2011
  lastUpdated: '2012-09-16', // CONFIRMED: last normal update, September 16, 2012
  copyrightYears: '2011–2012', // derived from launch (2011) and last update (2012)
  creator: 'Adrian Maple', // CONFIRMED
  /** Fictional address shown in the simulated Safari address bar. PROPOSED, not canon. */
  host: 'www.themaplecase.com',
  owner: 'The Maple Family', // proposed
  designCredit: '', // optional period credit, e.g. "Site design: …" (proposed; left empty)
};

/** Adrian's public account, shown on the home page. Proposed copy, canon-safe. */
export const publicAccount = [
  'Cristina Maple has been missing since February 24, 2011. Her father, Adrian Maple, woke one morning to discover that she was gone. There was no evidence that she had left the house. [TBD: where and when she was last seen]',
  'The disappearance drew wide public attention, and Adrian offered a reward of up to $10,000,000 for information leading to her return. No confirmed trace of Cristina has ever been found.',
  'When press coverage declined, Adrian established this archive so that every record of the case would remain in one place and in public view.',
];
