// Generic fetcher for Open Data DC (ArcGIS Hub) GeoJSON datasets.
// Shared by dc-parks, dc-rec-facilities, and dc-farmers-markets; each skill's
// config.json supplies the dataset, field names, and classification rules.
import { readFileSync } from 'node:fs';
import { stableId, centroid, pick, USER_AGENT } from '../lib/normalize.js';

async function fetchGeojson(cfg, log) {
  const url = cfg.geojson_url ||
    `https://opendata.dc.gov/api/download/v1/items/${cfg.item_id}/geojson?layers=${cfg.layer ?? 0}`;
  // The hub download API can respond with a pending-export stub before the
  // file is ready, so poll a few times.
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' });
    if (!res.ok) throw new Error(`Open Data DC HTTP ${res.status} for ${url}`);
    const body = await res.json();
    if (body.features) return body;
    log(`export not ready (attempt ${attempt}), waiting...`);
    await new Promise((r) => setTimeout(r, attempt * 5000));
  }
  throw new Error('Open Data DC export never became ready');
}

// First keyword rule that matches wins; falls back to the skill's default kind
function classifyKind(text, rules, dflt) {
  const t = (text || '').toLowerCase();
  for (const [kw, kind] of Object.entries(rules || {})) if (t.includes(kw)) return kind;
  return dflt;
}

export async function fetchRecords(cfg, ctx) {
  if (!ctx.fixture && !cfg.geojson_url && !cfg.item_id) {
    throw new Error(`config needs geojson_url or item_id; see skills/${ctx.skill.name}/SKILL.md one-time setup`);
  }
  const gj = ctx.fixture
    ? JSON.parse(readFileSync(ctx.fixture, 'utf8'))
    : await fetchGeojson(cfg, ctx.log);

  const out = [];
  for (const f of gj.features || []) {
    const p = f.properties || {};
    const name = pick(p, cfg.name_fields || ['NAME', 'FACILITY_NAME']);
    if (!name) continue;
    const typeText = pick(p, cfg.type_fields || ['FEATURE_TYPE', 'TYPE', 'USE_TYPE', 'FACILITY_TYPE']);
    const hay = `${name} ${typeText || ''}`;
    // Optional allowlist filter, e.g. keep only aquatic features
    if (cfg.include_keywords && !cfg.include_keywords.some((k) => hay.toLowerCase().includes(k))) continue;
    const kind = classifyKind(hay, cfg.kind_rules, cfg.kind || 'other');
    const { lat, lon } = centroid(f.geometry);
    const srcId = pick(p, cfg.id_fields || ['GIS_ID', 'FACILITYID', 'OBJECTID']);
    const attrs = {};
    for (const k of cfg.attr_fields || []) {
      const v = pick(p, [k]);
      if (v !== null) attrs[k.toLowerCase()] = v;
    }
    out.push({
      id: stableId(cfg.id_prefix || 'dc', srcId || name),
      source: ctx.skill.name,
      name: String(name).trim(),
      kind,
      address: pick(p, cfg.address_fields || ['ADDRESS', 'FULLADDRESS', 'LOCATION']) || null,
      lat, lon,
      url: cfg.info_url || null,
      attrs,
      status: 'draft',
    });
  }
  ctx.log(`${out.length} places normalized`);
  return out;
}
