/**
 * migrate_urls.js — converts legacy node.links[{label,url}] → node.url + node.urlPP
 *
 * Run once:  node data/migrate_urls.js
 *
 * Rules:
 *   - urlPP = first link whose URL contains 'physio-pedia'
 *   - url   = first link whose URL does NOT contain 'physio-pedia'
 *   - If only a physio-pedia URL exists, it is still stored in urlPP; url stays empty (flags gap).
 *   - Field `links` is removed after migration.
 */

const fs   = require('fs');
const path = require('path');

const SEED = path.join(__dirname, 'seed.js');
const BAK  = path.join(__dirname, 'seed.js.bak_urls');

// load
global.window = {};
require(SEED);
const data = window.SEED_DATA;

// backup original
fs.copyFileSync(SEED, BAK);
console.log(`Backup: ${BAK}`);

// migrate
let migrated = 0, dropped = 0;
for (const [id, o] of Object.entries(data.objects)) {
  const links = Array.isArray(o.links) ? o.links : [];
  const pp    = links.find(l => (l.url || '').includes('physio-pedia'));
  const other = links.find(l => !(l.url || '').includes('physio-pedia'));

  if (pp)    o.urlPP = pp.url;
  if (other) o.url   = other.url;

  const extra = links.length - (pp ? 1 : 0) - (other ? 1 : 0);
  if (extra > 0) {
    console.warn(`[${id}] ${extra} extra link(s) dropped:`, links.slice(2));
    dropped += extra;
  }

  if (links.length) migrated++;
  delete o.links;
}

// serialise
const out = 'window.SEED_DATA = ' + JSON.stringify(data, null, 2) + ';\n';
fs.writeFileSync(SEED, out);

// quick audit
const byType = {};
for (const o of Object.values(data.objects)) {
  byType[o.type] = byType[o.type] || { total:0, withUrl:0, withPP:0, noUrl:0 };
  byType[o.type].total++;
  if (o.url)   byType[o.type].withUrl++;
  if (o.urlPP) byType[o.type].withPP++;
  if (!o.url && !o.urlPP) byType[o.type].noUrl++;
}
console.log(`\nMigrated: ${migrated} nodes with links. Dropped: ${dropped}.\n`);
console.table(byType);
