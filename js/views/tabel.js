/**
 * tabel.js — Tabelweergave van alle objecten
 *
 * Kolommen: Type | Afk | Titel | Domeinen | Relaties | Samenvatting | Links
 * Features: zoekbalk, filter op type/domein, sorteer per kolom
 */

const TABEL = (() => {

  const TYPE_ICONS    = APP.TYPE_ICONS;
  const TYPE_LABELS   = APP.TYPE_LABELS;
  const DOMEIN_TAGS   = APP.DOMEIN_TAGS;
  const DOMEIN_COLORS = APP.DOMEIN_COLORS;

  let _sort = { col: 'afk', dir: 'asc' };

  // ── Public ────────────────────────────────────────────────────────────────

  function render() {
    _renderTable();
  }

  // ── Table ─────────────────────────────────────────────────────────────────

  function _renderTable() {
    const main = document.getElementById('tabel-main');
    if (!main) return;

    const F = APP.FILTERS;
    const args = {};
    if (F.type)           args.type   = F.type;
    if (F.search.trim())  args.search = F.search.trim();

    let results = DB.query(args);

    // Domein filter
    const allSelected = DOMEIN_TAGS.every(d => F.domeinen.has(d));
    if (F.domeinen.size > 0 && !allSelected) {
      results = results.filter(obj => {
        const tags = new Set(DB.getTags(obj.id));
        return [...F.domeinen].some(d => tags.has(d));
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
          <thead class="table-light" style="position:sticky;top:0;z-index:1;">
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

  // ── Detail (hergebruik OVZ detail-panel) ──────────────────────────────────

  function openDetail(id) {
    OVZ.showDetail(id);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Subscribe to shared filter changes
  APP.subscribe(() => _renderTable());

  return { render, toggleSort, openDetail };
})();
