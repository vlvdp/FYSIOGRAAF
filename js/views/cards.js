/**
 * cards.js — Kaartgrid renderer vanuit DB-queries
 *
 * Unified node schema: { id, type, afk, title, fields{}, url?, urlPP? }
 * Front = minimale kaart in masonry (afk + titel + chips)
 * Back  = detail offcanvas (alle inhoud)
 */

const CARDS = (() => {

  const DOMAIN_TAGS = ['rca', 'cna', 'msa', 'mtt', 'onco', 'ger'];

  const TYPE_ICONS = {
    instrument: `<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="#F97316" stroke="#C05A0B" stroke-width="1.5"/></svg>`,
    kennis:     `<svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,1 13,13 1,13" fill="#2563EB" stroke="#1A4BAD" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    bronnen:    `<svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" fill="#7C3AED" stroke="#5B28B3" stroke-width="1.5"/></svg>`,
    casuistiek: `<svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,1 13,7 7,13 1,7" fill="#0D9488" stroke="#0A6B62" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  };

  const DOMAIN_COLORS = {
    rca:  'var(--rca)',
    cna:  'var(--cna)',
    msa:  'var(--msa)',
    mtt:  'var(--mtt)',
    onco: 'var(--onco)',
    ger:  'var(--ger)',
  };

  // ── Badge helpers — Bootstrap .badge.rounded-pill ─────────────────────────

  function _colorBadge(text, colorVar, attrs = '') {
    return `<span class="badge rounded-pill border"
      style="color:${colorVar};border-color:${colorVar};"
      ${attrs}>${text}</span>`;
  }

  function _neutralBadge(text, attrs = '') {
    return `<span class="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border"
      ${attrs}>${text}</span>`;
  }

  // Navigeerbare pill: <button> voor keyboard/focus, stopProp voor gebruik in klikbare card
  function _navBadge(text, colorVar, id, stopProp = false) {
    const style = colorVar ? `style="color:${colorVar};border-color:${colorVar};"` : '';
    const cls   = colorVar ? 'badge rounded-pill border bg-transparent' : 'badge rounded-pill border bg-transparent text-secondary';
    const click = stopProp
      ? `onclick="event.stopPropagation();CARDS.openDetail('${id}')"`
      : `onclick="CARDS.openDetail('${id}')"`;
    return `<button type="button" class="${cls}" ${style} ${click}>${text}</button>`;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _linkedBronnen(id) {
    return DB.getLinkedObjects(id)
      .filter(({ object: o }) => o?.type === 'bronnen')
      .map(({ object: o }) => o);
  }

  function _field(label, content) {
    if (!content) return '';
    return `<div class="mb-3">
      <div class="text-uppercase fw-semibold text-secondary">${label}</div>
      <div class="small">${content}</div>
    </div>`;
  }

  function _escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function _normBlock(content) {
    if (!content) return '';
    if (content.includes('norm-block')) return content;
    const embedIdx = content.indexOf('<div class="implicatie-block">');
    if (embedIdx !== -1) content = content.substring(0, embedIdx).replace(/<\/div>\s*$/, '').trim();
    if (!content) return '';
    return `<div class="norm-block alert alert-info small">
      <div class="text-uppercase fw-semibold mb-1">Waarden</div>
      ${content}
    </div>`;
  }

  function _implicatieBlock(content) {
    if (!content) return '';
    if (content.includes('implicatie-block')) return content;
    return `<div class="implicatie-block alert alert-warning small">
      <div class="text-uppercase fw-semibold mb-1">Implicaties</div>
      ${content}
    </div>`;
  }

  function _urlLabel(u) {
    try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; }
  }

  function _urlLink(u) {
    if (!u) return '';
    return `<a href="${u}" target="_blank" rel="noopener" class="small text-decoration-none">${_urlLabel(u)}</a>`;
  }

  // ── FRONT — minimale kaart voor de masonry grid ───────────────────────────

  function buildCard(obj, tags) {
    const domeinTag = tags.find(t => DOMAIN_TAGS.includes(t)) || '';
    const f = obj.fields || {};

    // Chips: domein + toets + gekoppelde richtlijnen
    const TOETS_TAGS = ['kennen', 'uitvoeren', 'hoofd'];
    const pills = [];

    tags.filter(t => DOMAIN_TAGS.includes(t)).forEach(t =>
      pills.push(_colorBadge(t, DOMAIN_COLORS[t]))
    );
    tags.filter(t => TOETS_TAGS.includes(t)).forEach(t =>
      pills.push(_neutralBadge(t))
    );
    if (obj.type === 'casuistiek') {
      const CAS_LABELS = { diagnostiek: 'Diagnostics', behandelen: 'Treatment' };
      const ct = tags.find(t => CAS_LABELS[t]) || 'diagnostiek';
      pills.push(_neutralBadge(CAS_LABELS[ct] || ct));
    }
    _linkedBronnen(obj.id).forEach(o =>
      pills.push(_navBadge(o.afk || o.title, 'var(--type-richtlijn, #8B5CF6)', o.id, true))
    );

    const footerHtml = pills.length
      ? `<div class="card-footer d-flex flex-wrap gap-1">${pills.join('')}</div>`
      : '';

    return `
    <div class="card" data-id="${obj.id}" onclick="CARDS.openDetail('${obj.id}')" >
      <div class="card-body pb-2">
        <span class="d-flex align-items-center gap-1 mb-1">
          ${TYPE_ICONS[obj.type] ? `<span class="flex-shrink-0" title="${obj.type}">${TYPE_ICONS[obj.type]}</span>` : ''}
          <span class="font-monospace fw-semibold">${obj.afk || ''}</span>
        </span>
        <small class="text-muted d-block">${obj.title || ''}</small>
      </div>
      ${footerHtml}
    </div>`;
  }

  // ── BACK — volledige inhoud voor de detail offcanvas ──────────────────────

  function buildDetailHTML(id) {
    const obj  = DB.get(id);
    if (!obj) return { body: '', footer: '' };
    const tags  = DB.getTags(id);
    const links = DB.getLinkedObjects(id);
    const f     = obj.fields || {};

    // ── Body: inhoud ──────────────────────────────────────────────────────────
    let body = [
      f.kern              ? `<p class="small fw-semibold mb-3">${f.kern}</p>`      : '',
      f.toelichting       ? `<div class="small mb-3">${f.toelichting}</div>`      : '',
      f.watMeetHet        ? _field('Meting', f.watMeetHet)                   : '',
      f.scoringscriteria  ? _field('Scoring', f.scoringscriteria)            : '',
      f.normwaarden       ? _normBlock(f.normwaarden)                        : '',
      f.implicatie        ? _implicatieBlock(f.implicatie)                   : '',
      f.focus             ? `<p class="small fst-italic text-muted">${f.focus}</p>` : '',
      f.content           ? `<div class="small">${f.content}</div>`          : '',
      f.scope             ? _field('Scope', f.scope)                              : '',
      f.doelen            ? _field('Doelen', f.doelen)                            : '',
      f.indicaties        ? _field('Indicaties', f.indicaties)                    : '',
      f.contraindicaties  ? _field('Contra-indicaties', f.contraindicaties)       : '',
      f.kernaanbevelingen ? _field('Kernaanbevelingen', f.kernaanbevelingen)      : '',
    ].filter(Boolean).join('');

    // ── Bronvermelding: hover-tooltip op <sup> + Sources-blok onderaan ────────
    const citedSources = new Map();   // id → Set<page>
    body = body.replace(
      /<sup\s+data-src="([^"]+)"\s+data-p="([^"]+)">([^<]*)<\/sup>/g,
      (match, srcId, page, label) => {
        const src = DB.get(srcId);
        if (!src) return match;
        if (!citedSources.has(srcId)) citedSources.set(srcId, new Set());
        citedSources.get(srcId).add(page);
        const tip = `${src.title || src.afk || srcId}, p${page}`;
        return `<sup class="citation-ref" data-src="${srcId}" data-p="${page}" title="${_escapeAttr(tip)}">${label}</sup>`;
      }
    );

    if (citedSources.size) {
      const items = [...citedSources.entries()].map(([srcId, pages]) => {
        const src = DB.get(srcId);
        if (!src) return '';
        const pageList = [...pages].sort((a, b) => {
          const na = parseInt(a, 10), nb = parseInt(b, 10);
          return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
        }).map(p => `p${p}`).join(', ');
        const label = src.title || src.afk || srcId;
        return `<li class="small">
          <a href="#" onclick="event.preventDefault(); CARDS.openDetail('${srcId}');" class="text-decoration-none">${label}</a>
          <span class="text-muted"> — ${pageList}</span>
        </li>`;
      }).filter(Boolean).join('');
      body += `<div class="sources-block mt-3 pt-3 border-top">
        <div class="text-uppercase fw-semibold text-secondary small mb-1">Bronnen</div>
        <ul class="list-unstyled mb-0">${items}</ul>
      </div>`;
    }

    // ── Footer: graaf-relaties (richting + rel-type) ──────────────────────────
    const rawLinks = DB.getLinks(id);

    function _groupByRel(ls, getOtherId) {
      const map = {};
      for (const l of ls) {
        const o = DB.get(getOtherId(l));
        if (!o) continue;
        if (!map[l.rel]) map[l.rel] = [];
        map[l.rel].push(o);
      }
      return map;
    }

    const outGroups = _groupByRel(rawLinks.filter(l => l.from === id), l => l.to);
    const inGroups  = _groupByRel(rawLinks.filter(l => l.to   === id), l => l.from);

    function _relRows(groups, arrow) {
      return Object.entries(groups).map(([rel, objs]) => `
        <div class="d-flex flex-wrap align-items-baseline gap-1">
          <span class="text-muted small font-monospace flex-shrink-0">${arrow} ${rel}</span>
          ${objs.map(o => _navBadge(o.afk || o.title || o.id, null, o.id)).join('')}
        </div>`).join('');
    }

    const relSection = [_relRows(outGroups, '→'), _relRows(inGroups, '←')].filter(Boolean).join('');

    const footer = relSection ? `<div class="d-flex flex-column gap-1">${relSection}</div>` : '';

    // Outbound URLs — platte weergave, geen icoontjes of badges
    const urlRows = [
      obj.url   ? _urlLink(obj.url)   : '',
      obj.urlPP ? _urlLink(obj.urlPP) : '',
    ].filter(Boolean).join('<br>');
    const footer2 = urlRows;

    return { body, footer, footer2 };
  }

  function openDetail(id) {
    OVZ.showDetail(id);
  }

  return { buildCard, openDetail, buildDetailHTML };
})();
