// National Park Service events for DC-area parks via the official NPS API.
// Free key: https://www.nps.gov/subjects/developer/get-started.htm
// Events carry a dates[] array of occurrences; each becomes one happening.
import { readFileSync } from 'node:fs';
import { stableId, stripHtml, isLittleKidRelevant, ageMonthsFromText, etIso, USER_AGENT } from '../lib/normalize.js';

// "10:30 AM" to "10:30:00"
function to24h(s) {
  const m = String(s || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return '10:00:00';
  let h = +m[1];
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m[2]}:00`;
}

export async function fetchRecords(cfg, ctx) {
  let payload;
  if (ctx.fixture) {
    payload = JSON.parse(readFileSync(ctx.fixture, 'utf8'));
  } else {
    const key = process.env[cfg.api_key_env || 'NPS_API_KEY'];
    if (!key) throw new Error(`${cfg.api_key_env || 'NPS_API_KEY'} not set (free key at nps.gov/subjects/developer)`);
    const url = `https://developer.nps.gov/api/v1/events?parkCode=${cfg.park_codes.join(',')}&pageSize=${cfg.page_size || 100}&api_key=${key}`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`NPS API HTTP ${res.status}`);
    payload = await res.json();
  }
  const horizon = Date.now() + (cfg.days_ahead || 45) * 86400000;
  const recent = Date.now() - 86400000;
  const out = [];
  for (const ev of payload.data || []) {
    const desc = stripHtml(ev.description);
    const text = `${ev.title} ${desc} ${(ev.tags || []).join(' ')} ${ev.category || ''}`;
    if (cfg.family_only !== false && !isLittleKidRelevant(text)) continue;
    const dates = ev.dates && ev.dates.length ? ev.dates : ev.date ? [ev.date] : [];
    const t = (ev.times && ev.times[0]) || {};
    const age = ageMonthsFromText(text);
    for (const d of dates) {
      const start = etIso(`${d}T${to24h(t.timestart)}`);
      const ts = Date.parse(start);
      if (isNaN(ts) || ts < recent || ts > horizon) continue;
      out.push({
        id: stableId('nps', ev.id || ev.title, d),
        source: ctx.skill.name,
        title: stripHtml(ev.title),
        desc: desc.slice(0, 400),
        start,
        end: t.timeend ? etIso(`${d}T${to24h(t.timeend)}`) : null,
        venue: { name: ev.parkfullname || ev.location || null, address: null, lat: null, lon: null },
        age_min_m: age ? age.min : null,
        age_max_m: age ? age.max : null,
        cost: ev.isfree === true || ev.isfree === 'true' ? 'free' : 'unknown',
        setting: 'out',
        weather: 'any', // mostly outdoors; review pass can tighten
        url: ev.infourl || cfg.calendar_url,
        status: 'draft',
        fetched_at: new Date().toISOString(),
      });
    }
  }
  ctx.log(`${out.length} family happenings kept of ${(payload.data || []).length} events`);
  return out;
}
