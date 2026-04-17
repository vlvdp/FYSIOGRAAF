/**
 * overzicht.js — Rolodex: centrale verzameling van alle objecten
 */

const OVZ = (() => {

  // Types/domeinen/icons/labels nu in APP.* (gedeeld)
  const TYPE_ICONS    = APP.TYPE_ICONS;
  const TYPE_LABELS   = APP.TYPE_LABELS;
  const DOMEIN_TAGS   = APP.DOMEIN_TAGS;
  const DOMEIN_COLORS = APP.DOMEIN_COLORS;

  let _sort = 'relevance';

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
    _renderGrid();
  }

  function setSort(value) {
    _sort = value;
    _renderGrid();
  }

  // ── Grid ──────────────────────────────────────────────────────────────────

  function _renderGrid() {
    const grid = document.getElementById('overzicht-main');
    if (!grid) return;

    const F = APP.FILTERS;
    const args = {};
    if (F.type)           args.type   = F.type;
    if (F.search.trim())  args.search = F.search.trim();

    let results = DB.query(args);

    const allSelected = DOMEIN_TAGS.every(d => F.domeinen.has(d));
    if (F.domeinen.size > 0 && !allSelected) {
      results = results.filter(obj => {
        const tags = new Set(DB.getTags(obj.id));
        return [...F.domeinen].some(d => tags.has(d));
      });
    }

    results = _sortResults(results);

    const counts = {};
    for (const obj of results) counts[obj.type] = (counts[obj.type] || 0) + 1;
    const breakdown = Object.entries(counts)
      .map(([t, n]) => `${n} ${TYPE_LABELS[t] || t}`).join(' · ');

    const sortSel = `<select class="form-select form-select-sm" style="width:auto" onchange="OVZ.setSort(this.value)" title="Sort by">
      ${Object.entries(SORT_LABELS).map(([k, v]) =>
        `<option value="${k}" ${_sort === k ? 'selected' : ''}>${v}</option>`
      ).join('')}
    </select>`;

    if (!results.length) {
      grid.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2 gap-2">
          <span class="text-muted small">0 objects</span>
          ${sortSel}
        </div>
        <p class="text-muted small">No results.</p>`;
      return;
    }

    const cards = results.map(obj => {
      const tags = DB.getTags(obj.id);
      return CARDS.buildCard(obj, tags).replace(
        `onclick="CARDS.openDetail('${obj.id}')"`,
        `onclick="OVZ.showDetail('${obj.id}')"`
      );
    }).join('');

    grid.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2 gap-2">
        <span class="text-muted small">${results.length} objects · ${breakdown}</span>
        ${sortSel}
      </div>
      <div class="masonry">${cards}</div>`;
  }

  // ── Sorting ───────────────────────────────────────────────────────────────

  function _sortResults(objs) {
    const arr = objs.slice();
    const key = (o) => (o.afk || o.title || '').toLowerCase();
    const azCmp = (a, b) => key(a).localeCompare(key(b));

    let mode = _sort;
    const search = APP.FILTERS.search.trim();
    if (mode === 'relevance' && !search) mode = 'az';

    switch (mode) {
      case 'relevance': {
        const lq = search.toLowerCase();
        return arr.sort((a, b) => _score(a, lq) - _score(b, lq) || azCmp(a, b));
      }
      case 'za':        return arr.sort((a, b) => key(b).localeCompare(key(a)));
      case 'type':      return arr.sort((a, b) => (a.type || '').localeCompare(b.type || '') || azCmp(a, b));
      case 'relations': return arr.sort((a, b) => DB.getLinks(b.id).length - DB.getLinks(a.id).length || azCmp(a, b));
      case 'modified':  return arr.sort((a, b) => (b.modified || 0) - (a.modified || 0) || azCmp(a, b));
      case 'created':   return arr.sort((a, b) => (b.created || 0) - (a.created || 0) || azCmp(a, b));
      case 'az':
      default:          return arr.sort(azCmp);
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
    instrument: 'var(--type-instrument)',
    kennis:     'var(--type-kennis)',
    bronnen:    'var(--type-bronnen)',
    casuistiek: 'var(--type-casuistiek)',
  };

  // ── Detail-paneel navigatiestack ──────────────────────────────────────────
  let _history           = [];
  let _currentId         = null;
  let _panelOpen         = false;
  let _detailListenerSet = false;

  function _ensureDetailListener() {
    if (_detailListenerSet) return;
    const panel = document.getElementById('detail-panel');
    if (!panel) return;
    panel.addEventListener('hidden.bs.offcanvas', () => {
      _history   = [];
      _currentId = null;
      _panelOpen = false;
      _updateBackBtn();
    });
    _detailListenerSet = true;
  }

  function _updateBackBtn() {
    const btn = document.getElementById('detail-back');
    if (!btn) return;
    btn.classList.toggle('d-none', _history.length === 0);
  }

  function back() {
    if (!_history.length) return;
    const prev = _history.pop();
    _renderDetail(prev);
  }

  function showDetail(id) {
    if (_panelOpen && _currentId && _currentId !== id) {
      _history.push(_currentId);
    } else if (!_panelOpen) {
      _history = [];
    }
    _panelOpen = true;
    _renderDetail(id);
  }

  function _renderDetail(id) {
    const obj = DB.get(id);
    if (!obj) return;
    _currentId = id;
    _ensureDetailListener();

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
      .map(t => `<i class="bi bi-circle-fill" title="${t.toUpperCase()}" style="color:${DOMEIN_COLORS[t]};font-size:0.55rem;"></i>`)
      .join(' ');

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

    document.getElementById('detail-header').innerHTML = `
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

    document.getElementById('detail-body').innerHTML =
      detail.body
        ? `<div class="d-flex flex-column gap-3">${detail.body}</div>`
        : `<p class="text-muted small">No content.</p>`;

    const f1 = document.getElementById('detail-footer');
    const f2 = document.getElementById('detail-footer-extra');
    f1.innerHTML  = detail.footer;
    f2.innerHTML  = detail.footer2;
    f1.classList.toggle('d-none', !detail.footer);
    f2.classList.toggle('d-none', !detail.footer2);
    const fWrap = document.getElementById('detail-footer-wrap');
    if (fWrap) fWrap.classList.toggle('d-none', !detail.footer && !detail.footer2);

    _updateBackBtn();
    bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('detail-panel')).show();
  }

  function closeDetail() {
    const oc = bootstrap.Offcanvas.getInstance(document.getElementById('detail-panel'));
    if (oc) oc.hide();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  // Subscribe to shared filter changes
  APP.subscribe(() => _renderGrid());

  return { render, setSort, showDetail, closeDetail, back };
})();
