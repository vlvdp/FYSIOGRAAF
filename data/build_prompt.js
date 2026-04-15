#!/usr/bin/env node
/**
 * build_prompt.js — genereer Cowork-prompt voor een richtlijn-audit
 *
 * Vult COWORK_PROMPT_TEMPLATE.md met:
 *   - bron-id + titel + access-date
 *   - inventaris van bestaande nodes gerelateerd aan de bron
 *     (alles met een `usus`-edge vanuit deze bron, plus alles met de
 *     opgegeven domain-tag — als de bron net is aangemaakt en nog geen
 *     edges heeft, gebruik je --tag om de relevante set te selecteren)
 *   - domain-tag + scope-checklist (handmatig meegeven)
 *
 * Gebruik:
 *   node data/build_prompt.js \
 *     --bron rl-rug-2021 \
 *     --tag msa \
 *     --scope-file scope_lrp.md \
 *     [--out prompt.md]
 *
 * --scope-file is een markdown-bestand met de extractiescope-checklist
 * (vrij formaat, wordt 1-op-1 ingevoegd onder §4 Extractiescope).
 */

const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.replace(/^--/, ''), arr[i+1]]);
    return acc;
  }, [])
);

if (!args.bron || !args.tag || !args['scope-file']) {
  console.error('Usage: node data/build_prompt.js --bron <id> --tag <label> --scope-file <path> [--out <path>]');
  process.exit(1);
}

const SEED_PATH = path.join(__dirname, 'seed.js');
const TEMPLATE_PATH = path.join(__dirname, 'COWORK_PROMPT_TEMPLATE.md');
const OUT_PATH = args.out || path.join(__dirname, '..', `cowork_prompt_${args.bron}.md`);

eval(fs.readFileSync(SEED_PATH, 'utf8').replace('window.SEED_DATA', 'globalThis.__SEED__'));
const SEED = globalThis.__SEED__;

const bron = SEED.objects[args.bron];
if (!bron) { console.error(`bron ${args.bron} bestaat niet in seed.js`); process.exit(1); }

// Verzamel relevante node-ids:
//   - alles wat een usus-edge van/naar de bron heeft
//   - alles met de opgegeven tag
const relevant = new Set();
for (const l of SEED.links) {
  if (l.from === args.bron) relevant.add(l.to);
  if (l.to === args.bron) relevant.add(l.from);
}
for (const t of SEED.tags) {
  if (t.tag === args.tag) relevant.add(t.object);
}
relevant.delete(args.bron);

// Groepeer per type
const byType = { instrument: [], kennis: [], casuistiek: [], bronnen: [] };
for (const id of relevant) {
  const o = SEED.objects[id];
  if (!o) continue;
  if (byType[o.type]) byType[o.type].push(o);
}
for (const t of Object.keys(byType)) {
  byType[t].sort((a, b) => (a.afk || a.id).localeCompare(b.afk || b.id));
}

function renderTypeSection(label, items) {
  if (!items.length) return '';
  const lines = items.map(o =>
    `- \`${o.id}\` — ${o.afk ? `**${o.afk}** — ` : ''}${o.title || ''}`
  ).join('\n');
  return `## ${label}\n${lines}\n`;
}

const inventaris = [
  `## Bron\n- \`${bron.id}\` — ${bron.title || ''} (dit is DE bron)\n`,
  renderTypeSection('Instrumenten', byType.instrument),
  renderTypeSection('Kennis', byType.kennis),
  renderTypeSection('Casuïstiek', byType.casuistiek),
].filter(Boolean).join('\n');

const scopeText = fs.readFileSync(args['scope-file'], 'utf8').trim();
const accessDate = new Date().toISOString().slice(0, 10);

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
const out = template
  .replace(/\{\{RICHTLIJN_TITEL\}\}/g, bron.title || args.bron)
  .replace(/\{\{BRON_ID\}\}/g, args.bron)
  .replace(/\{\{ACCESS_DATE\}\}/g, accessDate)
  .replace(/\{\{DOMAIN_TAG\}\}/g, args.tag)
  .replace(/\{\{INVENTARIS\}\}/g, inventaris)
  .replace(/\{\{SCOPE_CHECKLIST\}\}/g, scopeText);

fs.writeFileSync(OUT_PATH, out);
console.log(`prompt written: ${OUT_PATH}`);
console.log(`  bron:        ${args.bron}`);
console.log(`  tag:         ${args.tag}`);
console.log(`  inventaris:  ${relevant.size} nodes (${byType.instrument.length} instrument, ${byType.kennis.length} kennis, ${byType.casuistiek.length} casus)`);
