// The contract between the site and its "stage". The public build uses src/stage (static,
// always UNSOLVED). The film build swaps in private/stage through the @stage alias.

export interface CaseIdentity {
  title: string;
  subtitle: string;
  status: string;
  reward?: string;
}

export interface CaseFile {
  identity: CaseIdentity;
  kicker: string;
  heading: string;
  subheading: string;
  photo: { evidenceId: string; src?: string; alt: string; caption?: string };
  facts: [string, string][];
  summary: string[];
  /** false = the case has no archive yet (renders an empty archive notice). */
  showArchive: boolean;
}

/** scenes: space-separated scene numbers where this variant is visible; null = always. */
export interface Variant<T> {
  scenes: string | null;
  value: T;
}

export interface Submission {
  name: string;
  conclusion: string;
  evidenceIds: string[];
}

export interface SubmitResponseProps {
  submission: Submission;
  /** true when the submission was restored rather than just submitted. */
  staged: boolean;
}

export interface MediaSource {
  src?: string;
  startAt?: number;
}

/** Props for a variant wrapper. Emits nothing in the public build (scenes is always null). */
export const sceneProps = (scenes: string | null) => (scenes ? { 'data-scenes': scenes } : {});
