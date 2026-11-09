'use client';

import { useEffect, useState } from 'react';
import * as A from '@/desktop/actions';
import type { AppWindowProps } from '../registry';
import { useCommands } from '../useCommands';
import { STICKY_COLORS } from './notes';

/** A sticky note. Notes are the user's own, kept for this session only. */
export default function Stickies({ win, focused }: AppWindowProps) {
  const [text, setText] = useState(String(win.props.text ?? ''));
  useEffect(() => {
    A.setWindowTitle(win.id, text.split('\n')[0].slice(0, 40) || 'Untitled');
  }, [win.id, text]);
  useCommands(
    win.id,
    Object.fromEntries(STICKY_COLORS.map((c) => [`color:${c}`, () => A.setWindowProps(win.id, { color: c })])),
  );
  return (
    <textarea
      className="scroll selectable"
      aria-label="Note"
      autoFocus={focused}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => A.setWindowProps(win.id, { text })}
      style={{ flex: 1, width: '100%', height: '100%', border: 0, resize: 'none', padding: '4px 8px', background: 'transparent', fontFamily: '"Marker Felt", Chalkboard, var(--ui)', fontSize: 14, lineHeight: 1.3 }}
    />
  );
}
