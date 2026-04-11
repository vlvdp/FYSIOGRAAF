#!/usr/bin/env node
/**
 * migrate_rels.js
 * Migreert link rel-types in seed.js naar het nieuwe semantische schema:
 *
 *   usus      — bron → instrument/kennis/vaardigheid
 *               casuistiek → instrument/vaardigheid
 *   contextus — kennis → instrument/vaardigheid/casuistiek
 *   nexus     — instrument/kennis/vaardigheid/casuistiek → bron/kennis
 *   sequens   — casuistiek → casuistiek
 */

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const seedPath   = path.join(__dirname, 'data', 'seed.js');
const backupPath = seedPath + '.bak';

// ── Backup ────────────────────────────────────────────────────────────────────
fs.copyFileSync(seedPath, backupPath);
console.log(`Backup: ${backupPath}\n`);

// ── Laad SEED_DATA via vm-sandbox ─────────────────────────────────────────────
const raw = fs.readFileSync(seedPath, 'utf8');
const sandbox = {};
vm.runInNewContext(raw + '\nmodule_export = SEED_DATA;', { module_export: null, ...sandbox });
// Alternatief: strip prefix
const jsonStr  = raw.replace(/^\s*const\s+SEED_DATA\s*=\s*/, '').replace(/;\s*$/, '');
const SEED_DATA = JSON.parse(jsonStr);

// ── Bouw ID → type map ────────────────────────────────────────────────────────
const typeMap = {};
for (const [id, obj] of Object.entries(SEED_DATA.objects)) {
  typeMap[id] = obj.type;
}

// ── Rel bepalen op basis van source/target type ───────────────────────────────
function newRel(fromType, toType, fromId, toId) {
  if (fromType === 'bronnen')    return 'usus';

  if (fromType === 'kennis') {
    if (toType === 'bronnen' || toType === 'kennis') return 'nexus';
    return 'contextus'; // → instrument, vaardigheid, casuistiek
  }

  if (fromType === 'casuistiek') {
    if (toType === 'casuistiek')                     return 'sequens';
    if (toType === 'instrument' || toType === 'vaardigheid') return 'usus';
    return 'nexus'; // → bronnen, kennis
  }

  // instrument, vaardigheid → altijd nexus
  return 'nexus';
}

// ── Migreer links ─────────────────────────────────────────────────────────────
const stats = { nexus: 0, contextus: 0, usus: 0, sequens: 0, onbekend: 0 };
let changes = 0;

let content = raw;

for (const link of SEED_DATA.links) {
  const fromType = typeMap[link.from];
  const toType   = typeMap[link.to];

  if (!fromType || !toType) {
    console.warn(`  SKIP ${link.id}: type onbekend (from=${link.from}[${fromType}] to=${link.to}[${toType}])`);
    stats.onbekend++;
    continue;
  }

  const rel = newRel(fromType, toType, link.from, link.to);

  if (rel !== link.rel) {
    // Vervang specifiek dit link-blok: zoek op ID en vervang de rel-waarde
    // Patroon: "id": "<link.id>", ... "rel": "<oud>"
    // Gebruik een gerichte regex op het id + rel-veld van dit specifieke link
    const escapedId  = link.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedRel = link.rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Zoek het blok dat dit link-id bevat en vervang enkel de rel daarin
    const pattern = new RegExp(
      `("id"\\s*:\\s*"${escapedId}"[^}]*?"rel"\\s*:\\s*)"${escapedRel}"`,
      's'
    );
    const after = content.replace(pattern, `$1"${rel}"`);

    if (after === content) {
      // Probeer omgekeerde volgorde (rel staat vóór id)
      const pattern2 = new RegExp(
        `("rel"\\s*:\\s*)"${escapedRel}"([^}]*?"id"\\s*:\\s*"${escapedId}")`,
        's'
      );
      const after2 = content.replace(pattern2, `$1"${rel}"$2`);
      if (after2 === content) {
        console.warn(`  WARN: kon ${link.id} niet vinden in tekst`);
      } else {
        content = after2;
        changes++;
      }
    } else {
      content = after;
      changes++;
    }

    console.log(`  ${link.id}: ${link.rel} → ${rel}  (${fromType} → ${toType})`);
  }

  stats[rel]++;
}

// ── Schrijf resultaat ─────────────────────────────────────────────────────────
fs.writeFileSync(seedPath, content, 'utf8');

console.log(`\n=== Klaar ===`);
console.log(`${changes} links gewijzigd`);
console.log(`Eindverdeling: nexus=${stats.nexus} contextus=${stats.contextus} usus=${stats.usus} sequens=${stats.sequens} onbekend=${stats.onbekend}`);
