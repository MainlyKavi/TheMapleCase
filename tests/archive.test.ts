import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evidence } from '../src/content/evidence.ts';
import { queryArchive, summarize, type ArchiveQuery } from '../src/lib/archive.ts';
import { formatDate } from '../src/lib/format.ts';

const items = evidence.map(summarize);
const q = (patch: Partial<ArchiveQuery>) => queryArchive([...items], { q: '', category: '', type: '', sort: 'id', dir: 'asc', ...patch });

test('formats partial and unknown dates', () => {
  assert.equal(formatDate('2011'), '2011');
  assert.equal(formatDate('2011-06'), 'June 2011');
  assert.equal(formatDate('2011-06-14'), 'June 14, 2011');
  assert.equal(formatDate('2011-06-14', 'approximate'), 'c. June 14, 2011');
  assert.equal(formatDate('[TBD]'), '[TBD]');
});

test('search matches ids, titles and filenames, all terms required', () => {
  assert.deepEqual(q({ q: 'mc-e-004' }).map((i) => i.id), ['MC-E-004']);
  assert.ok(q({ q: 'reward' }).some((i) => i.id === 'MC-E-002'));
  assert.ok(q({ q: 'infoline' }).some((i) => i.id === 'MC-E-009'));
  assert.equal(q({ q: 'reward photograph cristina' }).length, 0);
});

test('nothing in the archive matches June 28', () => {
  assert.equal(q({ q: 'June 28' }).length, 0);
  assert.equal(q({ q: '06-28' }).length, 0);
});

test('filters and sorting', () => {
  assert.ok(q({ type: 'video' }).every((i) => i.mediaType === 'video'));
  assert.ok(q({ category: 'Photographs' }).every((i) => i.category === 'Photographs'));
  const byDate = q({ sort: 'date' });
  assert.equal(byDate[0].date, '2011'); // known dates first, TBD last
  assert.deepEqual(q({ dir: 'desc' }).map((i) => i.id), q({}).map((i) => i.id).reverse());
});
