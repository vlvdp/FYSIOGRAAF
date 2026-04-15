/**
 * overzicht.js — Rolodex: centrale verzameling van alle objecten
 */

const OVZ = (() => {

  const TYPE_ICONS = {
    instrument: `<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="#F97316" stroke="#C05A0B" stroke-width="1.5"/></svg>`,
    kennis:     `<svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,1 13,13 1,13" fill="#2563EB" stroke="#1A4BAD" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    bronnen:    `<svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" fill="#7C3AED" stroke="#5B28B3" stroke-width="1.5"/></svg>`,
    casuistiek: `<svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,1 13,7 7,13 1,7" fill="#0D9488" stroke="#0A6B62" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  };

  const TYPE_LABELS = {
    instrument:  'Instrument',
    kennis:      'Knowledge',
    bronnen:     'Sources',
    casuistiek:  'Case Studies',
  };

  const DOMEIN_TAGS = ['msa', 'cna', 'rca', 'mtt', 'onco', 'ger'];

  let _filters = {
    search:    '',
    type:      '',
    domeinen:  new Set(),
    sort:      'relevance',
  };

  const SORT_LABELS = {
    relevance: 'Relevance',
    az:        'A → Z',
    za:        'Z → A',
    type:      'Type',
    relations: 'Most relations',
    modified:  'Recently modified',
    created:   'Recently created',
  };

  // ── Render ────────────────────────────────────────────────────────────────

  function render() {
    _renderSidebar();
    _renderGrid();
  }

  // ── Sidebar ───────────────────────────────────────────────────────────────

  function _renderSidebar() {
    const el = document.getElementById('ovzSidebar');
    if (!el) return;

    el.innerHTML = `
      <div class="p-3 d-flex flex-column gap-3">

        <!-- Zoekbalk + sort + actieve filters -->
        <div class="d-flex flex-column gap-1">
          <input type="search" class="form-control form-control-sm" id="ovzSearch"
            placeholder="Search…"
            value="${_esc(_filters.search)}"
            oninput="OVZ.setFilter('search', this.value)"
            autocomplete="off">
          <select class="form-select form-select-sm" id="ovzSort"
            onchange="OVZ.setFilter('sort', this.value)" title="Sort by">
            ${Object.entries(SORT_LABELS).map(([k, v]) =>
              `<option value="${k}" ${_filters.sort === k ? 'selected' : ''}>${v}</option>`
            ).join('')}
          </select>
          ${(() => {
            const parts = [];
            if (_filters.search.trim())   parts.push(`"${_esc(_filters.search.trim())}"`);
            if (_filters.type)            parts.push(TYPE_LABELS[_filters.type] || _filters.type);
            if (_filters.domeinen.size)   parts.push([..._filters.domeinen].map(d => d.toUpperCase()).join(', '));
            const hasFilter = parts.length > 0;
            return `
              <div class="d-flex align-items-start gap-2">
                <span class="text-muted small flex-grow-1 text-break">
                  ${hasFilter ? parts.join(' · ') : 'no filters active'}
                </span>
                ${hasFilter ? `<button class="btn btn-sm btn-outline-secondary py-0 px-2 flex-shrink-0" onclick="OVZ.clearAllFilters()">clear</button>` : ''}
              </div>`;
          })()}
        </div>

        <!-- Type -->
        <div>
          <div class="text-uppercase fw-semibold text-secondary mb-2">Type</div>
          <div class="d-flex flex-column gap-1">
            ${Object.entries(TYPE_LABELS).map(([k, v]) => _typeBtn(k, v, TYPE_ICONS[k])).join('')}
          </div>
        </div>

        <!-- Domein -->
        <div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="text-uppercase fw-semibold text-secondary">Domain</span>
            ${_filters.domeinen.size
              ? `<button class="btn btn-sm btn-outline-secondary py-0 px-2" onclick="OVZ.setFilter('domeinen_clear','')">clear</button>`
              : ''}
          </div>
          <div class="d-flex flex-column gap-1">
            ${DOMEIN_TAGS.map(t => _domeinBtn(t)).join('')}
          </div>
        </div>

      </div>
    `;

    if (_filters.search) {
      const inp = document.getElementById('ovzSearch');
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }
  }

  const DOMEIN_COLORS = { msa: 'var(--msa)', cna: 'var(--cna)', rca: 'var(--rca)', mtt: 'var(--mtt)', onco: 'var(--onco)', ger: 'var(--ger)' };

  function _typeBtn(val, label, icon) {
    const active = _filters.type === val;
    return `<button
      class="btn btn-sm w-100 text-start d-flex align-items-center gap-2 ${active ? 'btn-secondary' : 'btn-outline-secondary'}"
      onclick="OVZ.setFilter('type','${val}')">
      <span class="text-center flex-shrink-0">${icon}</span>${label}
    </button>`;
  }

  function _domeinBtn(tag) {
    const active = _filters.domeinen.has(tag);
    const color = DOMEIN_COLORS[tag] || 'var(--bs-secondary-color)';
    return `<button
      class="btn btn-sm w-100 text-start d-flex align-items-center gap-2 ${active ? 'btn-secondary' : 'btn-outline-secondary'}"
      onclick="OVZ.setFilter('domein','${tag}')">
      <span class="rounded-circle flex-shrink-0" style="width:8px;height:8px;background:${color};display:inline-block;"></span>
      ${tag.toUpperCase()}
    </button>`;
  }

  // ── Filter logic ──────────────────────────────────────────────────────────

  function setFilter(key, value) {
    if (key === 'search') {
      _filters.search = value;
      _renderGrid();
      return;
    }
    if (key === 'sort') {
      _filters.sort = value;
      _renderGrid();
      return;
    }
    if (key === 'type') {
      _filters.type = _filters.type === value && value !== '' ? '' : value;
    } else if (key === 'domein') {
      if (_filters.domeinen.has(value)) _filters.domeinen.delete(value);
      else _filters.domeinen.add(value);
    } else if (key === 'domeinen_clear') {
      _filters.domeinen.clear();
    }
    _renderSidebar();
    _renderGrid();
  }

  // ── Grid ──────────────────────────────────────────────────────────────────

  function _renderGrid() {
    const grid = document.getElementById('overzicht-main');
    if (!grid) return;

    const args = {};
    if (_filters.type)         args.type   = _filters.type;
    if (_filters.search.trim()) args.search = _filters.search.trim();

    let results = DB.query(args);

    const allSelected = DOMEIN_TAGS.every(d => _filters.domeinen.has(d));
    if (_filters.domeinen.size > 0 && !allSelected) {
      results = results.filter(obj => {
        const tags = new Set(DB.getTags(obj.id));
        return [..._filters.domeinen].some(d => tags.has(d));
      });
    }

    results = _sort(results);

    if (!results.length) {
      grid.innerHTML = `<p class="text-muted small p-2">No results.</p>`;
      return;
    }

    const counts = {};
    for (const obj of results) counts[obj.type] = (counts[obj.type] || 0) + 1;
    const breakdown = Object.entries(counts)
      .map(([t, n]) => `${n} ${TYPE_LABELS[t] || t}`).join(' · ');

    const cards = results.map(obj => {
      const tags = DB.getTags(obj.id);
      return CARDS.buildCard(obj, tags).replace(
        `onclick="CARDS.openDetail('${obj.id}')"`,
        `onclick="OVZ.showDetail('${obj.id}')"`
      );
    }).join('');

    grid.innerHTML = `
      <p class="text-muted mb-2" style="font-size:0.74rem;">${results.length} objects · ${breakdown}</p>
      <div class="masonry">${cards}</div>`;
  }

  // ── Sorting ───────────────────────────────────────────────────────────────

  function _sort(objs) {
    const arr = objs.slice();
    const key = (o) => (o.afk || o.title || '').toLowerCase();
    const azCmp = (a, b) => key(a).localeCompare(key(b));

    let mode = _filters.sort;
    // Relevance only meaningful with active search; otherwise fall back to A→Z
    if (mode === 'relevance' && !_filters.search.trim()) mode = 'az';

    switch (mode) {
      case 'relevance': {
        const lq = _filters.search.trim().toLowerCase();
        return arr.sort((a, b) => _score(a, lq) - _score(b, lq) || azCmp(a, b));
      }
      case 'za':
        return arr.sort((a, b) => key(b).localeCompare(key(a)));
      case 'type':
        return arr.sort((a, b) => (a.type || '').localeCompare(b.type || '') || azCmp(a, b));
      case 'relations':
        return arr.sort((a, b) => DB.getLinks(b.id).length - DB.getLinks(a.id).length || azCmp(a, b));
      case 'modified':
        return arr.sort((a, b) => (b.modified || 0) - (a.modified || 0) || azCmp(a, b));
      case 'created':
        return arr.sort((a, b) => (b.created || 0) - (a.created || 0) || azCmp(a, b));
      case 'az':
      default:
        return arr.sort(azCmp);
    }
  }

  function _score(obj, lq) {
    const afk = (obj.afk || '').toLowerCase();
    if (afk === lq)          return 0;
    if (afk.startsWith(lq)) return 1;
    if (afk.includes(lq))   return 2;
    if ((obj.title || '').toLowerCase().includes(lq)) return 3;
    return 4;
  }

  // ── Detail offcanvas ──────────────────────────────────────────────────────

  const TYPE_COLORS = {
    instrument: '#F97316',
    kennis:     '#2563EB',
    bronnen:    '#7C3AED',
    casuistiek: '#0D9488',
  };

  function showDetail(id) {
    const obj = DB.get(id);
    if (!obj) return;

    const detail    = CARDS.buildDetailHTML(id);
    const tags      = DB.getTags(id);
    const linkCount = DB.getLinks(id).length;
    const color     = TYPE_COLORS[obj.type] || 'var(--bs-secondary-color)';
    const bg        = `color-mix(in srgb, ${color} 15%, transparent)`;
    const bdr       = `color-mix(in srgb, ${color} 40%, transparent)`;

    const typeBadge = `<span class="badge rounded-pill border"
      style="color:${color};background:${bg};border-color:${bdr};">
      ${TYPE_ICONS[obj.type] || ''} ${TYPE_LABELS[obj.type] || obj.type}
    </span>`;

    const domainDots = tags
      .filter(t => DOMEIN_TAGS.includes(t))
      .map(t => `<span class="rounded-circle" title="${t.toUpperCase()}"
        style="width:8px;height:8px;background:${DOMEIN_COLORS[t]};display:inline-block;"></span>`)
      .join('');

    const hasSubtitle = obj.afk && obj.title && obj.afk !== obj.title;

    const domainPills = tags
      .filter(t => DOMEIN_TAGS.includes(t))
      .map(t => {
        const c = DOMEIN_COLORS[t];
        const bg  = `color-mix(in srgb, ${c} 15%, transparent)`;
        const bdr = `color-mix(in srgb, ${c} 40%, transparent)`;
        return `<span class="badge rounded-pill border" style="color:${c};background:${bg};border-color:${bdr};">${t.toUpperCase()}</span>`;
      }).join(' ');

    const relatiePill = `<span class="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border">◈ ${linkCount} relation${linkCount !== 1 ? 's' : ''}</span>`;

    document.getElementById('ovzDetailHeader').innerHTML = `
      <div class="mb-1">
        <div class="fw-bold font-monospace fs-5 lh-sm">${_esc(obj.afk || obj.title || obj.id)}</div>
        ${hasSubtitle ? `<div class="small text-muted">${_esc(obj.title)}</div>` : ''}
      </div>
      <div class="d-flex flex-wrap gap-1 align-items-center">
        ${typeBadge}
        ${domainPills}
        ${relatiePill}
      </div>
    `;

    document.getElementById('ovzDetailBody').innerHTML =
      detail.body
        ? `<div class="d-flex flex-column gap-3">${detail.body}</div>`
        : `<p class="text-muted small">No content.</p>`;

    const f1 = document.getElementById('ovzDetailFooter');
    const f2 = document.getElementById('ovzDetailFooter2');
    f1.innerHTML  = detail.footer;
    f2.innerHTML  = detail.footer2;
    f1.classList.toggle('d-none', !detail.footer);
    f2.classList.toggle('d-none', !detail.footer2);

    bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('detailPanel')).show();
  }

  function closeDetail() {
    const oc = bootstrap.Offcanvas.getInstance(document.getElementById('detailPanel'));
    if (oc) oc.hide();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  function clearAllFilters() {
    _filters.search    = '';
    _filters.type      = '';
    _filters.domeinen  = new Set();
    _filters.sort      = 'relevance';
    _renderSidebar();
    _renderGrid();
  }

  return { render, setFilter, clearAllFilters, showDetail, closeDetail };
})();
