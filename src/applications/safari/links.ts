'use client';

import * as A from '@/desktop/actions';
import { wm } from '@/desktop/store';

/** Bookmarks bar. Only the archive: Safari here is scoped to the Maple Case website. */
export const bookmarks = [
  { label: 'The Maple Case', url: '/home/' },
  { label: 'Evidence Archive', url: '/evidence/' },
  { label: 'Case Timeline', url: '/timeline/' },
  { label: 'People', url: '/people/' },
  { label: 'Media', url: '/media/' },
  { label: 'Press', url: '/press/' },
];

/** Opens an archive path in the front Safari window (or a new one). */
export function openUrl(url: string, newWindow = false) {
  const s = wm.get();
  const w = [...s.windows].filter((x) => x.appId === 'safari' && !x.props.panel).sort((a, b) => b.z - a.z)[0];
  if (w && !newWindow) {
    A.setWindowProps(w.id, { url, nav: Date.now() });
    A.restoreWindow(w.id);
  } else if (s.running.includes('safari') || newWindow) A.openWindow('safari', { url });
  else A.launchApp('safari', { url });
}
