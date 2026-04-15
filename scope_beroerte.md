# Scope-checklist — KNGF-richtlijn Beroerte (2014, update klinimetrie 2017)

Bron-id: **`rl-ber`** (BESTAAT AL — uitbreiden, niet opnieuw aanmaken)
Aparte bron: `rl-cva` (Stroke Unit behandelprotocol 2024 — níet verwarren,
met rust laten)
Specialisme-tag: `cna`
PDF: `beroerte-praktijkrichtlijn.pdf` (76 pagina's)

## Status van `rl-ber` — update nodig

Huidige `rl-ber` heeft alleen `scope` + `kernaanbevelingen`.
**Kritiek:** huidige `kernaanbevelingen` bevat "Vroege mobilisatie <24u bij
stabiele patiënten" — dit is **vervallen per 2020** (Bernhardt et al.,
Neurology 2020). De richtlijn-PDF bevat deze correctie expliciet op p1, p3,
p25, p54, p55 als rode annotatiebox.

### Update `rl-ber` via `updates`:
- `scope` — uitbreiden met fasenstructuur (H)AR/VR/LR/RC + ICF-kader
- `doelen` — toevoegen (uit A.2, p1)
- `indicaties` — toevoegen (uit A.3, A.6)
- `contraindicaties` — toevoegen (TIA, SAB buiten scope; B.4 rode vlaggen)
- `kernaanbevelingen` — **volledig herschrijven**, inclusief:
  - Stroke service / interdisciplinair team (niveau 1, B.1)
  - Intensiteit oefentherapie — meer uren = sneller herstel (niveau 1, B.2)
  - Taak- en contextspecificiteit (niveau 1, B.3)
  - NDT/Bobath géén meerwaarde (niveau 1, B.4) — don't
  - **Vroege mobilisatie <24u is VERVALLEN** (2020 update) — niet meer
    als eerste punt noemen
  - Systematisch meten met aanbevolen set (8 instrumenten)
  - Prognose 6 mnd stellen binnen eerste week (tabel 7)
  - Cognitieve revalidatie aandacht/geheugen/neglect
  - Valpreventie screenen, secundaire preventie leefstijlprogramma

## Context: al aanwezig in graaf — NIET dupliceren

### Generieke CNA-kennis (bron: `reader-cna`, HU-Reader)
Nieuwe CVA-nodes mogen via `nexus` linken, niet dupliceren:
- `reader-cna`, `cna-classificatie`, `cna-wat-hoe-waarom`, `cna-rps-model`,
  `cna-cla`, `cna-observatie`, `cna-vier-ssen`, `cna-tabel2`,
  `cna-hypertonie`, `cna-hierarchisch-model`, `cna-behandelstructuur`,
  `cna-motorisch-leren`, `cna-cortex`, `cna-basale-kernen`, `cna-cerebellum`,
  `cna-ruggenmerg`, `cna-spierkracht`, `cna-sensibiliteit`, `cna-balans`,
  `cna-sturing`, `cna-cognitief`

### Meetinstrumenten — AL AANWEZIG (patches via `updates`, geen nieuwe node)
Van de 8 aanbevolen + 23 optionele instrumenten uit tabel 4-5 bestaan al:

| Richtlijn | Bestaand id | Status |
|---|---|---|
| **Aanbevolen** | | |
| MI (Motricity Index) | `mi-f8eknl6` | bestaat, CVA-specifiek ✓ |
| TCT (Trunk Control Test) | `tct-ihqr0ru` | bestaat, CVA-specifiek ✓ |
| BBS (Berg Balance Scale) | `bbs-rw9okgz` | bestaat |
| FAC | `fac-rk6w94j` | bestaat |
| 10MLT (comfortabel + max) | `10mwt-btf63p5` | bestaat |
| FAT (Frenchay Arm Test) | `fat-0hh90n3` | bestaat |
| BI (Barthel Index) | `bi-jfriih3` | bestaat |
| FMA — volledig (boven + onder) | — | **alleen `fma-vingerextensie-vtwclpn` bestaat als losse item-node**; nieuwe overkoepelende FMA-nodes aanmaken |
| **Optioneel** | | |
| 6MWT | `6mwt-3oaasii` | bestaat |
| TUG | `tug-ej2xkyw` | bestaat |
| TIS (Trunk Impairment Scale) | `tis-2c50htt` | bestaat |
| NEADL | `neadl-i96unqd` | bestaat |
| MAS (Modified Ashworth) | `prpm-pm1jjm9` | bestaat |
| EmNSA (Nottingham Sensory) | `emnsa-dvq9gpv` | bestaat |
| NIHSS | `nihss-9texb5h` | bestaat |
| CIRS | `cirs` | bestaat |
| NPRS → NRS | `nrs-a2j2dqx` | bestaat (NPRS = NRS) |
| HADS | `hads-3sykkqp` | bestaat |

**Updates op deze instrumenten:** alleen als de richtlijn iets toevoegt
wat nog niet in de node staat. Kandidaten voor patch:
- `bbs-rw9okgz` — CVA-specifieke afnamemomenten uit tabel 4/5
- `fac-rk6w94j` — drempel FAC≥3 voor 10MLT-maximaal/6MWT
- `10mwt-btf63p5` — MCID 0,16 m/s chronische fase
- `bi-jfriih3` — dag 5 prognostisch, MCID 2 pnt chronisch
- `fat-0hh90n3` — CVA-afnamemomenten
- `6mwt-3oaasii`, `tug-ej2xkyw` — FAC≥3 drempel
- `nrs-a2j2dqx` — CVA-context implicatie (NPRS = NRS in richtlijn)
- `hads-3sykkqp` — CVA-context: afname vanaf 7 dagen na CVA
- `emnsa-dvq9gpv`, `tis-2c50htt`, `neadl-i96unqd`, `prpm-pm1jjm9`,
  `nihss-9texb5h`, `cirs` — alleen als afnamemoment-/cut-off-aanvullingen
  specifiek in richtlijn staan

### Nog ontbrekend — nieuwe `instrument`-nodes
- **FMA-bovenste extremiteit** (losstaand van het vingerextensie-item)
- **FMA-onderste extremiteit**
- **ARAT** (Action Research Arm Test) — MCID 6 pnt, halfjaarlijks RC-fase
- **NHPT** (Nine Hole Peg Test)
- **SSQOL** (Stroke-Specific Quality Of Life) — RC-fase
- **NNM** (goniometer Neutrale-0-Methode) — ROM
- **FES** (Falls-Efficacy Scale) — self-efficacy balans
- **FSS** (Fatigue Severity Scale)
- **MoCA** (Montreal Cognitive Assessment) — cognitieve signalering
- **O-LCT** (O-Letter Cancellation Test) — neglect
- **mRS** (Modified Rankin Scale)
- **CSI** (Caregiver Strain Index)

## Gewenste nieuwe kennis-nodes (Deel A-H)

### Deel A (intro/tijdsbeloop)
1. **CVA-definitie + ischemisch/bloedig** (A.1-A.2, p1-2)
2. **Tijdsbeloop fasen (H)AR/VR/LR/RC + figuur 1** (A.8.2, p3)
3. **Fysiotherapeutisch handelen in 8 stappen** (A.8.3, tabel 1, p3)

### Deel B (algemene principes)
4. **Stroke service & interdisciplinair team** (B.1, p8-11)
5. **Intensiteit van oefentherapie** (B.2, p11)
6. **Taak- en contextspecificiteit** (B.3, p11-12)
7. **NDT/Bobath — géén meerwaarde** (B.4, p12) — expliciete don't
8. **Motorisch leren bij CVA** (B.5, p12-13) — `nexus` → `cna-motorisch-leren`
9. **Teleconsultatie/-revalidatie** (B.6, p13-14)
10. **Zelfmanagement** (B.7, p14)
11. **Secundaire preventie: leefstijlprogramma** (B.8, p14-15)
12. **Valpreventie** (B.9, p15)

### Deel C (diagnostisch proces)
13. **Aanbevolen vs. optionele meetinstrumenten — overzicht** (C.2, tabel 4-5, p16-19)
14. **Systematisch meten — meetmomenten** (C.2.3 + tabel 6, p20-21)

### Deel D (prognose)
15. **Prognose loopvaardigheid 6 mnd** (D.1.1, tabel 7, p22) — TCT + MI-been
16. **Prognose arm-handvaardigheid 6 mnd** (D.1.2, tabel 7, p22-23) —
    FMA-vingerextensie + MI-schouderabductie; 'learned non-use'
17. **Prognose basale ADL 6 mnd** (D.1.3, tabel 7, p23) — BI dag 5
18. **Prognose chronische fase + MCID's** (D.2, p23-24) — 10MLT 0,16 m/s,
    ARAT 6 pnt, BI 2 pnt; halfjaarlijks

### Deel E (premobilisatiefase)
19. **Premobilisatiefase** (E, p25) — duur, lighouding, decubitus/bronchopneumonie/
    DVT-preventie, **vroegmobilisatie <24u VERVALLEN (2020 update)**

### Deel F (mobilisatiefase)
20. **Interventies loopvaardigheid — aanbevolen (niveau 1)** (F.1 subset, p26-35)
21. **Interventies loopvaardigheid — niet effectief/onduidelijk** (F.1 rest + F.2, p28-38)
22. **Loophulpmiddelen & beenorthesen** (F.3, p38-39)
23. **Interventies arm-handvaardigheid — aanbevolen (niveau 1)** (F.4, p39-46)
24. **Interventies arm-handvaardigheid — niveau 2 / niet effectief** (F.5, p46-47)
25. **ADL + dyspraxie-training** (F.6, p47-48)

### Deel G (cognitieve revalidatie)
26. **Cognitieve revalidatie — aandacht/geheugen/neglect** (G.1-G.3, p48-51)
27. **Cognitie en aerobe training** (G.4, p51) — dosering HRmax 40-70%,
    Borg 11-14, 3×/wk, 30-60 min

### Deel H (afsluiting)
28. **Rapportage, verslaglegging en afsluiting** (H, p51)

## Casuïstiek
29. `casus-cna-bro-005a` — CVA anamnese VR-fase (intake Bijlage 2)
30. `casus-cna-bro-005b` — CVA onderzoek + interventiekeuze VR-fase
    (meetmomenten, prognose-tabel 7, keuze aanbevolen interventies)
