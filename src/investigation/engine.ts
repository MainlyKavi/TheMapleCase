// Deterministic story event engine. Story events are DATA supplied by the stage module
// (none in the public build). The engine checks prerequisites, applies state changes and
// returns side effects for the desktop shell. UI components never decide canon.

export type StoryEffect =
  | { type: 'reveal'; nodeId: string }
  | { type: 'hide'; nodeId: string }
  | { type: 'variant'; nodeId: string; variant: string }
  | { type: 'trash'; nodeId: string }
  | { type: 'untrash'; nodeId: string }
  | { type: 'flag'; flag: string; value: boolean | string | number }
  | { type: 'stage'; stage: string }
  /** Shell effects: performed by the desktop, not stored. Text must be approved story text. */
  | { type: 'openApp'; appId: string; props?: Record<string, unknown> }
  | { type: 'openFile'; nodeId: string }
  | { type: 'notify'; title: string; body: string };

/** User actions the engine can react to. */
export type StoryAction =
  | { type: 'open-file'; nodeId: string }
  | { type: 'open-app'; appId: string }
  | { type: 'visit'; path: string }
  | { type: 'submit' };

export interface StoryEvent {
  id: string;
  /** Production description (never shown on screen). */
  description: string;
  /** Default true: fires at most once. */
  once?: boolean;
  /** Event ids that must have fired first. */
  requires?: string[];
  /** Story stages in which the event may fire; omitted = any stage. */
  stages?: string[];
  /** Flags that must equal the given values. */
  when?: Record<string, boolean | string | number>;
  /** Fires automatically when a matching user action happens. */
  on?: StoryAction;
  effects: StoryEffect[];
}

export interface StoryState {
  stage: string;
  fired: string[];
  flags: Record<string, boolean | string | number>;
  revealed: string[];
  hidden: string[];
  trashed: string[];
  variants: Record<string, string>;
  /** Ordered log of fired events, for inspection and replay. */
  log: string[];
}

export const initialStory = (stage = 'initial'): StoryState => ({
  stage,
  fired: [],
  flags: {},
  revealed: [],
  hidden: [],
  trashed: [],
  variants: {},
  log: [],
});

export type FireResult =
  | { ok: true; state: StoryState; shell: StoryEffect[] }
  | { ok: false; state: StoryState; reason: string };

const without = (list: string[], id: string) => list.filter((x) => x !== id);
const withItem = (list: string[], id: string) => (list.includes(id) ? list : [...list, id]);

export function canFire(state: StoryState, ev: StoryEvent): string | null {
  if ((ev.once ?? true) && state.fired.includes(ev.id)) return `${ev.id} has already fired`;
  const missing = (ev.requires ?? []).filter((r) => !state.fired.includes(r));
  if (missing.length) return `${ev.id} requires ${missing.join(', ')}`;
  if (ev.stages && !ev.stages.includes(state.stage)) return `${ev.id} is not available in stage ${state.stage}`;
  for (const [k, v] of Object.entries(ev.when ?? {})) if (state.flags[k] !== v) return `${ev.id} needs flag ${k}=${String(v)}`;
  return null;
}

export function applyEffects(state: StoryState, effects: StoryEffect[]): { state: StoryState; shell: StoryEffect[] } {
  let s = state;
  const shell: StoryEffect[] = [];
  for (const e of effects) {
    switch (e.type) {
      case 'reveal':
        s = { ...s, revealed: withItem(s.revealed, e.nodeId), hidden: without(s.hidden, e.nodeId) };
        break;
      case 'hide':
        s = { ...s, hidden: withItem(s.hidden, e.nodeId) };
        break;
      case 'variant':
        s = { ...s, variants: { ...s.variants, [e.nodeId]: e.variant } };
        break;
      case 'trash':
        s = { ...s, trashed: withItem(s.trashed, e.nodeId) };
        break;
      case 'untrash':
        s = { ...s, trashed: without(s.trashed, e.nodeId) };
        break;
      case 'flag':
        s = { ...s, flags: { ...s.flags, [e.flag]: e.value } };
        break;
      case 'stage':
        s = { ...s, stage: e.stage };
        break;
      default:
        shell.push(e);
    }
  }
  return { state: s, shell };
}

export function fire(state: StoryState, events: StoryEvent[], id: string): FireResult {
  const ev = events.find((e) => e.id === id);
  if (!ev) return { ok: false, state, reason: `unknown event ${id}` };
  const blocked = canFire(state, ev);
  if (blocked) return { ok: false, state, reason: blocked };
  const { state: next, shell } = applyEffects(state, ev.effects);
  return { ok: true, state: { ...next, fired: withItem(next.fired, ev.id), log: [...next.log, ev.id] }, shell };
}

const sameAction = (a: StoryAction, b: StoryAction) => JSON.stringify(a) === JSON.stringify(b);

/** Fires, in definition order, every event triggered by a user action. */
export function handle(state: StoryState, events: StoryEvent[], action: StoryAction): { state: StoryState; shell: StoryEffect[]; fired: string[] } {
  let s = state;
  const shell: StoryEffect[] = [];
  const fired: string[] = [];
  for (const ev of events) {
    if (!ev.on || !sameAction(ev.on, action)) continue;
    const r = fire(s, events, ev.id);
    if (r.ok) {
      s = r.state;
      shell.push(...r.shell);
      fired.push(ev.id);
    }
  }
  return { state: s, shell, fired };
}

/** Rebuilds a state from scratch by firing events in order (deterministic takes). */
export function replay(events: StoryEvent[], ids: string[], stage = 'initial'): { state: StoryState; errors: string[] } {
  let s = initialStory(stage);
  const errors: string[] = [];
  for (const id of ids) {
    const r = fire(s, events, id);
    if (r.ok) s = r.state;
    else errors.push(r.reason);
  }
  return { state: s, errors };
}

/** Static validation of event definitions (duplicate ids, unknown prerequisites, cycles). */
export function validateEvents(events: StoryEvent[], nodeIds?: Set<string>): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const e of events) {
    if (ids.has(e.id)) errors.push(`duplicate event id ${e.id}`);
    ids.add(e.id);
  }
  for (const e of events) {
    for (const r of e.requires ?? []) if (!ids.has(r)) errors.push(`${e.id} requires unknown event ${r}`);
    if (nodeIds)
      for (const fx of e.effects)
        if ('nodeId' in fx && !nodeIds.has(fx.nodeId)) errors.push(`${e.id} references unknown node ${fx.nodeId}`);
  }
  const visiting = new Set<string>();
  const done = new Set<string>();
  const byId = new Map(events.map((e) => [e.id, e]));
  const visit = (id: string): boolean => {
    if (done.has(id)) return false;
    if (visiting.has(id)) return true;
    visiting.add(id);
    const cyc = (byId.get(id)?.requires ?? []).some(visit);
    visiting.delete(id);
    done.add(id);
    return cyc;
  };
  for (const e of events) if (visit(e.id)) errors.push(`prerequisite cycle involving ${e.id}`);
  return errors;
}
