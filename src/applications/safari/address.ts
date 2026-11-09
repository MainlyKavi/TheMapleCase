// Safari address handling, pure (node-testable). Safari only opens the archive routes of this
// site; anything else is refused, including the desktop itself and film-only routes.

import { site } from '../../content/site.ts';

export const HOST = site.host;

export const ARCHIVE_PATH = /^\/(home|timeline|people|evidence|media|press|submit|site-map|about-this-site)(\/[a-z0-9-]*)*\/?(\?[^#]*)?(#.*)?$/i;

/** Archive path → what the address bar shows. */
export const toAddress = (path: string) => `http://${HOST}${path.replace(/^\/home\/?/, '/')}`;

/** Address bar text → archive path, or null when Safari can't open it. */
export function fromAddress(input: string): string | null {
  let t = input.trim();
  if (!t) return null;
  t = t.replace(/^https?:\/\//i, '');
  const bare = HOST.replace(/^www\./, '').replace(/\./g, '\\.');
  const hostRe = new RegExp(`^(www\\.)?${bare}(?=/|$|\\?)`, 'i');
  let path: string;
  if (hostRe.test(t)) path = t.replace(hostRe, '') || '/';
  else if (t.startsWith('/')) path = t;
  else return null;
  if (path === '/' || path === '') path = '/home/';
  if (!/[?#]/.test(path) && !path.endsWith('/')) path += '/';
  return ARCHIVE_PATH.test(path) ? path : null;
}
