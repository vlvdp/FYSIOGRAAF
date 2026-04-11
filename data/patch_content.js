/**
 * patch_content.js — eenmalig contentfixes in seed.js
 * Run: node data/patch_content.js
 */
const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'seed.js');
let c = fs.readFileSync(seedPath, 'utf8');

// ── 1. Verwijder h-100 van alle panel-divs ────────────────────────────────
// In het bestand staat letterlijk: class=\"border rounded p-2 h-100\"
// Alle 14 gevallen zijn exact deze klasse.
c = c.split(' h-100\\"').join('\\"');

// ── 2. Klinische implicatie: <p class="mt-2 mb-0 small text-secondary">
//       → <div class="bg-secondary bg-opacity-10 rounded p-2 small mt-2">
c = c.replace(
  /<p class=\\"mt-2 mb-0 small text-secondary\\">([\s\S]*?)<\/p>/g,
  '<div class=\\"bg-secondary bg-opacity-10 rounded p-2 small mt-2\\">$1<\/div>'
);

// ── 3. cna-spierkracht: geneste Direct/Indirect kaders → plain strong-tekst
const oldNested =
  '<div class=\\"row g-1\\"><div class=\\"col-6\\">' +
  '<div class=\\"border rounded p-1 small\\">' +
  '<div class=\\"fw-semibold\\">Direct</div>' +
  'Parese of paralyse door CNA-uitval' +
  '</div></div>' +
  '<div class=\\"col-6\\">' +
  '<div class=\\"border rounded p-1 small\\">' +
  '<div class=\\"fw-semibold\\">Indirect</div>' +
  'Inactiviteit door de beperking \u2192 secundaire deconditionering' +
  '</div></div></div>';

const newNested =
  '<div class=\\"small\\"><strong>Direct:</strong> Parese of paralyse door CNA-uitval</div>' +
  '<div class=\\"small mt-1\\"><strong>Indirect:</strong> Inactiviteit door de beperking \u2192 secundaire deconditionering</div>';

const before = c;
c = c.split(oldNested).join(newNested);
const replaced = c !== before;

fs.writeFileSync(seedPath, c, 'utf8');

const h100Count = (c.match(/ h-100\\"/g) || []).length;
const implCount = (c.match(/mt-2 mb-0 small text-secondary/g) || []).length;

console.log(`✓ seed.js bijgewerkt`);
console.log(`  h-100 resterend:           ${h100Count} (verwacht: 0)`);
console.log(`  oud implicatie-patroon:    ${implCount} (verwacht: 0)`);
console.log(`  Direct/Indirect vervangen: ${replaced} (verwacht: true)`);
