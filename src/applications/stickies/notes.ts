'use client';

import * as A from '@/desktop/actions';

export const STICKY_COLORS = ['yellow', 'blue', 'green', 'pink', 'purple', 'gray'] as const;

/** Notes are user content for this session only; nothing is pre-written. */
export const newNote = (color: string = 'yellow') => A.openWindow('stickies', { color });
