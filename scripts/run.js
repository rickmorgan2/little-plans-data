#!/usr/bin/env node
// Little Plans data runner.
//
// Usage:
//   node scripts/run.js --cadence daily|weekly|monthly|all [--skill <name>]
//                       [--fixtures] [--fixtures-dir <dir>] [--data-dir <dir>] [--strict]
//
// --fixtures reads local sample files instead of the network (used by CI),
// and exercises every skill including ones marked enabled: false.
// --strict exits non-zero if any source fails (CI); cron runs fail-soft so
// one flaky API never blocks the others.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { appendFileSync, mkdirSync } from 'node:fs';
import { loadSkills } from './lib/skills.js';
import { validateHappening, validatePlace } from './lib/validate.js';
import { readJson, writeJson, mergeRecords, buildFeeds } from './lib/store.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function arg(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return dflt;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : dflt;
}

const cadence = arg('cadence', 'all');
const only = arg('skill', null);
const fixtures = process.argv.includes('--fixtures');
const strict = process.argv.includes('--strict');
const fixturesDir = path.resolve(ROOT, arg('fixtures-dir', 'fixtures'));
const dataDir = path.resolve(ROOT, arg('data-dir', 'data'));

function logRun(entry) {
  mkdirSync(dataDir, { recursive: true });
  appendFileSync(path.join(dataDir, 'runs.log.jsonl'), JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
}

const skills = loadSkills(ROOT).filter((s) =>
  (only ? s.name === only : true) &&
  (cadence === 'all' || s.cadence === cadence) &&
  (fixtures || s.enabled !== false)
);

if (!skills.length) {
  console.error(`No skills matched (cadence=${cadence}${only ? `, skill=${only}` : ''}).`);
  process.exit(1);
}

let failures = 0;
for (const skill of skills) {
  const t0 = Date.now();
  try {
    const mod = await import(pathToFileURL(path.resolve(ROOT, skill.fetcher)).href);
    const ctx = {
      skill: { name: skill.name, kind: skill.kind },
      fixture: fixtures ? path.join(fixturesDir, skill.fixture) : null,
      log: (...a) => console.log(`[${skill.name}]`, ...a),
    };
    const records = await mod.fetchRecords(skill.config, ctx);
    const validate = skill.kind === 'places' ? validatePlace : validateHappening;
    const bad = records.map((r) => ({ r, e: validate(r) })).filter((x) => x.e.length);
    if (bad.length) {
      throw new Error(`${bad.length} invalid record(s); first: ${JSON.stringify(bad[0].e)} on "${bad[0].r.title || bad[0].r.name || bad[0].r.id}"`);
    }
    const file = path.join(dataDir, skill.kind, `${skill.name}.json`);
    const { records: merged, added, updated } = mergeRecords(readJson(file, []), records, new Date().toISOString(), skill.kind);
    writeJson(file, merged);
    logRun({ skill: skill.name, ok: true, fetched: records.length, added, updated, ms: Date.now() - t0 });
    console.log(`[${skill.name}] ok: ${records.length} fetched, ${added} new, ${updated} updated, ${merged.length} on file`);
  } catch (err) {
    failures++;
    logRun({ skill: skill.name, ok: false, error: String(err.message || err), ms: Date.now() - t0 });
    console.error(`[${skill.name}] FAILED: ${err.message || err}`);
  }
}

buildFeeds(dataDir);
console.log(`Feeds rebuilt in ${path.relative(ROOT, dataDir) || '.'}/feed/`);

if (failures && (strict || failures === skills.length)) process.exit(1);
