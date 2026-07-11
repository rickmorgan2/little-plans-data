<<<<<<< HEAD
# little-plans-data

Data collection and curation pipeline for **Little Plans**. It gathers DC-area
places (pools, spray parks, playgrounds, parks, markets) and dated happenings
(story times, museum family programs, ranger events) from open sources,
normalizes them into the corpus vocabulary, and publishes static JSON feeds
the app can consume — all as `status: draft` until a human approves them.

Zero runtime dependencies. Node 20+ and nothing else. Same philosophy as the
app: vanilla, auditable, no framework.

```
skills/<source>/SKILL.md ─┐   (docs + cadence frontmatter)
skills/<source>/config.json ─┤ (endpoints, field maps, filters)
                             ▼
        scripts/run.js  ── fetch → normalize → validate → merge
                             │        (review status always preserved)
                             ▼
        data/happenings/*.json   data/places/*.json     (one file per source)
                             ▼
        data/feed/happenings.json  data/feed/places.json  (what the app reads)
```

Recommendation: keep this as its **own repo** next to the app repo. The cron
commits daily data churn; you don't want that noise in the app's history.

## Quickstart

```bash
npm test                                   # fixtures only, no network
node scripts/run.js --cadence all          # live collect, everything enabled
node scripts/run.js --skill smithsonian-events   # one source
node scripts/run.js --skill dcpl-events --fixtures  # dry-run a parser
```

Output lands in `data/`. `data/runs.log.jsonl` records every run with counts
and errors — your first stop when a cron goes red.

## The skill convention

Each data source is a folder in `skills/` with two files:

- **SKILL.md** — human docs: what the source feeds, endpoint, quirks, field
  mapping, and the one-time setup if any. Flat YAML frontmatter carries the
  machine-relevant bits: `name`, `kind` (happenings|places), `cadence`
  (daily|weekly|monthly), `fetcher`, `fixture`, `enabled`.
- **config.json** — endpoints, field-name candidates, keyword filters.

`skills/_TEMPLATE/` documents the convention. Adding a source that matches an
existing platform (another Communico library, another DC GIS dataset) is a
new folder with a config — no new code.

## Current sources

| skill | kind | cadence | status |
|---|---|---|---|
| smithsonian-events | happenings | daily | **live** (Trumba JSON feed) |
| nps-events | happenings | daily | **live** once `NPS_API_KEY` secret is set (free) |
| dc-rec-facilities | places | weekly | **live** (pools, spray parks, rec centers) |
| dcpl-events | happenings | daily | 2-min DevTools step, then flip enabled |
| dc-parks | places | weekly | 1-min URL paste, then flip enabled |
| dc-farmers-markets | places | weekly | 1-min URL paste, then flip enabled |

Each pending skill's SKILL.md has the exact steps. `docs/future-sources.md`
is the scouting backlog (LibCal counties, MCPL, Kennedy Center, NWS weather
client-side, OSM Overpass for post-DMV scale).

## CI/CD

Two GitHub Actions workflows:

- **ci.yml** — every push/PR runs unit tests plus the full pipeline against
  local fixtures (dates auto-shifted into the future so tests never rot).
  No network, no secrets, never flaky.
- **collect.yml** — the cron. Daily at ~6:17am ET it runs the `daily`
  happenings skills; Mondays it runs the `weekly` places skills. Results are
  validated, merged, committed back to the repo, and mirrored to Supabase if
  those secrets exist. One flaky API fails soft: its error goes to
  `runs.log.jsonl`, the other sources still land. `workflow_dispatch` lets
  you run any cadence or single skill from the Actions tab.

Setup after pushing to GitHub: add the `NPS_API_KEY` secret (Settings →
Secrets → Actions), and confirm Actions has read/write permission
(Settings → Actions → General → Workflow permissions).

## Review: drafts stay drafts

Every record enters as `status: draft`, matching the corpus loop. The merge
preserves an existing record's status forever, so approving or rejecting is
never undone by the next collect. To review happenings the same way as
activities, point the review tool at a `data/happenings/*.json` file or edit
statuses directly — either way the decision sticks. The feeds keep the status
field so the app can show approved-only.

## Publishing the feed to the app

The feed is static JSON — no accounts, no tracking, one anonymous GET, which
keeps the privacy-by-architecture promise. Three options, in order of effort:

1. **Bake at build**: copy `data/feed/*.json` into the app's Docker image at
   deploy, next to `activities.json`. Simplest; feed freshness = deploy
   cadence.
2. **Serve from Caddy** (recommended once littleplans.co is live): a
   `git pull` on the server (systemd timer or the commented deploy step in
   collect.yml over SSH) and a `file_server` block for `/data/`. Fresh daily,
   no rebuild.
3. **GitHub Pages / raw**: publish `data/feed/` publicly and have the app
   fetch it. Works even before the server exists; the feed contains only
   public event data, so exposure is a non-issue.

App-side mapping is trivial by design: happenings carry corpus-vocabulary
fields (`age_min_m`, `weather`, `setting`), exact start times map onto the
five day-part windows, and place coordinates plug straight into the existing
OSRM/FOSSGIS/WMATA travel-time stack.

## Scaling up: the Supabase path

Flat files in a repo are the right database for a friends beta: versioned,
diffable, zero ops, and the review story is a text edit. When they stop being
right — multiple reviewers, thousands of happenings, an editor UI, or
server-side queries — the lift is already staged in `supabase/`:

1. Create a Supabase project; run `supabase/migrations/0001_init.sql`.
2. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as Actions secrets.

That's it. `supabase/sync.js` already runs at the end of every collect and
no-ops without those secrets; with them it upserts every record (same ids,
same shapes). RLS lets the anon key read **approved rows only**, and nothing
user-identifying ever touches the database, so the app's local-first privacy
stance survives the upgrade. Flat files remain the source of truth until you
deliberately flip that; run both for a while and compare.

## Adding a new source (the 15-minute version)

1. Copy `skills/_TEMPLATE/` to `skills/<name>/`; fill frontmatter + docs.
2. Write `config.json`. If it's a known platform (DC GIS, Communico), point
   at the existing fetcher and stop here.
3. Otherwise add `scripts/fetchers/<name>.js` exporting
   `fetchRecords(config, ctx)` returning normalized records.
4. Drop a real sample payload in `fixtures/` and reference it in frontmatter.
5. `node scripts/run.js --skill <name> --fixtures`, then live, then
   `enabled: true`. CI picks the fixture up automatically.
=======
# little-plans-data
>>>>>>> 088f17ac8a8feacb49b23a449495caea807de089
