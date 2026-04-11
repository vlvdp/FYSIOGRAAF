#!/usr/bin/env python3
"""
migrate_rels.py
Migreert link rel-types in seed.js naar het nieuwe semantische schema:

  usus      — bron → instrument/kennis/vaardigheid
              casuistiek → instrument/vaardigheid
  contextus — kennis → instrument/vaardigheid/casuistiek
  nexus     — instrument/kennis/vaardigheid/casuistiek → bron/kennis
  sequens   — casuistiek → casuistiek
"""

import json, re, shutil, sys
from pathlib import Path

SEED = Path(__file__).parent / 'data' / 'seed.js'
BACKUP = Path(str(SEED) + '.bak')

# ── Backup ────────────────────────────────────────────────────────────────────
shutil.copy2(SEED, BACKUP)
print(f'Backup: {BACKUP}\n')

# ── Lees en parse ─────────────────────────────────────────────────────────────
raw = SEED.read_text(encoding='utf-8')

# Strip JS-wrapper: "window.SEED_DATA = {...};"
json_str = re.sub(r'^\s*\w+[\w.]*\s*=\s*', '', raw)
json_str = re.sub(r';\s*$', '', json_str.rstrip())

data = json.loads(json_str)

# ── ID → type map ─────────────────────────────────────────────────────────────
type_map = {oid: obj['type'] for oid, obj in data['objects'].items()}

# ── Nieuwe rel bepalen ────────────────────────────────────────────────────────
def new_rel(from_type, to_type):
    if from_type == 'bronnen':
        return 'usus'
    if from_type == 'kennis':
        if to_type in ('bronnen', 'kennis'):
            return 'nexus'
        return 'contextus'   # → instrument, vaardigheid, casuistiek
    if from_type == 'casuistiek':
        if to_type == 'casuistiek':
            return 'sequens'
        if to_type in ('instrument', 'vaardigheid'):
            return 'usus'
        return 'nexus'       # → bronnen, kennis
    # instrument, vaardigheid → altijd nexus
    return 'nexus'

# ── Migreer ───────────────────────────────────────────────────────────────────
stats   = {'nexus': 0, 'contextus': 0, 'usus': 0, 'sequens': 0}
changes = 0
content = raw

for link in data['links']:
    lid       = link['id']
    old_rel   = link['rel']
    from_type = type_map.get(link['from'])
    to_type   = type_map.get(link['to'])

    if not from_type or not to_type:
        print(f'  SKIP {lid}: type onbekend (from={link["from"]}[{from_type}] to={link["to"]}[{to_type}])')
        continue

    rel = new_rel(from_type, to_type)
    stats[rel] = stats.get(rel, 0) + 1

    if rel == old_rel:
        continue

    # Vervang rel in het link-blok met dit specifieke id
    # Patroon A: "id": "<lid>", ... "rel": "<oud>"
    eid = re.escape(lid)
    erel = re.escape(old_rel)

    pattern_a = re.compile(
        rf'("id"\s*:\s*"{eid}"[^}}]*?"rel"\s*:\s*)"{erel}"',
        re.DOTALL
    )
    replaced, n = pattern_a.subn(lambda m: m.group(1) + f'"{rel}"', content)

    if n == 0:
        # Patroon B: rel staat vóór id in het blok
        pattern_b = re.compile(
            rf'("rel"\s*:\s*)"{erel}"([^}}]*?"id"\s*:\s*"{eid}")',
            re.DOTALL
        )
        replaced, n = pattern_b.subn(lambda m: m.group(1) + f'"{rel}"' + m.group(2), content)

    if n == 0:
        print(f'  WARN: kon {lid} niet vinden in tekst')
        continue

    content = replaced
    changes += 1
    print(f'  {lid}: {old_rel} → {rel}  ({from_type} → {to_type})')

# ── Schrijf ───────────────────────────────────────────────────────────────────
SEED.write_text(content, encoding='utf-8')

print(f'\n=== Klaar ===')
print(f'{changes} links gewijzigd')
total = sum(stats.values())
print(f'Eindverdeling ({total} links):')
for k, v in stats.items():
    print(f'  {k}: {v}')
