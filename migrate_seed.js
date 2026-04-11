#!/usr/bin/env node
/**
 * migrate_seed.js
 * Migreert seed.js HTML-strings van inline styles naar Bootstrap 5
 *
 * BELANGRIJK: HTML-strings zitten in JSON-waarden met dubbele aanhalingstekens,
 * dus alle HTML-attributen MOETEN enkelvoudige aanhalingstekens gebruiken.
 */

const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'data', 'seed.js');
const backupPath = seedPath + '.bak';

// Backup maken
fs.copyFileSync(seedPath, backupPath);
console.log(`Backup gemaakt: ${backupPath}`);

let content = fs.readFileSync(seedPath, 'utf8');
let totalChanges = 0;

function countMatches(str, pattern) {
  const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
  const re = new RegExp(pattern.source, flags);
  return (str.match(re) || []).length;
}

function replace(pattern, replacement, label) {
  const count = countMatches(content, pattern);
  if (count > 0) {
    content = content.replace(pattern, replacement);
    console.log(`  [${count}x] ${label}`);
    totalChanges += count;
  }
  return count;
}

// ============================================================
// Stap 1: Tabellen → Bootstrap responsive tables
// ============================================================
console.log('\n=== Stap 1: Tabellen → Bootstrap responsive tables ===');

// Verwijder bestaande <div style='overflow-x:auto;...'> wrappers rondom tabellen
// zodat we ze consistent opnieuw kunnen toevoegen als table-responsive
replace(
  /<div style='overflow-x:auto;[^']*'>\s*(<table\s)/g,
  '$1',
  "Verwijder bestaande overflow-x:auto div wrappers vóór tables"
);

// Bijbehorende losse </div> na </table> die van die wrappers kwamen
// (voorzichtig: alleen als ze direct na </table> staan)
replace(
  /(<\/table>)<\/div>/g,
  '$1',
  "Verwijder </div> direct na </table> (was overflow wrapper)"
);

// Vervang <table style='...'> door <table class='table table-sm'>
// (gebruik enkelvoudige aanhalingstekens in HTML-attributen!)
replace(
  /<table\s[^>]*style='[^']*'[^>]*>/g,
  "<table class='table table-sm'>",
  "Vervang <table style='...'> door <table class='table table-sm'>"
);

// Tabellen zonder style-attribuut maar met andere attributen (bijv. width)
replace(
  /<table\s+(?!class)[^>]*>/g,
  "<table class='table table-sm'>",
  "Vervang <table ...> (zonder class) door Bootstrap table"
);

// Wikkel elke <table class='table table-sm'> in <div class='table-responsive'>
// en sluit af na </table>
replace(
  /(<table class='table table-sm'>)/g,
  "<div class='table-responsive'>$1",
  "Wikkel tables in table-responsive div"
);

replace(
  /<\/table>/g,
  "</table></div>",
  "Sluit table-responsive div na </table>"
);

// ============================================================
// Stap 2: Verwijder style-attributen van tabel-elementen
// ============================================================
console.log('\n=== Stap 2: Verwijder style-attributen van tabel-elementen ===');

// Meerdere passes voor thead/tbody/tr/td/th met enkelvoudige aanhalingstekens
for (let i = 0; i < 3; i++) {
  replace(
    /(<(?:thead|tbody|tr|td|th)\b[^>]*?)\s*style='[^']*'([^>]*>)/g,
    '$1$2',
    `Verwijder style='...' van thead/tbody/tr/td/th (pass ${i+1})`
  );
}

// ============================================================
// Stap 3: Inline CSS-variabelen verwijderen/vervangen
// ============================================================
console.log('\n=== Stap 3: Inline CSS-variabelen verwijderen/vervangen ===');

// color:var(--accent) → color:var(--bs-primary)
replace(
  /\bcolor:\s*var\(--accent\)/g,
  'color:var(--bs-primary)',
  'color:var(--accent) → color:var(--bs-primary)'
);

// color:var(--muted) → verwijder de property (inclusief aangrenzende puntkomma's)
replace(
  /;?\s*color:\s*var\(--muted\)\s*;?/g,
  '',
  'Verwijder color:var(--muted)'
);

// border:... var(--border) → verwijder de property
replace(
  /;?\s*border(?:-bottom|-top|-left|-right)?:\s*[^;'\"]+var\(--border\)\s*;?/g,
  '',
  'Verwijder border:...var(--border)'
);

// background:var(--surface2) → verwijder
replace(
  /;?\s*background:\s*var\(--surface2\)\s*;?/g,
  '',
  'Verwijder background:var(--surface2)'
);

// var(--font-mono) → var(--bs-font-monospace)
replace(
  /var\(--font-mono\)/g,
  'var(--bs-font-monospace)',
  'var(--font-mono) → var(--bs-font-monospace)'
);

// background:color-mix(...) → verwijder het style-attribuut VOLLEDIG
replace(
  /\s*style='[^']*background:color-mix\([^']*'\s*/g,
  ' ',
  "Verwijder style met background:color-mix(...)"
);

// Hard-coded hex accent kleuren #f97316 en #f87171 in color-stijlen
replace(
  /;?\s*color:\s*#f97316\s*;?/g,
  '',
  'Verwijder color:#f97316'
);

replace(
  /;?\s*color:\s*#f87171\s*;?/g,
  '',
  'Verwijder color:#f87171'
);

// ============================================================
// Stap 4: Overige inline stijlen verwijderen
// ============================================================
console.log('\n=== Stap 4: Overige inline stijlen verwijderen ===');

// font-size:...rem
replace(
  /;?\s*font-size:\s*[\d.]+rem\s*;?/g,
  '',
  'Verwijder font-size:...rem'
);

// padding (standalone, niet padding-top/bottom etc.)
replace(
  /;?\s*padding:\s*[^;'\"]+;?/g,
  '',
  'Verwijder padding:...'
);

// margin-top
replace(
  /;?\s*margin-top:\s*[^;'\"]+;?/g,
  '',
  'Verwijder margin-top:...'
);

// margin-bottom
replace(
  /;?\s*margin-bottom:\s*[^;'\"]+;?/g,
  '',
  'Verwijder margin-bottom:...'
);

// line-height
replace(
  /;?\s*line-height:\s*[^;'\"]+;?/g,
  '',
  'Verwijder line-height:...'
);

// text-align (behalve in tabellen waar het al verwijderd is)
replace(
  /;?\s*text-align:\s*[^;'\"]+;?/g,
  '',
  'Verwijder text-align:...'
);

// vertical-align
replace(
  /;?\s*vertical-align:\s*[^;'\"]+;?/g,
  '',
  'Verwijder vertical-align:...'
);

// width:100%
replace(
  /;?\s*width:\s*100%\s*;?/g,
  '',
  'Verwijder width:100%'
);

// min-width
replace(
  /;?\s*min-width:\s*[^;'\"]+;?/g,
  '',
  'Verwijder min-width:...'
);

// border-collapse:collapse
replace(
  /;?\s*border-collapse:\s*collapse\s*;?/g,
  '',
  'Verwijder border-collapse:collapse'
);

// text-transform:uppercase
replace(
  /;?\s*text-transform:\s*uppercase\s*;?/g,
  '',
  'Verwijder text-transform:uppercase'
);

// font-weight (verwijderen uit style-attrs — Bootstrap heeft utility classes)
replace(
  /;?\s*font-weight:\s*\d+\s*;?/g,
  '',
  'Verwijder font-weight:... (numeriek)'
);

// font-style:italic vanuit style-attrs
replace(
  /;?\s*font-style:\s*italic\s*;?/g,
  '',
  'Verwijder font-style:italic'
);

// font-family (nu alleen nog andere font-family's)
replace(
  /;?\s*font-family:\s*var\(--bs-font-monospace\)\s*;?/g,
  '',
  'Verwijder font-family:var(--bs-font-monospace) — Bootstrap regelt dit'
);

// gap, display:grid overige layout-specifics
replace(
  /;?\s*gap:\s*[^;'\"]+;?/g,
  '',
  'Verwijder gap:...'
);

replace(
  /;?\s*display:\s*grid\s*;?/g,
  '',
  'Verwijder display:grid'
);

replace(
  /;?\s*grid-template-columns:\s*[^;'\"]+;?/g,
  '',
  'Verwijder grid-template-columns:...'
);

// border-radius
replace(
  /;?\s*border-radius:\s*[^;'\"]+;?/g,
  '',
  'Verwijder border-radius:...'
);

// border-left
replace(
  /;?\s*border-left:\s*[^;'\"]+;?/g,
  '',
  'Verwijder border-left:...'
);

// border-top
replace(
  /;?\s*border-top:\s*[^;'\"]+;?/g,
  '',
  'Verwijder border-top:...'
);

// overflow-x
replace(
  /;?\s*overflow-x:\s*[^;'\"]+;?/g,
  '',
  'Verwijder overflow-x:...'
);

// ============================================================
// Stap 5: Verwijder style-attributen van alle overige elementen
// ============================================================
console.log('\n=== Stap 5: Verwijder stijlen van alle HTML-elementen ===');

// Meerdere passes voor div, span, b, p, ul, li
const tags = ['div', 'span', 'b', 'p', 'ul', 'li', 'strong', 'em'];
for (const tag of tags) {
  for (let i = 0; i < 2; i++) {
    replace(
      new RegExp(`(<${tag}\\b[^>]*?)\\s*style='[^']*'([^>]*>)`, 'g'),
      '$1$2',
      `Verwijder style='...' van <${tag}>`
    );
  }
}

// ============================================================
// Stap 6: Lege style-attributen en residu opruimen
// ============================================================
console.log('\n=== Stap 6: Lege style-attributen opruimen ===');

// Lege of bijna-lege style-attributen
for (let i = 0; i < 3; i++) {
  replace(
    /\s*style='[;\s]*'\s*/g,
    ' ',
    "Verwijder lege/residu style='...' (enkelvoudig)"
  );
}

// Dubbele spaties in tags opruimen
replace(
  /(<[^>]+)  +([^>]*>)/g,
  '$1 $2',
  'Dubbele spaties in tags opruimen'
);

// Trailing spaties voor sluit-bracket
replace(
  /\s+>/g,
  '>',
  'Trailing spaties voor > verwijderen'
);

// ============================================================
// Stap 6b: Verwijder style-attributen met ESCAPED dubbele aanhalingstekens
// (HTML in JSON-strings die zelf dubbele quotes gebruiken, zodat HTML \" gebruikt)
// ============================================================
console.log('\n=== Stap 6b: Style-attributen met escaped dubbele aanhalingstekens ===');

// Verwijder kleur-properties die al geen waarde meer hebben: style=\"\"
replace(
  /\s*style=\\"[;\s]*\\"\s*/g,
  ' ',
  'Verwijder lege style=\\"\\"'
);

// Verwijder color:#4ade80, #fbbf24, #ef4444 uit style-attributen (CAT-score kleuren)
// → verwijder het hele style-attribuut (het bevat alleen een color)
replace(
  /\s*style=\\"color:#[0-9a-f]{6};?\\"\s*/g,
  ' ',
  'Verwijder style=\\"color:#xxxxxx\\" (CAT/score kleuren)'
);

// Verwijder overige style=\"...\" attributen (escaped) van b, span, div etc.
// Meerdere passes
for (let i = 0; i < 3; i++) {
  replace(
    /(<(?:b|span|div|p|ul|li|strong|em|td|th|tr|thead|tbody)\b[^>]*?)\s*style=\\"[^"]*\\"([^>]*>)/g,
    '$1$2',
    `Verwijder style=\\"...\\" van HTML-elementen (pass ${i+1})`
  );
}

// Verwijder resterende lege style=\"\"
replace(
  /\s*style=\\"[;\s]*\\"\s*/g,
  ' ',
  'Verwijder resterende lege style=\\"\\"'
);

// ============================================================
// Stap 7: color:var(--rca) en color:var(--cna) — laat staan
// (geen actie nodig)
// ============================================================
console.log('\n=== Stap 7: Domein-kleuren --rca en --cna worden behouden ===');
const rcaCount = (content.match(/var\(--rca\)/g) || []).length;
const cnaCount = (content.match(/var\(--cna\)/g) || []).length;
console.log(`  [${rcaCount}x] var(--rca) behouden`);
console.log(`  [${cnaCount}x] var(--cna) behouden`);

// ============================================================
// Schrijf resultaat
// ============================================================
fs.writeFileSync(seedPath, content, 'utf8');

console.log(`\n=== Klaar ===`);
console.log(`Totaal ${totalChanges} vervangingen gemaakt.`);
console.log(`Bestand opgeslagen: ${seedPath}`);
