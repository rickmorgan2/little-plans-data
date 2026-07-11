// Flat-file store. One JSON array per source under data/<kind>/<skill>.json,
// merged feeds under data/feed/. Swappable for Supabase later (see supabase/).
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

export function readJson(file, fallback) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return fallback; }
}

export function writeJson(file, obj) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(obj, null, 1) + '\n');
}

// Merge a fresh fetch into what we already have.
// Crucial rule: an existing record's status wins, so review decisions
// (approved/rejected) survive every refresh.
export function mergeRecords(existing, incoming, nowIso, kind) {
  const byId = new Map(existing.map((r) => [r.id, r]));
  let added = 0, updated = 0;
  for (const rec of incoming) {
    const prev = byId.get(rec.id);
    if (prev) {
      rec.status = prev.status;
      if (kind === 'places') rec.first_seen = prev.first_seen || nowIso;
      updated++;
    } else {
      if (kind === 'places') rec.first_seen = nowIso;
      added++;
    }
    if (kind === 'places') rec.last_seen = nowIso;
    byId.set(rec.id, rec);
  }
  let records = [...byId.values()];
  if (kind === 'happenings') {
    const cutoff = Date.now() - 24 * 3600 * 1000; // drop happenings that have ended
    records = records.filter((r) => {
      const t = Date.parse(r.end || r.start);
      return isNaN(t) ? true : t >= cutoff;
    });
    records.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  } else {
    records.sort((a, b) => a.id.localeCompare(b.id));
  }
  return { records, added, updated };
}

// Concatenate every source file per kind into one feed the app can fetch.
// The feed keeps the status field; the app decides whether to show drafts.
export function buildFeeds(dataDir) {
  for (const kind of ['happenings', 'places']) {
    const dir = path.join(dataDir, kind);
    const all = [];
    if (existsSync(dir)) {
      for (const f of readdirSync(dir).sort()) {
        if (f.endsWith('.json')) all.push(...readJson(path.join(dir, f), []));
      }
    }
    if (kind === 'happenings') all.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    writeJson(path.join(dataDir, 'feed', `${kind}.json`), {
      generated: new Date().toISOString(),
      count: all.length,
      [kind]: all,
    });
  }
}
