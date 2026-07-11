// End-to-end run against fixtures. Copies fixtures into a temp dir with all
// dates shifted a few days into the future, so the test never rots as real
// time passes the dates baked into the sample files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runPipeline(fixDir, dataDir) {
  execFileSync('node', [
    path.join(ROOT, 'scripts/run.js'),
    '--cadence', 'all', '--fixtures',
    '--fixtures-dir', fixDir, '--data-dir', dataDir, '--strict',
  ], { stdio: 'pipe' });
}

test('full fixture pipeline', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'lp-data-'));
  const fixDir = path.join(tmp, 'fixtures');
  const dataDir = path.join(tmp, 'data');
  mkdirSync(fixDir);

  // shift every ISO date in the fixtures to 3 days from now
  const future = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  for (const f of readdirSync(path.join(ROOT, 'fixtures'))) {
    const txt = readFileSync(path.join(ROOT, 'fixtures', f), 'utf8').replace(/\d{4}-\d{2}-\d{2}/g, future);
    writeFileSync(path.join(fixDir, f), txt);
  }

  runPipeline(fixDir, dataDir);

  // happenings feed: only draft, only kid-relevant, adult events filtered out
  const feed = JSON.parse(readFileSync(path.join(dataDir, 'feed/happenings.json'), 'utf8'));
  assert.ok(feed.count >= 4, `expected >=4 happenings, got ${feed.count}`);
  assert.ok(feed.happenings.every((h) => h.status === 'draft'));
  assert.ok(!feed.happenings.some((h) => /lecture|book club|21\+|strenuous/i.test(h.title + h.desc)));
  assert.ok(feed.happenings.every((h) => !isNaN(Date.parse(h.start))));

  // age parsing surfaced: the DCPL toddler storytime should carry 18-36m
  const toddler = feed.happenings.find((h) => /toddler story time/i.test(h.title));
  assert.ok(toddler, 'toddler story time missing');
  assert.equal(toddler.age_min_m, 18);
  assert.equal(toddler.age_max_m, 36);

  // NPS recurrence expansion: two dates collapse to one after date-shift, so just require presence
  assert.ok(feed.happenings.some((h) => h.source === 'nps-events'));

  // places feed: kinds classified from the shared DC fetcher
  const places = JSON.parse(readFileSync(path.join(dataDir, 'feed/places.json'), 'utf8'));
  const kinds = new Set(places.places.map((p) => p.kind));
  for (const k of ['pool', 'spray_park', 'rec_center', 'park', 'playground', 'farmers_market']) {
    assert.ok(kinds.has(k), `missing place kind ${k}`);
  }
  assert.ok(places.places.every((p) => p.lat > 38 && p.lat < 40 && p.lon < -76 && p.lon > -78));
  assert.ok(places.places.every((p) => p.first_seen && p.last_seen));

  // review decisions survive a re-collect
  const srcFile = path.join(dataDir, 'happenings/smithsonian-events.json');
  const rows = JSON.parse(readFileSync(srcFile, 'utf8'));
  rows[0].status = 'approved';
  writeFileSync(srcFile, JSON.stringify(rows));
  runPipeline(fixDir, dataDir);
  const rows2 = JSON.parse(readFileSync(srcFile, 'utf8'));
  assert.equal(rows2.find((r) => r.id === rows[0].id).status, 'approved');
});
