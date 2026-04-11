/**
 * cards.js — Kaartgrid renderer vanuit DB-queries
 *
 * Unified node schema: { id, type, afk, title, fields{}, links[] }
 * Front = minimale kaart in masonry (afk + titel + chips)
 * Back  = detail offcanvas (alle inhoud)
 */

const CARDS = (() => {

  const DOMAIN_TAGS = ['rca', 'cna', 'msa', 'mtt', 'onco'];

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

  function _linkBadge(text, href) {
    return `<a class="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border text-decoration-none"
      href="${href}" target="_blank" rel="noopener">${text}</a>`;
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

  function _normBlock(content) {
    if (!content) return '';
    if (content.includes('norm-block')) return content;
    const embedIdx = content.indexOf('<div class="implicatie-block">');
    if (embedIdx !== -1) content = content.substring(0, embedIdx).replace(/<\/div>\s*$/, '').trim();
    if (!content) return '';
    return `<div class="norm-block alert alert-info small">
      <div class="text-uppercase fw-semibold mb-1">Normwaarden / Afkapwaarden</div>
      ${content}
    </div>`;
  }

  function _implicatieBlock(content) {
    if (!content) return '';
    if (content.includes('implicatie-block')) return content;
    return `<div class="implicatie-block alert alert-warning small">
      <div class="text-uppercase fw-semibold mb-1">Klinische implicatie</div>
      ${content}
    </div>`;
  }

  const LINK_ICONS = {
    'meetinstrumentenzorg.nl': '📋',
    'fysiomedia.nl':           '🎬',
    'physio-pedia.com':        '🌐',
    'Richtlijn (PDF/web)':     '📄',
  };

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
      const CAS_LABELS = { diagnostiek: 'Diagnostiek', behandelen: 'Behandelen' };
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
    const body = [
      f.watMeetHet        ? _field('Wat meet het', f.watMeetHet)             : '',
      f.scoringscriteria  ? _field('Scoringscriteria', f.scoringscriteria)   : '',
      f.normwaarden       ? _normBlock(f.normwaarden)                        : '',
      f.implicatie        ? _implicatieBlock(f.implicatie)                   : '',
      f.focus             ? `<p class="small fst-italic text-muted">${f.focus}</p>` : '',
      f.content           ? `<div class="small">${f.content}</div>`          : '',
      f.scope             ? _field('Scope', f.scope)                         : '',
      f.kernaanbevelingen ? _field('Kernaanbevelingen', f.kernaanbevelingen) : '',
    ].filter(Boolean).join('');

    // ── Footer: graaf-metadata ────────────────────────────────────────────────
    const linkedInstr    = links.filter(({ object: o }) => o?.type === 'instrument');
    const linkedCasussen = links.filter(({ object: o }) => o?.type === 'casuistiek');
    const linkedBronnen  = links.filter(({ object: o }) => o?.type === 'bronnen');
    const otherLinks     = links.filter(({ object: o }) => o && !['instrument','casuistiek','bronnen'].includes(o.type));
    const refBadges      = (obj.links || []).map(l =>
      _linkBadge(`${LINK_ICONS[l.label] || '🔗'} ${l.label}`, l.url)
    );

    const footer = [
      linkedInstr.length ? `
        <div>
          <div class="text-uppercase fw-semibold text-secondary">Gebruikte instrumenten</div>
          <div class="d-flex flex-wrap gap-1 mt-1">
            ${linkedInstr.map(({ object: o }) =>
              _navBadge(o.afk || o.id, 'var(--rca)', o.id)
            ).join('')}
          </div>
        </div>` : '',
      linkedCasussen.length ? `
        <div>
          <div class="text-uppercase fw-semibold text-secondary">Gerelateerde casussen</div>
          <div class="d-flex flex-wrap gap-1 mt-1">
            ${linkedCasussen.map(({ object: o }) =>
              _navBadge(o.afk || o.id, 'var(--cna)', o.id)
            ).join('')}
          </div>
        </div>` : '',
      linkedBronnen.length ? `
        <div>
          <div class="text-uppercase fw-semibold text-secondary">Bronnen</div>
          <div class="d-flex flex-wrap gap-1 mt-1">
            ${linkedBronnen.map(({ object: o }) =>
              _navBadge(o.afk || o.title, 'var(--type-richtlijn, #8B5CF6)', o.id)
            ).join('')}
          </div>
        </div>` : '',
      otherLinks.length ? `
        <div>
          <div class="text-uppercase fw-semibold text-secondary">Gerelateerde objecten</div>
          <div class="d-flex flex-wrap gap-1 mt-1">
            ${otherLinks.map(({ object: o }) =>
              _navBadge(o.afk || o.title || o.id, null, o.id)
            ).join('')}
          </div>
        </div>` : '',
      tags.length ? `
        <div>
          <div class="text-uppercase fw-semibold text-secondary">Tags</div>
          <div class="d-flex flex-wrap gap-1 mt-1">
            ${tags.map(t => DOMAIN_COLORS[t]
              ? _colorBadge(t, DOMAIN_COLORS[t])
              : _neutralBadge(t)
            ).join('')}
          </div>
        </div>` : '',
      refBadges.length ? `
        <div>
          <div class="text-uppercase fw-semibold text-secondary">Referenties</div>
          <div class="d-flex flex-wrap gap-1 mt-1">
            ${refBadges.join('')}
          </div>
        </div>` : '',
    ].filter(Boolean).join('');

    return { body, footer };
  }

  function openDetail(id) {
    OVZ.showDetail(id);
  }

  return { buildCard, openDetail, buildDetailHTML };
})();
