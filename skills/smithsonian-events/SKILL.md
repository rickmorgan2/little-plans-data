---
name: smithsonian-events
kind: happenings
cadence: daily
fetcher: scripts/fetchers/smithsonian-events.js
fixture: trumba.sample.json
enabled: true
---

# Smithsonian Events

## What it feeds

Dated **happenings** across every SI museum plus the National Zoo — story
times, sleepovers-lite, family days, hands-on programs. One feed covers
venues v-01, v-02, v-12, v-14, v-18 in the corpus and then some. This is the
single richest free happenings stream in the city for our audience.

## Endpoint

The calendar at `si.edu/events` is published through Trumba, which exposes
standard machine feeds for every published calendar. The SI calendar's web
name is `smithsonian-events`, so:

- JSON (what we use): `https://www.trumba.com/calendars/smithsonian-events.json`
- ICS fallback: same URL with `.ics`

No auth, no key. Default feed window is about six months out. One polite
request per day with our User-Agent is far below any reasonable threshold.

## One-time setup

None expected. If the JSON URL ever 404s, open `si.edu/events`, use the
calendar's subscribe/feed links to find the current web name, and update
`feed_url` in `config.json`.

## Field mapping

| Trumba | normalized |
|---|---|
| `title` | `title` |
| `description` (HTML) | `desc` (stripped, 400 chars) |
| `startDateTime` / `endDateTime` (naive ET) | `start` / `end` (ET offset appended) |
| `location` | `venue.name` |
| `customFields` label `Audience` | relevance filter + age parsing |
| `customFields` label `Cost`/`Fee`/`Admission` | `cost` (`free`/`paid`/`unknown`) |
| `permaLinkUrl` | `url` |
| `eventID` + start | `id` (stable hash, prefix `sie`) |

## Quirks

- The feed is museum-wide, mostly adult programming. The fetcher keeps only
  events passing the little-kid keyword gate (`isLittleKidRelevant`), checking
  title + description + audience field. Expect a keep rate around 5–15%.
- Custom field labels have shifted over the years; the fetcher reads them
  case-insensitively and treats them as optional.
- Zoo and Folklife events are outdoors; `weather` ships as `unknown` and the
  review pass tightens it.

## Manual run

```bash
node scripts/run.js --skill smithsonian-events
node scripts/run.js --skill smithsonian-events --fixtures
```
