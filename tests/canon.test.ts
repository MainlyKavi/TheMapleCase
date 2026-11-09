// Canon guards (docs/CANON.md). These read private files too: the tests folder is never
// deployed. They keep confirmed facts in place and stop contradictions being "fixed" silently.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { evidence } from '../src/content/evidence.ts';
import { people } from '../src/content/people.ts';
import { press } from '../src/content/press.ts';
import { publicAccount, site } from '../src/content/site.ts';
import { timeline } from '../src/content/timeline.ts';
import { script } from '../private/script/scenes.ts';

const facts = (slug: string) => new Map(people.find((p) => p.slug === slug)!.facts);
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const publicSources = walk('src').filter((f) => /\.(tsx?|css)$/.test(f) && !/\.film\.tsx?$/.test(f));

test('Cristina: confirmed facts; age and date of birth agree (born 1996, 14 when missing)', () => {
  const c = facts('cristina-maple');
  assert.equal(c.get('Missing since'), 'February 24, 2011');
  assert.equal(c.get('Age when reported missing'), '14');
  assert.equal(c.get('Date of birth'), 'May 15, 1996');
  const born = new Date('1996-05-15');
  const missing = new Date('2011-02-24');
  const age = missing.getFullYear() - born.getFullYear() - (missing < new Date(missing.getFullYear(), born.getMonth(), born.getDate()) ? 1 : 0);
  assert.equal(age, 14);
  assert.match(c.get('Hair')!, /dark brown, nearly black/i);
  assert.match(c.get('Hair')!, /wolf cut/i);
  assert.equal(c.get('Eyes'), 'Brown');
  assert.equal(site.missingSinceDate, '2011-02-24');
});

test('Adrian and Catherine, company, location, archive dates', () => {
  const a = people.find((p) => p.slug === 'adrian-maple')!;
  assert.equal(new Map(a.facts).get('Company'), 'Seraphim Financial Group');
  assert.ok(a.relationships.some((r) => r.label === 'Wife' && r.name === 'Catherine Maple'));
  assert.equal(site.location, 'San Francisco, California');
  assert.equal(site.archiveLaunched, '2011-10');
  assert.equal(site.lastUpdated, '2012-09-16');
  assert.equal(site.creator, 'Adrian Maple');
  assert.equal(site.reward, '$10,000,000');
  assert.equal(timeline.find((t) => t.id === 'T-05')!.date, '2011-10');
  assert.equal(timeline.find((t) => t.id === 'T-06')!.date, '2012-09-16');
});

test('no old wife name, no X branding, no Kavi or twist vocabulary in public source', () => {
  for (const f of publicSources) {
    const text = readFileSync(f, 'utf8');
    assert.doesNotMatch(text, /\belena\b/i, f);
    assert.doesNotMatch(text, /\bkavi\b/i, f);
    assert.doesNotMatch(text, /pregnan|unborn|never born|truck driver/i, f);
    assert.doesNotMatch(text, /x\.com\b/i, f);
  }
});

test('nothing in the archive is dated June 28; no archive update after the last normal update', () => {
  const dated = [...evidence.map((e) => e.date), ...timeline.map((t) => t.date), ...press.map((p) => p.date)];
  assert.ok(!dated.some((d) => /-06-28$/.test(d)));
  assert.ok(![...dated, ...evidence.map((e) => e.addedToArchive)].some((d) => /^\d{4}/.test(d) && d.slice(0, 10) > '2012-09-16'));
  assert.ok(!JSON.stringify({ evidence, timeline, press, publicAccount }).toLowerCase().includes('june 28'));
});

test('lawsuit evidence is not inside Adrian’s archive', () => {
  assert.ok(!JSON.stringify(evidence).match(/lawsuit|court|plaintiff|defendant|judgment/i));
});

test('Kavi Case: approved minimum only (photo, Name, STATUS)', () => {
  const k = script.kavi.file;
  assert.deepEqual(k.facts, [
    ['Name', 'Kavi'],
    ['Status', 'Unsolved'],
  ]);
  assert.equal(k.kicker, '');
  assert.equal(k.subheading, '');
  assert.equal(k.summary.length, 0);
  assert.equal(k.showArchive, false);
  assert.equal(script.kavi.identity.subtitle, '');
});

test('Guest exchange: exactly the confirmed lines, nothing invented', () => {
  assert.deepEqual(
    script.guest.messages.map((m) => [m.from, m.text]),
    [
      ['guest', 'Check the June 28th video.'],
      ['kavi', 'There’s no June 28th video.'],
      ['guest', 'Check yours.'],
    ],
  );
  // The fictional date is never assumed: May 2019 with the day TBD.
  assert.match(script.siteDate, /^\[TBD/);
  assert.ok(!JSON.stringify(script).includes('2019-06-28') && !/June 28,? 2019/.test(JSON.stringify(script)));
});
