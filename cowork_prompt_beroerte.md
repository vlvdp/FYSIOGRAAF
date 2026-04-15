# Cowork-prompt — extractie KNGF-richtlijn Beroerte (2014, klinimetrie update 2017)

> Plak alles onder de horizontale lijn hieronder in Claude Cowork / claude.ai
> en voeg de PDF `beroerte-praktijkrichtlijn.pdf` als bijlage toe.
> Cowork heeft GEEN zicht op `seed.js`. De inventaris hieronder is je enige
> referentie naar wat al bestaat.

---

# Taak

Je bouwt nodes voor een kennisgraaf voor Nederlandse fysiotherapeuten
("FYSIOGRAAF"). Brondocument: **KNGF-richtlijn Beroerte — Praktijkrichtlijn,
V-12/2014, update klinimetrie 2017** (76 pagina's).
Bron-id in de graaf: **`rl-ber`** (bestaat al als stub; jouw taak is o.a. hem
aanvullen via `updates`, níet opnieuw aanmaken).

Let op: er bestaat een **aparte** bron `rl-cva` = Behandelprotocol
Fysiotherapie na CVA — Stroke Unit (KNGF/NVZF, 2024). Dat is een ander
document. Raak `rl-cva` niet aan.

Er bestaat ook een onafhankelijke body aan **generieke CNA-kennis** in de
graaf afkomstig uit de HU-Reader CNA (bron `reader-cna`). Die gaat over
modellen (WAT-HOE-WAAROM, RPS, CLA, Vier S'en, hiërarchisch model,
laesielocaties). Jouw extractie uit deze richtlijn gaat over **CVA-specifieke**
praktijk: fasen, prognose, meetinstrumenten, evidence-based interventies.
Overlap is normaal — maak `nexus`-edges waar concepten elkaar raken, maar
dupliceer geen content.

Bij elk inhoudelijk statement geef je de **paginabron** mee (zie §3).

---

# 1. Datamodel

Top-level output:

```json
{
  "bron": { "id": "rl-ber", "pdfPages": 76, "accessDate": "2026-04-15" },
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
| `bronnen` | `scope`, `doelen`, `indicaties`, `contraindicaties`, `kernaanbevelingen` | richtlijn zelf (`rl-ber` — alleen via `updates`) |

- `afk` = korte codenaam (bv. "BBS", "FAC", "VR-fase").
- `title` = volledige naam.
- `id` = kebab-case met korte random suffix (bv. `-x4k2`). Prefixes:
  - kennis CVA-fasen/zorg/interventies: `bro-` (bv. `bro-intensiteit-q1a2`)
  - kennis prognose: `bro-prog-` (bv. `bro-prog-loop-z7y8`)
  - nieuwe instrumenten: afkorting + `-bro` + random (bv. `arat-bro-a1b2`)
  - casussen: `casus-cna-bro-005a/005b`
  - **Gebruik GEEN id dat in §2 staat**. Als jouw node een bestaand item is,
    zet hem in `updates`, niet in `new_nodes`.

HTML in veldwaarden is toegestaan en aangemoedigd: `<b>`, `<br>`, `<em>`,
`<ul><li>`, `<table>`, HTML-entities (`&lt;`, `&gt;`).

## Edges (`links` top-level)

```json
{ "from": "id-A", "to": "id-B", "rel": "usus" }
```

| rel | betekenis | typische from→to |
|---|---|---|
| `usus` | "wordt gebruikt" | bron → node, casus → instrument |
| `nexus` | "inhoudelijk verband met" | kennis ↔ kennis, casus → kennis |
| `sequens` | "volgt op" (keten) | casus → casus |
| `contextus` | "toepassingscontext voor" | kennis → instrument |

**Verplicht:**
- Elke nieuwe node krijgt `rl-ber usus→ <node-id>`.
- Bij `updates` op bestaande instrumenten waar nog geen `rl-ber usus→` edge
  bestaat: voeg deze toe via `links`.
- Waar een CVA-fase gekoppeld is aan een interventie/meetinstrument: leg
  `contextus`-edges van fase-kennis naar instrument/interventie.
- Waar jouw nieuwe node conceptueel overlapt met een bestaande CNA-node
  (zie §2), leg een `nexus`-edge
  (bv. `bro-motorisch-leren-<suf> nexus→ cna-motorisch-leren`).

## Tags

Alle nieuwe nodes krijgen tag `cna`. Formaat: `{"object": "<id>", "tag": "cna"}`.

---

# 2. Inventaris — bestaande nodes

## 2.1. Bron `rl-ber` — aanvullen via `updates`

De bron bestaat als stub. Huidige velden (vereenvoudigd):
- `afk`: "Beroerte (CVA)"
- `title`: "KNGF-richtlijn Beroerte — 2014, klinimetrie update 2017"
- `scope`: kort — moet uitgebreid
- `kernaanbevelingen`: BEVAT VEROUDERDE CLAIM "Vroege mobilisatie <24u bij
  stabiele patiënten" — deze moet WEGGEHAALD (zie 2020-update Bernhardt
  et al., rode annotatiebox p1/p3/p25/p54/p55 in PDF)

**Update opdracht voor `rl-ber`** (via `updates` met id `rl-ber`):
- `scope` — herschrijven: CVA-doelgroep, (H)AR/VR/LR/RC-fasen, ICF-kader,
  wat wel/niet onder scope valt (TIA, SAB buiten scope, A.1-A.3, A.6, A.8)
- `doelen` — nieuw veld: kwaliteit/transparantie/uniformiteit fysio CVA (A.2 p1)
- `indicaties` — nieuw veld: wanneer fysiotherapie bij CVA geïndiceerd is
  (A.3, A.6)
- `contraindicaties` — nieuw veld: TIA, SAB, rode vlaggen/verwijzing (A.1, B.4)
- `kernaanbevelingen` — **volledig vervangen** met 6-10 top-aanbevelingen:
  - Stroke service / interdisciplinair team (niveau 1, B.1)
  - Intensiteit: meer uren oefenen = sneller herstel (niveau 1, B.2)
  - Taak- en contextspecifiek trainen (niveau 1, B.3)
  - **NDT/Bobath géén meerwaarde** (niveau 1, B.4) — expliciete don't
  - Systematisch meten met aanbevolen set (8 instrumenten), tabel 4-6
  - Prognose 6 mnd binnen eerste week stellen (tabel 7)
  - Cognitieve revalidatie voor aandacht/geheugen/neglect (G)
  - Valpreventiescreening + secundaire preventie leefstijl (B.8-B.9)
  - **⚠ 2020-update:** vroegmobilisatie <24u is VERVALLEN (Bernhardt 2020)
    — neem dit expliciet op in `kernaanbevelingen` als correctie

## 2.2. Bron `rl-cva` — NIET AANRAKEN
`rl-cva` = Behandelprotocol Stroke Unit 2024. Aparte bron.

## 2.3. Generieke CNA-kennis (bron: `reader-cna`) — niet dupliceren
Link via `nexus`, niet als nieuwe node opnieuw aanmaken:
`reader-cna`, `cna-classificatie`, `cna-wat-hoe-waarom`, `cna-rps-model`,
`cna-cla`, `cna-observatie`, `cna-vier-ssen`, `cna-tabel2`, `cna-hypertonie`,
`cna-hierarchisch-model`, `cna-behandelstructuur`, `cna-motorisch-leren`,
`cna-cortex`, `cna-basale-kernen`, `cna-cerebellum`, `cna-ruggenmerg`,
`cna-spierkracht`, `cna-sensibiliteit`, `cna-balans`, `cna-sturing`,
`cna-cognitief`

## 2.4. Meetinstrumenten die AL BESTAAN (patches via `updates`)

Onderstaande instrumenten bestaan al in de graaf. Maak **geen** nieuwe nodes.
Wel toegestaan: patch `scoringscriteria` / `normwaarden` / `implicatie` als
de richtlijn specifieke CVA-afkappunten, MCID's of afnamemomenten noemt die
nog ontbreken. En zorg dat `rl-ber usus→ <id>` edge bestaat.

**Aanbevolen instrumenten (tabel 4):**
| Richtlijn | Bestaand id | Aandachtspunt voor patch |
|---|---|---|
| MI (Motricity Index) | `mi-f8eknl6` | bestaat CVA-specifiek; schouderabductie als prognostisch arm-item expliciteren |
| TCT (Trunk Control Test) | `tct-ihqr0ru` | bestaat CVA-specifiek; zitbalans-item prognostisch voor loopvaardigheid |
| BBS (Berg Balance Scale) | `bbs-rw9okgz` | afnamemomenten per fase (H)AR/VR/LR/RC |
| FAC | `fac-rk6w94j` | drempel **FAC ≥ 3** schakelt 10MLT-maximaal en 6MWT aan |
| 10MLT (comfortabel + max) | `10mwt-btf63p5` | MCID 0,16 m/s chronische fase |
| FAT (Frenchay Arm Test) | `fat-0hh90n3` | afnamemoment aanbevolen: elke fase |
| BI (Barthel Index) | `bi-jfriih3` | BI dag 5 prognostisch; MCID 2 pnt chronisch |

**Optionele instrumenten (tabel 5):**
| Richtlijn | Bestaand id | Aandachtspunt |
|---|---|---|
| 6MWT | `6mwt-3oaasii` | combineer met Borg RPE; FAC ≥ 3 |
| TUG | `tug-ej2xkyw` | FAC ≥ 3 |
| TIS (Trunk Impairment Scale) | `tis-2c50htt` | zitbalans, optioneel |
| NEADL | `neadl-i96unqd` | bijzondere ADL, RC-fase |
| MAS (Modified Ashworth) | `prpm-pm1jjm9` | spiertonus; ID lijkt cryptisch — dit is de juiste |
| EmNSA | `emnsa-dvq9gpv` | somatosensoriek |
| NIHSS | `nihss-9texb5h` | overname medisch dossier |
| CIRS | `cirs` | multimorbiditeit |
| NPRS (= NRS in richtlijn) | `nrs-a2j2dqx` | implicatie: CVA-context |
| HADS | `hads-3sykkqp` | afname vanaf 7 dagen na CVA (signalering) |

## 2.5. Meetinstrumenten die NIEUW zijn (maak als `new_nodes`)

- **FMA-bovenste extremiteit** — volledige FMA boven (LET OP: er bestaat
  alleen `fma-vingerextensie-vtwclpn` — losstaand item. Maak een nieuwe
  node voor de volledige FMA-boven, leg `nexus` naar het item)
- **FMA-onderste extremiteit** — volledige FMA been
- **ARAT** (Action Research Arm Test) — MCID 6 pnt, halfjaarlijks RC-fase
- **NHPT** (Nine Hole Peg Test)
- **SSQOL** (Stroke-Specific QoL) — RC-fase
- **NNM** (goniometer Neutrale-0-Methode) — ROM
- **FES** (Falls-Efficacy Scale) — self-efficacy balans
- **FSS** (Fatigue Severity Scale)
- **MoCA** (Montreal Cognitive Assessment) — signalering cognitie
- **O-LCT** (O-Letter Cancellation Test) — neglect
- **mRS** (Modified Rankin Scale)
- **CSI** (Caregiver Strain Index)

---

# 3. Bronvermeldingsformaat — per claim

Naast de edge `rl-ber usus→ node` willen we dat **elke inhoudelijke uitspraak
in een veldwaarde** een paginaverwijzing draagt. Inline HTML:

```html
Bij een FAC ≥ 3 wordt de 10MLT met maximale snelheid afgenomen.<sup data-src="rl-ber" data-p="17">[p17]</sup>
```

- `data-src` = altijd `rl-ber`
- `data-p` = paginanummer zoals afgedrukt in de PDF-voet (KNGF-pagina, niet
  de PDF-viewerindex). Bereik: `data-p="17-19"`, zichtbaar `[p17–19]`.
- Plaats de `<sup>` direct ná de zin of claim.
- Meerdere bronnen per zin: meerdere `<sup>` achter elkaar.

**Granulariteit:** per statement. Niet elke implicatie hoeft een citatie als
de hele paragraaf één pagina-bron heeft — één aan het einde volstaat.

**Wel citeren:** cut-offs/MCID's (0,16 m/s; ARAT 6 pnt; BI 2 pnt; BI dag 5;
FAC≥3; FMA-vingerextensie; 30-60 min 3×/wk aerobe; Borg 11-14; HRmax 40-70%),
prognose-determinanten, aanbevelingsniveau (1/2/3/4), effectrichting
(✓/=/× bij interventies), fase-duur, **2020-vroegmobilisatie-correctie**.

**Niet citeren:** pure structuur, jouw eigen `implicatie`-zin, algemene kennis.

---

# 4. Extractiescope

## 4.1. `rl-ber` (via `updates`) — zie §2.1

## 4.2. Kennis — nieuw aan te maken

| # | Onderwerp | Bron in PDF |
|---|---|---|
| K1 | CVA-definitie + ischemisch/bloedig | A.1-A.2, p1-2 |
| K2 | Tijdsbeloop fasen (H)AR/VR/LR/RC + figuur 1 | A.8.2, p3 |
| K3 | Fysiotherapeutisch handelen 8 stappen | A.8.3 + tabel 1, p3 |
| K4 | Stroke service & interdisciplinair team | B.1, p8-11 |
| K5 | Intensiteit van oefentherapie | B.2, p11 |
| K6 | Taak- en contextspecificiteit | B.3, p11-12 |
| K7 | NDT/Bobath — geen meerwaarde (niveau 1) | B.4, p12 |
| K8 | Motorisch leren CVA-specifiek (→ `nexus` cna-motorisch-leren) | B.5, p12-13 |
| K9 | Teleconsultatie/-revalidatie | B.6, p13-14 |
| K10 | Zelfmanagement | B.7, p14 |
| K11 | Secundaire preventie: leefstijlprogramma | B.8, p14-15 |
| K12 | Valpreventie | B.9, p15 |
| K13 | Aanbevolen vs. optionele meetinstrumenten (overzicht) | C.2.1-C.2.2, tabel 4-5, p16-19 |
| K14 | Systematisch meten + meetmomenten | C.2.3 + tabel 6, p20-21 |
| K15 | Prognose loopvaardigheid 6 mnd (TCT + MI-been) | D.1.1 + tabel 7, p22 |
| K16 | Prognose arm-hand 6 mnd + 'learned non-use' | D.1.2 + tabel 7, p22-23 |
| K17 | Prognose basale ADL 6 mnd (BI dag 5) | D.1.3 + tabel 7, p23 |
| K18 | Prognose chronische fase + MCID's | D.2, p23-24 |
| K19 | Premobilisatiefase + **2020-waarschuwing** | E, p25 |
| K20 | Loop-interventies — aanbevolen (niveau 1) | F.1 subset, p26-35 |
| K21 | Loop-interventies — niet effectief/onduidelijk | F.1 rest + F.2, p28-38 |
| K22 | Loophulpmiddelen & beenorthesen | F.3, p38-39 |
| K23 | Arm-hand interventies — aanbevolen (niveau 1) | F.4, p39-46 |
| K24 | Arm-hand — niveau 2 / niet effectief | F.5, p46-47 |
| K25 | ADL + dyspraxie-training | F.6, p47-48 |
| K26 | Cognitieve revalidatie aandacht/geheugen/neglect | G.1-G.3, p48-51 |
| K27 | Cognitie en aerobe training + dosering | G.4, p51 |
| K28 | Rapportage, verslaglegging, afsluiting | H, p51 |

**Tips:**
- `kern` (1-2 zinnen) + `toelichting` (HTML-rijk: tabellen voor dosering,
  niveau, fase-bolletjes) + `implicatie` (wat doe je maandag).
- Bij interventie-nodes (K20, K21, K23, K24, K25, K26): compacte tabel met
  Interventie | Effect | Niveau | Fase | Aanbeveling (doen/niet doen).
- Bij K5, K8, K27 expliciet dosering: 3×/wk, 30-60 min, HRmax 40-70%,
  HRR 40-70%, VO₂max 40-70%, Borg 11-14.

## 4.3. Instrumenten

- **Bestaande**: zie §2.4. Alleen `updates` als de richtlijn nieuwe
  CVA-specifieke info toevoegt (afnamemomenten, cut-offs, MCID's).
  Zorg dat `rl-ber usus→ <id>` edge bestaat.
- **Nieuwe**: zie §2.5. 12 nodes. Per instrument: ICF-categorie,
  fase waarin aanbevolen (tabel 4-5), afnamemoment (tabel 6).

## 4.4. Casuïstiek

- **`casus-cna-bro-005a`** — Anamnese CVA (VR-fase, prototype patiënt uit
  Bijlage 2 intakeformulier). Hulpvraag, ICF, rode vlaggen, cognitieve/
  emotionele signalen, mantelzorger.
- **`casus-cna-bro-005b`** — Onderzoek + interventiekeuze (VR-fase).
  Meetmomenten <48u en dag 5, prognose 6 mnd via tabel 7, 2-3 aanbevolen
  loopinterventies + 2-3 aanbevolen armtherapie.
- Edge `casus-cna-bro-005a sequens→ casus-cna-bro-005b`.
- Elke casus: `usus` → gebruikte instrumenten; `nexus` → relevante
  kennis-nodes (K15-K17, K20, K23).

---

# 5. Output-instructies

- Lever **één JSON-blok** volgens het top-level schema in §1.
- JSON valide (geen trailing commas, geen commentaren).
- Gebruik de exacte veldnamen per type (§1). Geen extra velden.
- **Bij `updates`:** alléén gewijzigde velden. Voor `rl-ber` bevat de patch
  volledige vervangingsteksten voor `scope`, `doelen`, `indicaties`,
  `contraindicaties`, `kernaanbevelingen`. Voor instrumenten: alleen de
  daadwerkelijk aangepaste velden.
- **`audit_notes`** (Nederlands):
  - Welke onderwerpen bleken lastig af te bakenen (overlap reader-cna)?
  - Conflicterende evidence (niveau 1 én 2 voor dezelfde interventie)?
  - Is de 2020-update over vroegmobilisatie consequent verwerkt in
    `rl-ber.kernaanbevelingen` én K19?
  - Welke bestaande instrumenten heb je NIET gepatcht omdat de huidige
    content al voldoende was?
  - Gaten in richtlijn / granulariteitskwesties (overzichtsnode vs. losse)?

---

# 6. Schrijfstijl

- Nederlands, vakterminologie zoals in de richtlijn.
- `kern` = 1-2 zinnen essentie.
- `toelichting` = body, HTML-rijk (tabellen voor meetmoment, prognose-
  determinanten, interventie-effectniveau).
- `implicatie` = wat dit maandag in de spreekkamer betekent. Concreet,
  actiegericht.
- Geen emoji's, geen marketingtaal.
- Effectniveau: symbolen uit Bijlage 1 — niveau (1/2/3/4), effect
  (✓ gunstig, × ongunstig, = onduidelijk).

---

# 7. Levering

Plak de volledige JSON in één codeblok. `audit_notes` zit in de JSON.
Begin nu. Lees de PDF volledig — inclusief Bijlage 1 (samenvattende
aanbevelingen p52-64) en Bijlage 2 (intakeformulier p65). Let expliciet
op de rode annotatieboxen over vroegmobilisatie (p1/p3/p25/p54/p55).
