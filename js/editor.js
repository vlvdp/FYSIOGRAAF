/**
 * editor.js — Node toevoegen / bewerken (Bootstrap modal)
 *
 * EDITOR.open()           → nieuw object
 * EDITOR.open({tags:[…]}) → nieuw object met vooringevulde tags
 * EDITOR.open(null, id)   → bestaand object bewerken
 * EDITOR.close()          → sluit modal
 */

const EDITOR = (() => {

  const TYPES = [
    { id: 'instrument',  label: 'Instrument',  icon: '📋' },
    { id: 'kennis',      label: 'Kennis',       icon: '🧠' },
    { id: 'bronnen',     label: 'Bronnen',      icon: '📖' },
    { id: 'casuistiek',  label: 'Casuistiek',   icon: '🏥' },
  ];

  const FIXED_TAGS = ['msa', 'cna', 'rca', 'mtt', 'onco', 'ger'];

  let _editingId    = null;
  let _currentType  = 'instrument';
  let _selectedTags = new Set();
  let _pendingLinks = [];
  let _presetTags   = [];

  // ── Modal ─────────────────────────────────────────────────────────────────

  function open(preset, editId) {
    _editingId    = editId || null;
    _pendingLinks = [];
    _presetTags   = (preset && preset.tags) ? preset.tags : [];

    const existing = editId ? DB.get(editId) : null;
    _currentType   = existing ? existing.type : 'instrument';
    _selectedTags  = new Set(existing ? DB.getTags(editId) : _presetTags);

    if (existing) {
      _pendingLinks = DB.getLinks(editId).map(l => ({
        linkId:   l.id,
        targetId: l.from === editId ? l.to : l.from,
        rel:      l.rel,
      }));
    }

    document.getElementById('editorTitle').textContent =
      existing ? `Bewerken: ${existing.afk || existing.title || editId}` : 'Nieuw object';

    _renderBody();
    _renderActions();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editorModal')).show();
  }

  function close() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('editorModal'));
    if (modal) modal.hide();
    _editingId = null;
  }

  // ── Formulier ─────────────────────────────────────────────────────────────

  function _renderBody() {
    const existing = _editingId ? DB.get(_editingId) : null;

    document.getElementById('editorBody').innerHTML = `

      <!-- Type selector — Bootstrap btn-group -->
      <div class="mb-3">
        <label class="form-label fw-semibold">Type object</label>
        <div class="btn-group w-100" role="group" id="typeGrid">
          ${TYPES.map(t => `
            <button type="button"
              class="btn btn-outline-secondary ${t.id === _currentType ? 'active' : ''}"
              data-type="${t.id}"
              onclick="EDITOR._selectType('${t.id}')">
              ${t.icon} ${t.label}
            </button>`).join('')}
        </div>
      </div>

      <!-- Dynamisch formulier -->
      <div id="typeForm">${_typeForm(existing)}</div>

      <!-- Links -->
      <div class="mb-3">
        <label class="form-label fw-semibold">Externe links</label>
        <div class="row g-2">
          <div class="col">
            <input class="form-control form-control-sm" id="f_links_miz"
              placeholder="MeetInstrumentenZorg URL"
              value="${_esc(existing ? (existing.links_miz || '') : '')}">
          </div>
          <div class="col">
            <input class="form-control form-control-sm" id="f_links_fysiomedia"
              placeholder="Fysiomedia URL"
              value="${_esc(existing ? (existing.links_fysiomedia || '') : '')}">
          </div>
        </div>
      </div>

      <!-- Tags -->
      <div class="mb-3">
        <label class="form-label fw-semibold">Tags</label>
        <div id="tagPicker" class="mb-2">${_renderTagPicker()}</div>
        <div class="input-group input-group-sm">
          <input class="form-control" id="customTagInput" placeholder="Nieuwe tag…"
            onkeydown="if(event.key==='Enter'){event.preventDefault();EDITOR._addCustomTag();}">
          <button class="btn btn-outline-secondary" type="button" onclick="EDITOR._addCustomTag()">+</button>
        </div>
      </div>

      <!-- Relaties -->
      <div class="mb-3">
        <label class="form-label fw-semibold">Relaties</label>
        <div id="linkList" class="mb-2">${_renderLinkList()}</div>
        <div class="input-group input-group-sm">
          <input class="form-control" id="linkSearchInput"
            placeholder="Zoek object…"
            oninput="EDITOR._searchLinks(this.value)">
          <select class="form-select" id="linkRelSelect" style="max-width:140px;">
            <option value="nexus">Nexus</option>
            <option value="contextus">Contextus</option>
          </select>
          <button class="btn btn-outline-secondary" type="button" onclick="EDITOR._addLinkFromSearch()">+</button>
        </div>
        <div id="linkSearchResults" class="mt-1"></div>
      </div>
    `;
  }

  function _typeForm(existing) {
    const f = existing?.fields || {};
    const v = (field, fallback = '') => existing ? (existing[field] ?? fallback) : fallback;

    const field = (label, html) => `
      <div class="mb-3">
        <label class="form-label">${label}</label>
        ${html}
      </div>`;

    const inp = (id, val = '') =>
      `<input class="form-control form-control-sm" id="${id}" value="${_esc(val)}">`;

    const ta = (id, val = '', minH = '') =>
      `<textarea class="form-control form-control-sm" id="${id}" style="min-height:${minH || '80px'};resize:vertical;">${_esc(val)}</textarea>`;

    if (_currentType === 'instrument') return `
      ${field('Afkorting (bijv. MUST)', inp('f_afk', v('afk')))}
      ${field('Volledige naam',         inp('f_fullname', v('fullname')))}
      ${field('Wat meet het',           ta('f_watMeetHet', f.watMeetHet))}
      ${field('Scoringscriteria',       ta('f_scoringscriteria', f.scoringscriteria))}
      ${field('Normwaarden / Afkapwaarden', ta('f_normwaarden', f.normwaarden))}
      ${field('Klinische implicatie',   ta('f_implicatie', f.implicatie))}`;

    if (_currentType === 'casuistiek') return `
      ${field('Code (bijv. TD1)',       inp('f_code', v('code')))}
      ${field('Titel',                  inp('f_title', v('title')))}
      ${field('Setting',                inp('f_setting', f.setting))}
      ${field('Focus / omschrijving',   ta('f_focus', f.focus))}
      ${field('Inhoud (HTML of tekst)', ta('f_content', f.content, '160px'))}`;

    if (_currentType === 'bronnen') return `
      ${field('Titel',                  inp('f_title', v('title')))}
      ${field('Scope',                  ta('f_scope', f.scope))}
      ${field('Kernaanbevelingen',      ta('f_kernaanbevelingen', f.kernaanbevelingen, '160px'))}`;

    // kennis
    return `
      ${field('Titel',                  inp('f_title', v('title')))}
      ${field('Inhoud (HTML of tekst)', ta('f_content', f.content, '200px'))}`;
  }

  // ── Type selectie ─────────────────────────────────────────────────────────

  function _selectType(type) {
    _currentType = type;
    document.querySelectorAll('#typeGrid .btn').forEach(b => {
      b.classList.toggle('active', b.dataset.type === type);
    });
    const existing = _editingId ? DB.get(_editingId) : null;
    document.getElementById('typeForm').innerHTML = _typeForm(existing);
  }

  // ── Tag picker ────────────────────────────────────────────────────────────

  function _renderTagPicker() {
    const fixedSet = new Set(FIXED_TAGS);
    const rest     = DB.getAllTags().filter(t => !fixedSet.has(t)).sort();
    const allTags  = [...FIXED_TAGS, ...rest];
    return `<div class="d-flex flex-wrap gap-1">${allTags.map(_tagChip).join('')}</div>`;
  }

  function _tagChip(tag) {
    const sel = _selectedTags.has(tag);
    return `<button type="button"
      class="btn btn-sm rounded-pill px-3 py-0 ${sel ? 'btn-secondary' : 'btn-outline-secondary'}"
      onclick="EDITOR._toggleTag('${tag}')">${tag}</button>`;
  }

  function _toggleTag(tag) {
    if (_selectedTags.has(tag)) _selectedTags.delete(tag);
    else _selectedTags.add(tag);
    document.getElementById('tagPicker').innerHTML = _renderTagPicker();
  }

  function _addCustomTag() {
    const input = document.getElementById('customTagInput');
    const tag   = input.value.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag) return;
    _selectedTags.add(tag);
    input.value = '';
    document.getElementById('tagPicker').innerHTML = _renderTagPicker();
  }

  // ── Link picker ───────────────────────────────────────────────────────────

  function _renderLinkList() {
    if (!_pendingLinks.length)
      return '<p class="text-muted small mb-0">Nog geen relaties.</p>';

    return `<ul class="list-group list-group-flush">` +
      _pendingLinks.map((l, i) => {
        const obj   = DB.get(l.targetId);
        const label = obj ? (obj.afk || obj.title || l.targetId) : l.targetId;
        return `<li class="list-group-item d-flex align-items-center gap-2 px-0 py-1">
          <span class="flex-grow-1 font-monospace small text-warning">${label}</span>
          <span class="badge bg-secondary">${l.rel}</span>
          <button type="button" class="btn-close btn-sm" onclick="EDITOR._removeLink(${i})"></button>
        </li>`;
      }).join('') + `</ul>`;
  }

  function _searchLinks(q) {
    const el = document.getElementById('linkSearchResults');
    if (!q || q.length < 2) { el.innerHTML = ''; return; }
    const hits = DB.query({ search: q }).slice(0, 8);
    if (!hits.length) {
      el.innerHTML = '<p class="text-muted small mb-0">Geen resultaten.</p>';
      return;
    }
    el.innerHTML = `<div class="list-group">` +
      hits.map(o => `
        <button type="button" class="list-group-item list-group-item-action py-1 px-2"
          onclick="EDITOR._selectLinkTarget('${o.id}')">
          <span class="font-monospace small text-warning">${o.afk || o.title || o.id}</span>
          <span class="text-muted small ms-2">${o.type}</span>
        </button>`).join('') +
      `</div>`;
  }

  function _selectLinkTarget(targetId) {
    document.getElementById('linkSearchInput').value = '';
    document.getElementById('linkSearchResults').innerHTML = '';
    const rel = document.getElementById('linkRelSelect').value;
    if (!_pendingLinks.some(pl => pl.targetId === targetId && pl.rel === rel)) {
      _pendingLinks.push({ targetId, rel });
      document.getElementById('linkList').innerHTML = _renderLinkList();
    }
  }

  function _addLinkFromSearch() {
    const input = document.getElementById('linkSearchInput').value.trim();
    if (!input) return;
    const obj = DB.get(input) || DB.query({ search: input })[0];
    if (!obj) return;
    _selectLinkTarget(obj.id);
  }

  function _removeLink(idx) {
    _pendingLinks.splice(idx, 1);
    document.getElementById('linkList').innerHTML = _renderLinkList();
  }

  // ── Opslaan ───────────────────────────────────────────────────────────────

  function _save() {
    const val = id => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    let obj = _editingId ? { ...DB.get(_editingId) } : { type: _currentType };
    obj.type = _currentType;

    if (_currentType === 'instrument') {
      obj.afk   = val('f_afk');
      obj.title = val('f_fullname');
      obj.fields = {
        watMeetHet:       val('f_watMeetHet'),
        scoringscriteria: val('f_scoringscriteria'),
        normwaarden:      val('f_normwaarden'),
        implicatie:       val('f_implicatie'),
      };
    } else if (_currentType === 'casuistiek') {
      obj.code  = val('f_code');
      obj.title = val('f_title');
      obj.fields = {
        setting: val('f_setting'),
        focus:   val('f_focus'),
        content: val('f_content'),
      };
    } else if (_currentType === 'bronnen') {
      obj.title  = val('f_title');
      obj.fields = {
        scope:             val('f_scope'),
        kernaanbevelingen: val('f_kernaanbevelingen'),
      };
    } else {
      obj.title  = val('f_title');
      obj.fields = { content: val('f_content') };
    }

    obj.links_miz        = val('f_links_miz');
    obj.links_fysiomedia = val('f_links_fysiomedia');

    if (_editingId) {
      DB.update(_editingId, obj);
    } else {
      obj = DB.add(obj);
    }

    // Tags synchroniseren
    const existingTags = new Set(DB.getTags(obj.id));
    for (const t of _selectedTags)  if (!existingTags.has(t)) DB.addTag(obj.id, t);
    for (const t of existingTags)   if (!_selectedTags.has(t)) DB.removeTag(obj.id, t);

    // Links synchroniseren
    const existingLinks = DB.getLinks(obj.id);
    for (const pl of _pendingLinks) if (!pl.linkId) DB.addLink(obj.id, pl.targetId, pl.rel);
    for (const el of existingLinks) {
      if (!_pendingLinks.find(pl => pl.linkId === el.id)) DB.removeLink(el.id);
    }

    APP.updateStats();
    OVZ.render();
    close();
  }

  function _delete() {
    if (!_editingId) return;
    if (!confirm('Weet je zeker dat je dit object wilt verwijderen?')) return;
    DB.remove(_editingId);
    APP.updateStats();
    OVZ.render();
    close();
  }

  // ── Actions footer ────────────────────────────────────────────────────────

  function _renderActions() {
    document.getElementById('editorActions').innerHTML = `
      ${_editingId
        ? `<button type="button" class="btn btn-outline-danger me-auto" onclick="EDITOR._delete()">🗑 Verwijderen</button>`
        : ''}
      <button type="button" class="btn btn-outline-secondary" onclick="EDITOR.close()">Annuleren</button>
      <button type="button" class="btn btn-warning" onclick="EDITOR._save()">Opslaan</button>
    `;
  }

  // ── Utils ─────────────────────────────────────────────────────────────────

  function _esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { open, close, _selectType, _toggleTag, _addCustomTag, _searchLinks, _selectLinkTarget, _addLinkFromSearch, _removeLink, _save, _delete };
})();
