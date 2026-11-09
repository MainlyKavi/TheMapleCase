// PUBLIC desktop stage. Replaced by private/stage/desktop.tsx in the film build through the
// @stage/desktop alias (next.config.ts). Keep the exports identical in both files.
// Server-safe: plain data only (no hooks). The director hook lives in @stage/client.

import type { DesktopStage } from './desktop-types';

export const desktopStage: DesktopStage = {
  // Neutral account: whose computer this is in the story is TBD (docs/CANON.md).
  account: { user: 'user', fullName: 'User', host: 'Macintosh' },
  clock: { time: 'system', date: 'system' },
  // No approved correspondence exists yet; Mail starts empty.
  mail: [],
  nodes: [],
  events: [],
  presets: [],
};

