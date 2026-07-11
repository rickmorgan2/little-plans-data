// Shared normalizers used by every fetcher. Zero dependencies.
import { createHash } from 'node:crypto';

export const USER_AGENT = 'little-plans-data/0.1 (+https://littleplans.co)';

// Stable short id from a source prefix plus any identifying parts
export function stableId(prefix, ...parts) {
  const h = createHash('sha1').update(parts.map(String).join('|')).digest('hex').slice(0, 10);
  return `${prefix}-${h}`;
}

// Good-enough HTML to text for event descriptions
export function stripHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Keyword gate for the 6mo-5yr audience; exclusions win over inclusions
const KID_WORDS = /\b(stor(?:y|ies)\s?times?|storytimes?|toddlers?|preschool|pre-?k\b|bab(?:y|ies)|infants?|lap\s?time|little\s?ones?|kids?|children|famil(?:y|ies)|sing-?\s?along|puppets?|play\s?dates?|sensory|all\s+ages)\b/i;
const NOT_KID = /\b(teens?|adults?(\s+only)?|18\s?\+|21\s?\+|grades?\s+(?:[6-9]|1[0-2])\b|seniors?|wine|happy\s+hour)\b/i;

export function isLittleKidRelevant(text) {
  if (!text) return false;
  if (NOT_KID.test(text)) return false;
  return KID_WORDS.test(text);
}

// Parse an age range in months out of free text; null when nothing credible found
export function ageMonthsFromText(text) {
  if (!text) return null;
  const t = String(text).toLowerCase();
  let m;
  if ((m = t.match(/(\d+)\s*(?:-|to|through)\s*(\d+)\s*months?/))) return { min: +m[1], max: +m[2] };
  if ((m = t.match(/birth\s*(?:-|to|through)\s*(\d+)\s*months?/))) return { min: 0, max: +m[1] };
  if ((m = t.match(/birth\s*(?:-|to|through)\s*(?:age\s*)?(\d+)/))) return { min: 0, max: +m[1] * 12 };
  if ((m = t.match(/ages?\s*(\d+)\s*(?:-|to|through)\s*(\d+)/))) return { min: +m[1] * 12, max: +m[2] * 12 };
  if ((m = t.match(/(\d+)\s*(?:-|to|through)\s*(\d+)\s*years?/))) return { min: +m[1] * 12, max: +m[2] * 12 };
  if ((m = t.match(/(\d+)\s*(?:and|&)\s*under/))) return { min: 0, max: +m[1] * 12 };
  if ((m = t.match(/under\s*(\d+)/))) return { min: 0, max: +m[1] * 12 };
  if (/all\s+ages/.test(t)) return { min: 0, max: null };
  return null;
}

// Append the correct America/New_York UTC offset to a naive local timestamp.
// Passes through strings that already carry an offset or Z. DST edge hours are
// approximated by the same day's offset, which is fine for event listings.
export function etIso(local) {
  let s = String(local).trim().replace(' ', 'T');
  if (/(?:Z|[+-]\d{2}:\d{2})$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += 'T09:00:00'; // date-only defaults to morning
  const probe = new Date(s + 'Z');
  if (isNaN(probe)) return s;
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'longOffset' }).formatToParts(probe);
  const off = (parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT-05:00').replace('GMT', '');
  return s + (off || '-05:00');
}

// Case-insensitive first non-empty property lookup
export function pick(obj, keys) {
  if (!obj) return null;
  const lower = {};
  for (const [k, v] of Object.entries(obj)) lower[k.toLowerCase()] = v;
  for (const k of keys) {
    const v = lower[String(k).toLowerCase()];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return null;
}

// Bounding-box center of any GeoJSON geometry; fine at DC-parcel scale
export function centroid(geom) {
  if (!geom || !geom.coordinates) return { lat: null, lon: null };
  if (geom.type === 'Point') return { lat: geom.coordinates[1], lon: geom.coordinates[0] };
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  (function walk(c) {
    if (typeof c[0] === 'number') {
      minLon = Math.min(minLon, c[0]); maxLon = Math.max(maxLon, c[0]);
      minLat = Math.min(minLat, c[1]); maxLat = Math.max(maxLat, c[1]);
    } else c.forEach(walk);
  })(geom.coordinates);
  if (!isFinite(minLat)) return { lat: null, lon: null };
  return { lat: (minLat + maxLat) / 2, lon: (minLon + maxLon) / 2 };
}
