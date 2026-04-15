# Cowork-prompt — audit van {{RICHTLIJN_TITEL}}

> Plak alles onder de horizontale lijn hieronder in Claude Cowork / claude.ai
> en voeg de PDF van de richtlijn als bijlage toe.
> Cowork heeft GEEN zicht op `seed.js`. De inventaris hieronder is jouw
> enige referentie naar wat al bestaat.

---

# Taak

Je bouwt nodes voor een kennisgraaf voor Nederlandse fysiotherapeuten
("FYSIOGRAAF"). Brondocument: **{{RICHTLIJN_TITEL}}**.
Bron-id in de graaf: `{{BRON_ID}}`.

Een eerdere extractie kan al bestaan. Jouw extractie dient als
**onafhankelijke second pass** voor audit op volledigheid en correctheid.
Werk zelfstandig; volg de richtlijn, niet eventuele eerdere extracties.

Bij elk inhoudelijk statement geef je de **paginabron** mee (zie §3).

---

# 1. Datamodel

Top-level output:

```json
{
  "bron": { "id": "{{BRON_ID}}", "pdfPages": <int>, "accessDate": "{{ACCESS_DATE}}" },
  "new_nodes": [ /* objecten die nog niet in de inventaris staan */ ],
  "updates":   [ /* patches op objecten die wel in de inventaris staan */ ],
  "links":     [ /* edges: {from, to, rel} */ ],
  "tags":      [ /* {object, tag} */ ],
  "audit_notes": "vrije tekst: wat viel op, twijfels, gaten in de richtlijn"
}
```

## Objecttypes — exact deze veldnamen gebruiken

Elk object: `{ id, type, afk, title, fields: {...}, links: [{label,url}] }`.

| type | velden | bedoeling |
|---|---|---|
| `instrument` | `watMeetHet`, `scoringscriteria`, `normwaarden`, `implicatie` | meetinstrument / test |
| `kennis` | `kern`, `toelichting`, `implicatie` | klinische kennis, besluitregel, principe |
| `casuistiek` | `content`, `focus`, `setting` | concrete casus (`content` is HTML-body, `focus` is korte sub-titel, `setting` is "eerste lijn"/"tweede lijn"/etc.) |
| `bronnen` | `scope`, `doelen`, `indicaties`, `contraindicaties`, `kernaanbevelingen` | richtlijn zelf — alleen `{{BRON_ID}}` updaten, niet opnieuw aanmaken |

⚠️ Let op: `casuistiek` gebruikt **andere veldnamen** dan `kennis`. Niet verwarren.

`afk` = korte UI-label. `title` = volledige naam. `id` = kebab-case.
HTML in waarden mag (`<b>`, `<br>`, `<em>`, `<ul><li>`, entities).

**Nieuwe id's:** kebab-case + korte random suffix, prefix herkenbaar voor
het onderwerp. Gebruik **GEEN** id uit §2; kies iets anders. Als jouw node
volgens jou een bestaand item is, zet 'm in `updates` (met het bestaande id),
niet in `new_nodes`.

## Edges (`links` top-level)

```json
{ "from": "id-A", "to": "id-B", "rel": "usus" }
```

| rel | betekenis | typische from→to |
|---|---|---|
| `usus` | "wordt gebruikt" | bron → node, casus → instrument |
| `nexus` | "inhoudelijk verband met" | kennis ↔ kennis, casus → kennis |
| `sequens` | "volgt op" | casus → casus |
| `contextus` | "toepassingscontext voor" | kennis → instrument |

**Verplicht:** elke nieuwe node krijgt minimaal één edge
`{{BRON_ID}} → <node-id>` met rel `usus`.

## Tags

Alle nieuwe nodes krijgen tag `{{DOMAIN_TAG}}` (specialisme).
Formaat: `{"object": "<id>", "tag": "{{DOMAIN_TAG}}"}`.

Beschikbare tag-labels (gebruik alleen `{{DOMAIN_TAG}}` tenzij een node
duidelijk multi-domein is):
- `rca` — revalidatie / cardio-pulmonaal
- `msa` — musculoskeletaal
- `cna` — centraal-neurologisch
- `ger` — geriatrie
- `onco` — oncologie
- `mtt` — medische trainingstherapie

---

# 2. Inventaris — bestaande nodes rond dit onderwerp

Deze id's bestaan al. Plaats verwante content onder `updates` (niet
`new_nodes`). Raak een id niet aan als jouw onderwerp al gedekt is.

{{INVENTARIS}}

---

# 3. Bronvermeldingsformaat — per claim

Naast de edge `{{BRON_ID}} usus→ node` willen we dat **elke inhoudelijke
uitspraak** een paginaverwijzing draagt. Inline in HTML:

```html
Diagnosecriteria vereisen X.<sup data-src="{{BRON_ID}}" data-p="15">[p15]</sup>
```

- `data-src` = altijd `{{BRON_ID}}`
- `data-p` = paginanummer **zoals afgedrukt op de PDF-pagina** (niet PDF-viewerindex)
- Zichtbaar label: `[p15]`. Bereik: `[p48–50]` met `data-p="48-50"`.
- Plaats `<sup>` direct ná de claim.
- Meerdere bronnen per zin: meerdere `<sup>` achter elkaar.

**Granulariteit:** per **statement** (zin of duidelijke claim), niet per woord.
Eén citatie aan het eind van een paragraaf is OK als de hele paragraaf
één pagina-bron heeft.

**Wat wel citeren:** scores, cut-offs, classificatiecriteria, aanbevelingen,
epidemiologische cijfers, testeigenschappen.

**Wat NIET citeren:** structuur ("we bespreken drie profielen"), algemene
kennis, jouw eigen `implicatie`-zin (synthese, geen richtlijn-claim) — wel
de onderliggende feiten in andere velden citeren.

---

# 4. Extractiescope

{{SCOPE_CHECKLIST}}

---

# 5. Output-instructies

- **Eén JSON-blok**, valide (geen trailing commas, geen comments)
- Exacte veldnamen per type (§1). Geen extra velden.
- Bij `updates`: lever alléén de velden die je wil wijzigen of aanvullen.
- `audit_notes` = vrije Nederlandse tekst:
  - Welke onderwerpen lijken in de inventaris onderbedeeld?
  - Welke statements waren lastig te categoriseren?
  - Granulariteits-twijfels (één grote node vs. meerdere kleine)?
  - Gaten of zwakke plekken in de richtlijn zelf?

# 6. Schrijfstijl

- Nederlands, vakterminologie zoals in de richtlijn
- `kern` = 1-2 zinnen essentie; `toelichting` = HTML-rijke body;
  `implicatie` = wat dit concreet betekent voor de fysiotherapeut
- Wees concreet. Vermijd vage formuleringen. Geen emoji's, geen marketingtaal.

# 7. Levering

Plak de volledige JSON in één codeblok. Daarna eronder je `audit_notes`
samenvatting (zit al in de JSON, mag ook leesbaar apart).

Begin nu. Lees de PDF volledig voor je begint met extractie.
