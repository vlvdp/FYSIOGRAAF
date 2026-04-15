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
