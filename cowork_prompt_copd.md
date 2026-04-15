# Cowork-prompt — audit van KNGF-richtlijn COPD — 2020

> Plak alles onder de horizontale lijn hieronder in Claude Cowork / claude.ai
> en voeg de PDF van de richtlijn als bijlage toe.
> Cowork heeft GEEN zicht op `seed.js`. De inventaris hieronder is jouw
> enige referentie naar wat al bestaat.

---

# Taak

Je bouwt nodes voor een kennisgraaf voor Nederlandse fysiotherapeuten
("FYSIOGRAAF"). Brondocument: **KNGF-richtlijn COPD — 2020**.
Bron-id in de graaf: `rl-copd-2020`.

Een eerdere extractie kan al bestaan. Jouw extractie dient als
**onafhankelijke second pass** voor audit op volledigheid en correctheid.
Werk zelfstandig; volg de richtlijn, niet eventuele eerdere extracties.

Bij elk inhoudelijk statement geef je de **paginabron** mee (zie §3).

---

# 1. Datamodel

Top-level output:

```json
{
  "bron": { "id": "rl-copd-2020", "pdfPages": <int>, "accessDate": "2026-04-15" },
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
| `bronnen` | `scope`, `doelen`, `indicaties`, `contraindicaties`, `kernaanbevelingen` | richtlijn zelf — alleen `rl-copd-2020` updaten, niet opnieuw aanmaken |

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
`rl-copd-2020 → <node-id>` met rel `usus`.

## Tags

Alle nieuwe nodes krijgen tag `rca` (specialisme).
Formaat: `{"object": "<id>", "tag": "rca"}`.

Beschikbare tag-labels (gebruik alleen `rca` tenzij een node
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

## Bron
- `rl-copd-2020` — KNGF-richtlijn COPD — 2020 (dit is DE bron)

## Instrumenten
- `10mwt-btf63p5` — **10MWT** — 10 Meter Wandeltest
- `6mwt-3oaasii` — **6MWT** — 6 Minuten Wandeltest
- `acsm-pijn` — **ACSM-schaal** — ACSM Pijnschaal voor Symptomatisch Perifeer Arterieel Vaatlijden
- `aecopd-mob-zwuu3ei` — **AECOPD-MOB** — Decision-Making Tool for Safe Mobilization of Hospitalized AECOPD Patients
- `bbs-rw9okgz` — **BBS** — Berg Balance Scale
- `bi-jfriih3` — **BI** — Barthel Index
- `borg-ntiwleg` — **BORG** — Borg RPE / CR-10 schaal
- `borg-cr-10-1tju1k1` — **Borg CR-10** — Borgschaal kortademigheid (dyspnoe) — 0–10
- `borg-cr-10-7mjowlc` — **Borg CR-10** — Borgschaal vermoeidheid / zwaarte — 0–10
- `borg-rpe-3q3dw37` — **Borg RPE** — Ratings of Perceived Exertion — schaal 6–20
- `cat-tv44uin` — **CAT** — COPD Assessment Test
- `ccq-68j351u` — **CCQ** — Clinical COPD Questionnaire
- `cirs` — **CIRS** — Cumulative Illness Rating Scale
- `demmi-f6ogjbf` — **DEMMI** — de Morton Mobility Index
- `emnsa-dvq9gpv` — **EmNSA** — Erasmus MC Modificatie (revised) Nottingham Sensory Assessment
- `eq5d` — **EQ-5D** — EuroQol 5D — kwaliteit van leven
- `fac-rk6w94j` — **FAC** — Functional Ambulation Categories
- `fat-0hh90n3` — **FAT** — Frenchay Arm Test
- `fma-vingerextensie-vtwclpn` — **FMA (vingerextensie)** — Fugl-Meyer Assessment — item vingerextensie
- `hads-3sykkqp` — **HADS** — Hospital Anxiety and Depression Scale
- `iswt-o7nxght` — **ISWT** — Incremental Shuttle Walk Test
- `kvl-h-67n8vxn` — **KVL-H** — Kwaliteit van Leven bij Hartpatiënten
- `lastmeter-odp2l7o` — **Lastmeter** — Lastmeter / Distress Thermometer + Probleemlijst
- `loopbandtest` — **Loopbandtest** — Loopbandtest sPAV — incrementeel protocol
- `mi-f8eknl6` — **MI** — Motricity Index
- `mip-pimax-2tpk0k7` — **MIP / PImax** — Maximale Inspiratoire Druk
- `mmrc-8eu1fyi` — **mMRC** — modified Medical Research Council Dyspnoeschaal
- `mmse-j6zp0am` — **MMSE** — Mini-Mental State Examination
- `mrc-0y16lq5` — **MRC** — MRC Spierkrachtschaal
- `must-muj4ge0` — **MUST** — Malnutrition Universal Screening Tool
- `mvi-9jdikni` — **MVI** — Multidimensionele Vermoeidheids Index
- `neadl-i96unqd` — **NEADL** — Nottingham Extended Activities of Daily Living Scale
- `nihss-9texb5h` — **NIHSS** — National Institutes of Health Stroke Scale
- `ppc-e1suzs2` — **PPC** — Post Pulmonale Complicaties Risicofactoren
- `prpm-pm1jjm9` — **PRPM** — Perceived Resistance to Passive Movement
- `psk-up6oqkz` — **PSK** — Patiënt Specifieke Klachtenlijst
- `stoplicht-s6kx9h0` — **Stoplicht Hartrevalidatie** — Stoplicht Lichaamssignalen — Hartrevalidatie
- `tct-ihqr0ru` — **TCT** — Trunk Control Test
- `tis-2c50htt` — **TIS** — Trunk Impairment Scale
- `tug-ej2xkyw` — **TUG** — Timed Up and Go Test
- `vas-vermoeidheid-kgdn33e` — **VAS vermoeidheid** — Visual Analogue Scale — vermoeidheid
- `wiq` — **WIQ** — Walking Impairment Questionnaire

## Kennis
- `tl-1rm` — **1RM-tabel** — 1RM conversie & krachtspiramide — Brzycki, Baechle, Dos Remedios
- `spav-activeringsprogramma` — **Activeringsprogramma** — sPAV — Activeringsprogramma (zelfstandige training thuis)
- `spav-behandelschema` — **Behandelschema** — sPAV — Behandelschema (fasen en frequenties)
- `cna-cortex` — **Cortexlaesie** — Behandelprincipes bij cortexlaesie — CVA, TBI
- `spav-differentiaaldiagnose` — **DD sPAV** — sPAV — Differentiaaldiagnose claudicatio
- `aanvullend-y4pxnu8` — **Dyspneu aanvullend** — Behandeling Dyspneu aanvullend
- `beslisboom-uyvfibc` — **Dyspneu opties** — Behandeling Dyspneu opties
- `rationale-vkz68nk` — **Dyspneu rationale** — Behandeling Dyspneu rationale
- `fitt-5cftwyg` — **FITT** — Trainingsparameters duur- vs intervaltraining bij COPD
- `spav-fitt-looptraining` — **FITT sPAV** — sPAV — FITT-parameters looptraining
- `gold-klinimetrie-esyy74n` — **GOLD × Klinimetrie** — Welke meetinstrumenten horen bij welk GOLD-stadium?
- `gold-1-4-4ymlz7m` — **GOLD 1–4** — Spirometrische classificatie luchtwegobstructie (post-bronchodilatoir FEV₁)
- `gold-a-b-e-yxticp1` — **GOLD A / B / E** — Symptoom- en exacerbatierisicogroepen — GOLD 2022–2024 (ABE-systeem)
- `hr-u8blzi3` — **HR** — Hartslagmeting
- `spav-indicatiestelling` — **Indicatiestelling** — sPAV — Indicatiestelling (4 screeningsvragen)
- `tl-peace-love` — **PEACE & LOVE** — Blessurebeheer van acute tot herstelfase — Dubois & Esculier (2020)
- `tl-prikkelparameters` — **Prikkelparameters** — Prikkelparameters per trainingsdoelstelling — Tabel 8.2
- `rr-73i5hcj` — **RR** — Bloeddrukmeting
- `spo-vr0dlo5` — **SpO₂** — Saturatiemeting (pulsoximetrie)
- `tl-principes` — **Trainingsprincipes** — Trainingsprincipes & wetmatigheden — Bompa, Poel et al.
- `tl-trainingszones` — **Trainingszones** — Trainingszones cardiovasculair & respiratoir — Takken, Tonnessen, Seiler
- `tl-weefsel` — **Weefselherstel** — Weefselherstelfasen & hersteltijden — Fysiotherapie van Berkel (2016)

## Casuïstiek
- `casus-ez-beh-004` — **TB4** — COPD — behandeling
- `casus-ez-beh-005` — **TB5** — sPAV — behandeling
- `casus-ez-diag-004a` — **TD4a** — COPD — anamnese
- `casus-ez-diag-004b` — **TD4b** — COPD — onderzoek
- `casus-ez-diag-005a` — **TD5a** — sPAV — anamnese
- `casus-ez-diag-005b` — **TD5b** — sPAV — onderzoek


---

# 3. Bronvermeldingsformaat — per claim

Naast de edge `rl-copd-2020 usus→ node` willen we dat **elke inhoudelijke
uitspraak** een paginaverwijzing draagt. Inline in HTML:

```html
Diagnosecriteria vereisen X.<sup data-src="rl-copd-2020" data-p="15">[p15]</sup>
```

- `data-src` = altijd `rl-copd-2020`
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

# Scope-checklist — KNGF-richtlijn COPD (2020)

Bron-id: `rl-copd-2020` (bestaat al, alleen `scope` gevuld; hernoemd van `rl-copd` op 2026-04-15)
Specialisme-tag: `rca`
PDF: `KNGF COPD 2020.pdf`

## Context: al aanwezig in graaf — NIET opnieuw extraheren
Volgende nodes bestaan al met RCA-tag en usus→rl-copd-2020; Cowork mag hier wél naar verwijzen
via `nexus`-links maar moet ze niet dupliceren als nieuwe kennis-nodes:

- GOLD-classificatie FEV₁ 1-4 (`gold-1-4-4ymlz7m`)
- GOLD ABE-groepen (`gold-a-b-e-yxticp1`)
- Meetinstrumenten per GOLD-stadium (`gold-klinimetrie-esyy74n`)
- CCQ, CAT, mMRC, ISWT, 6MWT, MIP/PImax, saturatiemeting, Borg CR-10 (dyspnoe/vermoeidheid), HADS
- Stoplicht lichaamssignalen, AECOPD mobilisatie-tool, PPC-risicofactoren
- FITT duur- vs intervaltraining bij COPD (`fitt-5cftwyg`)
- Behandeling Dyspneu — rationale, beslisboom, aanvullend (`rationale-vkz68nk`, `beslisboom-uyvfibc`, `aanvullend-y4pxnu8`)
- 3 casussen: COPD anamnese / onderzoek / behandeling (`casus-ez-diag-004a/b`, `casus-ez-beh-004`)

## Gewenste nieuwe extractie (Deel A / B / C van de richtlijn)

### Bron-node `rl-copd-2020` aanvullen
1. **Kernaanbevelingen** — top 5-8 do's/don'ts van de richtlijn (vooral uit Deel C)
2. **Doelen** — doel van de richtlijn (conform `bronnen`-schema, uit A.1)
3. **Indicaties** — wanneer fysio/oefentherapie bij COPD geïndiceerd (uit A.3.3)
4. **Contra-indicaties / verwijscriteria** — rode vlaggen en doorverwijzing (uit B.4)

### Diagnostisch proces (Deel B) — nieuwe kennis-nodes
5. **Patiëntenprofielen COPD** (B.5, Noot B.5 p.34-38) — de 4-5 profielen met kenmerken en therapie-accent; unieke kern van deze richtlijn en ontbreekt in graaf
6. **Doelen stellen bij COPD** (B.6, p.11 / Noot B.6 p.38) — domeinen + SMART-aanpak specifiek voor COPD
7. **Rode vlaggen & doorverwijzing** (B.4.1/B.4.2, p.8-9) — COPD-specifieke rode vlaggen, wanneer terugverwijzen
8. **Diagnostisch handelen bij longaanval** (B.7.2, Noot B.7.2 p.42) — wat anders tijdens/na AECOPD
9. **Diagnostisch handelen bij comorbiditeit** (B.7.1, Noot B.7.1 p.39) — cardiovasculair, diabetes, osteoporose, depressie
10. **Diagnostisch handelen palliatieve fase** (B.7.3, p.12 / Noot B.7.3 p.44)

### Therapeutisch proces (Deel C) — nieuwe kennis-nodes
11. **Voorlichting en educatie** (C.1, Noot C.1 p.45) — inhoud, zelfmanagement, COPD-specifieke educatiedoelen
12. **Optimaliseren van fysieke activiteit** (C.2, Noot C.2 p.47) — gedragsinterventie-aanpak, onderscheid van trainen
13. **Interventies ademhalingsapparaat** (C.4.1-C.4.5) — **5 losse kennis-nodes**, onderling gekoppeld via `nexus`:
    - 13a. Ademspiertraining / IMT (C.4.1, Noot C.4.1 p.56) — moet ook `contextus→ mip-pimax-2tpk0k7` krijgen
    - 13b. Ademhalingstechnieken (C.4.2, Noot C.4.2 p.57) — PLB, ademregulatie
    - 13c. Ontspanningstechnieken (C.4.3, Noot C.4.3 p.59)
    - 13d. Houdingsaanpassingen (C.4.4, Noot C.4.4 p.60)
    - 13e. Mucusklaring (C.4.5, Noot C.4.5 p.60)
14. **Aanvullende trainingsmodaliteiten** (C.3.3-C.3.5) — hydrotherapie, training bij zuurstofdesaturatie, NMES — indicaties en beperkingen
15. **Supervisie: duur & frequentie** (C.5.1, Noot C.5.1 p.62) — hoe lang, hoe vaak, groep vs individueel
16. **Therapeutisch handelen bij longaanval** (C.6.2, Noot C.6.2 p.67) — tijdens opname + na ontslag
17. **Therapeutisch handelen palliatieve fase** (C.6.3, Noot C.6.3 p.68)
18. **Evaluatie en afsluiting** (C.7, Noot C.7 p.69) — wanneer afbouwen, overdracht naar zelfstandig bewegen

## Links — verplicht

### Basis
- Elke nieuwe node → inbound edge `rl-copd-2020 usus→ node`

### Nieuwe-node koppeling aan bestaande graaf (expliciet per nieuwe node)
De huidige COPD-subgraph heeft 25 `usus`-edges vanuit de bron, maar slechts 1 `nexus` en 0 `contextus` tussen kennis-nodes onderling — nieuwe nodes moeten dit expliciet repareren:

| nieuwe node | rel | bestaande target | ratio |
|---|---|---|---|
| 5. Patiëntenprofielen | `contextus` → | `ccq-68j351u`, `cat-tv44uin`, `mmrc-8eu1fyi` | profielen worden met deze instrumenten bepaald |
| 5. Patiëntenprofielen | `nexus` → | `gold-a-b-e-yxticp1`, `gold-1-4-4ymlz7m` | profielen bouwen op GOLD-classificatie |
| 6. Doelen stellen | `nexus` → | patiëntenprofielen (item 5) | doelen per profiel |
| 6. Doelen stellen | `contextus` → | `ccq-68j351u`, `cat-tv44uin` | evaluatie-instrumenten |
| 7. Rode vlaggen | `nexus` → | `ppc-e1suzs2` | PPC is risico-verwant |
| 8. Diagnostiek longaanval | `nexus` → | `aecopd-mob-zwuu3ei` | beide gaan over AECOPD |
| 9. Diagnostiek comorbiditeit | `contextus` → | `hads-3sykkqp`, `cirs` | meetinstrumenten comorbiditeit |
| 11. Voorlichting/educatie | `nexus` → | patiëntenprofielen (item 5) | educatie-inhoud verschilt per profiel |
| 12. Optimaliseren fysieke activiteit | `nexus` → | `fitt-5cftwyg` | onderscheid activiteit vs training |
| 13a. IMT | `contextus` → | `mip-pimax-2tpk0k7` | MIP is de meting voor IMT-indicatie |
| 13a-e | `nexus` ↔ | onderling alle 5 | cluster ademhalingsapparaat |
| 13b-e (ademhaling/houding/mucus) | `contextus` → | `mmrc-8eu1fyi`, `borg-cr-10-1tju1k1` | dyspnoe-instrumenten |
| 14. Aanvullende trainingsmodaliteiten | `nexus` → | `tl-trainingszones`, `fitt-5cftwyg` | trainings-cluster |
| 14. (zuurstofdesaturatie-subdeel) | `contextus` → | `spo-vr0dlo5` | saturatiemeting is kerninstrument |
| 15. Supervisie duur/frequentie | `nexus` → | `fitt-5cftwyg` | trainings-cluster |
| 16. Therapie longaanval | `nexus` → | `aecopd-mob-zwuu3ei`, `stoplicht-s6kx9h0`, patiëntenprofielen |  |
| 18. Evaluatie/afsluiting | `contextus` → | `ccq-68j351u`, `cat-tv44uin`, `6mwt-3oaasii`, `iswt-o7nxght` | progressie-meting |

### Casus-koppeling (weespagina's voorkomen)
Bestaande casussen (`casus-ez-diag-004a/b`, `casus-ez-beh-004`) hebben alleen `usus` naar instrumenten. Nieuwe kennis-nodes moeten via `nexus` aan casussen hangen waar inhoudelijk relevant:
- `casus-ez-diag-004a` (anamnese) → `nexus` → items 5 (profielen), 6 (doelen), 7 (rode vlaggen)
- `casus-ez-diag-004b` (onderzoek) → `nexus` → items 5, 6
- `casus-ez-beh-004` (behandeling) → `nexus` → items 11, 12, 13a-e, 14, 15

### Bestaande-graph-reparaties (Cowork mag deze toevoegen)
Idempotent apply-tool: nieuwe edges met dezelfde from/to/rel worden gededupliceerd. Cowork mag deze ontbrekende kennis-cluster-edges toevoegen:

- **GOLD-cluster:** `nexus` tussen `gold-1-4-4ymlz7m` ↔ `gold-a-b-e-yxticp1` ↔ `gold-klinimetrie-esyy74n` (3 edges, ongerichte triangle)
- **Dyspneu-cluster:** `nexus` tussen `rationale-vkz68nk` ↔ `beslisboom-uyvfibc` ↔ `aanvullend-y4pxnu8` (3 edges)
- **Dyspneu → meetinstrument:** `contextus` van `rationale-vkz68nk` → `mmrc-8eu1fyi` en `borg-cr-10-1tju1k1`
- **FITT → meetinstrument:** `contextus` van `fitt-5cftwyg` → `6mwt-3oaasii`, `iswt-o7nxght`, `borg-cr-10-7mjowlc`
- **GOLD-klinimetrie → instrumenten:** `contextus` van `gold-klinimetrie-esyy74n` → `ccq-68j351u`, `cat-tv44uin`, `mmrc-8eu1fyi`, `6mwt-3oaasii`, `iswt-o7nxght`
- **Casus-sequens reparatie:** `sequens` van `casus-ez-diag-004a` → `casus-ez-diag-004b` (anamnese → onderzoek, ontbreekt nu)

## Exclusies
- Geen farmacotherapie, inhalatietechniek-details (buiten fysio-scope, wel mogen benoemen als "verwijs terug naar arts/longverpleegkundige")
- Geen herhaling van algemene spirometrie-uitleg (zit al in GOLD-node)
- Geen nieuwe klinimetrie-nodes voor instrumenten die al bestaan — wél mogen ze via `contextus` worden gekoppeld aan nieuwe kennis-nodes

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
