#!/usr/bin/env node
/**
 * migrate.js — Eenmalig migratiescript
 *
 * Leest: klinimetrie_IZ_overzicht_v5_83_2.html
 * Schrijft: data/seed.js  (window.SEED_DATA = { objects, links, tags })
 *
 * Gebruik: node migrate.js
 */

const fs   = require('fs');
const path = require('path');

const SRC  = path.join(__dirname, 'klinimetrie_IZ_overzicht_v5_83_2.html');
const DEST = path.join(__dirname, 'data', 'seed.js');

const html = fs.readFileSync(SRC, 'utf8');

// ── Helpers ───────────────────────────────────────────────────────────────

function stripTags(s) {
  return (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanHtml(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function slug(s) {
  return (s || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Stap 1: Kaarten uit HTML extraheren (panel-gebaseerd) ─────────────────
//
// Strategie: zoek elk panel (id="domain-toets"), pak daarbinnen
// alle <div class="card DOMAIN"> ongeacht of ze data-domain hebben.

// Bekende panels: domain → subtabs
const PANELS = {
  rca:  ['kennen','uitvoeren','hoofd','gold','training'],
  cna:  ['kennen','uitvoeren','hoofd'],
  ez:   ['vitaal','symptoom','borg','inspanning','balans'],
  unco: ['beslissing','ems','totaal'],
};

function extractInnerHtml(fullHtml, startIdx) {
  // Gegeven startIdx is de positie NA de opening-tag.
  // Geeft de HTML terug tot het matchende </div>.
  let depth = 1;
  let pos   = startIdx;
  while (pos < fullHtml.length && depth > 0) {
    const nextOpen  = fullHtml.indexOf('<div', pos);
    const nextClose = fullHtml.indexOf('</div>', pos);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + 4;
    } else {
      depth--;
      if (depth === 0) return { inner: fullHtml.slice(startIdx, nextClose), end: nextClose + 6 };
      pos = nextClose + 6;
    }
  }
  return { inner: '', end: pos };
}

function extractCards() {
  const cards = [];

  for (const [domain, subs] of Object.entries(PANELS)) {
    for (const toets of subs) {
      const panelId = `${domain}-${toets}`;
      const panelRe = new RegExp(`<div[^>]+id="${panelId}"[^>]*>`);
      const pm = panelRe.exec(html);
      if (!pm) { continue; }

      const afterTag = pm.index + pm[0].length;
      const { inner: panelHtml } = extractInnerHtml(html, afterTag);
      if (!panelHtml) continue;

      // Vind alle outer card-divs binnen dit panel
      const cardRe = /<div\s+(?:class="card\s+[^"]*"|[^>]*class="card\s+[^"]*")[^>]*>/g;
      let m;
      while ((m = cardRe.exec(panelHtml)) !== null) {
        // Sla over als het een card-head / card-body / card-links is
        if (/class="card-/.test(m[0])) continue;

        const cardStart   = m.index + m[0].length;
        const { inner: cardInner, end: cardEnd } = extractInnerHtml(panelHtml, cardStart);
        const cardHtml    = m[0] + cardInner + '</div>';

        // Afkorting — accepteer ook inline-style varianten
        const afkM = cardHtml.match(/<span[^>]*class="afk"[^>]*>([^<]+)<\/span>/);
        const afk  = afkM ? afkM[1].trim() : '';
        if (!afk) continue;

        const fnM      = cardHtml.match(/<span[^>]*class="fullname"[^>]*>([^<]+)<\/span>/);
        const fullname = fnM ? fnM[1].trim() : '';

        // Section-heads
        const fields = {};
        const sectionRe = /<div[^>]*class="section-head"[^>]*>([^<]+)<\/div>\s*<div[^>]*class="item"[^>]*>([\s\S]*?)<\/div>/g;
        let sm;
        while ((sm = sectionRe.exec(cardHtml)) !== null) {
          const label   = sm[1].trim().toLowerCase();
          const content = cleanHtml(sm[2]);
          if (label.includes('wat meet'))   fields.watMeetHet = content;
          else if (label.includes('scoring')) fields.scoringscriteria = content;
        }

        // norm-block (inhoud na label-div)
        const nbM = cardHtml.match(/<div[^>]*class="norm-block"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
        if (nbM) {
          fields.normwaarden = cleanHtml(
            nbM[1].replace(/<div[^>]*class="label"[^>]*>[\s\S]*?<\/div>/, '').trim()
          );
        }

        // implicatie-block
        const ibM = cardHtml.match(/<div[^>]*class="implicatie-block"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
        if (ibM) {
          fields.implicatie = cleanHtml(
            ibM[1].replace(/<div[^>]*class="label"[^>]*>[\s\S]*?<\/div>/, '').trim()
          );
        }

        // Richtlijn-badges
        const badgeTags = [];
        const badgeRe = /class="badge\s+(copd|hart|onc|ber|cva|kwo)"/g;
        let bm;
        while ((bm = badgeRe.exec(cardHtml)) !== null) badgeTags.push(bm[1]);

        const mizM = cardHtml.match(/href="(https?:\/\/meetinstrumentenzorg[^"]+)"/);
        const ppM  = cardHtml.match(/href="(https?:\/\/www\.physio-pedia[^"]+)"/);

        const id = `${slug(afk)}-${uid()}`;
        cards.push({
          obj: {
            id, type: 'instrument', afk, fullname, fields,
            links_miz: mizM ? mizM[1] : '',
            links_pp:  ppM  ? ppM[1]  : '',
          },
          tags: [domain, toets, ...new Set(badgeTags)],
        });
      }
    }
  }

  return cards;
}

// ── Stap 2: CASUSSEN array extraheren ────────────────────────────────────

function extractCasussen() {
  const m = html.match(/const CASUSSEN\s*=\s*(\[[\s\S]*?\]);\s*\n/);
  if (!m) {
    console.warn('⚠ CASUSSEN array niet gevonden');
    return [];
  }

  let arr;
  try {
    // eval in Node-context (veilig: eigen file)
    arr = eval(m[1]); // eslint-disable-line no-eval
  } catch (e) {
    console.warn('⚠ Kon CASUSSEN niet parsen:', e.message);
    return [];
  }

  return arr.map(c => {
    // Bouw een content-string van verwijsbrief + anamnese
    let content = '';
    if (c.verwijsbrief) {
      const vb = c.verwijsbrief;
      content += '<b>Verwijsbrief</b><br>';
      if (vb._persoonsgegevens) content += vb._persoonsgegevens.map(([k,v]) => `<b>${k}:</b> ${v}`).join('<br>') + '<br>';
      if (vb.zorgaanvraag)      content += `<b>Zorgaanvraag:</b> ${vb.zorgaanvraag}<br>`;
      if (vb.verwijsdiagnose)   content += `<b>Diagnose:</b> ${vb.verwijsdiagnose}<br>`;
      if (vb.medischeInfo)      content += `<b>Medisch:</b> ${vb.medischeInfo}<br>`;
    }
    if (c.anamnese && c.anamnese.length) {
      content += '<br><b>Anamnese</b><br>';
      content += c.anamnese.map(([v,a]) => `<b>${v}:</b> ${a}`).join('<br>');
    }

    const tags = [
      c.vak || 'ez',
      c.toetstype || 'diagnostiek',
      c.diagnose,
      c.rol,
    ].filter(Boolean);

    const obj = {
      id:      c.id,
      type:    'casus',
      code:    c.code,
      title:   c.titel,
      focus:   c.focus,
      setting: c.setting,
      content,
      refs:    c.refs || [],
      sisters: c.sisters || [],
    };

    return { obj, tags };
  });
}

// ── Stap 3: Richtlijnen als kennis-objecten ───────────────────────────────

function extractRichtlijnen() {
  // Pak de top-richtlijnen panel en bewaar als blob
  const m = html.match(/id="top-richtlijnen">([\s\S]*?)<\/div>\s*<!-- /);
  if (!m) return [];

  return [{
    obj: {
      id: 'richtlijnen-overzicht',
      type: 'kennis',
      title: 'KNGF Richtlijnen Overzicht',
      content: cleanHtml(m[1]).slice(0, 50000),
    },
    tags: ['richtlijnen'],
  }];
}

// ── Stap 4: Bijzondere secties als kennis-objecten ────────────────────────

function extractSpecial() {
  const items = [];

  // UNCO-panel
  const uncoM = html.match(/id="top-unco">([\s\S]*?)(?=<!-- ===|<div class="top-panel")/);
  if (uncoM) {
    items.push({
      obj: { id: 'unco-content', type: 'kennis', title: 'UNCO-MOB 2.1 Beslissingstabellen', content: cleanHtml(uncoM[1]).slice(0, 50000) },
      tags: ['unco', 'beslissing'],
    });
  }

  // Trainingsleer
  const tlM = html.match(/id="top-trainingsleer">([\s\S]*?)(?=<!-- ===|<div class="top-panel")/);
  if (tlM) {
    items.push({
      obj: { id: 'trainingsleer-content', type: 'kennis', title: 'Trainingsleer — Zones & Principes', content: cleanHtml(tlM[1]).slice(0, 50000) },
      tags: ['trainingsleer', 'zones'],
    });
  }

  // BOKS
  const boksM = html.match(/id="top-boks">([\s\S]*?)(?=<!-- ===|<div class="top-panel")/);
  if (boksM) {
    items.push({
      obj: { id: 'boks-content', type: 'kennis', title: 'BOKS EZ — Beroepstaken', content: cleanHtml(boksM[1]).slice(0, 50000) },
      tags: ['boks', 'diagnostiek'],
    });
  }

  return items;
}

// ── Samenstellen ──────────────────────────────────────────────────────────

console.log('🔍 Extraheren kaarten…');
const cardItems = extractCards();
console.log(`   ${cardItems.length} kaarten gevonden`);

console.log('🔍 Extraheren casussen…');
const casItems = extractCasussen();
console.log(`   ${casItems.length} casussen gevonden`);

console.log('🔍 Extraheren speciale secties…');
const rlItems    = extractRichtlijnen();
const specItems  = extractSpecial();
console.log(`   ${rlItems.length + specItems.length} kennis-objecten gevonden`);

const allItems = [...cardItems, ...casItems, ...rlItems, ...specItems];

// Bouw DB-structuur
const objects = {};
const links   = [];
const tags    = [];

for (const { obj, tags: objTags } of allItems) {
  objects[obj.id] = obj;
  for (const tag of objTags) {
    if (tag) tags.push({ object: obj.id, tag });
  }
}

// Casussen ↔ instrumenten koppelen via refs
for (const { obj } of casItems) {
  if (!obj.refs) continue;
  for (const ref of obj.refs) {
    const instr = Object.values(objects).find(o => o.afk === ref);
    if (instr) {
      links.push({
        id:   `lnk-${uid()}`,
        from: obj.id,
        to:   instr.id,
        rel:  'gebruikt_in',
      });
    }
  }
}

// Casussen ↔ sisters koppelen
for (const { obj } of casItems) {
  if (!obj.sisters) continue;
  for (const sisterId of obj.sisters) {
    if (objects[sisterId]) {
      links.push({
        id:   `lnk-${uid()}`,
        from: obj.id,
        to:   sisterId,
        rel:  'gerelateerd',
      });
    }
  }
}

const seedData = { objects, links, tags };

// Schrijf seed.js
fs.mkdirSync(path.dirname(DEST), { recursive: true });
const output = `// data/seed.js — Gegenereerd door migrate.js op ${new Date().toISOString()}
// NIET handmatig bewerken — gebruik de editor in de app

window.SEED_DATA = ${JSON.stringify(seedData, null, 2)};
`;

fs.writeFileSync(DEST, output, 'utf8');

const objCount  = Object.keys(objects).length;
const tagCount  = tags.length;
const linkCount = links.length;

console.log('');
console.log(`✅ seed.js geschreven naar ${DEST}`);
console.log(`   ${objCount} objecten`);
console.log(`   ${tagCount} tags`);
console.log(`   ${linkCount} relaties`);
console.log('');
console.log('Start nu de app met: python3 -m http.server 8080');
