# FYSIOGRAAF — schema source of truth

> Empirisch afgeleid uit `data/seed.js`. Update dit bestand wanneer je een
> nieuw type, veld, rel-label of tag introduceert.
> Laatst gesynchroniseerd: 2026-04-15.

## Top-level

```js
window.SEED_DATA = {
  objects: { [id]: object },
  links:   [ { id, from, to, rel } ],
  tags:    [ { object, tag } ]
}
```

## Object-types & velden

Elke object: `{ id, type, afk, title, fields: {...}, links: [{label,url}] }`

### `instrument` — meetinstrument (69 instances)
| veld | dekking | inhoud |
|---|---|---|
| `watMeetHet` | 100% | wat het instrument meet (1-3 zinnen) |
| `scoringscriteria` | 99% | items, schaal, scoringsregel |
| `normwaarden` | 100% | cut-offs, MCID, referentiewaarden |
| `implicatie` | 100% | klinische bruikbaarheid |

### `kennis` — klinische kennis / besluitregel (72 instances) — **bimodaal**
| veld | dekking | inhoud |
|---|---|---|
| `kern` | 42% | 1-2 zinnen essentie (**nieuwe stijl**) |
| `toelichting` | 42% | HTML-rijke body (**nieuwe stijl**) |
| `content` | 36% | volledige body (**legacy stijl**) |
| `implicatie` | 92% | klinische implicatie |
| `watMeetHet` / `normwaarden` | 22% | edge case — kennis met instrument-achtige velden |

**Convention voor nieuwe extracties:** gebruik `kern` + `toelichting` + `implicatie`.
UI rendert beide stijlen; legacy hoeft niet gemigreerd te worden.

### `casuistiek` — concrete casus (19 instances)
| veld | dekking | inhoud |
|---|---|---|
| `content` | 100% | volledige casus-narrative (HTML) |
| `focus` | 100% | korte cursieve sub-titel onder de header |
| `setting` | 100% | context-tag (eerste lijn / tweede lijn / etc.) |

⚠️ **Wijkt af van kennis-schema.** Bij Cowork-extractie expliciet meegeven.

### `bronnen` — richtlijn / reader / boek (12 instances)
| veld | dekking | inhoud |
|---|---|---|
| `scope` | 100% | onderwerp + populatie + fase-afbakening |
| `kernaanbevelingen` | 83% | belangrijkste do's/don'ts uit de richtlijn |
| `doelen` | 25% | doel van de richtlijn (recent toegevoegd) |
| `indicaties` | 25% | wanneer richtlijn van toepassing is |
| `contraindicaties` | 25% | rode vlaggen, exclusie, verwijscriteria |

## Relatie-labels (`links[].rel`)

| label | semantiek | typische from→to | aantal |
|---|---|---|---|
| `usus` | "wordt gebruikt door" | bron→node, casus→instrument | 253 |
| `nexus` | "inhoudelijk verband met" | kennis↔kennis, casus→kennis | 100 |
| `contextus` | "toepassingscontext voor" | kennis→instrument | 37 |
| `sequens` | "volgt op" (keten) | casus→casus | 17 |

**Conventie:** elke node die uit een richtlijn komt → minimaal één edge `bron usus→ node`.

## Tag-labels (specialismen)

| tag | naam | aantal |
|---|---|---|
| `rca` | revalidatie / cardio-pulmonaal | 77 |
| `msa` | musculoskeletaal | 62 |
| `cna` | centraal-neurologisch | 53 |
| `ger` | geriatrie | 31 |
| `onco` | oncologie | 16 |
| `mtt` | medische trainingstherapie | 12 |

Tag-vorm: `{ "object": "<id>", "tag": "<label>" }`.

## ID-conventies

- kebab-case, eindigt op kort suffix (random base36 of betekenisvolle code)
- domein-prefix waar logisch: `rug-`, `lrp-`, `lrs-`, `artrose-`, `cna-`, `gold-`
- bronnen: `rl-<korte-naam>` (bv. `rl-rug-2021`, `rl-artrose-2020`)
- casussen: `casus-<tag>-<korte-naam>-<volgnr>` (bv. `casus-msa-lrp-001a`)
- link-id: `lnk-<base36-random>` (gegenereerd door apply-tool)

## Citaties

Inline in HTML-velden:
```html
<sup data-src="<bron-id>" data-p="<page-or-range>">[p<page>]</sup>
```

- `data-src` = id van een `bronnen`-object dat bestaat in `seed.js`
- `data-p` = paginanummer zoals **afgedrukt op de PDF-pagina** (niet PDF-viewer-index)
- bereik: `data-p="48-50"`, label `[p48–50]`
- meerdere bronnen per zin: meerdere `<sup>` achter elkaar
- niet citeren: `implicatie` (synthese, niet richtlijn-claim)

UI rendert deze tags als hoverbare `.citation-ref`-superscripts en
aggregeert in een "Sources"-blok onderaan de detail-card (zie
`js/views/cards.js`).
