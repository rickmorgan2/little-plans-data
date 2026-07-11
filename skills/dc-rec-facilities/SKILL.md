---
name: dc-rec-facilities
kind: places
cadence: weekly
fetcher: scripts/fetchers/dc-open-data.js
fixture: dc-rec-facilities.sample.geojson
enabled: true
---

# DC Recreation Facilities (DPR)

## What it feeds

Evergreen **places**: DPR recreation centers, pools, spray parks, and
playground-bearing facilities as points with addresses and coordinates.
This is the venue backbone for summer water anchors (spray park runs, pool
mornings — v-03 territory) and rainy-day rec-center fallbacks.

## Endpoint

Open Data DC (ArcGIS Hub), dataset **Recreation Facilities**, published by
DPR/OCTO under CC-BY. Fetched as GeoJSON through the hub download API:

```
https://opendata.dc.gov/api/download/v1/items/7122c1c815314588abe5c1864da8a355/geojson?layers=3
```

Dataset page: https://opendata.dc.gov/datasets/7122c1c815314588abe5c1864da8a355

## One-time setup

None — item id and layer are prefilled. If DC re-publishes the dataset under
a new item id (it happens every few years), open the dataset page, hit
"I want to use this" → API/download resources, and update `item_id`/`layer`
or paste the full URL into `geojson_url`, which takes precedence.

## Field mapping

| DC GIS | normalized |
|---|---|
| `NAME`/`FACILITY_NAME` | `name` |
| `FEATURE_TYPE`/`USE_TYPE`/... | `kind` via `kind_rules` keywords (spray→`spray_park`, pool→`pool`, playground→`playground`, else `rec_center`) |
| `ADDRESS`/`FULLADDRESS` | `address` |
| geometry | `lat`/`lon` (bbox center) |
| `GIS_ID`/`OBJECTID` | `id` (stable hash, prefix `dcrf`) |
| `WARD`, `PHONE`, `STATUS` | `attrs` |

## Quirks

- The hub download API sometimes returns a pending-export stub while it
  regenerates the file; the fetcher polls up to 4 times.
- Field names in DC GIS layers drift between republications; every lookup is
  a case-insensitive multi-candidate pick, so drift usually costs nothing.
- Seasonal pool/spray operating status is NOT in this dataset — that's a
  future source (DPR seasonal pages, see docs/future-sources.md).

## Manual run

```bash
node scripts/run.js --skill dc-rec-facilities
node scripts/run.js --skill dc-rec-facilities --fixtures
```
