// Staged releases. Content tagged with a later stage than PUBLIC_RELEASE is removed on the
// server before anything is serialised, so it never reaches the browser. Material that is a
// spoiler belongs in private/ until it is approved for release; this filter is a second line.

export const RELEASE_STAGES = ['initial', 'post-premiere'] as const;
export type ReleaseStage = (typeof RELEASE_STAGES)[number];

/** The stage the public build ships. Change only when a release is approved. */
export const PUBLIC_RELEASE: ReleaseStage = 'initial';

export function isReleased(stage: string | undefined, current: string = PUBLIC_RELEASE): boolean {
  if (!stage) return true;
  const at = RELEASE_STAGES.indexOf(stage as ReleaseStage);
  const now = RELEASE_STAGES.indexOf(current as ReleaseStage);
  // Unknown stages are treated as unreleased.
  return at >= 0 && now >= 0 && at <= now;
}
