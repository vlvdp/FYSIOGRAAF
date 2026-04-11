/**
 * graph.js — Interactieve graph visualisatie via vis-network
 *
 * Toont alle DB-objecten als nodes en hun links als edges.
 * Klik op een node om het detail-panel te openen.
 */

const GRAPH = (() => {

  // ── Kleurenschema (sync met style.css) ───────────────────────────────────

  const TYPE_COLOR = {
    instrument:  { bg: '#F97316', border: '#C05A0B', font: '#000000' },
    kennis:      { bg: '#2563EB', border: '#1A4BAD', font: '#FFFFFF' },
    bronnen:     { bg: '#7C3AED', border: '#5B28B3', font: '#FFFFFF' },
    casuistiek:  { bg: '#0D9488', border: '#0A6B62', font: '#FFFFFF' },
  };

  const REL_COLOR = {
    nexus:     '#F97316',
    contextus: '#7C3AED',
    usus:      '#E11D48',
    sequens:   '#16A34A',
  };

  const TYPE_LABEL = {
    instrument:  'Instrument',
    kennis:      'Kennis',
    bronnen:     'Bronnen',
    casuistiek:  'Casuistiek',
  };

  // ── State ─────────────────────────────────────────────────────────────────

  let _network         = null;
  let _nodes           = null;
  let _edges           = null;
  let _visNodes        = null;
  let _visEdges        = null;
  let _activeTypes     = new Set(Object.keys(TYPE_COLOR));
  let _activeRels      = new Set(Object.keys(REL_COLOR));
  let _searchTerm      = '';
  let _focusNodeId     = null;
  let _focusNeighborIds = new Set();

  // ── Render ────────────────────────────────────────────────────────────────

  const TYPE_SHAPES = {
    instrument: `<svg width="12" height="12" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="#F97316" stroke="#C05A0B" stroke-width="1.5"/></svg>`,
    kennis:     `<svg width="12" height="12" viewBox="0 0 14 14"><polygon points="7,1 13,13 1,13" fill="#2563EB" stroke="#1A4BAD" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    bronnen:    `<svg width="12" height="12" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" fill="#7C3AED" stroke="#5B28B3" stroke-width="1.5"/></svg>`,
    casuistiek: `<svg width="12" height="12" viewBox="0 0 14 14"><polygon points="7,1 13,7 7,13 1,7" fill="#0D9488" stroke="#0A6B62" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  };

  function render() {
    const sidebar = document.getElementById('graphSidebar');
    const main    = document.getElementById('graph-main');
    if (!sidebar || !main) return;
    sidebar.innerHTML = _buildSidebarHTML();
    main.innerHTML    = `<div id="graphCanvas" class="w-100 h-100"></div>`;
    _buildNetwork();
    _bindControls();
  }

  function _buildSidebarHTML() {
    return `
      <div class="p-3 d-flex flex-column gap-3">
        <div class="d-flex flex-column gap-1">
          <input type="text" id="graphSearch" class="form-control form-control-sm"
            placeholder="Zoek node…" autocomplete="off">
          <div class="d-flex align-items-start gap-2">
            <span class="text-muted small flex-grow-1 text-break" id="graphFilterStatus">geen filters actief</span>
          </div>
          <div id="graphFocusBar" class="d-none d-flex align-items-center gap-2 px-2 py-1 rounded"
            style="background:color-mix(in srgb,var(--bs-warning) 15%,transparent);border:1px solid color-mix(in srgb,var(--bs-warning) 40%,transparent);">
            <span class="small flex-grow-1 text-truncate" id="graphFocusLabel"></span>
            <button class="btn btn-sm p-0 lh-1 border-0 bg-transparent text-secondary" id="graphFocusClear" title="Focus wissen">✕</button>
          </div>
        </div>
        <div>
          <div class="text-uppercase fw-semibold text-secondary mb-2">Type</div>
          <div class="d-flex flex-column gap-1">
            ${Object.entries(TYPE_COLOR).map(([type, c]) => `
              <button class="btn btn-sm w-100 text-start d-flex align-items-center gap-2 btn-secondary"
                data-filter-type="${type}">
                ${TYPE_SHAPES[type] || ''} ${TYPE_LABEL[type]}
              </button>`).join('')}
          </div>
        </div>
        <div>
          <div class="text-uppercase fw-semibold text-secondary mb-2">Relatie</div>
          <div class="d-flex flex-column gap-1">
            ${Object.entries(REL_COLOR).map(([rel, color]) => `
              <button class="btn btn-sm w-100 text-start d-flex align-items-center gap-2 btn-secondary"
                data-filter-rel="${rel}">
                <span class="rounded-circle flex-shrink-0" style="width:8px;height:8px;background:${color};display:inline-block;"></span>
                ${rel}
              </button>`).join('')}
          </div>
        </div>
        <div class="d-flex flex-column gap-1">
          <button class="btn btn-sm btn-outline-secondary" id="graphFit">⊡ Fit</button>
          <button class="btn btn-sm btn-outline-secondary" id="graphPhysics">⟳ Stabiliseer</button>
          <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#legendaModal">⊞ Legenda</button>
        </div>
      </div>
    `;
  }

  function _buildNetwork() {
    const allObjects = DB.getAll();
    const allLinks   = allObjects.flatMap(o => DB.getLinks(o.id))
      .filter((l, i, arr) => arr.findIndex(x => x.id === l.id) === i); // dedupe

    _buildDataSets(allObjects, allLinks);
    _initVis();
    _updateStat();
  }

  function _buildDataSets(objects, links) {
    // Bereken degree per node
    const degreeMap = {};
    links.forEach(l => {
      degreeMap[l.from] = (degreeMap[l.from] || 0) + 1;
      degreeMap[l.to]   = (degreeMap[l.to]   || 0) + 1;
    });

    const visNodeArr = objects.map(obj => {
      const c      = TYPE_COLOR[obj.type] || { bg: '#555', border: '#333', font: '#fff' };
      const label  = obj.afk || obj.title?.slice(0, 12) || obj.id;
      const degree = degreeMap[obj.id] || 0;
      const size   = Math.min(10 + degree * 2.5, 32);
      const fullTitle = [obj.afk, obj.title, `${degree} verbinding${degree !== 1 ? 'en' : ''}`].filter(Boolean).join(' — ');
      return {
        id:     obj.id,
        label,
        title:  fullTitle,
        group:  obj.type,
        color:  { background: c.bg, border: c.border, highlight: { background: c.bg, border: '#fff' } },
        font:   { color: c.font, size: 12, face: 'JetBrains Mono, monospace' },
        shape:  _shapeForType(obj.type),
        size,
      };
    });

    const visEdgeArr = links.map(l => ({
      id:     l.id,
      from:   l.from,
      to:     l.to,
      label:  l.rel,
      title:  l.rel,
      color:  { color: REL_COLOR[l.rel] || '#666', opacity: 0.7 },
      font:   { color: '#888', size: 9, face: 'Inter, sans-serif', align: 'middle' },
      arrows: { to: { enabled: true, scaleFactor: 0.6 } },
      width:  1.5,
      smooth: { type: 'dynamic' },
    }));

    _visNodes = visNodeArr;
    _visEdges = visEdgeArr;
  }

  function _shapeForType(type) {
    return {
      instrument: 'dot',
      kennis:     'triangle',
      bronnen:    'square',
      casuistiek: 'diamond',
    }[type] || 'dot';
  }

  function _initVis() {
    const container = document.getElementById('graphCanvas');
    if (!container) return;
    if (_network) { _network.destroy(); _network = null; }

    _nodes = new vis.DataSet(_visNodes.filter(_nodeVisible));
    _edges = new vis.DataSet(_visEdges.filter(_edgeVisible));

    const options = {
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: { gravitationalConstant: -60, centralGravity: 0.005, springLength: 120, damping: 0.4 },
        stabilization: { iterations: 200, fit: true },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        navigationButtons: false,
        keyboard: false,
      },
      layout: { improvedLayout: false },
    };

    _network = new vis.Network(container, { nodes: _nodes, edges: _edges }, options);

    _network.on('click', params => {
      if (params.nodes.length === 1) {
        const id = params.nodes[0];
        _setFocus(id);
        OVZ.showDetail(id);
      } else if (params.nodes.length === 0) {
        _clearFocus();
      }
    });

    _network.on('stabilizationIterationsDone', () => {
      _network.setOptions({ physics: { enabled: false } });
    });
  }

  // ── Filtering ─────────────────────────────────────────────────────────────

  function _nodeVisible(node) {
    if (_focusNodeId && !_focusNeighborIds.has(node.id)) return false;
    if (!_activeTypes.has(node.group)) return false;
    if (_searchTerm) {
      const label = (node.label + ' ' + (node.title || '')).toLowerCase();
      if (!label.includes(_searchTerm)) return false;
    }
    return true;
  }

  function _edgeVisible(edge) {
    return _activeRels.has(edge.label);
  }

  function _applyFilters() {
    if (!_nodes || !_edges) return;

    // Zichtbare node IDs
    const visibleNodeIds = new Set(
      _visNodes.filter(_nodeVisible).map(n => n.id)
    );

    // Update nodes
    const currentNodeIds = new Set(_nodes.getIds());
    const toAdd    = _visNodes.filter(n => visibleNodeIds.has(n.id) && !currentNodeIds.has(n.id));
    const toRemove = [...currentNodeIds].filter(id => !visibleNodeIds.has(id));
    if (toAdd.length)    _nodes.add(toAdd);
    if (toRemove.length) _nodes.remove(toRemove);

    // Update edges (alleen als beide endpoints zichtbaar zijn)
    const visibleEdges = _visEdges.filter(e =>
      _edgeVisible(e) && visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to)
    );
    const visibleEdgeIds = new Set(visibleEdges.map(e => e.id));
    const currentEdgeIds = new Set(_edges.getIds());
    const toAddE    = visibleEdges.filter(e => !currentEdgeIds.has(e.id));
    const toRemoveE = [...currentEdgeIds].filter(id => !visibleEdgeIds.has(id));
    if (toAddE.length)    _edges.add(toAddE);
    if (toRemoveE.length) _edges.remove(toRemoveE);

    _updateStat();
  }

  function _updateStat() {
    const el = document.getElementById('graphStat');
    if (!el || !_nodes) return;
    el.textContent = `${_nodes.length} nodes · ${_edges ? _edges.length : 0} edges`;
  }

  function _updateFilterStatus() {
    const el = document.getElementById('graphFilterStatus');
    if (!el) return;
    const allTypes = Object.keys(TYPE_COLOR);
    const allRels  = Object.keys(REL_COLOR);
    const hiddenTypes = allTypes.filter(t => !_activeTypes.has(t));
    const hiddenRels  = allRels.filter(r => !_activeRels.has(r));
    const parts = [];
    if (hiddenTypes.length) parts.push(hiddenTypes.map(t => TYPE_LABEL[t]).join(', ') + ' verborgen');
    if (hiddenRels.length)  parts.push(hiddenRels.join(', ') + ' verborgen');
    el.textContent = parts.length ? parts.join(' · ') : 'geen filters actief';
  }

  // ── Focus mode ────────────────────────────────────────────────────────────

  function _setFocus(id) {
    if (_focusNodeId === id) { _clearFocus(); return; }
    _focusNodeId = id;
    _focusNeighborIds = new Set([id]);
    _visEdges.forEach(e => {
      if (e.from === id) _focusNeighborIds.add(e.to);
      if (e.to   === id) _focusNeighborIds.add(e.from);
    });
    _applyFilters();
    _updateFocusUI();
  }

  function _clearFocus() {
    _focusNodeId = null;
    _focusNeighborIds = new Set();
    _applyFilters();
    _updateFocusUI();
  }

  function _updateFocusUI() {
    const bar   = document.getElementById('graphFocusBar');
    const label = document.getElementById('graphFocusLabel');
    if (!bar || !label) return;
    if (_focusNodeId) {
      const node = _visNodes.find(n => n.id === _focusNodeId);
      const name = node ? (node.title?.split(' — ')[0] || node.label) : _focusNodeId;
      const count = _focusNeighborIds.size - 1;
      label.textContent = `${name} · ${count} buur${count !== 1 ? 'en' : ''}`;
      bar.classList.remove('d-none');
    } else {
      bar.classList.add('d-none');
    }
  }

  // ── Event bindings ────────────────────────────────────────────────────────

  function _bindControls() {
    // Zoek
    const searchEl = document.getElementById('graphSearch');
    if (searchEl) {
      searchEl.addEventListener('input', e => {
        _searchTerm = e.target.value.toLowerCase().trim();
        _applyFilters();
        if (_searchTerm && _network) {
          // Highlight gevonden nodes
          const found = _visNodes.filter(_nodeVisible).map(n => n.id);
          if (found.length) _network.selectNodes(found);
        }
      });
    }

    // Type-filters
    document.querySelectorAll('[data-filter-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.filterType;
        if (_activeTypes.has(type)) _activeTypes.delete(type);
        else _activeTypes.add(type);
        btn.classList.toggle('btn-secondary', _activeTypes.has(type));
        btn.classList.toggle('btn-outline-secondary', !_activeTypes.has(type));
        _applyFilters();
        _updateFilterStatus();
      });
    });

    // Relatie-filters
    document.querySelectorAll('[data-filter-rel]').forEach(btn => {
      btn.addEventListener('click', () => {
        const rel = btn.dataset.filterRel;
        if (_activeRels.has(rel)) _activeRels.delete(rel);
        else _activeRels.add(rel);
        btn.classList.toggle('btn-secondary', _activeRels.has(rel));
        btn.classList.toggle('btn-outline-secondary', !_activeRels.has(rel));
        _applyFilters();
        _updateFilterStatus();
      });
    });

    // Fit
    document.getElementById('graphFit')?.addEventListener('click', () => {
      _network?.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
    });

    // Focus wissen
    document.getElementById('graphFocusClear')?.addEventListener('click', () => _clearFocus());

    // Physics toggle
    document.getElementById('graphPhysics')?.addEventListener('click', () => {
      if (!_network) return;
      const opts = _network.physics;
      const current = opts?.physicsEnabled ?? false;
      _network.setOptions({ physics: { enabled: !current } });
      document.getElementById('graphPhysics').textContent = !current ? '⏸ Pauzeer' : '⟳ Stabiliseer';
    });
  }

  // ── Public ────────────────────────────────────────────────────────────────

  return { render, setFocus: _setFocus, clearFocus: _clearFocus };
})();
