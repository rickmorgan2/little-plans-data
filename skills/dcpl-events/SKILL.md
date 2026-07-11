---
name: dcpl-events
kind: happenings
cadence: daily
fetcher: scripts/fetchers/dcpl-events.js
fixture: communico.sample.json
enabled: false
---

# DC Public Library Events

## What it feeds

Dated **happenings**: story times, baby lap times, sensory play, sing-alongs
across 26 branches. For the 6mo–5yr crowd this is arguably the highest-density
source in the city — free, indoor, weekday-morning-heavy, i.e. exactly the
shape of a Little Plans anchor. Feeds venues v-07 and v-13 and adds the other
two dozen branches.

## Endpoint

DCPL runs its calendar on **Communico** at
`https://dclibrary.libnet.info/events`. The page is a JS app fed by a JSON
endpoint on the same host. Communico doesn't document that endpoint publicly,
which is why there's a one-time capture step below. The parser reads field
names defensively because Communico tenants vary slightly.

## One-time setup (2 minutes) — why `enabled: false` for now

1. Open `https://dclibrary.libnet.info/events` in a browser.
2. DevTools → Network → filter XHR/Fetch → reload. Look for the request
   returning the event list as JSON (on Communico sites it's typically named
   something like `eeventcaldata`, with the query encoding date range and
   filters).
3. Copy that request URL into `config.json` → `endpoint`. If the URL encodes
   a date range, widen it or note whether it's relative.
4. Run `node scripts/run.js --skill dcpl-events`, eyeball the output, then
   flip `enabled: true` in the frontmatter.

If the captured shape doesn't match the parser, run once with `--fixtures`,
compare against `fixtures/communico.sample.json`, and adjust the field
pickers in the fetcher — they're all in one place at the top of the loop.

## Field mapping

| Communico (typical) | normalized |
|---|---|
| `title` | `title` |
| `description` | `desc` (stripped, 400 chars) |
| `event_start` / `start` (naive ET) | `start` (ET offset appended) |
| `ages` / `age_groups` | relevance filter + `age_min_m`/`age_max_m` |
| `location` / `branch` | `venue.name` |
| `id` | `url` (`event_base_url` + id) and stable `id` (prefix `dcpl`) |
| — | `cost` is hardcoded `free`; DCPL programs are free |

## Quirks

- Age labels are gold here ("Toddler Story Time - For children aged 18-36
  months") — the months parser catches these directly.
- Same-named story times recur weekly; the id hashes title + start so each
  occurrence is its own happening.
- Be a good citizen: one fetch per day, our User-Agent, 30-day window.

## Manual run

```bash
node scripts/run.js --skill dcpl-events
node scripts/run.js --skill dcpl-events --fixtures
```
