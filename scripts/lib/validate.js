// Minimal validators for the two record kinds. Returns an array of problems.
const STATUSES = new Set(['draft', 'approved', 'rejected']);
const PLACE_KINDS = new Set([
  'park', 'playground', 'pool', 'spray_park', 'rec_center',
  'library', 'farmers_market', 'garden', 'trail', 'museum', 'other',
]);

function badCoord(lat, lon) {
  if (lat == null && lon == null) return false; // coords optional
  return typeof lat !== 'number' || typeof lon !== 'number' ||
    lat < -90 || lat > 90 || lon < -180 || lon > 180;
}

export function validateHappening(r) {
  const e = [];
  for (const k of ['id', 'source', 'title', 'start', 'url', 'status']) if (!r[k]) e.push(`missing ${k}`);
  if (r.status && !STATUSES.has(r.status)) e.push(`bad status ${r.status}`);
  if (r.start && isNaN(Date.parse(r.start))) e.push(`unparseable start ${r.start}`);
  if (r.end && isNaN(Date.parse(r.end))) e.push(`unparseable end ${r.end}`);
  if (r.venue && badCoord(r.venue.lat, r.venue.lon)) e.push('bad venue coords');
  if (r.age_min_m != null && r.age_max_m != null && r.age_min_m > r.age_max_m) e.push('age range inverted');
  return e;
}

export function validatePlace(r) {
  const e = [];
  for (const k of ['id', 'source', 'name', 'kind', 'status']) if (!r[k]) e.push(`missing ${k}`);
  if (r.status && !STATUSES.has(r.status)) e.push(`bad status ${r.status}`);
  if (r.kind && !PLACE_KINDS.has(r.kind)) e.push(`unknown kind ${r.kind}`);
  if (badCoord(r.lat, r.lon)) e.push('bad coords');
  return e;
}
