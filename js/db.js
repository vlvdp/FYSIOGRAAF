/**
 * db.js — IZ Widget Graph Database
 *
 * Datamodel:
 *   objects  — nodes: instrument, casus, richtlijn, kennis, vaardigheid
 *   links    — edges: many-to-many relaties tussen objecten
 *   tags     — labels voor filtering (domein, toetstype, richtlijn, etc.)
 *
 * Opslag: localStorage, met fallback naar window.SEED_DATA
 */

const DB = (() => {
  const STORAGE_KEY = 'iz_db_v1';

  // ── Interne state ──────────────────────────────────────────────────────────

  let _objects  = {};   // { id: object }
  let _links    = [];   // [{ id, from, to, rel }]
  let _tags     = [];   // [{ object, tag }]
  let _lastEdit = null; // ISO timestamp van laatste wijziging

  // ── Helpers ────────────────────────────────────────────────────────────────

  function _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ── Laden & opslaan ───────────────────────────────────────────────────────

  function save() {
    _lastEdit = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      objects:  _objects,
      links:    _links,
      tags:     _tags,
      lastEdit: _lastEdit,
    }));
  }

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        _objects  = data.objects  || {};
        _links    = data.links    || [];
        _tags     = data.tags     || [];
        _lastEdit = data.lastEdit || null;
        return;
      } catch (e) {
        console.warn('db.js: localStorage corrupt, fallback naar seed data', e);
      }
    }
    _loadSeed();
  }

  function _loadSeed() {
    if (!window.SEED_DATA) return;
    const s = window.SEED_DATA;
    _objects = s.objects || {};
    _links   = s.links   || [];
    _tags    = s.tags    || [];
    save();
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ objects: _objects, links: _links, tags: _tags }, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'iz_db_export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(jsonString) {
    const data = JSON.parse(jsonString);
    _objects = data.objects || {};
    _links   = data.links   || [];
    _tags    = data.tags    || [];
    save();
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    _loadSeed();
  }

  // ── Lezen ─────────────────────────────────────────────────────────────────

  function get(id) {
    return _objects[id] || null;
  }

  function getAll() {
    return Object.values(_objects);
  }

  /**
   * query({ type, excludeType, tag, tags, excludeTags, linkedTo, search })
   *
   * type        — filter op object.type (string)
   * excludeType — sluit dit type uit (string)
   * tag         — object moet deze tag hebben (string)
   * tags        — object moet ALLE tags hebben (array, AND-logica)
   * excludeTags — object mag GEEN van deze tags hebben (array, OR-logica)
   * linkedTo    — object moet een link hebben naar/van dit id
   * search      — zoektekst op afk + fullname + content (case-insensitive)
   */
  function query({ type, excludeType, tag, tags, excludeTags, linkedTo, search } = {}) {
    let results = Object.values(_objects);

    if (type) {
      results = results.filter(o => o.type === type);
    }

    if (excludeType) {
      results = results.filter(o => o.type !== excludeType);
    }

    if (tag) {
      const ids = new Set(_tags.filter(t => t.tag === tag).map(t => t.object));
      results = results.filter(o => ids.has(o.id));
    }

    if (tags && tags.length) {
      for (const t of tags) {
        const ids = new Set(_tags.filter(x => x.tag === t).map(x => x.object));
        results = results.filter(o => ids.has(o.id));
      }
    }

    if (excludeTags && excludeTags.length) {
      for (const t of excludeTags) {
        const ids = new Set(_tags.filter(x => x.tag === t).map(x => x.object));
        results = results.filter(o => !ids.has(o.id));
      }
    }

    if (linkedTo) {
      const linked = new Set(
        _links
          .filter(l => l.from === linkedTo || l.to === linkedTo)
          .map(l => l.from === linkedTo ? l.to : l.from)
      );
      results = results.filter(o => linked.has(o.id));
    }

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(o => {
        const hay = [
          o.afk, o.title,
          ...Object.values(o.fields || {}),
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      });
    }

    return results;
  }

  function getTags(id) {
    return _tags.filter(t => t.object === id).map(t => t.tag);
  }

  function getAllTags() {
    return [...new Set(_tags.map(t => t.tag))].sort();
  }

  function getLinks(id) {
    return _links.filter(l => l.from === id || l.to === id);
  }

  function getLinkedObjects(id) {
    const links = getLinks(id);
    const seen = new Set();
    return links.map(l => {
      const otherId = l.from === id ? l.to : l.from;
      return { link: l, object: _objects[otherId] || null };
    }).filter(x => {
      if (!x.object) return false;
      if (seen.has(x.object.id)) return false;
      seen.add(x.object.id);
      return true;
    });
  }

  // ── Schrijven ─────────────────────────────────────────────────────────────

  function add(obj) {
    if (!obj.id)   obj.id       = _uid();
    if (!obj.type) throw new Error('db.add: type is verplicht');
    obj.created  = obj.created  || Date.now();
    obj.modified = Date.now();
    _objects[obj.id] = obj;
    save();
    return obj;
  }

  function update(id, patch) {
    if (!_objects[id]) throw new Error(`db.update: object '${id}' niet gevonden`);
    Object.assign(_objects[id], patch, { modified: Date.now() });
    save();
    return _objects[id];
  }

  function remove(id) {
    delete _objects[id];
    _links = _links.filter(l => l.from !== id && l.to !== id);
    _tags  = _tags.filter(t => t.object !== id);
    save();
  }

  function addLink(fromId, toId, rel = 'gerelateerd') {
    const existing = _links.find(l =>
      ((l.from === fromId && l.to === toId) || (l.from === toId && l.to === fromId)) && l.rel === rel
    );
    if (existing) return existing;
    const link = { id: _uid(), from: fromId, to: toId, rel };
    _links.push(link);
    save();
    return link;
  }

  function removeLink(linkId) {
    _links = _links.filter(l => l.id !== linkId);
    save();
  }

  function addTag(objectId, tag) {
    const exists = _tags.find(t => t.object === objectId && t.tag === tag);
    if (!exists) {
      _tags.push({ object: objectId, tag });
      save();
    }
  }

  function removeTag(objectId, tag) {
    _tags = _tags.filter(t => !(t.object === objectId && t.tag === tag));
    save();
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  function stats() {
    const types = {};
    for (const o of Object.values(_objects)) {
      types[o.type] = (types[o.type] || 0) + 1;
    }
    return {
      objects:  Object.keys(_objects).length,
      links:    _links.length,
      tags:     _tags.length,
      types,
      lastEdit: _lastEdit,
    };
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  load();

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    // Lezen
    get, getAll, query, getTags, getAllTags, getLinks, getLinkedObjects, stats,
    // Schrijven
    add, update, remove, addLink, removeLink, addTag, removeTag,
    // Persistentie
    save, exportJSON, importJSON, reset,
  };
})();
