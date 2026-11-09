'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import type { MediaType } from '@/content/types';
import {
  evidenceHref,
  MEDIA_LABEL,
  queryArchive,
  type ArchiveQuery,
  type EvidenceSummary,
  type SortKey,
} from '@/lib/archive';
import { Thumb } from './MissingMedia';
import { Txt } from './Txt';

const SORTS: [SortKey, string][] = [
  ['id', 'Reference'],
  ['date', 'Date'],
  ['title', 'Title'],
  ['category', 'Category'],
];

const TYPES = Object.keys(MEDIA_LABEL) as MediaType[];

export function EvidenceArchive({ items }: { items: EvidenceSummary[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const sortParam = params.get('sort') as SortKey | null;
  const query: ArchiveQuery = {
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    type: params.get('type') ?? '',
    sort: SORTS.some(([k]) => k === sortParam) ? sortParam! : 'id',
    dir: params.get('dir') === 'desc' ? 'desc' : 'asc',
  };
  const results = queryArchive(items, query);
  const filtered = Boolean(query.q || query.category || query.type);

  const update = (patch: Partial<ArchiveQuery>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v || (k === 'sort' && v === 'id') || (k === 'dir' && v === 'asc')) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    update({ q: String(new FormData(e.currentTarget).get('q') ?? '').trim() });
  };

  const sortBy = (key: SortKey) =>
    update({ sort: key, dir: query.sort === key && query.dir === 'asc' ? 'desc' : 'asc' });

  const count = (pred: (i: EvidenceSummary) => boolean) => items.filter(pred).length;
  const categories = [...new Set(items.map((i) => i.category))];

  const facet = (label: string, n: number, active: boolean, onClick: () => void) => (
    <li key={label}>
      <button
        type="button"
        aria-pressed={active}
        onClick={onClick}
        className={`flex w-full items-baseline justify-between gap-2 border-l-[3px] px-3 py-[5px] text-left text-[13px] hover:bg-fog-light ${
          active ? 'border-navy bg-fog-light font-bold text-navy' : 'border-transparent text-link'
        }`}
      >
        <span>{label}</span>
        <span className="text-[11px] font-normal text-ink-muted">{n}</span>
      </button>
    </li>
  );

  const th = (key: SortKey, label: string) => (
    <th aria-sort={query.sort === key ? (query.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
      <button type="button" className="sort-btn" onClick={() => sortBy(key)}>
        {label}
        <span aria-hidden="true" className={query.sort === key ? 'opacity-100' : 'opacity-30'}>
          {query.sort === key && query.dir === 'desc' ? '▼' : '▲'}
        </span>
      </button>
    </th>
  );

  return (
    <div className="grid gap-7 lg:grid-cols-[220px_1fr]">
      <aside className="grid gap-5 sm:grid-cols-2 lg:block lg:space-y-5" aria-label="Refine results">
        <section className="panel">
          <h2 className="panel-head">Category</h2>
          <ul className="py-1.5">
            {facet('All items', items.length, !query.category, () => update({ category: '' }))}
            {categories.map((c) =>
              facet(c, count((i) => i.category === c), query.category === c, () =>
                update({ category: query.category === c ? '' : c }),
              ),
            )}
          </ul>
        </section>
        <section className="panel">
          <h2 className="panel-head">Media type</h2>
          <ul className="py-1.5">
            {facet('All types', items.length, !query.type, () => update({ type: '' }))}
            {TYPES.map((t) =>
              facet(MEDIA_LABEL[t], count((i) => i.mediaType === t), query.type === t, () =>
                update({ type: query.type === t ? '' : t }),
              ),
            )}
          </ul>
        </section>
      </aside>

      <div className="min-w-0">
        <form role="search" onSubmit={onSearch} className="panel">
          <div className="panel-body">
            <label htmlFor="archive-q" className="field-label">
              Search the archive
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                key={query.q}
                id="archive-q"
                name="q"
                type="search"
                defaultValue={query.q}
                placeholder="Title, reference, filename or date"
                className="field min-w-0 flex-1"
                autoComplete="off"
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
              {filtered && (
                <button type="button" className="btn" onClick={() => update({ q: '', category: '', type: '' })}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-ink-muted">
          <p aria-live="polite">
            Showing <strong className="text-ink">{results.length}</strong> of {items.length} items
            {query.q && <> matching “{query.q}”</>}
          </p>
          <label className="flex items-center gap-2">
            Sort by
            <select
              className="field !w-auto !py-1 text-[12.5px]"
              value={query.sort}
              onChange={(e) => update({ sort: e.target.value as SortKey, dir: 'asc' })}
            >
              {SORTS.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="panel mt-2 overflow-x-auto">
          <table className="data-table min-w-[660px]">
            <caption className="sr-only">Evidence archive items</caption>
            <thead>
              <tr>
                <th className="w-[76px]">
                  <span className="sr-only">Preview</span>
                </th>
                {th('id', 'Ref.')}
                {th('title', 'Item')}
                {th('category', 'Category')}
                {th('date', 'Date')}
              </tr>
            </thead>
            <tbody>
              {results.map((i) => (
                <tr key={i.id}>
                  <td>
                    <Thumb kind={i.mediaType} id={i.id} src={i.thumb} />
                  </td>
                  <td className="whitespace-nowrap">
                    <Link href={evidenceHref(i.id)} className="file-id !text-link">
                      {i.id}
                    </Link>
                  </td>
                  <td>
                    <Link href={evidenceHref(i.id)} className="font-bold">
                      {i.title}
                    </Link>
                    <p className="mt-0.5 line-clamp-2 max-w-[440px] text-[12.5px] text-ink-muted">
                      <Txt>{i.description}</Txt>
                    </p>
                    <p className="mt-1 text-[11.5px] text-ink-muted">
                      {MEDIA_LABEL[i.mediaType]} · <span className="file-id !text-[11px]">{<Txt>{i.filename}</Txt>}</span>
                    </p>
                  </td>
                  <td className="whitespace-nowrap text-[12.5px]">{i.category}</td>
                  <td className="whitespace-nowrap text-[12.5px]">
                    <Txt>{i.displayDate}</Txt>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {results.length === 0 && (
            <div className="border-t border-fog px-6 py-12 text-center">
              <p className="font-narrow text-[18px] font-bold text-navy">No archive items found</p>
              <p className="mt-1.5 text-[13px] text-ink-muted">
                {query.q ? <>Nothing in the archive matches “{query.q}”.</> : 'No items match the selected filters.'} Check
                the spelling, or try a broader search.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
