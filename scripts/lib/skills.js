// Discovers data-source skills: each skills/<name>/ holds a SKILL.md
// (human docs + flat YAML frontmatter) and a config.json (machine config).
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

// Flat "key: value" frontmatter between --- fences; booleans coerced
export function parseFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (v === 'true') v = true;
    else if (v === 'false') v = false;
    if (k) out[k] = v;
  }
  return out;
}

export function loadSkills(root) {
  const dir = path.join(root, 'skills');
  const skills = [];
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('_') || name.startsWith('.')) continue; // skip template
    const skillFile = path.join(dir, name, 'SKILL.md');
    if (!existsSync(skillFile)) continue;
    const meta = parseFrontmatter(readFileSync(skillFile, 'utf8'));
    const cfgFile = path.join(dir, name, 'config.json');
    const config = existsSync(cfgFile) ? JSON.parse(readFileSync(cfgFile, 'utf8')) : {};
    skills.push({ dir: path.join(dir, name), ...meta, config });
  }
  return skills;
}
