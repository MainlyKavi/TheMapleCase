// Virtual filesystem: one set of records shared by every application. Pure and serialisable.
// Canonical nodes come from the server (src/desktop/content/build-fs.ts); session changes
// (user files, trash) and story state are layered on top by composeFs().

export type FileData =
  | { t: 'text'; text: string }
  /** A typeset transcription of a paper document (the archive's own transcription). */
  | { t: 'doc'; title: string; paragraphs: string[]; note?: string }
  | { t: 'image'; src?: string; alt: string; caption?: string }
  | { t: 'media'; media: 'video' | 'audio'; src?: string; poster?: string; transcript?: string[] }
  /** Internet location (.webloc): an archive path opened in Safari. */
  | { t: 'link'; url: string }
  | { t: 'app'; appId: string }
  /** Honest placeholder for content that has not been supplied or decided. */
  | { t: 'placeholder'; note: string };

export type DirRole = 'volume' | 'home' | 'desktop' | 'documents' | 'applications' | 'trash' | 'system' | 'library' | 'folder';

interface Base {
  id: string;
  name: string;
  parent: string | null;
  /** ISO dates, only when canon establishes them. Unknown = undefined, shown as "--". */
  created?: string;
  modified?: string;
  /** Canonical records: cannot be moved to the Trash, renamed or edited. */
  locked?: boolean;
  /** Dotfiles and system folders; listed by `ls -a` only. */
  hidden?: boolean;
  /** Invisible until a story event reveals it (see src/investigation/engine.ts). */
  gate?: string;
  /** Release stage; later stages are dropped on the server before serialisation. */
  release?: string;
  /** Link to the archive record this file mirrors. */
  evidenceId?: string;
  /** Created during this session by the user. */
  user?: boolean;
}

export interface VDir extends Base {
  kind: 'dir';
  role: DirRole;
}

export interface VFile extends Base {
  kind: 'file';
  data: FileData;
  /** Human-readable size when known ("1.2 MB"). */
  size?: string;
  /** Alternative contents a story event may switch to. */
  variants?: Record<string, FileData>;
}

export type VNode = VDir | VFile;

export interface FsSnapshot {
  nodes: Record<string, VNode>;
  root: string;
  home: string;
  desktop: string;
  documents: string;
  applications: string;
  trash: string;
  /** Short user name, e.g. "user". */
  user: string;
  /** Volume name shown in Finder, e.g. "Macintosh HD". */
  volume: string;
}

/** Session layer: things the user did since the last reset. Never persisted. */
export interface FsOverlay {
  added: Record<string, VNode>;
  /** node id → original parent id */
  trashed: Record<string, string>;
  /** Permanently deleted (Empty Trash) user nodes. */
  removed: string[];
  renamed: Record<string, string>;
  edited: Record<string, FileData>;
}

/** The slice of story state the filesystem cares about. */
export interface FsStory {
  revealed: string[];
  hidden: string[];
  trashed: string[];
  variants: Record<string, string>;
}

export type Fs = FsSnapshot;

export const emptyOverlay = (): FsOverlay => ({ added: {}, trashed: {}, removed: [], renamed: {}, edited: {} });
export const emptyFsStory = (): FsStory => ({ revealed: [], hidden: [], trashed: [], variants: {} });

/** Merges canonical nodes, the session overlay and story state into the visible filesystem. */
export function composeFs(snap: FsSnapshot, overlay: FsOverlay, story: FsStory): Fs {
  const nodes: Record<string, VNode> = {};
  const all = { ...snap.nodes, ...overlay.added };
  for (const [id, n] of Object.entries(all)) {
    if (overlay.removed.includes(id)) continue;
    if (n.gate && !story.revealed.includes(id)) continue;
    if (story.hidden.includes(id)) continue;
    let node: VNode = n;
    const trashedFrom = overlay.trashed[id] ?? (story.trashed.includes(id) ? n.parent ?? undefined : undefined);
    if (trashedFrom) node = { ...node, parent: snap.trash };
    if (overlay.renamed[id]) node = { ...node, name: overlay.renamed[id] };
    if (node.kind === 'file') {
      const variant = story.variants[id];
      if (variant && node.variants?.[variant]) node = { ...node, data: node.variants[variant] };
      if (overlay.edited[id]) node = { ...node, data: overlay.edited[id] };
    }
    nodes[id] = node;
  }
  // Drop nodes whose ancestors are gone (gated or hidden folders hide their contents).
  const alive = (id: string, depth = 0): boolean => {
    const n = nodes[id];
    if (!n || depth > 64) return false;
    return n.parent === null || alive(n.parent, depth + 1);
  };
  for (const id of Object.keys(nodes)) if (!alive(id)) delete nodes[id];
  return { ...snap, nodes };
}

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

export function children(fs: Fs, dirId: string, showHidden = false): VNode[] {
  return Object.values(fs.nodes)
    .filter((n) => n.parent === dirId && (showHidden || !n.hidden))
    .sort((a, b) => collator.compare(a.name, b.name));
}

export const getNode = (fs: Fs, id: string | null | undefined): VNode | undefined => (id ? fs.nodes[id] : undefined);

export function ancestors(fs: Fs, id: string): VNode[] {
  const out: VNode[] = [];
  let n = fs.nodes[id];
  let guard = 0;
  while (n && guard++ < 64) {
    out.unshift(n);
    n = n.parent ? fs.nodes[n.parent] : (undefined as unknown as VNode);
  }
  return out;
}

/** POSIX path of a node ("/" for the startup volume). */
export function pathOf(fs: Fs, id: string): string {
  const chain = ancestors(fs, id);
  if (!chain.length) return '';
  const parts = chain.slice(1).map((n) => n.name);
  return `/${parts.join('/')}`;
}

/** Resolves "~", ".", "..", absolute and relative paths. Returns the node id or null. */
export function resolve(fs: Fs, cwd: string, input: string): string | null {
  let path = input.trim();
  if (!path) return cwd;
  let cur: string | null;
  if (path === '~' || path.startsWith('~/')) {
    cur = fs.home;
    path = path.slice(1);
  } else if (path.startsWith('/')) cur = fs.root;
  else cur = cwd;
  for (const seg of path.split('/')) {
    if (!seg || seg === '.') continue;
    const node: VNode | undefined = fs.nodes[cur!];
    if (!node) return null;
    if (seg === '..') {
      cur = node.parent ?? fs.root;
      continue;
    }
    if (node.kind !== 'dir') return null;
    const next = Object.values(fs.nodes).find((n) => n.parent === cur && n.name === seg);
    if (!next) return null;
    cur = next.id;
  }
  return cur;
}

export const extOf = (name: string) => {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : '';
};

/** Display name without the extension (Finder hides some, e.g. ".app"). */
export const displayName = (n: VNode) => (n.kind === 'file' ? n.name.replace(/\.(app|webloc)$/, '') : n.name);

const KIND_BY_EXT: Record<string, string> = {
  txt: 'Plain text document',
  rtf: 'Rich Text Format (RTF) document',
  pdf: 'PDF Document',
  jpg: 'JPEG Image',
  jpeg: 'JPEG Image',
  png: 'PNG Image',
  gif: 'GIF Image',
  mp4: 'MPEG-4 Movie',
  mov: 'QuickTime Movie',
  m4v: 'MPEG-4 Movie',
  wav: 'WAVE audio file',
  mp3: 'MP3 audio file',
  m4a: 'AAC audio file',
  html: 'HTML document',
  webloc: 'Web Internet Location',
  app: 'Application',
};

export function kindOf(n: VNode): string {
  if (n.kind === 'dir') return n.role === 'volume' ? 'Volume' : 'Folder';
  if (n.data.t === 'app') return 'Application';
  if (n.data.t === 'link') return 'Web Internet Location';
  return KIND_BY_EXT[extOf(n.name)] ?? (n.data.t === 'placeholder' ? 'Document' : 'Document');
}

/** Which application opens a node. null for folders (Finder navigates into them). */
export function appFor(n: VNode): string | null {
  if (n.kind === 'dir') return null;
  switch (n.data.t) {
    case 'app':
      return n.data.appId;
    case 'link':
      return 'safari';
    case 'text':
      return 'textedit';
    case 'doc':
    case 'image':
      return 'preview';
    case 'media':
      return 'quicktime';
    case 'placeholder': {
      const ext = extOf(n.name);
      if (['mp4', 'mov', 'm4v', 'wav', 'mp3', 'm4a'].includes(ext)) return 'quicktime';
      if (['txt', 'rtf'].includes(ext)) return 'textedit';
      return 'preview';
    }
  }
}

export type IconKind = 'folder' | 'volume' | 'home' | 'trash' | 'trash-full' | 'apps-folder' | 'system-folder' | 'text' | 'pdf' | 'image' | 'movie' | 'audio' | 'webloc' | 'html' | 'generic' | `app:${string}`;

export function iconFor(fs: Fs, n: VNode): IconKind {
  if (n.kind === 'dir') {
    if (n.role === 'volume') return 'volume';
    if (n.role === 'home') return 'home';
    if (n.role === 'trash') return children(fs, n.id).length ? 'trash-full' : 'trash';
    if (n.role === 'applications') return 'apps-folder';
    if (n.role === 'system') return 'system-folder';
    return 'folder';
  }
  if (n.data.t === 'app') return `app:${n.data.appId}`;
  if (n.data.t === 'link') return 'webloc';
  const ext = extOf(n.name);
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'm4v'].includes(ext)) return 'movie';
  if (['wav', 'mp3', 'm4a'].includes(ext)) return 'audio';
  if (ext === 'html') return 'html';
  if (['txt', 'rtf'].includes(ext) || n.data.t === 'text') return 'text';
  return 'generic';
}

/** Spotlight-style search: every term must appear in the name or text content. */
export function search(fs: Fs, query: string, limit = 50): VNode[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const textOf = (n: VNode) => {
    if (n.kind !== 'file') return '';
    const d = n.data;
    if (d.t === 'text') return d.text;
    if (d.t === 'doc') return `${d.title} ${d.paragraphs.join(' ')}`;
    if (d.t === 'image') return `${d.alt} ${d.caption ?? ''}`;
    return '';
  };
  return Object.values(fs.nodes)
    .filter((n) => !n.hidden && n.id !== fs.root && n.parent !== fs.trash)
    .filter((n) => {
      const hay = `${n.name} ${n.evidenceId ?? ''} ${textOf(n)}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    })
    .sort((a, b) => collator.compare(a.name, b.name))
    .slice(0, limit);
}

/** Can the user move this node to the Trash? */
export function canTrash(fs: Fs, n: VNode): { ok: true } | { ok: false; reason: string } {
  if (n.locked) return { ok: false, reason: `The item “${displayName(n)}” can’t be moved to the Trash because it’s locked.` };
  if (n.kind === 'dir' && n.role !== 'folder') return { ok: false, reason: `The item “${displayName(n)}” can’t be moved to the Trash because it’s required by Mac OS X.` };
  if (n.parent === fs.trash) return { ok: false, reason: 'The item is already in the Trash.' };
  return { ok: true };
}

let counter = 0;
export const newUserId = (prefix = 'u') => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

/** A name that does not clash with siblings: "untitled folder", "untitled folder 2", … */
export function uniqueName(fs: Fs, dirId: string, base: string): string {
  const taken = new Set(children(fs, dirId, true).map((n) => n.name));
  if (!taken.has(base)) return base;
  const m = /^(.*?)(\.[^.]+)?$/.exec(base)!;
  for (let i = 2; ; i++) {
    const name = `${m[1]} ${i}${m[2] ?? ''}`;
    if (!taken.has(name)) return name;
  }
}
