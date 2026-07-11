---
name: dc-farmers-markets
kind: places
cadence: weekly
fetcher: scripts/fetchers/dc-open-data.js
fixture: dc-farmers-markets.sample.geojson
enabled: false
---

# DC Farmers Markets

## What it feeds

Evergreen **places**: farmers market locations with season/day/hours
attributes. Markets are stealth-great toddler anchors — food theme, free
samples, dogs to point at, live music half the time. Feeds v-19/v-20-style
activities with more candidates ("Eastern Market lap" generalizes).

## Endpoint

Open Data DC farmers markets dataset (points, CC-BY). Find it by searching
"farmers markets" at https://opendata.dc.gov — same hub download API as the
other DC skills.

## One-time setup (1 minute) — why `enabled: false` for now

1. Search "farmers markets" on opendata.dc.gov and open the current dataset.
2. Copy the **GeoJSON** URL from its API/download resources.
3. Paste into `config.json` → `geojson_url`, run
   `node scripts/run.js --skill dc-farmers-markets`, flip `enabled: true`.

## Field mapping

| DC GIS | normalized |
|---|---|
| `NAME`/`MARKETNAME` | `name` |
| point geometry | `lat`/`lon` |
| `ADDRESS` | `address` |
| `OPEN_SEASON`, `DAYS`, `HOURS`, `SNAP`, `WIC` | `attrs` (day/season data is why this source earns its keep) |
| `GIS_ID`/`OBJECTID` | `id` (prefix `dcfm`) |

## Quirks

- `kind` is always `farmers_market`; no classification rules needed.
- Hours/season live in free-text attributes — surface them in review, don't
  parse them. A market's "Sat 9–1, Apr–Dec" is for a human to sanity-check.
- Weekly cadence is honestly overkill (markets change yearly); it rides the
  weekly places cron for simplicity.

## Manual run

```bash
node scripts/run.js --skill dc-farmers-markets
node scripts/run.js --skill dc-farmers-markets --fixtures
```
