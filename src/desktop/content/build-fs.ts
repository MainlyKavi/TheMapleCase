// SERVER ONLY (imported by src/app/page.tsx). Builds the startup volume from the public content
// records. Only the resulting snapshot is serialised to the browser, after release filtering.

import { evidence } from '../../content/evidence.ts';
import type { EvidenceItem } from '../../content/types.ts';
import { isReleased } from '../../investigation/release.ts';
import type { FileData, FsSnapshot, VDir, VFile, VNode } from '../model/vfs.ts';

const TBD = /^\s*\[TBD/;

/** Application bundles and where they live. */
export const APP_BUNDLES: { appId: string; file: string; dir: 'applications' | 'utilities' }[] = [
  { appId: 'addressbook', file: 'Address Book.app', dir: 'applications' },
  { appId: 'mail', file: 'Mail.app', dir: 'applications' },
  { appId: 'preview', file: 'Preview.app', dir: 'applications' },
  { appId: 'quicktime', file: 'QuickTime Player.app', dir: 'applications' },
  { appId: 'safari', file: 'Safari.app', dir: 'applications' },
  { appId: 'stickies', file: 'Stickies.app', dir: 'applications' },
  { appId: 'sysprefs', file: 'System Preferences.app', dir: 'applications' },
  { appId: 'textedit', file: 'TextEdit.app', dir: 'applications' },
  { appId: 'terminal', file: 'Terminal.app', dir: 'utilities' },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** The archive path of an evidence record (shown in Safari). */
const evidencePath = (id: string) => `/evidence/${id.toLowerCase()}/`;

function evidenceFile(e: EvidenceItem, parent: string): VFile {
  const name = TBD.test(e.filename) ? `${e.id} (filename TBD)` : e.filename;
  let data: FileData;
  if (/\.html?$/i.test(e.filename)) data = { t: 'link', url: evidencePath(e.id) };
  else if (e.mediaType === 'document')
    data = e.body?.length
      ? { t: 'doc', title: e.title, paragraphs: e.body, note: 'Transcription from the archive. The original file is not available.' }
      : { t: 'placeholder', note: 'File unavailable.' };
  else if (e.mediaType === 'image') data = { t: 'image', src: e.file?.src, alt: e.title, caption: e.caption };
  else data = { t: 'media', media: e.mediaType, src: e.file?.src, poster: e.file?.poster, transcript: e.body };
  return {
    kind: 'file',
    id: `ev:${e.id}`,
    name,
    parent,
    data,
    size: e.fileSize && !TBD.test(e.fileSize) ? e.fileSize : undefined,
    locked: true,
    evidenceId: e.id,
  };
}

export interface BuildOptions {
  user: string;
  /** Extra nodes from the stage module (film build only; none in public). */
  extra?: VNode[];
  release?: string;
}

export function buildFs({ user, extra = [], release }: BuildOptions): FsSnapshot {
  const nodes: Record<string, VNode> = {};
  const dir = (id: string, name: string, parent: string | null, role: VDir['role'] = 'folder', more: Partial<VDir> = {}) => {
    nodes[id] = { kind: 'dir', id, name, parent, role, locked: true, ...more };
  };
  const file = (f: VFile) => (nodes[f.id] = f);

  dir('root', 'Macintosh HD', null, 'volume');
  dir('applications', 'Applications', 'root', 'applications');
  dir('utilities', 'Utilities', 'applications');
  dir('library', 'Library', 'root', 'library');
  dir('system', 'System', 'root', 'system');
  dir('system-library', 'Library', 'system', 'library');
  dir('users', 'Users', 'root');
  dir('shared', 'Shared', 'users');
  dir('home', user, 'users', 'home');
  dir('desktop', 'Desktop', 'home', 'desktop');
  dir('documents', 'Documents', 'home', 'documents');
  for (const [id, name] of [
    ['downloads', 'Downloads'],
    ['home-library', 'Library'],
    ['movies', 'Movies'],
    ['music', 'Music'],
    ['pictures', 'Pictures'],
    ['public', 'Public'],
    ['sites', 'Sites'],
  ])
    dir(id, name, 'home');
  dir('trash', '.Trash', 'home', 'trash', { hidden: true });

  for (const b of APP_BUNDLES) file({ kind: 'file', id: `app:${b.appId}`, name: b.file, parent: b.dir, data: { t: 'app', appId: b.appId }, locked: true });

  file({ kind: 'file', id: 'webloc:archive', name: 'The Maple Case.webloc', parent: 'desktop', data: { t: 'link', url: '/home/' }, locked: true });

  // The public archive, mirrored as files (same records, same IDs), grouped like the archive.
  dir('maple', 'The Maple Case', 'documents');
  for (const e of evidence.filter((x) => x.publicVisibility)) {
    const catId = `evcat:${slug(e.category)}`;
    if (!nodes[catId]) dir(catId, e.category, 'maple');
    file(evidenceFile(e, catId));
  }

  for (const n of extra) nodes[n.id] = n;

  // Release filtering happens here, before serialisation.
  for (const [id, n] of Object.entries(nodes)) if (!isReleased(n.release, release)) delete nodes[id];

  return { nodes, root: 'root', home: 'home', desktop: 'desktop', documents: 'documents', applications: 'applications', trash: 'trash', user, volume: 'Macintosh HD' };
}
