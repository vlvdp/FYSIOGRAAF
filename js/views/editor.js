/**
 * editor.js — Inline URL-editor (vierde tab)
 *
 * Rendert een tabel van alle nodes met bewerkbare url + urlPP velden.
 * Werkt direct op DB (localStorage); export downloadt bijgewerkte seed.js.
 */

const EDITOR = (() => {

  let _origSnapshot = {};   // snapshot bij eerste render
  let _rows = [];
  let _sortKey = 'type';
  let _sortAsc = true;
  let _initialised = false;

  const TYPE_COLORS = {
    instrument: '#F97316', kennis: '#2563EB', bronnen: '#7C3AED', casuistiek: '#0D9488'
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function _allRows() {
    return DB.getAll().map(o => ({
      id:    o.id,
      type:  o.type,
      afk:   o.afk || '',
      title: o.title || '',
      url:   o.url || '',
      urlPP: o.urlPP || '',
    }));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  function render() {
    if (!_initialised) {
      // Snapshot originele staat
      DB.getAll().forEach(o => {
        _origSnapshot[o.id] = { url: o.url || '', urlPP: o.urlPP || '' };
      });
      _populateTypeFilter();
      _initialised = true;
    }
    applyFilter();
  }

  function _populateTypeFilter() {
    const rows = _allRows();
    const types = [...new Set(rows.map(r => r.type))].sort();
    const sel = document.getElementById('editorTypeFilter');
    if (!sel) return;
    sel.innerHTML = '<option value="">All types</option>' +
      types.map(t => `<option value="${t}">${t} (${rows.filter(r => r.type === t).length})</option>`).join('');
  }

  function applyFilter() {
    let filtered = _allRows();

    const q = (document.getElementById('editorSearch')?.value || '').toLowerCase().trim();
    if (q) filtered = filtered.filter(r =>
      r.afk.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
    );

    const typeF = document.getElementById('editorTypeFilter')?.value || '';
    if (typeF) filtered = filtered.filter(r => r.type === typeF);

    const urlF = document.getElementById('editorUrlFilter')?.value || '';
    if (urlF === 'missing-url')  filtered = filtered.filter(r => !r.url);
    if (urlF === 'missing-pp')   filtered = filtered.filter(r => !r.urlPP);
    if (urlF === 'missing-any')  filtered = filtered.filter(r => !r.url || !r.urlPP);
    if (urlF === 'has-both')     filtered = filtered.filter(r => r.url && r.urlPP);

    filtered.sort((a, b) => {
      const va = (a[_sortKey] || '').toLowerCase();
      const vb = (b[_sortKey] || '').toLowerCase();
      return _sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    _rows = filtered;
    _renderTable();
  }

  function _renderTable() {
    const container = document.getElementById('editor-main');
    if (!container) return;

    const header = `<table class="table table-sm table-hover mb-0">
      <thead class="sticky-top bg-body">
        <tr>
          <th style="width:3rem">#</th>
          <th style="width:5.5rem;cursor:pointer" onclick="EDITOR.sortBy('type')">Type</th>
          <th style="width:7rem;cursor:pointer" onclick="EDITOR.sortBy('afk')">Afk</th>
          <th style="cursor:pointer" onclick="EDITOR.sortBy('title')">Title</th>
          <th>url</th>
          <th>urlPP</th>
        </tr>
      </thead><tbody>`;

    const rows = _rows.map((r, i) => {
      const orig = _origSnapshot[r.id] || {};
      const urlChanged = r.url !== (orig.url || '');
      const ppChanged  = r.urlPP !== (orig.urlPP || '');
      const rowClass   = (urlChanged || ppChanged) ? 'table-warning' : '';
      const c = TYPE_COLORS[r.type] || '#666';

      return `<tr class="${rowClass}" data-id="${r.id}">
        <td class="text-muted">${i + 1}</td>
        <td><span class="badge" style="background:${c};font-size:.7rem">${r.type}</span></td>
        <td class="font-monospace fw-semibold small">${_esc(r.afk)}</td>
        <td class="small text-truncate" style="max-width:200px" title="${_esc(r.title)}">${_esc(r.title)}</td>
        <td>
          <div class="d-flex align-items-center gap-1">
            <input type="url" class="form-control form-control-sm ${urlChanged ? 'border-warning' : ''}"
                   style="font-size:.8rem;min-width:220px"
                   value="${_esc(r.url)}" placeholder="—"
                   data-field="url" data-id="${r.id}"
                   oninput="EDITOR.onChange(this)">
            ${r.url ? `<a href="${_esc(r.url)}" target="_blank" rel="noopener" class="small text-decoration-none" title="Open">↗</a>` : ''}
          </div>
        </td>
        <td>
          <div class="d-flex align-items-center gap-1">
            <input type="url" class="form-control form-control-sm ${ppChanged ? 'border-warning' : ''}"
                   style="font-size:.8rem;min-width:220px"
                   value="${_esc(r.urlPP)}" placeholder="—"
                   data-field="urlPP" data-id="${r.id}"
                   oninput="EDITOR.onChange(this)">
            ${r.urlPP ? `<a href="${_esc(r.urlPP)}" target="_blank" rel="noopener" class="small text-decoration-none" title="Open">↗</a>` : ''}
          </div>
        </td>
      </tr>`;
    }).join('');

    container.innerHTML = header + rows + '</tbody></table>';

    const rc = document.getElementById('editorRowCount');
    if (rc) rc.textContent = `${_rows.length} nodes`;
    _updateChangeCount();
  }

  // ── Editing ───────────────────────────────────────────────────────────────

  function onChange(input) {
    const id    = input.dataset.id;
    const field = input.dataset.field;
    const val   = input.value.trim();

    // Update DB
    const obj = DB.get(id);
    if (!obj) return;
    const patch = {};
    patch[field] = val || undefined;
    if (val) obj[field] = val;
    else delete obj[field];
    DB.save();

    // Visual feedback
    const orig = (_origSnapshot[id] || {})[field] || '';
    input.classList.toggle('border-warning', val !== orig);

    const tr = input.closest('tr');
    const cur = DB.get(id);
    const origObj = _origSnapshot[id] || {};
    const anyChange = (cur.url || '') !== (origObj.url || '') || (cur.urlPP || '') !== (origObj.urlPP || '');
    tr.classList.toggle('table-warning', anyChange);

    _updateChangeCount();
  }

  function _updateChangeCount() {
    let count = 0;
    for (const [id, orig] of Object.entries(_origSnapshot)) {
      const cur = DB.get(id);
      if (!cur) continue;
      if ((cur.url || '') !== (orig.url || ''))     count++;
      if ((cur.urlPP || '') !== (orig.urlPP || '')) count++;
    }
    const badge = document.getElementById('editorChangeCount');
    if (!badge) return;
    badge.textContent = `${count} change${count !== 1 ? 's' : ''}`;
    badge.classList.toggle('bg-warning', count > 0);
    badge.classList.toggle('text-dark', count > 0);
    badge.classList.toggle('bg-secondary', count === 0);
  }

  // ── Sort ───────────────────────────────────────────────────────────────────

  function sortBy(key) {
    if (_sortKey === key) _sortAsc = !_sortAsc;
    else { _sortKey = key; _sortAsc = true; }
    applyFilter();
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  function exportSeed() {
    const all = DB.getAll();
    const objects = {};
    all.forEach(o => { objects[o.id] = o; });
    // Reconstruct full SEED_DATA shape
    const data = { objects, links: DB.stats()._raw_links || [], tags: [] };
    // Simpler: just export via DB
    DB.exportJSON();
  }

  // ── Revert ─────────────────────────────────────────────────────────────────

  function revert() {
    if (!confirm('Revert all URL changes?')) return;
    for (const [id, orig] of Object.entries(_origSnapshot)) {
      const obj = DB.get(id);
      if (!obj) continue;
      if (orig.url) obj.url = orig.url; else delete obj.url;
      if (orig.urlPP) obj.urlPP = orig.urlPP; else delete obj.urlPP;
    }
    DB.save();
    applyFilter();
  }

  return { render, applyFilter, onChange, sortBy, exportSeed, revert };
})();
