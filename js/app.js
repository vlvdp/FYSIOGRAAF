/**
 * app.js — Navigatie, gedeelde filters, sidebar-render, DB-stats
 */

const APP = (() => {

  const VIEWS = ['overzicht', 'graph', 'tabel'];

  // ── Constants (gedeeld tussen views) ─────────────────────────────────────

  const TYPE_LABELS = {
    instrument: 'Instrument',
    kennis:     'Knowledge',
    bronnen:    'Sources',
    casuistiek: 'Case Studies',
  };

  const TYPE_ICONS = {
    instrument: `<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="#F97316" stroke="#C05A0B" stroke-width="1.5"/></svg>`,
    kennis:     `<svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,1 13,13 1,13" fill="#2563EB" stroke="#1A4BAD" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    bronnen:    `<svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" fill="#7C3AED" stroke="#5B28B3" stroke-width="1.5"/></svg>`,
    casuistiek: `<svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,1 13,7 7,13 1,7" fill="#0D9488" stroke="#0A6B62" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  };

  // Bootstrap-icon varianten voor compacte sidebar-knoppen
  const TYPE_BI = {
    instrument: { cls: 'bi-circle-fill',   color: '#F97316' },
    kennis:     { cls: 'bi-triangle-fill', color: '#2563EB' },
    bronnen:    { cls: 'bi-square-fill',   color: '#7C3AED' },
    casuistiek: { cls: 'bi-diamond-fill',  color: '#0D9488' },
  };

  const DOMEIN_TAGS   = ['msa', 'cna', 'rca', 'mtt', 'onco', 'ger'];
  const DOMEIN_COLORS = { msa: 'var(--msa)', cna: 'var(--cna)', rca: 'var(--rca)', mtt: 'var(--mtt)', onco: 'var(--onco)', ger: 'var(--ger)' };

  // ── Shared filter state ──────────────────────────────────────────────────

  const FILTERS = {
    search:   '',
    type:     '',
    domeinen: new Set(),
  };

  const _subs = [];
  function subscribe(fn) { _subs.push(fn); }
  function _notify()     { _subs.forEach(fn => { try { fn(FILTERS); } catch (e) { console.error(e); } }); }

  function setFilter(key, value) {
    if (key === 'search') {
      FILTERS.search = value;
    } else if (key === 'type') {
      FILTERS.type = FILTERS.type === value ? '' : value;
    } else if (key === 'domein') {
      if (FILTERS.domeinen.has(value)) FILTERS.domeinen.delete(value);
      else FILTERS.domeinen.add(value);
    } else if (key === 'domeinen_clear') {
      FILTERS.domeinen.clear();
    }
    renderSidebar();
    _notify();
  }

  function clearAll() {
    FILTERS.search = '';
    FILTERS.type = '';
    FILTERS.domeinen.clear();
    const inp = document.getElementById('app-search');
    if (inp) inp.value = '';
    renderSidebar();
    _notify();
  }

  // ── Sidebar render ───────────────────────────────────────────────────────

  function _esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  function renderSidebar() {
    const el = document.getElementById('app-sidebar');
    if (!el) return;

    const BTN_BASE = 'btn btn-sm w-100 text-start d-flex align-items-center gap-2';

    const typeBtns = Object.entries(TYPE_LABELS).map(([k, v]) => {
      const active = FILTERS.type === k;
      const icon   = TYPE_BI[k];
      return `<button class="${BTN_BASE} ${active ? 'btn-secondary' : 'btn-outline-secondary'}"
        onclick="APP.setFilter('type','${k}')" title="${v}">
        <i class="sb-icon bi ${icon.cls}" style="color:${icon.color}"></i>
        <span class="sb-label">${v}</span>
      </button>`;
    }).join('');

    const domBtns = DOMEIN_TAGS.map(t => {
      const active = FILTERS.domeinen.has(t);
      const color  = DOMEIN_COLORS[t];
      return `<button class="${BTN_BASE} ${active ? 'btn-secondary' : 'btn-outline-secondary'}"
        onclick="APP.setFilter('domein','${t}')" title="${t.toUpperCase()}">
        <span class="sb-icon rounded-circle" style="width:10px;height:10px;background:${color};display:inline-block;"></span>
        <span class="sb-label">${t.toUpperCase()}</span>
      </button>`;
    }).join('');

    el.innerHTML = `
      <div class="p-2 d-flex flex-column gap-3">

        <button class="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
          onclick="APP.toggleSidebar()" title="Toggle sidebar" aria-label="Toggle sidebar">
          <i class="bi bi-layout-sidebar"></i>
        </button>

        <div>
          <div class="sb-section-label text-uppercase fw-semibold text-secondary mb-2" style="font-size:0.7rem">Type</div>
          <div class="d-flex flex-column gap-1">${typeBtns}</div>
        </div>

        <div>
          <div class="sb-section-label text-uppercase fw-semibold text-secondary mb-2" style="font-size:0.7rem">Domain</div>
          <div class="d-flex flex-column gap-1">${domBtns}</div>
        </div>

      </div>
    `;
  }

  // Keep topbar search input in sync with FILTERS state
  function _syncTopbarSearch() {
    const inp = document.getElementById('app-search');
    if (inp && inp.value !== FILTERS.search) inp.value = FILTERS.search;
  }

  // ── Sidebar collapse ─────────────────────────────────────────────────────

  function toggleSidebar() {
    document.body.classList.toggle('sidebar-collapsed');
    localStorage.setItem('sidebarCollapsed', document.body.classList.contains('sidebar-collapsed') ? '1' : '0');
  }

  // ── Top-tab navigatie ────────────────────────────────────────────────────

  function showTop(id) {
    VIEWS.forEach(v => {
      const btn = document.getElementById(`tab-${v}`);
      if (btn) {
        btn.classList.toggle('btn-secondary', v === id);
        btn.classList.toggle('btn-outline-secondary', v !== id);
      }
      document.getElementById(`${v}-main`)?.classList.toggle('d-none', v !== id);
    });
    _renderIfNeeded(id);
  }

  const _rendered = new Set();
  function _renderIfNeeded(id) {
    if (_rendered.has(id)) return;
    _rendered.add(id);
    if (id === 'overzicht') OVZ.render();
    if (id === 'graph')     GRAPH.render();
    if (id === 'tabel')     TABEL.render();
  }

  // ── DB stats bar ─────────────────────────────────────────────────────────

  function updateStats() {
    const s    = DB.stats();
    const nodes = document.getElementById('db-nodes');
    const edges = document.getElementById('db-edges');
    if (nodes) nodes.textContent = s.objects;
    if (edges) edges.textContent = s.links;
  }

  // ── Init ─────────────────────────────────────────────────────────────────

  function init() {
    if (localStorage.getItem('sidebarCollapsed') === '1') {
      document.body.classList.add('sidebar-collapsed');
    }
    renderSidebar();
    updateStats();
    showTop('overzicht');
  }

  document.addEventListener('DOMContentLoaded', init);

  // ── Keyboard ─────────────────────────────────────────────────────────────

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    if (e.key === 'Escape') {
      const panel = document.getElementById('detail-panel');
      if (panel?.classList.contains('show')) OVZ.closeDetail();
    }
  });

  return {
    // constants
    TYPE_LABELS, TYPE_ICONS, DOMEIN_TAGS, DOMEIN_COLORS,
    // filter API
    FILTERS, setFilter, clearAll, subscribe,
    // UI
    showTop, updateStats, renderSidebar, toggleSidebar,
  };
})();
