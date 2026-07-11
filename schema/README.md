# Data contract

Two record kinds. Field names deliberately mirror the corpus schema in
`activities.json` (`age_min_m`, `weather`, `setting`, `themes`, `status`) so
the app and the review tooling speak one language. Validation lives in
`scripts/lib/validate.js`; every record is checked before it's written.

## Happening (dated event)

```json
{
 "id": "dcpl-1a2b3c4d5e",
 "source": "dcpl-events",
 "title": "Toddler Story Time",
 "desc": "Books, songs, rhymes, and movement.",
 "start": "2026-07-21T10:30:00-04:00",
 "end": "2026-07-21T11:15:00-04:00",
 "venue": { "name": "Southeast Neighborhood Library", "address": null, "lat": null, "lon": null },
 "age_min_m": 18,
 "age_max_m": 36,
 "cost": "free",
 "setting": "out",
 "weather": "indoor_only",
 "url": "https://dclibrary.libnet.info/event/16638566",
 "status": "draft",
 "fetched_at": "2026-07-11T10:17:03.000Z"
}
```

Required: `id`, `source`, `title`, `start`, `url`, `status`.
`start`/`end` carry an explicit UTC offset (Eastern). `cost` is
`free`/`paid`/`unknown`. `age_*_m` are months, null when the source doesn't
say. `weather` uses the corpus vocabulary (`any`/`dry`/`indoor_only`) plus
`unknown` for review to resolve.

## Place (evergreen venue)

```json
{
 "id": "dcrf-9f8e7d6c5b",
 "source": "dc-rec-facilities",
 "name": "Canal Park Spray Plaza",
 "kind": "spray_park",
 "address": "200 M St SE",
 "lat": 38.8768,
 "lon": -77.0016,
 "url": "https://dpr.dc.gov/locations",
 "attrs": { "ward": "6" },
 "status": "draft",
 "first_seen": "2026-07-13T11:23:01.000Z",
 "last_seen": "2026-07-13T11:23:01.000Z"
}
```

Required: `id`, `source`, `name`, `kind`, `status`. Kinds: `park`,
`playground`, `pool`, `spray_park`, `rec_center`, `library`,
`farmers_market`, `garden`, `trail`, `museum`, `other`. `first_seen` and
`last_seen` are maintained by the merge; a place whose `last_seen` goes stale
has probably left the source dataset.

## Status lifecycle (the moat rule)

Everything enters as `draft`. Promotion to `approved` (or `rejected`) is a
human decision made in review — same philosophy as the activity corpus.
The merge in `scripts/lib/store.js` **always preserves an existing record's
status**, so re-collection never undoes review work. The published feed keeps
the status field; the app decides whether drafts are shown (they shouldn't be,
outside your own testing).
