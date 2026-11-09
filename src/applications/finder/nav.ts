'use client';

import * as A from '@/desktop/actions';
import { wm } from '@/desktop/store';

/** Opens a new Finder window at a folder. */
export const openFinder = (dirId: string) => A.openWindow('finder', { dir: dirId });

/** Go menu: navigates the focused Finder window, or opens one. */
export function goTo(dirId: string) {
  const s = wm.get();
  const w = s.windows.find((x) => x.id === s.focused);
  if (w && w.appId === 'finder' && !w.props.panel) A.setWindowProps(w.id, { dir: dirId });
  else openFinder(dirId);
}
