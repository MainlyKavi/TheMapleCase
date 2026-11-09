'use client';

import { SubmitResponse, useStagedSubmission } from '@stage/client';
import { useRef, useState, type FormEvent } from 'react';
import type { Submission } from '@/stage/types';

/** Client-only form. Nothing is transmitted: the stage decides what the response looks like. */
export function SubmitForm({ items }: { items: { id: string; title: string }[] }) {
  const staged = useStagedSubmission();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState('');
  const textarea = useRef<HTMLTextAreaElement>(null);
  const shown = submission ?? staged;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const conclusion = String(data.get('conclusion') ?? '').trim();
    if (conclusion.length < 10) {
      setError('Please describe your conclusion before submitting.');
      textarea.current?.focus();
      return;
    }
    setError('');
    setSubmission({
      name: String(data.get('name') ?? '').trim(),
      conclusion,
      evidenceIds: data.getAll('evidence').map(String),
    });
  };

  return (
    <>
      <form key={shown ? 'filled' : 'blank'} onSubmit={onSubmit} noValidate className="panel mt-8">
        <h2 className="panel-head">Your submission</h2>
        <div className="panel-body space-y-6 md:p-6">
          <div>
            <label className="field-label" htmlFor="s-name">
              Name or initials <span className="font-normal text-ink-muted">(optional)</span>
            </label>
            <input
              id="s-name"
              name="name"
              className="field max-w-[320px]"
              autoComplete="off"
              maxLength={60}
              defaultValue={shown?.name}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="s-conclusion">
              Your conclusion
            </label>
            <p id="s-conclusion-hint" className="field-hint mb-2">
              Describe what you believe happened, and why.
            </p>
            <textarea
              ref={textarea}
              id="s-conclusion"
              name="conclusion"
              rows={9}
              className="field resize-y font-serif !text-[15px] leading-relaxed"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 's-conclusion-hint s-conclusion-error' : 's-conclusion-hint'}
              defaultValue={shown?.conclusion}
            />
            {error && (
              <p id="s-conclusion-error" role="alert" className="mt-1.5 text-[12.5px] font-bold text-[#8e3b33]">
                {error}
              </p>
            )}
          </div>
          <fieldset>
            <legend className="field-label">
              Relevant archive items <span className="font-normal text-ink-muted">(optional)</span>
            </legend>
            <div className="grid max-h-[230px] gap-x-6 gap-y-1.5 overflow-auto border border-rule bg-fog-light p-3 sm:grid-cols-2">
              {items.map((i) => (
                <label key={i.id} className="flex items-start gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    name="evidence"
                    value={i.id}
                    defaultChecked={shown?.evidenceIds.includes(i.id)}
                    className="mt-[3px]"
                  />
                  <span>
                    <span className="file-id mr-1.5">{i.id}</span>
                    {i.title}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap items-center gap-4 border-t border-fog pt-5">
            <button className="btn btn-primary" type="submit" disabled={Boolean(shown)}>
              Submit conclusion
            </button>
            <span className="field-hint">This form is not a reward claim.</span>
          </div>
        </div>
      </form>
      {shown && (
        <div className="mt-6" aria-live="polite">
          <SubmitResponse submission={shown} staged={!submission} />
        </div>
      )}
    </>
  );
}
