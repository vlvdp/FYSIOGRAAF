#!/usr/bin/env node
/**
 * apply_extraction.js — generieke Cowork-extractie naar seed.js
 *
 * Vervangt de eenmalige apply_cowork_step{1,2,3_5}.js scripts.
 *
 * Gebruik:
 *   node data/apply_extraction.js <pad-naar-extractie.json> [--dry-run]
 *
 * Werkwijze (idempotent, in deze volgorde):
 *   1. Validatie: JSON-shape, type-schema's, ID-collisions, edge-refs, schemas per type
 *   2. NEW NODES → toevoegen aan objects (geen overwrite)
 *   3. UPDATES per type:
 *        - instrument:  cite-only (citaties uit Cowork-velden injecteren in
 *                       bestaande velden — bestaande content blijft intact)
 *        - kennis:      grow-vs-shrink heuristiek
 *                       newLen > oldLen + 50 → wholesale replace (per veld)
 *                       anders → cite-only
 *        - bronnen:     per veld merge (bestaand veld leeg → vul; bestaand
 *                       gevuld → cite-only append)
 *        - casuistiek:  als de Cowork-velden afwijken van het bestaande
 *                       casuistiek-schema (content/focus/setting): SKIP met
 *                       waarschuwing
 *   4. NEW LINKS → toevoegen aan links (deduped, link-id auto-gen)
 *   5. NEW TAGS  → toevoegen aan tags (deduped)
 *   6. Verify: parse seed.js terug, print counts
 *
 * Maakt automatisch een backup `seed.js.bak-<timestamp>` voordat geschreven wordt.
 */

const fs = require('fs');
const path = require('path');

const SEED_PATH = path.join(__dirname, 'seed.js');
const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const inputPath = args.find(a => !a.startsWith('--'));

if (!inputPath) {
  console.error('Usage: node data/apply_extraction.js <extractie.json> [--dry-run]');
  process.exit(1);
}

// Schema's afgeleid uit data/SCHEMA.md
const SCHEMAS = {
  instrument:  ['watMeetHet', 'scoringscriteria', 'normwaarden', 'implicatie'],
  kennis:      ['kern', 'toelichting', 'implicatie'],   // nieuwe stijl; 'content' (legacy) wordt door UI ook gerenderd
  casuistiek:  ['content', 'focus', 'setting'],
  bronnen:     ['scope', 'doelen', 'indicaties', 'contraindicaties', 'kernaanbevelingen'],
};
const CITE_FIELDS = {
  instrument:  ['watMeetHet', 'scoringscriteria', 'normwaarden'],
  kennis:      ['kern', 'toelichting'],
  casuistiek:  ['content'],
  bronnen:     ['scope', 'doelen', 'indicaties', 'contraindicaties'],
};
const REPLACE_THRESHOLD = 50;

// ── Helpers ────────────────────────────────────────────────────────────────
function uniqPages(htmlStr) {
  const matches = htmlStr.match(/data-p="([^"]+)"/g) || [];
  const pages = [];
  for (const m of matches) {
    const p = m.match(/data-p="([^"]+)"/)[1];
    if (!pages.includes(p)) pages.push(p);
  }
  return pages.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}
function buildSupCluster(pages, bronId) {
  return pages.map(p => `<sup data-src="${bronId}" data-p="${p}">[p${p}]</sup>`).join('');
}
function alreadyCited(html, bronId) {
  return new RegExp(`data-src="${bronId.replace(/[-]/g, '\\$&')}"`).test(html);
}

// ── Read ───────────────────────────────────────────────────────────────────
const ex = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
let src = fs.readFileSync(SEED_PATH, 'utf8');
eval(src.replace('window.SEED_DATA', 'globalThis.__SEED__'));
const SEED = globalThis.__SEED__;

const bronId = (ex.bron && ex.bron.id) || null;
if (!bronId) { console.error('extractie.bron.id ontbreekt'); process.exit(1); }
if (!SEED.objects[bronId]) { console.error(`bron ${bronId} bestaat niet in seed.js`); process.exit(1); }

const existingIds = new Set(Object.keys(SEED.objects));
const existingEdgeKey = new Set(SEED.links.map(l => [l.from, l.to, l.rel].sort().join('|')));
const existingTagKey  = new Set(SEED.tags.map(t => `${t.object}|${t.tag}`));
const usedLinkIds     = new Set(SEED.links.map(l => l.id));

function uid() {
  let id; do { id = 'lnk-' + Math.random().toString(36).slice(2, 9); } while (usedLinkIds.has(id));
  usedLinkIds.add(id); return id;
}

// ── 1. Validatie ───────────────────────────────────────────────────────────
const issues = [];
for (const n of (ex.new_nodes || [])) {
  if (existingIds.has(n.id)) issues.push(`new node id collision: ${n.id}`);
  if (!SCHEMAS[n.type]) issues.push(`new node ${n.id} unknown type: ${n.type}`);
}
const allIds = new Set([...existingIds, ...(ex.new_nodes || []).map(n => n.id)]);
for (const l of (ex.links || [])) {
  if (!allIds.has(l.from)) issues.push(`link from-id missing: ${l.from}`);
  if (!allIds.has(l.to))   issues.push(`link to-id missing: ${l.to}`);
}
for (const t of (ex.tags || [])) {
  if (!allIds.has(t.object)) issues.push(`tag object missing: ${t.object}`);
}
if (issues.length) {
  console.error('VALIDATION ERRORS:');
  for (const i of issues) console.error(' -', i);
  process.exit(1);
}

// ── 2. Surgical edit helpers ───────────────────────────────────────────────
function replaceFieldInSrc(objId, field, oldVal, newVal) {
  const needle = `"${field}": ${JSON.stringify(oldVal)}`;
  const replacement = `"${field}": ${JSON.stringify(newVal)}`;
  const before = src.length;
  src = src.replace(needle, replacement);
  return src.length !== before;
}

function appendFieldToObject(objId, field, value) {
  const idAnchor = `"${objId}": {`;
  const idIdx = src.indexOf(idAnchor);
  if (idIdx === -1) return false;
  const fieldsAnchor = src.indexOf('"fields": {', idIdx);
  if (fieldsAnchor === -1) return false;
  let i = src.indexOf('{', fieldsAnchor) + 1;
  let depth = 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
    i++;
  }
  if (depth !== 0) return false;
  const inner = src.slice(fieldsAnchor + '"fields": {'.length, i);
  const isEmpty = inner.trim() === '';
  const enc = JSON.stringify(value);
  const insertion = isEmpty
    ? `\n        "${field}": ${enc}\n      `
    : `,\n        "${field}": ${enc}\n      `;
  const beforeStr = src.slice(0, i).replace(/\s*$/, '');
  src = beforeStr + insertion + src.slice(i).replace(/^[\s]*\}/, '}');
  return true;
}

// ── 3. NEW NODES ───────────────────────────────────────────────────────────
const newNodes = (ex.new_nodes || []).filter(n => !existingIds.has(n.id));
if (newNodes.length) {
  // Schema-check per node
  for (const n of newNodes) {
    const allowed = SCHEMAS[n.type] || [];
    const used = Object.keys(n.fields || {});
    const off = used.filter(f => !allowed.includes(f));
    if (off.length) console.warn(`  ⚠ ${n.id}: off-schema fields ${off.join(',')}`);
  }
  const blocks = newNodes.map(n => {
    const body = JSON.stringify(n, null, 2).split('\n').map(l => '    ' + l).join('\n').slice(4);
    return `    "${n.id}": ${body}`;
  }).join(',\n');
  const anchor = '    }\n  },\n  "links": [';
  if (!src.includes(anchor)) { console.error('objects close anchor not found'); process.exit(1); }
  src = src.replace(anchor, `    },\n${blocks}\n  },\n  "links": [`);
}

// ── 4. UPDATES per type ────────────────────────────────────────────────────
const stats = { replaced: 0, citeOnly: 0, filledEmpty: 0, skipped: 0 };
for (const u of (ex.updates || [])) {
  const obj = SEED.objects[u.id];
  if (!obj) { console.warn(`  · skip update ${u.id} (not found)`); stats.skipped++; continue; }
  const declaredType = u.type || obj.type;
  if (declaredType !== obj.type) {
    console.warn(`  · skip update ${u.id} (type mismatch: ${u.type} vs ${obj.type})`);
    stats.skipped++; continue;
  }
  const allowed = SCHEMAS[obj.type] || [];
  const used = Object.keys(u.fields || {});
  const off = used.filter(f => !allowed.includes(f));
  if (off.length === used.length) {
    console.warn(`  · SKIP update ${u.id} (${obj.type}): ALL fields off-schema [${off.join(',')}]. Expected: [${allowed.join(',')}]`);
    stats.skipped++; continue;
  }
  if (off.length) {
    console.warn(`  · ${u.id}: ignoring off-schema fields [${off.join(',')}]`);
  }

  // Beslissingsregel per type
  if (obj.type === 'instrument') {
    let any = false;
    for (const fname of CITE_FIELDS.instrument) {
      const cwVal = (u.fields || {})[fname]; if (!cwVal) continue;
      const existing = obj.fields[fname]; if (!existing || alreadyCited(existing, bronId)) continue;
      const pages = uniqPages(cwVal); if (!pages.length) continue;
      const newVal = existing.replace(/\s*$/, '') + ' ' + buildSupCluster(pages, bronId);
      if (replaceFieldInSrc(u.id, fname, existing, newVal)) any = true;
    }
    if (any) { stats.citeOnly++; console.log(`  ⊕ instrument cite-only: ${u.id}`); }
    else     { stats.skipped++; }

  } else if (obj.type === 'kennis') {
    const oldLen = JSON.stringify(obj.fields).length;
    const newFiltered = {};
    for (const f of allowed) if (u.fields && u.fields[f] !== undefined) newFiltered[f] = u.fields[f];
    const newLen = JSON.stringify(newFiltered).length;

    if (newLen > oldLen + REPLACE_THRESHOLD) {
      let ok = true;
      for (const fname of allowed) {
        if (newFiltered[fname] === undefined) continue;
        if (obj.fields[fname] === undefined) {
          if (!appendFieldToObject(u.id, fname, newFiltered[fname])) ok = false;
          continue;
        }
        if (!replaceFieldInSrc(u.id, fname, obj.fields[fname], newFiltered[fname])) ok = false;
      }
      if (ok) { stats.replaced++; console.log(`  ✓ kennis replace: ${u.id} (+${newLen - oldLen})`); }

    } else {
      let any = false;
      for (const fname of CITE_FIELDS.kennis) {
        const cwVal = newFiltered[fname]; if (!cwVal) continue;
        const existing = obj.fields[fname]; if (!existing || alreadyCited(existing, bronId)) continue;
        const pages = uniqPages(cwVal); if (!pages.length) continue;
        const newVal = existing.replace(/\s*$/, '') + ' ' + buildSupCluster(pages, bronId);
        if (replaceFieldInSrc(u.id, fname, existing, newVal)) any = true;
      }
      if (any) { stats.citeOnly++; console.log(`  ⊕ kennis cite-only: ${u.id} (grow ${newLen - oldLen})`); }
      else     { stats.skipped++; console.log(`  · kennis skip: ${u.id}`); }
    }

  } else if (obj.type === 'bronnen') {
    let any = false;
    for (const fname of CITE_FIELDS.bronnen) {
      const cwVal = (u.fields || {})[fname]; if (!cwVal) continue;
      const existing = obj.fields[fname];
      if (!existing) {
        if (appendFieldToObject(u.id, fname, cwVal)) {
          any = true; stats.filledEmpty++;
          console.log(`  + ${u.id}.${fname} added (${cwVal.length} chars)`);
        }
      } else if (!alreadyCited(existing, bronId)) {
        const pages = uniqPages(cwVal); if (!pages.length) continue;
        const newVal = existing.replace(/\s*$/, '') + ' ' + buildSupCluster(pages, bronId);
        if (replaceFieldInSrc(u.id, fname, existing, newVal)) {
          any = true;
          console.log(`  ⊕ ${u.id}.${fname} += citation`);
        }
      }
    }
    if (any) stats.citeOnly++; else stats.skipped++;

  } else if (obj.type === 'casuistiek') {
    // Strikt: verwacht content/focus/setting. Anders weigeren.
    if (!off.length) {
      // veilige merge: alleen ontbrekende velden vullen
      for (const fname of allowed) {
        if ((u.fields || {})[fname] === undefined) continue;
        if (obj.fields[fname]) continue;
        if (appendFieldToObject(u.id, fname, u.fields[fname])) stats.filledEmpty++;
      }
    } else {
      stats.skipped++;
      console.warn(`  · SKIP casuistiek ${u.id} (off-schema fields)`);
    }
  }
}

// ── 5. NEW LINKS ───────────────────────────────────────────────────────────
const newLinks = (ex.links || []).filter(l => {
  const k = [l.from, l.to, l.rel].sort().join('|');
  return !existingEdgeKey.has(k);
}).map(l => ({ id: uid(), from: l.from, to: l.to, rel: l.rel }));
if (newLinks.length) {
  const blocks = newLinks.map(l => '    ' + JSON.stringify(l, null, 2).split('\n').join('\n    ')).join(',\n');
  const anchor = '    }\n  ],\n  "tags": [';
  if (!src.includes(anchor)) { console.error('links close anchor not found'); process.exit(1); }
  src = src.replace(anchor, `    },\n${blocks}\n  ],\n  "tags": [`);
}

// ── 6. NEW TAGS ────────────────────────────────────────────────────────────
const newTags = (ex.tags || []).filter(t => !existingTagKey.has(`${t.object}|${t.tag}`));
if (newTags.length) {
  const blocks = newTags.map(t => '    ' + JSON.stringify(t, null, 2).split('\n').join('\n    ')).join(',\n');
  const anchor = '    }\n  ]\n};\n';
  if (!src.includes(anchor)) { console.error('tags close anchor not found'); process.exit(1); }
  src = src.replace(anchor, `    },\n${blocks}\n  ]\n};\n`);
}

// ── Write & verify ─────────────────────────────────────────────────────────
console.log('\n── Summary ──');
console.log(`  new_nodes added:     ${newNodes.length}`);
console.log(`  updates replaced:    ${stats.replaced}`);
console.log(`  updates cite-only:   ${stats.citeOnly}`);
console.log(`  bronnen new fields:  ${stats.filledEmpty}`);
console.log(`  updates skipped:     ${stats.skipped}`);
console.log(`  links added:         ${newLinks.length}`);
console.log(`  tags added:          ${newTags.length}`);

if (DRY) { console.log('\n[dry-run] no file written'); process.exit(0); }

const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
fs.writeFileSync(`${SEED_PATH}.bak-${ts}`, fs.readFileSync(SEED_PATH));
fs.writeFileSync(SEED_PATH, src);
console.log(`\nseed.js written. backup: seed.js.bak-${ts}`);

delete globalThis.__SEED__;
eval(fs.readFileSync(SEED_PATH, 'utf8').replace('window.SEED_DATA', 'globalThis.__SEED__'));
const v = globalThis.__SEED__;
console.log(`verify: objects=${Object.keys(v.objects).length}, links=${v.links.length}, tags=${v.tags.length}`);
