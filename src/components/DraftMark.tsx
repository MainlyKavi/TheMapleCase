import type { CanonStatus } from '@/content/types';

// Visible only on the public dev server (npm run dev). Never in builds or the film build.
// Server components only: MAPLE_BUILD is not exposed to the client.
const SHOW = process.env.NODE_ENV === 'development' && process.env.MAPLE_BUILD !== 'film';

export function DraftMark({ status }: { status: CanonStatus }) {
  if (!SHOW || status === 'confirmed') return null;
  return (
    <span className="draft-mark ml-2" title="Production marker, dev server only">
      {status}
    </span>
  );
}
