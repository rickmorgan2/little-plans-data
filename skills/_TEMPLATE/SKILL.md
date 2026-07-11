---
name: my-source
kind: happenings
cadence: daily
fetcher: scripts/fetchers/my-source.js
fixture: my-source.sample.json
enabled: false
---

# My Source (template)

Copy this folder to `skills/<name>/`, fill in the frontmatter, write the docs
below, and add a `config.json` next to this file. That's the whole convention.

## Frontmatter keys (all required)

| key | meaning |
|---|---|
| `name` | folder name; also the source id stamped on every record |
| `kind` | `happenings` (dated events) or `places` (evergreen venues) |
| `cadence` | `daily`, `weekly`, or `monthly`; the cron in `.github/workflows/collect.yml` maps to these |
| `fetcher` | path to the fetcher module, which exports `async fetchRecords(config, ctx)` |
| `fixture` | sample payload in `fixtures/` used by `--fixtures` mode and CI |
| `enabled` | `false` parks a source without deleting it (fixtures mode still tests it) |

Machine config (endpoints, field names, filters) lives in `config.json` so the
runner never has to parse prose. This file is for humans: what the source is,
why we take it, its quirks, and the one-time setup if any.

## Sections every skill should have

1. **What it feeds** — which record kind, roughly how many records, why it matters for a 6mo–5yr planner.
2. **Endpoint** — the URL(s), auth, and rate expectations.
3. **One-time setup** — anything to paste into `config.json` or GitHub secrets.
4. **Field mapping** — source field → normalized field table.
5. **Quirks** — pagination, pending exports, date formats, filtering caveats.
6. **Manual run** — the exact command.

## Manual run

```bash
node scripts/run.js --skill my-source            # live
node scripts/run.js --skill my-source --fixtures # against the sample payload
```
