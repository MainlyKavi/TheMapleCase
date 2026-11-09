import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fromAddress, toAddress } from '../src/applications/safari/address.ts';
import { filterMessages, threads } from '../src/applications/mail/model.ts';
import { evidence } from '../src/content/evidence.ts';
import { buildFs } from '../src/desktop/content/build-fs.ts';
import { magnify, sanitizePrefs } from '../src/desktop/model/prefs.ts';
import { complete, initialTerm, run, tokenize, type TermEnv } from '../src/desktop/model/terminal.ts';
import { appFor, canTrash, children, composeFs, emptyFsStory, emptyOverlay, pathOf, resolve, search, type VNode } from '../src/desktop/model/vfs.ts';
import * as W from '../src/desktop/model/windows.ts';
import { fire, handle, initialStory, replay, validateEvents, type StoryEvent } from '../src/investigation/engine.ts';
import { isReleased } from '../src/investigation/release.ts';

const VP: W.Viewport = { w: 1280, h: 800, top: 22, bottom: 70 };
const open = (s: W.WMState, app: string, o: Partial<W.OpenOptions> = {}) => W.openWindow(s, app, { title: app, w: 400, h: 300, ...o });

// --- Window manager ------------------------------------------------------------------------

test('windows: open, focus, stacking and multiple windows per app', () => {
  let s = W.initialWM(VP);
  const a = open(s, 'safari');
  s = a.state;
  const b = open(s, 'safari');
  s = b.state;
  const c = open(s, 'textedit');
  s = c.state;
  assert.equal(s.focused, c.id);
  assert.equal(W.activeApp(s), 'textedit');
  assert.deepEqual(s.running, ['finder', 'safari', 'textedit']);
  // Cascade: the second Safari window is offset from the first.
  const [wa, wb] = s.windows;
  assert.ok(wb.bounds.x > wa.bounds.x && wb.bounds.y > wa.bounds.y);
  s = W.focusWindow(s, a.id);
  assert.equal(s.focused, a.id);
  assert.ok(s.windows.find((w) => w.id === a.id)!.z > s.windows.find((w) => w.id === c.id)!.z);
});

test('windows: minimize, restore, zoom, close keep focus sensible', () => {
  let s = W.initialWM(VP);
  const a = open(s, 'finder');
  s = a.state;
  const b = open(s, 'safari');
  s = b.state;
  s = W.minimizeWindow(s, b.id);
  assert.equal(s.windows.find((w) => w.id === b.id)!.minimized, true);
  assert.equal(s.focused, a.id);
  s = W.restoreWindow(s, b.id);
  assert.equal(s.focused, b.id);
  assert.equal(s.windows.find((w) => w.id === b.id)!.minimized, false);
  const before = s.windows.find((w) => w.id === b.id)!.bounds;
  s = W.zoomWindow(s, b.id);
  const zoomed = s.windows.find((w) => w.id === b.id)!;
  assert.ok(zoomed.bounds.w > before.w && zoomed.zoomedFrom);
  s = W.zoomWindow(s, b.id);
  assert.deepEqual(s.windows.find((w) => w.id === b.id)!.bounds, before);
  s = W.closeWindow(s, b.id);
  assert.equal(s.focused, a.id);
  assert.ok(s.running.includes('safari'), 'closing the last window keeps the app running');
  s = W.closeWindow(open(s, 'sysprefs').state, s.nextId ? `w${s.nextId}` : '', true);
  assert.ok(!s.running.includes('sysprefs'), 'quitOnLastClose apps quit');
});

test('windows: constrain keeps title bars reachable', () => {
  const b = W.constrain({ x: -5000, y: -300, w: 400, h: 300 }, VP);
  assert.ok(b.x + b.w >= 80 && b.y >= VP.top);
  const c = W.constrain({ x: 99999, y: 99999, w: 400, h: 300 }, VP);
  assert.ok(c.x <= VP.w - 80 && c.y <= VP.h - W.TITLE_H);
  const big = W.constrain({ x: 0, y: 0, w: 5000, h: 5000 }, VP);
  assert.ok(big.w <= VP.w && big.h <= VP.h - VP.top);
  // Shrinking the screen pulls windows back on.
  let s = open(W.initialWM(VP), 'finder', { x: 1100, y: 600 }).state;
  s = W.setViewport(s, { ...VP, w: 640, h: 480 });
  assert.ok(s.windows[0].bounds.x <= 640 - 80 && s.windows[0].bounds.y <= 480 - W.TITLE_H);
});

test('windows: hide, quit, activate and switcher order', () => {
  let s = W.initialWM(VP);
  const a = open(s, 'safari');
  s = open(a.state, 'mail').state;
  s = W.hideApp(s, 'mail');
  assert.equal(W.activeApp(s), 'safari');
  assert.ok(s.hidden.includes('mail'));
  const act = W.activateApp(s, 'mail');
  assert.ok(act && !act.hidden.includes('mail') && W.activeApp(act) === 'mail');
  assert.equal(W.activateApp(W.initialWM(VP), 'terminal'), null, 'not running → caller opens a window');
  s = W.quitApp(act!, 'mail');
  assert.ok(!s.running.includes('mail') && !s.windows.some((w) => w.appId === 'mail'));
  assert.equal(W.switcherOrder(s)[0], W.activeApp(s));
  assert.ok(W.quitApp(s, 'finder').running.includes('finder'), 'Finder cannot quit');
});

// --- Filesystem ----------------------------------------------------------------------------

const snap = buildFs({ user: 'user' });
const fs0 = composeFs(snap, emptyOverlay(), emptyFsStory());

test('vfs: every public evidence record is mirrored once, locked, with its archive id', () => {
  const pub = evidence.filter((e) => e.publicVisibility);
  const files = Object.values(snap.nodes).filter((n) => n.evidenceId);
  assert.equal(files.length, pub.length);
  for (const e of pub) {
    const n = snap.nodes[`ev:${e.id}`];
    assert.ok(n, `${e.id} mirrored`);
    assert.equal(n.evidenceId, e.id);
    assert.equal(n.locked, true);
    // No invented timestamps.
    assert.equal(n.created, undefined);
    assert.equal(n.modified, undefined);
  }
});

test('vfs: paths, resolution and associations', () => {
  assert.equal(pathOf(fs0, 'home'), '/Users/user');
  assert.equal(resolve(fs0, 'home', '~/Documents/The Maple Case/Photographs'), 'evcat:photographs');
  assert.equal(resolve(fs0, 'evcat:photographs', '../..'), 'documents');
  assert.equal(resolve(fs0, 'home', '/Applications/Utilities/Terminal.app'), 'app:terminal');
  assert.equal(resolve(fs0, 'home', 'nope'), null);
  assert.equal(appFor(fs0.nodes['ev:MC-E-001']), 'preview');
  assert.equal(appFor(fs0.nodes['ev:MC-E-004']), 'preview');
  assert.equal(appFor(fs0.nodes['ev:MC-E-007']), 'quicktime');
  assert.equal(appFor(fs0.nodes['webloc:archive']), 'safari');
  assert.equal(appFor(fs0.nodes['ev:MC-E-012']), 'safari');
  assert.ok(search(fs0, 'reward').some((n) => n.id === 'ev:MC-E-002'));
  assert.ok(!search(fs0, 'june 28').length);
});

test('vfs: trash, put back, empty trash, gates and story visibility', () => {
  assert.equal(canTrash(fs0, fs0.nodes['ev:MC-E-004']).ok, false, 'canonical evidence is protected');
  const userFile: VNode = { kind: 'file', id: 'u1', name: 'notes.txt', parent: 'documents', data: { t: 'text', text: 'x' }, user: true };
  let ov = { ...emptyOverlay(), added: { u1: userFile } };
  let fs = composeFs(snap, ov, emptyFsStory());
  assert.equal(canTrash(fs, fs.nodes.u1).ok, true);
  ov = { ...ov, trashed: { u1: 'documents' } };
  fs = composeFs(snap, ov, emptyFsStory());
  assert.equal(fs.nodes.u1.parent, 'trash');
  assert.ok(children(fs, 'trash', true).some((n) => n.id === 'u1'));
  ov = { ...ov, trashed: {}, removed: ['u1'] };
  assert.equal(composeFs(snap, ov, emptyFsStory()).nodes.u1, undefined);
  // Gated nodes stay invisible until revealed.
  const gated = buildFs({ user: 'user', extra: [{ kind: 'dir', id: 'g', name: '.hidden', parent: 'home', role: 'folder', gate: 'e1', hidden: true }] });
  assert.equal(composeFs(gated, emptyOverlay(), emptyFsStory()).nodes.g, undefined);
  assert.ok(composeFs(gated, emptyOverlay(), { ...emptyFsStory(), revealed: ['g'] }).nodes.g);
});

test('release: later-stage nodes never reach the public snapshot', () => {
  assert.equal(isReleased(undefined), true);
  assert.equal(isReleased('initial'), true);
  assert.equal(isReleased('post-premiere'), false);
  assert.equal(isReleased('made-up-stage'), false);
  const s = buildFs({ user: 'user', extra: [{ kind: 'dir', id: 'later', name: 'Later', parent: 'home', role: 'folder', release: 'post-premiere' }] });
  assert.equal(s.nodes.later, undefined);
});

// --- Terminal ------------------------------------------------------------------------------

const env: TermEnv = { user: 'user', host: 'Macintosh', date: () => null };
const sh = (cmds: string[]) => {
  let st = initialTerm(fs0);
  const out: string[] = [];
  for (const c of cmds) {
    const r = run(st, c, fs0, env);
    st = r.state;
    out.push(...r.out);
  }
  return { st, out };
};

test('terminal: navigation and listing over the virtual filesystem only', () => {
  const { st, out } = sh(['pwd', 'cd Documents/The\\ Maple\\ Case/Photographs', 'pwd', 'ls']);
  assert.equal(out[0], '/Users/user');
  assert.equal(out[1], '/Users/user/Documents/The Maple Case/Photographs');
  assert.ok(out.slice(2).join(' ').includes('cristina_notice_photo.jpg'));
  assert.equal(st.cwd, 'evcat:photographs');
  assert.deepEqual(tokenize(`cd "a b" c\\ d 'e'`), ['cd', 'a b', 'c d', 'e']);
});

test('terminal: no arbitrary execution, hidden files only with -a, safe date', () => {
  for (const evil of ['rm -rf /', 'eval process.exit()', 'node', 'sudo ls', '$(whoami)', 'curl http://x', 'constructor', '__proto__', 'toString']) {
    const r = run(initialTerm(fs0), evil, fs0, env);
    assert.match(r.out[0], /command not found/, evil);
  }
  assert.ok(!sh(['ls']).out.join(' ').includes('.Trash'));
  assert.ok(sh(['ls -a']).out.join(' ').includes('.Trash'));
  assert.match(sh(['date']).out[0], /not been set/);
  const opened = run(initialTerm(fs0), 'open Desktop/The\\ Maple\\ Case.webloc', fs0, env);
  assert.deepEqual(opened.effect, { type: 'open', nodeId: 'webloc:archive' });
  assert.equal(complete(initialTerm(fs0), 'cd Doc', fs0, env).line, 'cd Documents/');
});

// --- Story engine --------------------------------------------------------------------------

const EVENTS: StoryEvent[] = [
  { id: 'a', description: 'test', effects: [{ type: 'reveal', nodeId: 'n1' }, { type: 'flag', flag: 'seen', value: true }] },
  { id: 'b', description: 'test', requires: ['a'], when: { seen: true }, effects: [{ type: 'variant', nodeId: 'n2', variant: 'v2' }, { type: 'openApp', appId: 'safari' }] },
  { id: 'c', description: 'test', once: false, stages: ['initial'], on: { type: 'open-file', nodeId: 'n3' }, effects: [{ type: 'hide', nodeId: 'n4' }] },
];

test('engine: prerequisites, once, flags, stages, shell effects', () => {
  let s = initialStory();
  assert.equal(fire(s, EVENTS, 'b').ok, false);
  const r1 = fire(s, EVENTS, 'a');
  assert.ok(r1.ok);
  s = r1.state;
  assert.ok(s.revealed.includes('n1'));
  assert.equal(fire(s, EVENTS, 'a').ok, false, 'one-time events fire once');
  const r2 = fire(s, EVENTS, 'b');
  assert.ok(r2.ok && r2.shell[0].type === 'openApp');
  assert.equal(r2.state.variants.n2, 'v2');
  const h = handle(r2.state, EVENTS, { type: 'open-file', nodeId: 'n3' });
  assert.deepEqual(h.fired, ['c']);
  assert.ok(handle(h.state, EVENTS, { type: 'open-file', nodeId: 'n3' }).fired.length === 1, 'repeatable');
  assert.equal(fire({ ...initialStory('post-premiere') }, EVENTS, 'c').ok, false);
});

test('engine: deterministic replay and validation', () => {
  const x = replay(EVENTS, ['a', 'b']);
  const y = replay(EVENTS, ['a', 'b']);
  assert.deepEqual(x, y);
  assert.deepEqual(x.state.log, ['a', 'b']);
  assert.deepEqual(validateEvents(EVENTS), []);
  const bad = validateEvents([
    { id: 'x', description: '', requires: ['y'], effects: [] },
    { id: 'y', description: '', requires: ['x'], effects: [{ type: 'reveal', nodeId: 'missing' }] },
  ], new Set(['present']));
  assert.ok(bad.some((e) => e.includes('cycle')) && bad.some((e) => e.includes('unknown node')));
});

// --- Apps (pure parts) ---------------------------------------------------------------------

test('safari: scoped to archive routes; never the desktop or film routes', () => {
  assert.equal(fromAddress('http://www.themaplecase.com/'), '/home/');
  assert.equal(fromAddress('themaplecase.com/evidence/mc-e-004'), '/evidence/mc-e-004/');
  assert.equal(fromAddress('/timeline/'), '/timeline/');
  assert.equal(fromAddress('/evidence/?q=reward'), '/evidence/?q=reward');
  for (const bad of ['http://www.google.com', 'www.themaplecase.com/production/', '/film-media/x.mp4', 'javascript:alert(1)', 'www.themaplecase.com.evil.com/', '//evil.com/home/']) assert.equal(fromAddress(bad), null, bad);
  assert.equal(toAddress('/home/'), 'http://www.themaplecase.com/');
});

test('mail: mailbox filter, search and threads', () => {
  const msgs = [
    { id: '1', mailbox: 'inbox' as const, from: 'a', to: 'b', subject: 'Hello', body: ['first'], date: '2019-05-01' },
    { id: '2', mailbox: 'inbox' as const, from: 'b', to: 'a', subject: 'Re: Hello', body: ['second'], date: '2019-05-02' },
    { id: '3', mailbox: 'sent' as const, from: 'a', to: 'c', subject: 'Other', body: ['third'] },
  ];
  assert.deepEqual(filterMessages(msgs, 'inbox', '').map((m) => m.id), ['2', '1']);
  assert.deepEqual(filterMessages(msgs, 'inbox', 'second').map((m) => m.id), ['2']);
  assert.equal(threads(filterMessages(msgs, 'inbox', '')).length, 1);
});

test('prefs: storage values are validated', () => {
  const p = sanitizePrefs({ wallpaper: '<script>', dockSize: 9999, magnify: 'yes', magnifySize: 1 });
  assert.equal(p.wallpaper, 'aqua-blue');
  assert.equal(p.dockSize, 96);
  assert.equal(p.magnify, true);
  assert.ok(p.magnifySize >= p.dockSize);
  const sizes = magnify([24, 76, 128], 76, 48, 80);
  assert.equal(sizes[1], 80);
  assert.ok(sizes[0] < 80 && sizes[0] > 48);
  assert.deepEqual(magnify([1, 2], null, 48, 80), [48, 48]);
});

test('windows: oversized windows open fully inside the work area', () => {
  const s = open(W.initialWM(VP), 'safari', { w: 3000, h: 2000 }).state;
  const b = s.windows[0].bounds;
  const area = W.workArea(VP);
  assert.ok(b.x >= 0 && b.y >= area.y && b.x + b.w <= VP.w && b.y + b.h <= area.y + area.h, JSON.stringify(b));
});
