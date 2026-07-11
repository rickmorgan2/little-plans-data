# Future data sources

The pipeline makes adding a source a one-folder job, so this is the backlog,
tiered by how ready the data is. The bar for adding one: does it produce
anchors or happenings a tired parent of a 6mo–5yr-old would actually use?

## Tier 1 — real feeds, add whenever there's an hour

- **NWS weather (`api.weather.gov`)** — free, no key, CORS-friendly. Don't
  pipeline it; fetch it **client-side in the app** at plan time and use it to
  nudge anchors (outdoor water on 95° days, `indoor_only` when it rains).
  Pairs perfectly with the existing `weather` corpus tag. One anonymous GET,
  consistent with the privacy architecture.
- **Library of Congress events** — loc.gov has a JSON API (`?fo=json` on most
  pages); the Young Readers Center programming is squarely in-audience.
- **Arlington / Alexandria / Fairfax libraries** — LibCal-based calendars
  publish documented RSS/ICS per calendar. Same shape as dcpl-events, new
  config.
- **Montgomery County Public Libraries** — Communico, same platform as DCPL
  (`mcpl.libnet.info/events?t=Storytime`). The dcpl fetcher generalizes to a
  `communico-events` fetcher with a different endpoint. Big win for MD-side
  friends in the beta.
- **More NPS park codes** — the fetcher already takes a list; `prwi`
  (Prince William Forest) and `gree` (Greenbelt) extend the suburbs.

## Tier 2 — data exists, needs a scouting pass

- **DPR seasonal pool & spray park status/hours** — the rec-facilities
  dataset has locations but not "is it open right now." DPR publishes
  seasonal schedules on dpr.dc.gov; check for a structured source before
  resorting to page scraping. High value June–September; ties into the
  §17.7-style accuracy mindset — mark it DRAFT until verified.
- **Kennedy Center Millennium Stage** — free daily 6pm performances (v-08).
  Check for an ICS/JSON behind their calendar; the evening slot fits the
  evening day-part window.
- **National Gallery of Art** — family programs and the Sculpture Garden
  (v-17). NGA has strong open-data habits (collection data on GitHub); the
  events feed needs a look.
- **Glen Echo Park** — the carousel, Adventure Theatre, puppet company. An
  NPS site run by a partnership; events on glenechopark.org.
- **US Botanic Garden & National Arboretum events** (v-09, v-10) — both post
  family programs; check USBG's calendar and FONA's for feeds.
- **Capital Bikeshare GBFS** — real-time station status is a documented open
  feed. Not activities per se, but "bike-seat ride to X" support activities
  could check dock availability near home base.
- **Montgomery / Arlington / PG County open data portals** — dataMontgomery
  and friends carry playgrounds, parks, and spray pads in the same ArcGIS
  shapes the dc-open-data fetcher already parses. Suburb expansion is mostly
  config, not code.
- **OpenStreetMap via Overpass** — `leisure=playground` POIs everywhere,
  including ones DC GIS misses. This is the geographic escape hatch when
  Little Plans leaves the DMV. Mind the Overpass fair-use policy (cache
  aggressively, off-peak cron).

## Tier 3 — valuable but fiddly; revisit deliberately

- **Eventbrite** — lots of family events, but the public search API was
  deprecated; per-organizer endpoints still work. Would mean curating a list
  of trusted kid-event organizers rather than open search.
- **Destination DC (washington.org) / local parenting calendars** — rich but
  scrape-only; check terms of service before touching, and prefer asking for
  a feed. A friendly email sometimes just works.
- **KID Museum, Imagination Stage, National Children's Museum (v-11)** —
  individually small; a shared `ics-generic` fetcher would make each one a
  config file if they publish calendar subscriptions.
- **Smithsonian Open Access API (api.si.edu)** — collections, not events,
  but a fun future feature: "find the T. rex" scavenger-hunt supports
  generated from object metadata. Corpus enrichment, not happenings.

## Ground rules for every new source

1. One polite fetch per cadence with our User-Agent; we're a guest.
2. Respect licenses: DC open data is CC-BY (credit it in the app's about
   page), NPS is public domain, feeds are for subscribing — scraping HTML is
   the last resort and only where terms allow.
3. Everything lands as `status: draft`. The corpus is the moat because a
   human vetted it; automated ingestion never skips that gate.
4. New source = new `skills/<name>/` folder + fixture + config. If it needs
   a new fetcher, write the fixture first.
