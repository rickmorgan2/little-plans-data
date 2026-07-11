#!/usr/bin/env node
// Optional mirror of the flat-file data into Supabase via PostgREST upserts.
// Deliberately a no-op unless both env vars are set, so the collect workflow
// can always call it. Zero dependencies: plain fetch against the REST API.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.log('Supabase env not set; skipping sync (flat files remain the source of truth).');
  process.exit(0);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates',
};

function loadAll(kind) {
  const dir = path.join(ROOT, 'data', kind);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(readFileSync(path.join(dir, f), 'utf8')));
}

// Flatten the JSON record shapes onto the SQL columns
const mapHappening = (h) => ({
  id: h.id, source: h.source, title: h.title, descr: h.desc ?? null,
  starts_at: h.start, ends_at: h.end ?? null,
  venue_name: h.venue?.name ?? null, address: h.venue?.address ?? null,
  lat: h.venue?.lat ?? null, lon: h.venue?.lon ?? null,
  age_min_m: h.age_min_m ?? null, age_max_m: h.age_max_m ?? null,
  cost: h.cost ?? null, setting: h.setting ?? null, weather: h.weather ?? null,
  url: h.url ?? null, attrs: h.attrs ?? {}, status: h.status, fetched_at: h.fetched_at ?? null,
});
const mapPlace = (p) => ({
  id: p.id, source: p.source, name: p.name, kind: p.kind,
  address: p.address ?? null, lat: p.lat ?? null, lon: p.lon ?? null,
  url: p.url ?? null, attrs: p.attrs ?? {}, status: p.status,
  first_seen: p.first_seen ?? null, last_seen: p.last_seen ?? null,
});

async function upsert(table, rows) {
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const res = await fetch(`${URL}/rest/v1/${table}?on_conflict=id`, {
      method: 'POST', headers: HEADERS, body: JSON.stringify(chunk),
    });
    if (!res.ok) throw new Error(`${table} upsert HTTP ${res.status}: ${await res.text()}`);
  }
  console.log(`${table}: upserted ${rows.length}`);
}

await upsert('happenings', loadAll('happenings').map(mapHappening));
await upsert('places', loadAll('places').map(mapPlace));
