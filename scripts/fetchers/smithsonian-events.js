// Smithsonian Institution events via the Trumba JSON feed behind si.edu/events.
// Covers all SI museums plus the National Zoo in one feed.
import { readFileSync } from 'node:fs';
import { stableId, stripHtml, isLittleKidRelevant, ageMonthsFromText, etIso, USER_AGENT } from '../lib/normalize.js';

export async function fetchRecords(cfg, ctx) {
  let raw;
  if (ctx.fixture) {
    raw = JSON.parse(readFileSync(ctx.fixture, 'utf8'));
  } else {
    const res = await fetch(cfg.feed_url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Trumba HTTP ${res.status} for ${cfg.feed_url}`);
    raw = await res.json();
  }
  const events = Array.isArray(raw) ? raw : raw.events || [];
  const horizon = Date.now() + (cfg.days_ahead || 45) * 86400000;
  const out = [];
  for (const ev of events) {
    // Trumba custom fields carry audience/cost as label-value pairs
    const custom = {};
    for (const f of ev.customFields || []) custom[String(f.label || '').toLowerCase()] = stripHtml(f.value);
    const audience = custom['audience'] || custom['event audience'] || '';
    const desc = stripHtml(ev.description);
    const text = `${ev.title} ${desc} ${audience}`;
    if (cfg.family_only !== false && !isLittleKidRelevant(text)) continue;
    if (!ev.startDateTime) continue;
    const start = etIso(ev.startDateTime);
    if (Date.parse(start) > horizon) continue;
    const costText = custom['cost'] || custom['fee'] || custom['admission'] || '';
    const age = ageMonthsFromText(text);
    out.push({
      id: stableId('sie', ev.eventID || ev.permaLinkUrl || ev.title, ev.startDateTime),
      source: ctx.skill.name,
      title: stripHtml(ev.title),
      desc: desc.slice(0, 400),
      start,
      end: ev.endDateTime ? etIso(ev.endDateTime) : null,
      venue: { name: stripHtml(ev.location) || null, address: null, lat: null, lon: null },
      age_min_m: age ? age.min : null,
      age_max_m: age ? age.max : null,
      cost: /free|no charge|included/i.test(costText) ? 'free' : costText ? 'paid' : 'unknown',
      setting: 'out',
      weather: 'unknown',
      url: ev.permaLinkUrl || ev.eventActionUrl || cfg.calendar_url,
      status: 'draft',
      fetched_at: new Date().toISOString(),
    });
  }
  ctx.log(`${out.length} family happenings kept of ${events.length} events`);
  return out;
}
