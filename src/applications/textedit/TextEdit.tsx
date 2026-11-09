'use client';

import { useEffect, useRef, useState } from 'react';
import * as A from '@/desktop/actions';
import { displayName, getNode } from '@/desktop/model/vfs';
import { currentFs, useFs } from '@/desktop/store';
import type { AppWindowProps } from '../registry';
import { useCommands } from '../useCommands';

/** TextEdit: canonical files open read-only; new documents are the user's and can be saved. */
export default function TextEdit({ win }: AppWindowProps) {
  const fs = useFs();
  const nodeId = win.props.nodeId as string | undefined;
  const node = getNode(fs, nodeId);
  const file = node?.kind === 'file' ? node : undefined;
  const original = file?.data.t === 'text' ? file.data.text : file?.data.t === 'placeholder' ? '' : '';
  const readOnly = Boolean(file && (file.locked || !file.user));
  const [text, setText] = useState(original);
  const [size, setSize] = useState(12);
  const [wrap, setWrap] = useState(true);
  const [saving, setSaving] = useState<null | { then?: () => void }>(null);
  const [name, setName] = useState('Untitled.txt');
  const dirty = !readOnly && text !== original;
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    A.setWindowTitle(win.id, `${file ? displayName(file) : 'Untitled'}${readOnly && file?.locked ? ' — Locked' : ''}`);
  }, [win.id, file, readOnly]);

  useEffect(() => {
    if (Boolean(win.props.dirty) !== dirty) A.setWindowProps(win.id, { dirty });
  }, [dirty, win.id, win.props.dirty]);

  useEffect(() => {
    if (!readOnly) area.current?.focus();
  }, [readOnly]);

  const save = (then?: () => void) => {
    if (file?.user) {
      A.saveUserFile(file.parent!, file.name, { t: 'text', text }, file.id);
      then?.();
      return;
    }
    setSaving({ then });
  };

  const confirmSave = () => {
    const id = A.saveUserFile(currentFs().documents, name.trim().replace(/[/:]/g, '-') || 'Untitled.txt', { t: 'text', text });
    A.setWindowProps(win.id, { nodeId: id });
    const then = saving?.then;
    setSaving(null);
    then?.();
  };

  useCommands(win.id, {
    save: !readOnly && (() => save()),
    saveAs: !readOnly && (() => setSaving({})),
    bigger: () => setSize((s) => Math.min(48, s + 2)),
    smaller: () => setSize((s) => Math.max(8, s - 2)),
    wrap: () => setWrap((w) => !w),
    requestClose: dirty
      ? () =>
          A.alert({
            title: `Do you want to save the changes you made in the document “${file ? displayName(file) : 'Untitled'}”?`,
            message: 'Your changes will be lost if you don’t save them.',
            icon: 'app:textedit',
            sheetFor: win.id,
            buttons: [
              { label: 'Don’t Save', action: () => A.forceCloseWindow(win.id) },
              { label: 'Cancel', cancel: true },
              { label: 'Save…', default: true, action: () => save(() => A.forceCloseWindow(win.id)) },
            ],
          })
      : undefined,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!readOnly && (
        <div
          aria-hidden="true"
          style={{
            height: 22,
            flex: 'none',
            borderBottom: '1px solid #9a9a9a',
            background: 'repeating-linear-gradient(90deg, #555 0 1px, transparent 1px 9px) left 18px bottom 0 / 100% 4px no-repeat, repeating-linear-gradient(90deg, #555 0 1px, transparent 1px 72px) left 18px bottom 0 / 100% 9px no-repeat, linear-gradient(#f7f7f7, #e3e3e3)',
          }}
        />
      )}
      <textarea
        ref={area}
        className="scroll selectable"
        aria-label={file ? displayName(file) : 'Untitled document'}
        value={text}
        readOnly={readOnly}
        wrap={wrap ? 'soft' : 'off'}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        style={{ flex: 1, width: '100%', resize: 'none', border: 0, padding: '10px 18px', background: '#fff', fontFamily: readOnly ? 'var(--mono)' : 'Helvetica, Arial, sans-serif', fontSize: readOnly ? size - 2 : size, lineHeight: 1.35 }}
      />
      {file?.data.t === 'placeholder' && <p className="placeholder-note">{file.data.note}</p>}
      {saving && (
        <form
          className="alert-panel sheet"
          style={{ display: 'block', width: 380 }}
          onSubmit={(e) => {
            e.preventDefault();
            confirmSave();
          }}
          onKeyDown={(e) => e.key === 'Escape' && setSaving(null)}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            Save As:
            <input className="aqua-field" autoFocus value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1 }} />
          </label>
          <p style={{ margin: '10px 0 16px 58px', fontSize: 12 }}>Where: Documents</p>
          <div className="alert-buttons">
            <button type="button" className="aqua-btn" onClick={() => setSaving(null)}>
              Cancel
            </button>
            <button type="submit" className="aqua-btn default">
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
