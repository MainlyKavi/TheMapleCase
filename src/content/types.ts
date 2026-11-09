// Content schema for the public archive. Records here must never contain film spoilers;
// production notes live in private/notes. Unknown values use the inline form "[TBD: note]".

/** Production status of a record (shown only as dev draft marks, never in builds). */
export type CanonStatus = 'confirmed' | 'current' | 'proposed' | 'tbd';

export type EvidenceCategory =
  | 'Notices & Statements'
  | 'Photographs'
  | 'Recordings'
  | 'Personal Documents'
  | 'Press & Media'
  | 'Archive Updates';

export type MediaType = 'document' | 'image' | 'video' | 'audio';

/** exact = full date known; approximate = shown as "c."; year = year only; unknown = TBD. */
export type DateConfidence = 'exact' | 'approximate' | 'year' | 'unknown';

export type Verification = 'Verified' | 'Provided by family' | 'Unverified' | 'Pending review';

export type SourceType = 'Family' | 'Press' | 'Public record' | 'Archive' | 'Submitted';

/** Present only once the real asset exists under /public. */
export interface MediaFile {
  src: string;
  poster?: string;
  width?: number;
  height?: number;
}

export interface EvidenceItem {
  id: string;
  title: string;
  category: EvidenceCategory;
  description: string;
  /** "2011", "2011-06", "2011-06-14" or "[TBD: …]" */
  date: string;
  dateConfidence: DateConfidence;
  source: string;
  sourceType: SourceType;
  verificationStatus: Verification;
  provenance: string[];
  filename: string;
  mediaType: MediaType;
  fileSize: string;
  originalFormat: string;
  file?: MediaFile;
  caption?: string;
  /** Transcription paragraphs (documents) or transcript (recordings). */
  body?: string[];
  addedToArchive: string;
  relatedEvidenceIds: string[];
  publicVisibility: boolean;
  canonStatus: CanonStatus;
}

export interface Person {
  slug: string;
  name: string;
  role: string;
  photoEvidenceId?: string;
  facts: [string, string][];
  relationships: { label: string; name: string; href?: string }[];
  biography: string[];
  relatedEvidenceIds: string[];
  canonStatus: CanonStatus;
}

export interface TimelineEvent {
  id: string;
  date: string;
  dateConfidence: DateConfidence;
  title: string;
  description: string;
  relatedEvidenceIds: string[];
  relatedPressIds: string[];
  canonStatus: CanonStatus;
}

export type PressCategory =
  | 'Initial reports'
  | 'Reward announcement'
  | 'Search updates'
  | 'Public speculation'
  | 'Archive launch';

export interface PressItem {
  id: string;
  date: string;
  dateConfidence: DateConfidence;
  outlet: string;
  headline: string;
  category: PressCategory;
  format: 'Print' | 'Online' | 'Television' | 'Radio';
  summary: string;
  relatedEvidenceIds: string[];
  canonStatus: CanonStatus;
}
