'use client';

import { desktopStage } from '@stage/desktop';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as A from '@/desktop/actions';
import { complete, initialTerm, prompt, run, type TermEnv, type TermState } from '@/desktop/model/terminal';
import { currentFs, useFs, useUI } from '@/desktop/store';
import type { AppWindowProps } from '../registry';
import { useCommands } from '../useCommands';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Terminal({ win, focused }: AppWindowProps) {
  const fs = useFs();
  const clock = useUI((u) => u.clock);
  const [state, setState] = useState<TermState>(() => initialTerm(currentFs()));
  const [lines, setLines] = useState<string[]>(['Welcome to Darwin!']);
  const [input, setInput] = useState('');
  const [histPos, setHistPos] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const env: TermEnv = useMemo(
    () => ({
      user: desktopStage.account.user,
      host: desktopStage.account.host,
      // Never invents a fictional date: 'system' uses the viewer's clock, null prints a notice.
      date: () => {
        if (clock.date === null) return null;
        const now = clock.date === 'system' ? new Date() : new Date(`${clock.date}T12:00:00`);
        const [h, m] = clock.time === 'system' ? [now.getHours(), now.getMinutes()] : clock.time.split(':').map(Number);
        const tz = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(now).find((p) => p.type === 'timeZoneName')?.value ?? '';
        return `${DAYS[now.getDay()]} ${MONTHS[now.getMonth()]} ${String(now.getDate()).padStart(2, ' ')} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ${tz} ${now.getFullYear()}`;
      },
    }),
    [clock],
  );

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [lines]);
  useEffect(() => {
    if (focused) field.current?.focus({ preventScroll: true });
  }, [focused]);

  useCommands(win.id, { clear: () => setLines([]) });

  const submit = () => {
    const p = prompt(state, fs, env);
    const r = run(state, input, fs, env);
    setState(r.state);
    setHistPos(null);
    setInput('');
    if (r.effect?.type === 'clear') return setLines([]);
    setLines((l) => [...l, p + input, ...r.out].slice(-2000));
    if (r.effect?.type === 'open') A.openNode(r.effect.nodeId);
    if (r.effect?.type === 'exit') setDone(true);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit();
    else if (e.key === 'Tab') {
      e.preventDefault();
      const c = complete(state, input, fs, env);
      if (c.line !== input) setInput(c.line);
      else if (c.options.length > 1) setLines((l) => [...l, prompt(state, fs, env) + input, c.options.join('  ')]);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const h = state.history;
      if (!h.length) return;
      const pos = histPos === null ? h.length : histPos;
      const next = Math.min(h.length, Math.max(0, pos + (e.key === 'ArrowUp' ? -1 : 1)));
      setHistPos(next);
      setInput(next === h.length ? '' : h[next]);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      setLines((l) => [...l, `${prompt(state, fs, env)}${input}^C`]);
      setInput('');
    }
  };

  return (
    <div
      ref={scroller}
      className="scroll selectable"
      onClick={() => window.getSelection()?.isCollapsed && field.current?.focus()}
      style={{ height: '100%', background: '#fff', color: '#000', fontFamily: 'var(--mono)', fontSize: 11, lineHeight: '14px', padding: '2px 4px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
      role="log"
      aria-label="Terminal output"
    >
      {lines.map((l, i) => (
        <div key={i}>{l || ' '}</div>
      ))}
      {!done && (
        <div style={{ display: 'flex' }}>
          <span>{prompt(state, fs, env)}</span>
          <input
            ref={field}
            aria-label="Command"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            style={{ flex: 1, border: 0, padding: 0, font: 'inherit', background: 'transparent', caretColor: '#000', outline: 'none', boxShadow: 'none' }}
          />
        </div>
      )}
    </div>
  );
}
