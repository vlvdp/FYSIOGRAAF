/**
 * app.js — Navigatie, initialisatie en DB-stats
 */

const APP = (() => {

  const TOP_IDS = ['overzicht', 'graph'];

  // ── Top-tab navigatie ────────────────────────────────────────────────────

  function showTop(id) {
    // Nav-tab active state
    TOP_IDS.forEach(tid => {
      document.getElementById(`tab-${tid}`)?.classList.toggle('active', tid === id);
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
    if (el('dbStatTags'))    el('dbStatTags').textContent    = s.tags;
    if (el('dbStatLastEdit')) {
      if (s.lastEdit) {
        const d = new Date(s.lastEdit);
        el('dbStatLastEdit').textContent = d.toLocaleString('en-GB', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        });
      } else {
        el('dbStatLastEdit').textContent = '';
      }
    }
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
    // Negeer als gebruiker aan het typen is
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    const ovzOpen = document.getElementById('ovzDetailOverlay')?.classList.contains('active');

    // Escape: sluit rolodex detail
    if (e.key === 'Escape' && ovzOpen) {
      OVZ.closeDetail();
      return;
    }
  });

  return { showTop, updateStats };
})();
