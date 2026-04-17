/**
 * graph.js — Interactieve graph visualisatie via vis-network
 *
 * Toont alle DB-objecten als nodes en hun links als edges.
 * Klik op een node om het detail-panel te openen.
 */

const GRAPH = (() => {

  // ── Kleurenschema (sync met style.css) ───────────────────────────────────

  // vis-network rendert naar canvas → hex-waarden vereist (geen CSS vars).
  // Sync deze bij palette-wijzigingen met --type-* in style.css.
  const TYPE_COLOR = {
    instrument:  { bg: '#E8833A', border: '#A35B1F', font: '#000000' },
    kennis:      { bg: '#0B6FBF', border: '#084A80', font: '#FFFFFF' },
    bronnen:     { bg: '#7A4FBF', border: '#543585', font: '#FFFFFF' },
    casuistiek:  { bg: '#0F9D8A', border: '#0A6E60', font: '#FFFFFF' },
  };

  const REL_COLOR = {
    nexus:     '#F97316',
    contextus: '#7C3AED',
    usus:      '#E11D48',
    sequens:   '#16A34A',
  };

  const TYPE_LABEL = {
    instrument:  'Instrument',
    kennis:      'Knowledge',
    bronnen:     'Sources',
    casuistiek:  'Case Studies',
  };

  // ── State ─────────────────────────────────────────────────────────────────

  let _network         = null;
  let _nodes           = null;
  let _edges           = null;
  let _visNodes        = null;
  let _visEdges        = null;
  let _activeRels      = new Set(Object.keys(REL_COLOR)); // graph-specific
  let _focusNodeId     = null;
  let _focusNeighborIds = new Set();

  const DOMEIN_TAGS = APP.DOMEIN_TAGS;

  // ── Render ────────────────────────────────────────────────────────────────

  const TYPE_SHAPES = {
    instrument: `<i class="bi bi-circle-fill"   style="color:var(--type-instrument)"></i>`,
    kennis:     `<i class="bi bi-triangle-fill" style="color:var(--type-kennis)"></i>`,
    bronnen:    `<i class="bi bi-square-fill"   style="color:var(--type-bronnen)"></i>`,
    casuistiek: `<i class="bi bi-diamond-fill"  style="color:var(--type-casuistiek)"></i>`,
  };

  function render() {
    const main = document.getElementById('graph-main');
    if (!main) return;
    main.innerHTML = `
      <div id="graph-canvas" class="w-100 h-100"></div>

      <!-- Floating controls rechtsboven -->
      <div class="graph-controls d-flex flex-column gap-2">
        <div class="card p-2 d-flex flex-column gap-1">
          <div class="text-uppercase fw-semibold text-secondary mb-1" style="font-size:0.65rem">Relation</div>
          ${Object.entries(REL_COLOR).map(([rel, color]) => `
            <button class="btn btn-sm btn-secondary text-start d-flex align-items-center gap-2"
              data-filter-rel="${rel}">
              <span class="rounded-circle flex-shrink-0" style="width:8px;height:8px;background:${color};display:inline-block;"></span>
              ${rel}
            </button>`).join('')}
        </div>
        <div class="card p-2 d-flex flex-column gap-1">
          <button class="btn btn-sm btn-outline-secondary" id="graph-fit" title="Fit to view">⊡ Fit</button>
          <button class="btn btn-sm btn-outline-secondary" id="graph-physics" title="Toggle physics">⟳ Stabilise</button>
        </div>
      </div>

      <!-- Floating focus bar linksboven -->
      <div id="graph-focus-bar" class="graph-focus-bar alert alert-warning mb-0 d-none align-items-center gap-2 px-2 py-1">
        <span class="small flex-grow-1 text-truncate" id="graph-focus-label"></span>
        <button class="btn btn-sm p-0 lh-1 border-0 bg-transparent text-secondary" id="graph-focus-clear" title="Clear focus">✕</button>
      </div>
    `;
    _buildNetwork();
    _bindControls();
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

    const css = getComputedStyle(document.documentElement);
    const emphasisColor = css.getPropertyValue('--bs-emphasis-color').trim() || '#fff';
    const secondaryColor = css.getPropertyValue('--bs-secondary-color').trim() || '#888';

    const visNodeArr = objects.map(obj => {
      const c      = TYPE_COLOR[obj.type] || { bg: '#555', border: '#333', font: '#fff' };
      const label  = obj.afk || obj.title?.slice(0, 12) || obj.id;
      const degree = degreeMap[obj.id] || 0;
      const size   = Math.min(10 + degree * 2.5, 32);
      const fullTitle = [obj.afk, obj.title, `${degree} connection${degree !== 1 ? 's' : ''}`].filter(Boolean).join(' — ');
      return {
        id:     obj.id,
        label,
        title:  fullTitle,
        group:  obj.type,
        color:  { background: c.bg, border: c.border, highlight: { background: c.bg, border: emphasisColor } },
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
      color:  { color: REL_COLOR[l.rel] || secondaryColor, opacity: 0.7 },
      font:   { color: secondaryColor, size: 9, face: 'Inter, sans-serif', align: 'middle' },
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
    const container = document.getElementById('graph-canvas');
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

    const F = APP.FILTERS;

    // Type filter (single select or all)
    if (F.type && node.group !== F.type) return false;

    // Domein filter
    if (F.domeinen.size > 0) {
      const allSelected = DOMEIN_TAGS.every(d => F.domeinen.has(d));
      if (!allSelected) {
        const tags = new Set(DB.getTags(node.id));
        const match = [...F.domeinen].some(d => tags.has(d));
        if (!match) return false;
      }
    }

    // Search
    const q = F.search.trim().toLowerCase();
    if (q) {
      const label = (node.label + ' ' + (node.title || '')).toLowerCase();
      if (!label.includes(q)) return false;
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

  function _updateStat() { /* noop */ }

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
    const bar   = document.getElementById('graph-focus-bar');
    const label = document.getElementById('graph-focus-label');
    if (!bar || !label) return;
    if (_focusNodeId) {
      const node = _visNodes.find(n => n.id === _focusNodeId);
      const name = node ? (node.title?.split(' — ')[0] || node.label) : _focusNodeId;
      const count = _focusNeighborIds.size - 1;
      label.textContent = `${name} · ${count} neighbour${count !== 1 ? 's' : ''}`;
      bar.classList.remove('d-none');
      bar.classList.add('d-flex');
    } else {
      bar.classList.add('d-none');
      bar.classList.remove('d-flex');
    }
  }

  // ── Event bindings ────────────────────────────────────────────────────────

  function _bindControls() {
    // Relatie-filters (graph-specifiek)
    document.querySelectorAll('[data-filter-rel]').forEach(btn => {
      btn.addEventListener('click', () => {
        const rel = btn.dataset.filterRel;
        if (_activeRels.has(rel)) _activeRels.delete(rel);
        else _activeRels.add(rel);
        btn.classList.toggle('btn-secondary', _activeRels.has(rel));
        btn.classList.toggle('btn-outline-secondary', !_activeRels.has(rel));
        _applyFilters();
      });
    });

    document.getElementById('graph-fit')?.addEventListener('click', () => {
      _network?.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
    });

    document.getElementById('graph-focus-clear')?.addEventListener('click', () => _clearFocus());

    document.getElementById('graph-physics')?.addEventListener('click', () => {
      if (!_network) return;
      const current = _network.physics?.physicsEnabled ?? false;
      _network.setOptions({ physics: { enabled: !current } });
      document.getElementById('graph-physics').textContent = !current ? '⏸ Pause' : '⟳ Stabilise';
    });
  }

  // Subscribe to shared filter changes
  APP.subscribe(() => {
    if (_network) _applyFilters();
  });

  // ── Public ────────────────────────────────────────────────────────────────

  return { render, setFocus: _setFocus, clearFocus: _clearFocus };
})();
