/**
 * app.js — Navigatie, initialisatie en DB-stats
 */

const APP = (() => {

  const TOP_IDS = ['overzicht', 'graph'];

  // ── Top-tab navigatie ────────────────────────────────────────────────────

  function showTop(id) {
    // View-switcher button state
    TOP_IDS.forEach(tid => {
      const btn = document.getElementById(`tab-${tid}`);
      if (!btn) return;
      btn.classList.toggle('btn-secondary', tid === id);
      btn.classList.toggle('btn-outline-secondary', tid !== id);
    });

    // Sidebar panels
    const ovzSidebar   = document.getElementById('ovzSidebar');
    const graphSidebar = document.getElementById('graphSidebar');
    ovzSidebar?.classList.toggle('d-none',   id !== 'overzicht');
    graphSidebar?.classList.toggle('d-none', id !== 'graph');

    // Main panels
    const ovzMain   = document.getElementById('overzicht-main');
    const graphMain = document.getElementById('graph-main');
    ovzMain?.classList.toggle('d-none',   id !== 'overzicht');
    graphMain?.classList.toggle('d-none', id !== 'graph');

    // Render lazy bij eerste bezoek
    _renderTopIfNeeded(id);
  }

  // ── Lazy render ──────────────────────────────────────────────────────────

  const _rendered = new Set();

  function _renderTopIfNeeded(id) {
    if (_rendered.has(id)) return;
    _rendered.add(id);
    if (id === 'overzicht') OVZ.render();
    if (id === 'graph')     GRAPH.render();
  }

  // ── DB stats bar ─────────────────────────────────────────────────────────

  function updateStats() {
    const s  = DB.stats();
    const el = id => document.getElementById(id);
    if (el('dbStatObjects')) el('dbStatObjects').textContent = s.objects;
    if (el('dbStatLinks'))   el('dbStatLinks').textContent   = s.links;
  }

  // ── Init ─────────────────────────────────────────────────────────────────

  function init() {
    updateStats();

    // Begin met klinimetrie (overzicht)
    showTop('overzicht');
  }

  document.addEventListener('DOMContentLoaded', init);

  // ── Toetsenbordnavigatie ─────────────────────────────────────────────────

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    if (e.key === 'Escape') {
      const panel = document.getElementById('detailPanel');
      if (panel?.classList.contains('show')) {
        OVZ.closeDetail();
      }
    }
  });

  return { showTop, updateStats };
})();
