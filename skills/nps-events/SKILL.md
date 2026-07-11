---
name: nps-events
kind: happenings
cadence: daily
fetcher: scripts/fetchers/nps-events.js
fixture: nps.sample.json
enabled: true
---

# National Park Service Events (DC area)

## What it feeds

Dated **happenings** from the federal parks that blanket DC: ranger story
times, junior-ranger-lite programs, nature walks, planetarium shows at Rock
Creek, lotus season at Kenilworth. Feeds venues v-15 and v-16 and everything
on the Mall.

## Endpoint

Official NPS API: `https://developer.nps.gov/api/v1/events` filtered by
`parkCode`. Public-domain data, generous limits (1,000 req/hour), needs a
free API key.

Park codes in `config.json`:

| code | park |
|---|---|
| `nama` | National Mall & Memorial Parks |
| `rocr` | Rock Creek Park (incl. Nature Center & Planetarium) |
| `anac` | Anacostia Park (incl. the roller rink) |
| `keaq` | Kenilworth Park & Aquatic Gardens |
| `choh` | C&O Canal (Georgetown + Great Falls MD side) |
| `gwmp` | GW Memorial Parkway (Great Falls VA side, Roosevelt Island) |

## One-time setup

1. Get a free key: https://www.nps.gov/subjects/developer/get-started.htm
2. Locally: `export NPS_API_KEY=...` (or put it in your shell profile).
3. GitHub: repo Settings → Secrets and variables → Actions → new secret
   `NPS_API_KEY`. The collect workflow already passes it through.

## Field mapping

| NPS | normalized |
|---|---|
| `title` | `title` |
| `description` (HTML) | `desc` (stripped, 400 chars) |
| `dates[]` + `times[0].timestart` | one happening per date, `start` in ET |
| `parkfullname` | `venue.name` |
| `isfree` | `cost` |
| `infourl` | `url` |
| `id` + date | `id` (stable hash, prefix `nps`) |

## Quirks

- Events are recurrence definitions with a `dates[]` array; the fetcher
  expands each future date within the horizon into its own happening.
- `times` uses 12-hour strings ("10:00 AM"); converted in `to24h`.
- Most programs are outdoors; `weather` ships as `any` and review tightens it.
- The family keyword gate is on; NPS tags/categories help it along.

## Manual run

```bash
NPS_API_KEY=... node scripts/run.js --skill nps-events
node scripts/run.js --skill nps-events --fixtures
```
