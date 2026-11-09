# The Maple Case: archive website

A fictional 2012–2013 missing-person archive for the short film *THE MAPLE CASE*, built with
Next.js 16, React 19, TypeScript and Tailwind CSS 4.

> **Keep this repository private.** `docs/`, `private/` and `scripts/` contain story spoilers.
> Only the static `out/` folder is ever published.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Public site, dev server on :3000 (shows amber draft markers) |
| `npm run build` | Public static export to `out/`, then fails if any film-only material leaked |
| `npm run film:build` / `npm run film:start` | Private film build on :3100 (scenes, console, private media) |
| `npm run film:dev` | Film build in dev mode |
| `npm run check` | Typecheck, lint, unit tests, content audit, public build + leak check |
| `npm run audit:content` | Lists missing assets, unconfirmed records and every `[TBD]` value |

## Where things live

```
src/content/      the story data: evidence, people, timeline, press, site facts (no spoilers)
src/components/   period UI components
src/app/(archive) public pages
src/stage/        public stage stubs (always UNSOLVED)
private/          film-only: stage engine, scene script, production notes, private media
docs/             PLAN.md (canon, questions, design), CLUE-PLAN.md, PRODUCTION.md
scripts/          content audit, public-build leak check, film launcher
tests/            archive search/date tests
```

Edit story content in `src/content/*.ts`. Write unknown values as `[TBD: note]`: they render as
amber chips and are listed by the audit. See `docs/PRODUCTION.md` for recording.
