/**
 * tabel.js — Tabelweergave van alle objecten
 *
 * Kolommen: Type | Afk | Titel | Domeinen | Relaties | Samenvatting | Links
 * Features: zoekbalk, filter op type/domein, sorteer per kolom
 */

const TABEL = (() => {

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

  const DOMEIN_TAGS  = ['msa', 'cna', 'rca', 'mtt', 'onco', 'ger'];
  const DOMEIN_COLORS = { msa: 'var(--msa)', cna: 'var(--cna)', rca: 'var(--rca)', mtt: 'var(--mtt)', onco: 'var(--onco)', ger: 'var(--ger)' };

  let _filters = {
    search:   '',
    type:     '',
    domeinen: new Set(),
  };

  let _sort = { col: 'afk', dir: 'asc' };

  // ── Public ────────────────────────────────────────────────────────────────

  function render() {
    _renderToolbar();
    _renderTable();
  }

  // ── Toolbar (zoekbalk + filters) ──────────────────────────────────────────

  function _renderToolbar() {
    const el = document.getElementById('tabelSidebar');
    if (!el) return;

    const hasFilter = _filters.search.trim() || _filters.type || _filters.domeinen.size;

    el.innerHTML = `
      <div class="p-3 d-flex flex-column gap-3">

        <div class="d-flex flex-column gap-1">
          <input type="search" class="form-control form-control-sm" id="tabelSearch"
            placeholder="Search…"
            value="${_esc(_filters.search)}"
            oninput="TABEL.setFilter('search', this.value)"
            autocomplete="off">
          ${(() => {
            const parts = [];
            if (_filters.search.trim())   parts.push('"' + _esc(_filters.search.trim()) + '"');
            if (_filters.type)            parts.push(TYPE_LABELS[_filters.type] || _filters.type);
            if (_filters.domeinen.size)   parts.push([..._filters.domeinen].map(d => d.toUpperCase()).join(', '));
            return `
              <div class="d-flex align-items-start gap-2">
                <span class="text-muted small flex-grow-1 text-break">
                  ${parts.length > 0 ? parts.join(' · ') : 'no filters active'}
                </span>
                ${parts.length > 0 ? '<button class="btn btn-sm btn-outline-secondary py-0 px-2 flex-shrink-0" onclick="TABEL.clearAll()">clear</button>' : ''}
              </div>`;
          })()}
        </div>

        <!-- Type filter -->
        <div>
          <div class="text-uppercase fw-semibold text-secondary mb-2" style="font-size:0.7rem">Type</div>
          <div class="d-flex flex-column gap-1">
            ${Object.entries(TYPE_LABELS).map(([k, v]) => {
              const active = _filters.type === k;
              return `<button class="btn btn-sm w-100 text-start d-flex align-items-center gap-2 ${active ? 'btn-secondary' : 'btn-outline-secondary'}"
                onclick="TABEL.setFilter('type','${k}')">
                ${TYPE_ICONS[k]} ${v}
              </button>`;
            }).join('')}
          </div>
        </div>

        <!-- Domain filter -->
        <div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="text-uppercase fw-semibold text-secondary" style="font-size:0.7rem">Domain</span>
            ${_filters.domeinen.size
              ? `<button class="btn btn-sm btn-outline-secondary py-0 px-2" onclick="TABEL.setFilter('domeinen_clear','')">clear</button>`
              : ''}
          </div>
          <div class="d-flex flex-column gap-1">
            ${DOMEIN_TAGS.map(t => {
              const active = _filters.domeinen.has(t);
              const color = DOMEIN_COLORS[t] || 'var(--bs-secondary-color)';
              return `<button class="btn btn-sm w-100 text-start d-flex align-items-center gap-2 ${active ? 'btn-secondary' : 'btn-outline-secondary'}"
                onclick="TABEL.setFilter('domein','${t}')">
                <span class="rounded-circle flex-shrink-0" style="width:8px;height:8px;background:${color};display:inline-block;"></span>
                ${t.toUpperCase()}
              </button>`;
            }).join('')}
          </div>
        </div>

      </div>
    `;

    if (_filters.search) {
      const inp = document.getElementById('tabelSearch');
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }
  }

  // ── Table ─────────────────────────────────────────────────────────────────

  function _renderTable() {
    const main = document.getElementById('tabel-main');
    if (!main) return;

    const args = {};
    if (_filters.type)          args.type   = _filters.type;
    if (_filters.search.trim()) args.search = _filters.search.trim();

    let results = DB.query(args);

    // Domein filter
    const allSelected = DOMEIN_TAGS.every(d => _filters.domeinen.has(d));
    if (_filters.domeinen.size > 0 && !allSelected) {
      results = results.filter(obj => {
        const tags = new Set(DB.getTags(obj.id));
        return [..._filters.domeinen].some(d => tags.has(d));
      });
    }

    // Sorteren
    results = _sortResults(results);

    if (!results.length) {
      main.innerHTML = `<p class="text-muted small p-2">No results.</p>`;
      return;
    }

    const counts = {};
    for (const obj of results) counts[obj.type] = (counts[obj.type] || 0) + 1;
    const breakdown = Object.entries(counts)
      .map(([t, n]) => `${n} ${TYPE_LABELS[t] || t}`).join(' · ');

    const colDefs = [
      { key: 'type',      label: 'Type',         width: '90px'  },
      { key: 'afk',       label: 'Afk',          width: '100px' },
      { key: 'title',     label: 'Title',        width: ''      },
      { key: 'domeinen',  label: 'Domain',        width: '120px' },
      { key: 'relaties',  label: 'Rel',          width: '50px'  },
      { key: 'summary',   label: 'Summary',      width: ''      },
      { key: 'links',     label: 'Links',        width: '80px'  },
    ];

    const ths = colDefs.map(c => {
      const sortable = !['links'].includes(c.key);
      const isSorted = _sort.col === c.key;
      const arrow = isSorted ? (_sort.dir === 'asc' ? ' ▲' : ' ▼') : '';
      const wStyle = c.width ? `width:${c.width};min-width:${c.width};` : '';
      const cls = sortable ? 'tabel-sortable' : '';
      const click = sortable ? `onclick="TABEL.toggleSort('${c.key}')"` : '';
      return `<th class="${cls}" style="${wStyle}user-select:none;white-space:nowrap;" ${click}>${c.label}${arrow}</th>`;
    }).join('');

    const rows = results.map(obj => {
      const tags = DB.getTags(obj.id);
      const linkCount = DB.getLinks(obj.id).length;
      const summary = _getSummary(obj);
      const domeinPills = tags
        .filter(t => DOMEIN_TAGS.includes(t))
        .map(t => `<span class="badge rounded-pill border" style="color:${DOMEIN_COLORS[t]};border-color:${DOMEIN_COLORS[t]};font-size:0.65rem;">${t.toUpperCase()}</span>`)
        .join(' ');

      const urlLinks = [];
      if (obj.url)   urlLinks.push(`<a href="${_esc(obj.url)}" target="_blank" rel="noopener" class="text-decoration-none small" title="${_esc(obj.url)}" onclick="event.stopPropagation()">🔗</a>`);
      if (obj.urlPP) urlLinks.push(`<a href="${_esc(obj.urlPP)}" target="_blank" rel="noopener" class="text-decoration-none small" title="Physio-pedia" onclick="event.stopPropagation()">PP</a>`);

      return `<tr class="tabel-row" onclick="TABEL.openDetail('${obj.id}')" style="cursor:pointer;">
        <td class="text-nowrap">${TYPE_ICONS[obj.type] || ''} <span class="small">${TYPE_LABELS[obj.type] || obj.type}</span></td>
        <td class="fw-semibold font-monospace small">${_esc(obj.afk || '')}</td>
        <td class="small">${_esc(obj.title || '')}</td>
        <td>${domeinPills || '<span class="text-muted">—</span>'}</td>
        <td class="text-center small">${linkCount}</td>
        <td class="small text-muted tabel-summary">${summary}</td>
        <td class="text-center">${urlLinks.join(' ') || '<span class="text-muted">—</span>'}</td>
      </tr>`;
    }).join('');

    main.innerHTML = `
      <p class="text-muted mb-2" style="font-size:0.74rem;">${results.length} objects · ${breakdown}</p>
      <div class="table-responsive">
        <table class="table table-sm table-hover table-striped align-middle mb-0 tabel-view">
          <thead class="table-light sticky-top">
            <tr>${ths}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  // ── Samenvatting extraheren ────────────────────────────────────────────────

  function _getSummary(obj) {
    const f = obj.fields || {};
    // Prioriteit: kern > watMeetHet > content > scope
    const raw = f.kern || f.watMeetHet || f.content || f.scope || f.focus || '';
    // Strip HTML
    const text = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    // Max ~120 tekens
    if (text.length <= 120) return _esc(text);
    return _esc(text.substring(0, 117)) + '…';
  }

  // ── Sortering ─────────────────────────────────────────────────────────────

  function toggleSort(col) {
    if (_sort.col === col) {
      _sort.dir = _sort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      _sort.col = col;
      _sort.dir = 'asc';
    }
    _renderTable();
  }

  function _sortResults(objs) {
    const arr = objs.slice();
    const col = _sort.col;
    const dir = _sort.dir === 'asc' ? 1 : -1;

    return arr.sort((a, b) => {
      let va, vb;

      switch (col) {
        case 'type':
          va = (TYPE_LABELS[a.type] || a.type || '').toLowerCase();
          vb = (TYPE_LABELS[b.type] || b.type || '').toLowerCase();
          return dir * va.localeCompare(vb);
        case 'afk':
          va = (a.afk || a.title || '').toLowerCase();
          vb = (b.afk || b.title || '').toLowerCase();
          return dir * va.localeCompare(vb);
        case 'title':
          va = (a.title || '').toLowerCase();
          vb = (b.title || '').toLowerCase();
          return dir * va.localeCompare(vb);
        case 'domeinen': {
          const ta = DB.getTags(a.id).filter(t => DOMEIN_TAGS.includes(t)).sort().join(',');
          const tb = DB.getTags(b.id).filter(t => DOMEIN_TAGS.includes(t)).sort().join(',');
          return dir * ta.localeCompare(tb);
        }
        case 'relaties':
          va = DB.getLinks(a.id).length;
          vb = DB.getLinks(b.id).length;
          return dir * (va - vb);
        case 'summary': {
          va = _getSummary(a).toLowerCase();
          vb = _getSummary(b).toLowerCase();
          return dir * va.localeCompare(vb);
        }
        default:
          return 0;
      }
    });
  }

  // ── Filter logic ──────────────────────────────────────────────────────────

  function setFilter(key, value) {
    if (key === 'search') {
      _filters.search = value;
      _renderTable();
      return;
    }
    if (key === 'type') {
      _filters.type = _filters.type === value ? '' : value;
    } else if (key === 'domein') {
      if (_filters.domeinen.has(value)) _filters.domeinen.delete(value);
      else _filters.domeinen.add(value);
    } else if (key === 'domeinen_clear') {
      _filters.domeinen.clear();
    }
    _renderToolbar();
    _renderTable();
  }

  function clearAll() {
    _filters.search   = '';
    _filters.type     = '';
    _filters.domeinen = new Set();
    _renderToolbar();
    _renderTable();
  }

  // ── Detail (hergebruik OVZ detail-panel) ──────────────────────────────────

  function openDetail(id) {
    OVZ.showDetail(id);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { render, setFilter, clearAll, toggleSort, openDetail };
})();
