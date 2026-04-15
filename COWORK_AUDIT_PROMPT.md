# Cowork-prompt — audit KNGF-richtlijn Lage rugpijn en LRS 2021

> Paste alles onder de horizontale lijn hieronder in Claude Cowork / claude.ai,
> en voeg de PDF `kngf_richtlijn_lage_rugpijn_en_lrs_2021.pdf` als bijlage toe.
> Cowork heeft GEEN zicht op `seed.js` — dat is expres: deze extractie is een
> blind reviewer-pass. Alleen de inventarislijst hieronder krijg je mee.

---

# Taak

Je bouwt nodes voor een kennisgraaf voor Nederlandse fysiotherapeuten
("FYSIOGRAAF"). Je krijgt één brondocument: de **KNGF-richtlijn Lage
rugpijn en lumbosacraal radiculair syndroom (2021)**. Je haalt daar álle
relevante klinische kennis, meetinstrumenten, behandelprincipes en
besluitregels uit, en levert dat als gestructureerde JSON.

Een eerdere sessie heeft al een eerste extractie gedaan. Jouw extractie
dient als **onafhankelijke second pass** voor audit op volledigheid en
correctheid. Werk zelfstandig; volg de richtlijn, niet de bestaande
extractie.

Bij elk inhoudelijk statement geef je de **paginabron** mee (zie §3).

---

# 1. Datamodel

Top-level output:

```json
{
  "bron": { "id": "rl-rug-2021", "pdfPages": 81, "accessDate": "2026-04-15" },
  "new_nodes": [ /* objecten die nog niet in de inventaris staan */ ],
  "updates":   [ /* patches op objecten die wel in de inventaris staan */ ],
  "links":     [ /* edges: {from, to, rel} */ ],
  "tags":      [ /* {object, tag} */ ],
  "audit_notes": "vrije tekst: wat viel op, twijfels, gaten in de richtlijn"
}
```

## Objecttypes

Elk object: `{ id, type, afk, title, fields: {...}, links: [{label,url}] }`.

| type | verplichte velden | bedoeling |
|---|---|---|
| `instrument` | `watMeetHet`, `scoringscriteria`, `normwaarden`, `implicatie` | meetinstrument / test |
| `kennis` | `kern`, `toelichting`, `implicatie` | klinische kennis, besluitregel, principe |
| `casuistiek` | `kern`, `toelichting`, `implicatie` | concrete casus |
| `bronnen` | `scope`, `doelen`, `indicaties`, `contraindicaties` | richtlijn zelf (alleen `rl-rug-2021`, updaten niet hernieuwd aanmaken) |

- `afk` = korte codenaam die in de UI als label dient (bv. "SLR", "Profiel 2").
- `title` = volledige naam.
- `id` = kebab-case, eindigt op een korte random suffix (bv. `-x4k2`),
  prefix herkenbaar voor het onderwerp: `lrp-`, `lrs-`, `rug-` voor kennis;
  voor instrumenten de afkorting + `-rug` of `-lrp` + random.
  **Gebruik GEEN id die in de inventaris onder §2 staat** — kies iets
  anders. Als je denkt dat jouw node een bestaand item is, zet het in
  `updates` (met het bestaande id uit §2), niet in `new_nodes`.

HTML in veldwaarden is toegestaan en aangemoedigd voor leesbaarheid:
`<b>`, `<br>`, `<em>`, `<ul><li>`, HTML-entities (`&lt;`, `&gt;`).

## Edges (`links` top-level)

```json
{ "from": "id-A", "to": "id-B", "rel": "usus" }
```

Relatielabels:

| rel | betekenis | typische from→to |
|---|---|---|
| `usus` | "wordt gebruikt" | bron → node, casus → instrument |
| `nexus` | "inhoudelijk verband met" | kennis ↔ kennis, casus → kennis |
| `sequens` | "volgt op" (keten) | casus → casus |
| `contextus` | "toepassingscontext voor" | kennis → instrument |

**Verplicht:** elke nieuwe node krijgt minimaal één edge
`rl-rug-2021 → <node-id>` met rel `usus`. Dit is hoe we bronvermelding
op node-niveau leggen.

## Tags

Alle nodes krijgen tag `msa` (musculoskeletaal) — dit is het specialisme.
Formaat: `{"object": "<id>", "tag": "msa"}`.

---

# 2. Inventaris — bestaande nodes rond rug/LRS

Deze id's bestaan al. Plaats verwante content onder `updates` (niet
`new_nodes`). Raak id's níet aan als je denkt dat je onderwerp al
gedekt is.

## Bron
- `rl-rug-2021` — KNGF-richtlijn Lage rugpijn en LRS 2021 (dit is DE bron)

## Instrumenten
- `nrs-a2j2dqx` — NRS (pijnintensiteit)
- `qbpds-rug-5j3k` — Quebec Back Pain Disability Scale
- `rmdq-rug-p2q3` — Roland Morris Disability Questionnaire
- `odi-rug-r4s5` — Oswestry Disability Index
- `sbst-rug-8p2w` — STarT Back Screening Tool
- `fabq-rug-t6u7` — Fear-Avoidance Beliefs Questionnaire
- `pseq-rug-v8w9` — Pain Self-Efficacy Questionnaire
- `gpe-rug-x0y1` — Global Perceived Effect
- `psk-up6oqkz` — Patiënt Specifieke Klachten
- `hads-3sykkqp` — Hospital Anxiety and Depression Scale
- `tsk-lrp-q1r2` — Tampa Scale of Kinesiophobia
- `pcs-lrp-s3t4` — Pain Catastrophizing Scale
- `slr-lrp-u5v6` — Straight Leg Raise / Lasègue
- `csi-lrp-w7x8` — Central Sensitization Inventory
- `4dkl-lrp-y9z0` — Vierdimensionale Klachtenlijst (4-DKL)

## Kennis
- `rug-classificatie-2m1q` — Aspecifiek vs. LRS
- `rug-rode-vlaggen-9t2z` — Rode vlaggen
- `rug-gele-vlaggen-g8h9` — Gele vlaggen (psychosociaal)
- `rug-neurodiag-i0j1` — LRS neurodynamische tests & dermatomen
- `rug-profiel1-a2b3` — Patiëntprofiel 1 (laag risico)
- `rug-profiel2-c4d5` — Patiëntprofiel 2 (matig)
- `rug-profiel3-e6f7` — Patiëntprofiel 3 (hoog)
- `rug-gelaagde-zorg-4h1p` — Strategie gelaagde zorg
- `rug-prognose-k2l3` — Prognose aspecifiek + LRS
- `rug-lrs-behandeling-m4n5` — LRS behandelstrategie
- `rug-zelfmanagement-o6p7` — Zelfmanagement & ergonomie
- `lrp-oefentherapie-a1b2` — Oefentherapie dosering & principes
- `lrp-gedrag-c3d4` — Gedragsmatige behandeling — matching-tabel

## Casuïstiek
- `casus-msa-lrp-001a` — Lage rugpijn — anamnese (profiel 2)
- `casus-msa-lrp-001b` — Lage rugpijn — onderzoek (profiel 2)
- `casus-msa-lrs-002a` — LRS — anamnese
- `casus-msa-lrs-002b` — LRS — onderzoek

---

# 3. Bronvermeldingsformaat — per claim

Naast de edge `rl-rug-2021 usus→ node` willen we dat **elke inhoudelijke
uitspraak in een veldwaarde** een paginaverwijzing draagt. Gebruik deze
syntax, inline in de HTML:

```html
Diagnosecriteria LRS vereisen radiculaire pijn in één been.<sup data-src="rl-rug-2021" data-p="15">[p15]</sup>
```

- `data-src` = altijd `rl-rug-2021`
- `data-p` = paginanummer zoals afgedrukt in de PDF (dus de KNGF-paginavoet,
  niet de PDF-viewerindex)
- Zichtbaar label tussen haken: `[p15]`. Bij pagina-bereik: `[p48–50]`,
  met attribuut `data-p="48-50"`.
- Plaats de `<sup>` direct ná de zin of claim, vóór de punt niet verplicht.
- Meerdere bronnen per zin: meerdere `<sup>` achter elkaar.

**Granulariteit:** per **statement** (zin of duidelijke claim), niet per
woord. Niet elke implicatie-regel hoeft een eigen citatie als de hele
paragraaf één pagina-bron heeft — zet er dan één aan het einde.

**Wat wel citeren:**
- Scores, cut-offs, afkappunten
- Classificatiecriteria (profielen, vlaggen, LRS-criteria)
- Aanbevelingen (behandelkeuzes, doseringen, verwijsindicaties)
- Epidemiologische cijfers
- Testeigenschappen (sensitiviteit/specificiteit)

**Wat níet citeren:**
- Pure structuur ("we bespreken drie profielen")
- Algemene kennis die niet richtlijn-afhankelijk is
- Jouw eigen interpretatieve `implicatie`-zin — dat is jouw synthese,
  geen richtlijn-claim. (Maar wél de onderliggende feiten citeren.)

---

# 4. Extractiescope — wat uit de richtlijn halen?

Dek de volledige richtlijn. Grof overzicht:

**Praktijkrichtlijn (p7-31)**
- A.1 Inleiding, A.2 Achtergrond (epidemiologie, klinisch beeld, etiologie),
  A.3 Organisatie van zorg
- B.1 Anamnese / lichamelijk onderzoek / rode vlaggen
- B.2 Indicatiestelling en behandelprofielen (+ B.2.1 classificatiesystemen)
- B.3 Meetinstrumenten
- C.1 Voorlichting en pijneducatie
- C.2 Oefentherapie (interventies, dosering)
- C.3 Gedragsgeoriënteerde behandeling
- C.4 Niet-oefentherapeutische interventies (mobilisaties/manipulaties,
  massage, TENS/interferentie)
- C.5 Afsluiting van de behandeling

**Toelichting / Noten (p32-81):** verantwoording en evidence per onderdeel.
Gebruik deze om `toelichting`-velden diepte te geven en om
`scoringscriteria` / `normwaarden` / testeigenschappen van
meetinstrumenten te staven.

Aandachtspunten die erin móeten zitten:

1. **Classificatie** aspecifiek vs. LRS + criteria
2. **Rode vlaggen** — volledige lijst
3. **Gele, blauwe, zwarte vlaggen** — psychosociale stratificatie
4. **SBST-afkappunten** en koppeling aan profielen 1/2/3
5. **Profielen 1/2/3** — kenmerken, doelen, interventies, evaluatie
6. **Meetinstrumenten aanbevolen door richtlijn** — welke, wanneer,
   bij welk profiel, MCID-waarden
7. **Pijneducatie** — inhoud en principes
8. **Oefentherapie** — type, dosering, progressie, contra-indicaties
9. **Gedragsmatige behandeling** — graded activity, graded exposure,
   ACT, matching van interventie op kenmerk
10. **Passieve interventies** — aanbevelingen over manipulatie,
    massage, TENS (wanneer wel/niet)
11. **Voorlichting/afsluiting** — GPE, criteria voor beëindiging
12. **LRS specifiek** — diagnostische tests (SLR, Lasègue gekruist,
    Slump, FNS, bulbocavernosus bij cauda), behandelfasen, verwijscriteria
13. **Prognose en beloop** — aspecifiek én LRS
14. **Organisatie van zorg** — verwijsroutes, multidisciplinair,
    rollen paramedisch

---

# 5. Output-instructies

- Lever **één JSON-blok** volgens het top-level schema in §1.
- JSON moet valide zijn (geen trailing commas, geen commentaren).
- Gebruik de exacte veldnamen per type (§1). Geen extra velden.
- **Bij `updates`:** lever alléén de velden die je wil wijzigen of
  aanvullen. Als je een veld volledig herschrijft, zet de volledige nieuwe
  tekst erin. Als je alleen wil aanvullen, schrijf een patch-instructie
  in `audit_notes` in plaats daarvan.
- **`audit_notes`** is jouw vrije-tekst-rapport, in het Nederlands:
  - Welke onderwerpen uit de richtlijn vond je dat in de inventaris
    onderbedeeld lijken? (Cowork kent de inhoud niet, dus speculatief
    op basis van de titels in §2.)
  - Welke statements in de richtlijn waren lastig te categoriseren?
  - Twijfels over granulariteit (één grote node vs. meerdere kleine)?
  - Gaten of zwakke plekken in de richtlijn zelf die je opviel.

---

# 6. Schrijfstijl

- Nederlands, vakterminologie zoals in de richtlijn.
- `kern` = 1-2 zinnen essentie.
- `toelichting` = de body, mag HTML-rijk zijn.
- `implicatie` = wat dit concreet betekent voor de fysiotherapeut
  in de spreekkamer (klinische bruikbaarheid).
- Wees concreet. Vermijd vage formuleringen als "kan nuttig zijn".
- Geen emoji's, geen marketingtaal.

---

# 7. Levering

Plak de volledige JSON in één codeblok. Daarna eronder je `audit_notes`
(zit al in de JSON, maar mag ook apart als leesbare samenvatting).

Begin nu. Lees de PDF volledig voor je begint met extractie.
