// DC Public Library events via the Communico (libnet.info) calendar JSON.
// The public site is https://dclibrary.libnet.info/events; the JSON endpoint
// behind it is captured once via DevTools and pasted into config.endpoint
// (see this skill's SKILL.md). Field names vary slightly across Communico
// tenants, so everything below reads defensively.
import { readFileSync } from 'node:fs';
import { stableId, stripHtml, isLittleKidRelevant, ageMonthsFromText, etIso, USER_AGENT } from '../lib/normalize.js';

export async function fetchRecords(cfg, ctx) {
  let raw;
  if (ctx.fixture) {
    raw = JSON.parse(readFileSync(ctx.fixture, 'utf8'));
  } else {
    if (!cfg.endpoint) {
      throw new Error('config.endpoint not set; one-time DevTools step in skills/dcpl-events/SKILL.md');
    }
    const res = await fetch(cfg.endpoint, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Communico HTTP ${res.status}`);
    raw = await res.json();
  }
  const events = Array.isArray(raw) ? raw : raw.events || raw.data || [];
  const horizon = Date.now() + (cfg.days_ahead || 30) * 86400000;
  const out = [];
  for (const ev of events) {
    const ages = [].concat(ev.ages || ev.age_groups || ev.audiences || []).join(' ');
    const desc = stripHtml(ev.description || ev.short_description || '');
    const text = `${ev.title} ${ages} ${desc}`;
    if (!isLittleKidRelevant(text)) continue;
    const startRaw = ev.event_start || ev.start || ev.starttime ||
      (ev.date && ev.time_start ? `${ev.date} ${ev.time_start}` : null);
    if (!startRaw) continue;
    const start = etIso(String(startRaw));
    if (isNaN(Date.parse(start)) || Date.parse(start) > horizon) continue;
    const endRaw = ev.event_end || ev.end || ev.endtime || null;
    const age = ageMonthsFromText(text);
    const branch = stripHtml(ev.location || ev.branch || ev.library || ev.location_name || '');
    out.push({
      id: stableId('dcpl', ev.id || ev.event_id || ev.title, startRaw),
      source: ctx.skill.name,
      title: stripHtml(ev.title),
      desc: desc.slice(0, 400),
      start,
      end: endRaw ? etIso(String(endRaw)) : null,
      venue: { name: branch || null, address: null, lat: null, lon: null },
      age_min_m: age ? age.min : null,
      age_max_m: age ? age.max : null,
      cost: 'free', // DCPL programs are free
      setting: 'out',
      weather: 'indoor_only',
      url: ev.url || (ev.id ? `${cfg.event_base_url}${ev.id}` : cfg.calendar_url),
      status: 'draft',
      fetched_at: new Date().toISOString(),
    });
  }
  ctx.log(`${out.length} little-kid happenings kept of ${events.length} events`);
  return out;
}
