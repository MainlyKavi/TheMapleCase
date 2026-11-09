// Public/private boundary at the source level. The build-output scan
// (scripts/verify-public-build.mjs) is the second line of defence.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const src = walk('src').filter((f) => /\.(tsx?|mjs|css)$/.test(f));

test('public source never imports private code (only *.film.* routes may)', () => {
  for (const f of src) {
    if (/\.film\.tsx?$/.test(f)) continue;
    const text = readFileSync(f, 'utf8');
    assert.doesNotMatch(text, /from\s+['"](@private\/|[./]*private\/)/, f);
    assert.doesNotMatch(text, /import\(\s*['"](@private\/|[./]*private\/)/, f);
  }
});

test('the @stage aliases point at public stubs unless MAPLE_BUILD=film', () => {
  const cfg = readFileSync('next.config.ts', 'utf8');
  assert.match(cfg, /'@stage\/desktop': '\.\/src\/stage\/desktop\.ts'/);
  assert.match(cfg, /productionBrowserSourceMaps: false/);
  const ts = JSON.parse(readFileSync('tsconfig.json', 'utf8'));
  for (const [k, v] of Object.entries(ts.compilerOptions.paths as Record<string, string[]>)) if (k.startsWith('@stage')) assert.ok(v[0].startsWith('./src/'), k);
});

test('public desktop stage ships no story events, nodes, mail or presets', async () => {
  const { desktopStage } = await import('../src/stage/desktop.ts');
  assert.deepEqual(desktopStage.events, []);
  assert.deepEqual(desktopStage.nodes, []);
  assert.deepEqual(desktopStage.mail, []);
  assert.deepEqual(desktopStage.presets, []);
  assert.equal(desktopStage.account.user, 'user');
});

test('private files never appear in the public static folder', () => {
  const pub = walk('public');
  assert.ok(!pub.some((f) => /private|film|kavi/i.test(f)), pub.join(', '));
});
