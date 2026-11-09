// A deliberately tiny shell over the virtual filesystem. It never evaluates code, never touches
// a real filesystem, environment or process: every command is an entry in COMMANDS below.

import { children, displayName, getNode, pathOf, resolve, type Fs, type VNode } from './vfs.ts';

export interface TermState {
  cwd: string;
  history: string[];
}

export type TermEffect = { type: 'clear' } | { type: 'open'; nodeId: string } | { type: 'exit' };

export interface TermEnv {
  user: string;
  host: string;
  /** Formatted output for `date`, or null when the fictional date is not set. */
  date: () => string | null;
  /** Story-controlled extra commands (none in the public build). */
  extra?: Record<string, (args: string[]) => string[]>;
}

export interface TermResult {
  state: TermState;
  out: string[];
  effect?: TermEffect;
}

export const initialTerm = (fs: Fs): TermState => ({ cwd: fs.home, history: [] });

export function prompt(state: TermState, fs: Fs, env: TermEnv): string {
  const n = getNode(fs, state.cwd);
  const label = state.cwd === fs.home ? '~' : state.cwd === fs.root || !n ? '/' : n.name;
  return `${env.host}:${label} ${env.user}$ `;
}

/** Splits a command line into words, honouring single and double quotes and backslashes. */
export function tokenize(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quote: '"' | "'" | null = null;
  let has = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
      else cur += c;
    } else if (c === '"' || c === "'") {
      quote = c;
      has = true;
    } else if (c === '\\' && i + 1 < line.length) {
      cur += line[++i];
      has = true;
    } else if (/\s/.test(c)) {
      if (cur || has) out.push(cur);
      cur = '';
      has = false;
    } else {
      cur += c;
      has = true;
    }
  }
  if (cur || has) out.push(cur);
  return out;
}

const listName = (n: VNode) => (n.kind === 'dir' ? `${n.name}` : n.name);

function columns(names: string[], width = 80): string[] {
  if (!names.length) return [];
  const col = Math.max(...names.map((n) => n.length)) + 2;
  const per = Math.max(1, Math.floor(width / col));
  const rows = Math.ceil(names.length / per);
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < per; c++) {
      const name = names[c * rows + r];
      if (name !== undefined) line += name.padEnd(col);
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

type Cmd = (args: string[], s: TermState, fs: Fs, env: TermEnv) => Omit<TermResult, 'state'> & { state?: TermState };

const HELP: [string, string][] = [
  ['help', 'show this list'],
  ['pwd', 'print the working directory'],
  ['ls [-a] [-l] [path]', 'list a directory'],
  ['cd [path]', 'change directory (~ is your home)'],
  ['cat file', 'print a text file'],
  ['open path', 'open a file or folder with its application'],
  ['echo text', 'print text'],
  ['date', 'print the date and time'],
  ['whoami', 'print your user name'],
  ['history', 'list previous commands'],
  ['clear', 'clear the window'],
  ['exit', 'end the session'],
];

const COMMANDS: Record<string, Cmd> = {
  help: () => ({ out: ['Available commands:', ...HELP.map(([c, d]) => `  ${c.padEnd(22)}${d}`)] }),
  pwd: (_a, s, fs) => ({ out: [pathOf(fs, s.cwd) || '/'] }),
  whoami: (_a, _s, _fs, env) => ({ out: [env.user] }),
  echo: (a) => ({ out: [a.join(' ')] }),
  uname: () => ({ out: ['Darwin'] }),
  date: (_a, _s, _fs, env) => ({ out: [env.date() ?? 'date: the date has not been set'] }),
  clear: () => ({ out: [], effect: { type: 'clear' } }),
  exit: () => ({ out: ['logout', '', '[Process completed]'], effect: { type: 'exit' } }),
  logout: (a, s, fs, env) => COMMANDS.exit(a, s, fs, env),
  history: (_a, s) => ({ out: s.history.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`) }),
  cd: (a, s, fs) => {
    const target = a[0] ?? '~';
    const id = resolve(fs, s.cwd, target);
    const n = getNode(fs, id);
    if (!n) return { out: [`-bash: cd: ${target}: No such file or directory`] };
    if (n.kind !== 'dir') return { out: [`-bash: cd: ${target}: Not a directory`] };
    return { out: [], state: { ...s, cwd: n.id } };
  },
  ls: (a, s, fs) => {
    const flags = a.filter((x) => x.startsWith('-')).join('');
    const paths = a.filter((x) => !x.startsWith('-'));
    const all = flags.includes('a');
    const long = flags.includes('l');
    const bad = flags.replace(/[-al]/g, '');
    if (bad) return { out: [`ls: illegal option -- ${bad[0]}`, 'usage: ls [-al] [file ...]'] };
    const out: string[] = [];
    const targets = paths.length ? paths : ['.'];
    for (const p of targets) {
      const id = resolve(fs, s.cwd, p);
      const n = getNode(fs, id);
      if (!n) {
        out.push(`ls: ${p}: No such file or directory`);
        continue;
      }
      if (targets.length > 1) out.push(`${p}:`);
      const list = n.kind === 'dir' ? children(fs, n.id, all) : [n];
      const names = [...(all && n.kind === 'dir' ? ['.', '..'] : []), ...list.map(listName)];
      if (long) {
        out.push(`total ${list.length}`);
        if (all && n.kind === 'dir') out.push('drwxr-xr-x   user  staff   .', 'drwxr-xr-x   user  staff   ..');
        for (const c of list) {
          const perm = c.kind === 'dir' ? 'drwxr-xr-x' : c.locked ? '-r--r--r--' : '-rw-r--r--';
          const size = c.kind === 'file' && c.size ? c.size : '';
          out.push(`${perm}   user  staff  ${size.padStart(8)}  ${c.name}`);
        }
      } else out.push(...columns(names));
      if (targets.length > 1) out.push('');
    }
    return { out };
  },
  cat: (a, s, fs) => {
    if (!a.length) return { out: ['usage: cat file ...'] };
    const out: string[] = [];
    for (const p of a) {
      const n = getNode(fs, resolve(fs, s.cwd, p));
      if (!n) out.push(`cat: ${p}: No such file or directory`);
      else if (n.kind === 'dir') out.push(`cat: ${p}: Is a directory`);
      else if (n.data.t === 'text') out.push(...n.data.text.split('\n'));
      else if (n.data.t === 'link') out.push(n.data.url);
      else out.push(`cat: ${p}: binary file (try: open "${displayName(n)}")`);
    }
    return { out };
  },
  open: (a, s, fs) => {
    if (!a.length) return { out: ['Usage: open path'] };
    const id = resolve(fs, s.cwd, a.join(' '));
    if (!id || !getNode(fs, id)) return { out: [`The file ${a.join(' ')} does not exist.`] };
    return { out: [], effect: { type: 'open', nodeId: id } };
  },
};

export function run(state: TermState, line: string, fs: Fs, env: TermEnv): TermResult {
  const trimmed = line.trim();
  const history = trimmed ? [...state.history, trimmed].slice(-500) : state.history;
  const s = { ...state, history };
  if (!trimmed) return { state: s, out: [] };
  const [name, ...args] = tokenize(trimmed);
  const extra = env.extra?.[name];
  if (extra) return { state: s, out: extra(args) };
  const cmd = Object.hasOwn(COMMANDS, name) ? COMMANDS[name] : undefined;
  if (!cmd) return { state: s, out: [`-bash: ${name}: command not found`] };
  const r = cmd(args, s, fs, env);
  return { state: r.state ?? s, out: r.out, effect: r.effect };
}

/** Tab completion for the last word (commands first word, paths otherwise). */
export function complete(state: TermState, line: string, fs: Fs, env: TermEnv): { line: string; options: string[] } {
  const words = line.split(' ');
  const last = words[words.length - 1];
  let options: string[];
  let stem = last;
  if (words.length === 1) {
    options = [...Object.keys(COMMANDS), ...Object.keys(env.extra ?? {})].filter((c) => c.startsWith(last));
  } else {
    const slash = last.lastIndexOf('/');
    const dirPart = slash >= 0 ? last.slice(0, slash + 1) : '';
    stem = last.slice(slash + 1);
    const dir = getNode(fs, resolve(fs, state.cwd, dirPart || '.'));
    if (!dir || dir.kind !== 'dir') return { line, options: [] };
    options = children(fs, dir.id, stem.startsWith('.'))
      .filter((n) => n.name.startsWith(stem))
      .map((n) => `${dirPart}${n.name.replace(/ /g, '\\ ')}${n.kind === 'dir' ? '/' : ''}`);
    stem = last;
  }
  if (options.length === 1) return { line: [...words.slice(0, -1), options[0] + (words.length === 1 ? ' ' : '')].join(' '), options };
  if (options.length > 1) {
    let prefix = options[0];
    for (const o of options) while (!o.startsWith(prefix)) prefix = prefix.slice(0, -1);
    if (prefix.length > stem.length) return { line: [...words.slice(0, -1), prefix].join(' '), options };
  }
  return { line, options };
}
