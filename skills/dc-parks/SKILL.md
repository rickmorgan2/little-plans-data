---
name: dc-parks
kind: places
cadence: weekly
fetcher: scripts/fetchers/dc-open-data.js
fixture: dc-parks.sample.geojson
enabled: false
---

# DC Parks (DPR Parks and Recreation Areas)

## What it feeds

Evergreen **places**: every DPR park polygon — including the pocket parks
and triangle parks that never show up in a Google search but are a
stroller-distance anchor ("any playground" activities get real candidates).
Amenity attributes flag playgrounds, gardens, and trails.

## Endpoint

Open Data DC dataset **Parks and Recreation Areas** (DPR, CC-BY), polygons.
Dataset page: https://opendata.dc.gov/datasets/parks-and-recreation-areas

Fetched as GeoJSON via the hub download API once the item id or full URL is
pasted into `config.json` (see below).

## One-time setup (1 minute) — why `enabled: false` for now

1. Open the dataset page above.
2. "I want to use this" → API/download resources → copy the **GeoJSON** URL.
3. Paste it into `config.json` → `geojson_url`.
4. `node scripts/run.js --skill dc-parks`, eyeball the output, flip
   `enabled: true`.

(Prefilling the id from memory risks a stale identifier; a 1-minute paste
from the live page is more reliable. Same pattern as dc-farmers-markets.)

## Field mapping

| DC GIS | normalized |
|---|---|
| `NAME`/`PARK_NAME` | `name` |
| type/amenity fields | `kind` via `kind_rules` (playground/spray/pool/garden/trail, default `park`) |
| `ADDRESS` | `address` |
| polygon geometry | `lat`/`lon` (bbox center — fine at park scale) |
| `GIS_ID`/`OBJECTID` | `id` (prefix `dcpk`) |
| `WARD`, `ACREAGE`, `AMENITIES`, `WOODED_AREA` | `attrs` |

## Quirks

- Polygons, not points: centroid is a bbox center, which can land oddly on
  L-shaped parks. Good enough for travel-time estimates; flag exceptions in
  review.
- Overlaps with dc-rec-facilities are expected (a rec center sits inside its
  park). Different id prefixes keep them distinct; dedupe-by-proximity is a
  curation decision, not a pipeline one.

## Manual run

```bash
node scripts/run.js --skill dc-parks
node scripts/run.js --skill dc-parks --fixtures
```
