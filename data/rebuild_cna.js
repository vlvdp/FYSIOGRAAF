/**
 * rebuild_cna.js — Volledige rebuild van alle CNA kennis-nodes
 * Bron: Reader Centraal Neurologische Aandoeningen (Houwink & Janssen, HU 2023-2024)
 *
 * Run: node data/rebuild_cna.js
 */

const fs  = require('fs');
const vm  = require('vm');
const path = require('path');

// ── Laden ─────────────────────────────────────────────────────────────────────
const seedPath = path.join(__dirname, 'seed.js');
const src  = fs.readFileSync(seedPath, 'utf8');
const ctx  = { window: {} };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const data = ctx.window.SEED_DATA;

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Node-definities ───────────────────────────────────────────────────────────

const NODES = [

  // ── Diagnostisch proces ──────────────────────────────────────────────────

  {
    id:    'cna-classificatie',
    afk:   'CNA-classificatie',
    title: 'NAH-indeling — degeneratief, niet-degeneratief, fase',
    content: `<p class="mb-2">NAH wordt ingedeeld naar type en fase. Dit bepaalt direct of behandeldoelen gericht zijn op herstel of compensatie.</p>
<table class="table table-sm">
<thead><tr><th>Type</th><th>Voorbeelden</th><th>Herstel</th><th>Behandelstrategie</th></tr></thead>
<tbody>
<tr><td><b>Degeneratief</b></td><td>Parkinson · Huntington · MS · Dementie</td><td>Geen langetermijnherstel</td><td>Vroeg compensatiestrategieën aanleren; optimaliseren en behouden</td></tr>
<tr><td><b>Niet-degeneratief — acuut</b></td><td>CVA · Traumatisch hersenletsel</td><td>Herstel mogelijk</td><td>Herstelgericht + tijdelijke compensatie</td></tr>
<tr><td><b>Niet-degeneratief — chronisch</b></td><td>CVA chronisch · Incomplete ruggenmerglaesie</td><td>Beperkt herstel</td><td>Compensatiestrategie centraal; optimaliseren huidig niveau</td></tr>
</tbody>
</table>`,
    implicatie: 'Stel altijd als eerste vast: degeneratief of niet-degeneratief? Acuut of chronisch? Dit bepaalt of behandeldoelen op herstel of compensatie gericht zijn en hoe ambitieus de langetermijndoelen worden gesteld.',
  },

  {
    id:    'cna-wat-hoe-waarom',
    afk:   'WAT–HOE–WAAROM',
    title: 'WAT – HOE – WAAROM — diagnostisch kader CNA',
    content: `<p class="mb-2">Drie structurerende vragen voor het diagnostisch proces bij elke CNA-patiënt. Leidend van anamnese tot hypothesetoetsing.</p>
<table class="table table-sm">
<thead><tr><th>Vraag</th><th>Doel</th><th>Aanpak</th><th>Klinimetrie</th></tr></thead>
<tbody>
<tr><td><b>WAT</b></td><td>Hulpvraag specificeren</td><td>Constraints in kaart brengen: persoon × taak × omgeving (CLA)</td><td>PSK · PSG</td></tr>
<tr><td><b>HOE</b></td><td>Observatie problematische handeling</td><td>Observeer in meest authentieke context; structureer via Tabel 1 (Observatie)</td><td>Activiteitsspecifieke klinimetrie</td></tr>
<tr><td><b>WAAROM</b></td><td>Hypothesen formuleren en toetsen</td><td>Functiestoornis identificeren: Vier S'en, balans, hogere cognitieve functies</td><td>Klinimetrie per hypothese (Tabel 2)</td></tr>
</tbody>
</table>`,
    implicatie: 'WAT–HOE–WAAROM is de ruggengraat van elke CNA-sessie: van de eerste anamnese tot de nulmeting aan het begin van elke behandeling. De cyclus herhaalt zich continu en leidt altijd terug naar de hulpvraag.',
  },

  {
    id:    'cna-rps-model',
    afk:   'RPS-model',
    title: 'RPS-model — Rehabilitation Problem Solving',
    content: `<p class="mb-2">Schematisch model om alle diagnostische bevindingen te ordenen. Pijlen geven aan welke functiestoornis bijdraagt aan welke activiteitsbeperking — dit zijn de behandelbare parameters.</p>
<ol>
<li><b>Anamnese & hulpvraag</b> — WAT wil de patiënt? (PSK / PSG)</li>
<li><b>Observatie</b> — HOE voert de patiënt de activiteit uit?</li>
<li><b>Hypothesen</b> — WAAROM lukt het niet? (Vier S'en, balans, cognitie)</li>
<li><b>Onderzoeksplan uitvoeren</b> — klinimetrie per hypothese</li>
<li><b>Resultaten & verbanden</b> — RPS-schema invullen met pijlen: functie → activiteit → participatie</li>
<li><b>Fysiotherapeutische diagnose</b> — probleem, prognose, indicatie, SDM</li>
<li><b>Behandelplan → behandeling → evaluatie</b> → terug naar stap 1</li>
</ol>`,
    implicatie: 'Vul het RPS-schema volledig in voor elke patiënt. De pijlen bepalen de prioriteit van behandelbare parameters en koppelen de functiestoornis direct aan de hulpvraag.',
  },

  {
    id:    'cna-cla',
    afk:   'CLA',
    title: 'Constraints-Led Approach (Van Hooren et al., 2017)',
    content: `<p class="mb-2">Kader voor hulpvraagspecificatie én behandeluitdaging. De therapeut past constraints aan zodat de patiënt zelf de optimale motorische oplossing moet vinden.</p>
<table class="table table-sm">
<thead><tr><th>Constraint</th><th>Diagnostisch: welke constraints belemmeren?</th><th>Therapeutisch: welke constraint aanpassen?</th></tr></thead>
<tbody>
<tr><td><b>Persoon</b></td><td>CNA-gevolgen · algehele belastbaarheid · fitheid · motivatie · cognitie</td><td>Moeilijkheidsgraad afstemmen op draagkracht van die sessie</td></tr>
<tr><td><b>Taak</b></td><td>Statisch vs. dynamisch · welke onderdelen lukken? · snelheid / belasting</td><td>Object net buiten bereik zetten om balans uit te dagen; tempo variëren</td></tr>
<tr><td><b>Omgeving</b></td><td>Binnenshuis vs. buiten · meubilair · ondergrond · hulpmiddelen</td><td>Authentieke context nabootsen; strepen op de vloer als visuele cue</td></tr>
</tbody>
</table>`,
    implicatie: 'Therapeut = probleemaanbieder, patiënt = probleemoplosser. Gebruik de CLA zowel voor het specificeren van de hulpvraag als voor het ontwerpen van behandeluitdagingen.',
  },

  {
    id:    'cna-observatie',
    afk:   'Observatie CNA',
    title: 'Tabel 1 — Observatie problematische handeling',
    content: `<p class="mb-2">Gestructureerde driestappe observatie van de problematische activiteit in de meest authentieke context. Basis voor hypothesevorming (WAAROM).</p>
<table class="table table-sm">
<thead><tr><th>Stap</th><th>Inhoud</th></tr></thead>
<tbody>
<tr><td><b>1. Algemene kenmerken</b></td><td>Lukt het en is het veilig? · Met/zonder hulpmiddelen? · Wat valt het meeste op? · Welk deel verloopt het moeilijkste? · Tekenen van inspanning?</td></tr>
<tr><td><b>2. Bewegingsanalyse</b></td><td>Hoofd / romp / extremiteiten — start, midden, eindfase. Zwaartepunt & steunvlak. Bewegingsuitslag & snelheid. Grenzen opzoeken: wanneer lukt het (net) wel / niet meer?</td></tr>
<tr><td><b>3. Klinimetrie activiteit</b></td><td>Loopvaardigheid (10MLT, 6MWT, FAC, POMA-M, TUG, DGI) · balans (BBS, POMA-B, Mini-BESTest) · rompbalans (TCT, TIS) · transfers (M-PAS I, TUG, FTSTS) · bedmobiliteit (TCT, M-PAS III) · arm/hand (FAT) · ADL (BI, NEADL)</td></tr>
</tbody>
</table>`,
    implicatie: 'Observeer altijd in de meest authentieke context. Stap 1 → 2 → 3: van globaal naar specifiek. Klinimetriekeuze volgt uit het activiteitsdomein én de FAC-score van de patiënt.',
  },

  // ── Hypothesen: Vier S'en ──────────────────────────────────────────────────

  {
    id:    'cna-vier-ssen',
    afk:   "Vier S'en",
    title: "De Vier S'en — neurologische kernfuncties bij CNA",
    content: `<p class="mb-2">De vier neurologische functiedomeinen die bij CNA verstoord kunnen zijn. Vormen de basis voor hypothesevorming (WAAROM) en zijn onderling afhankelijk.</p>
<table class="table table-sm">
<thead><tr><th>Functie</th><th>Kern</th><th>Klinimetrie</th></tr></thead>
<tbody>
<tr><td><b>Spierkracht</b></td><td>Verlies door directe CNA-uitval (parese/paralyse) of indirect via inactiviteit. Alleen negatieve symptomen.</td><td>MRC · Microfet · MI</td></tr>
<tr><td><b>Spiertonus</b></td><td>Hypo- of hypertonie. Type hypertonie afhankelijk van laesielocatie: spasticiteit (cortex), rigiditeit (basale kernen), paratonie (dementie).</td><td>PRPM · MAS · PAI</td></tr>
<tr><td><b>Sturing</b></td><td>Cortex: selectiviteit (sturing + kracht + tonus samen). Cerebellum: coördinatie/ataxie. Basale kernen: hypokinesie, bradykinesie, akinesie.</td><td>FMA · MI · SARA · M-PAS</td></tr>
<tr><td><b>Sensibiliteit</b></td><td>Oppervlakkige en diepe sensibiliteit. Proprioceptie-uitval beïnvloedt balans en motorische sturing.</td><td>EmNSA · globaal (tast, pijn, proprioceptie)</td></tr>
</tbody>
</table>
<p class="mt-2 mb-0">De Vier S'en zijn <b>onderling afhankelijk</b>: spierkracht meten omvat altijd ook sturing en tonus. Onderzoek ze in samenhang en in de context van de hulpvraag.</p>`,
    implicatie: "Stel hypothesen op voor alle vier S'en na observatie. Onderzoek de functies die het meest bijdragen aan de activiteitsbeperking. Koppel bevindingen via het RPS-model aan de hulpvraag.",
  },

  {
    id:    'cna-tabel2',
    afk:   'Tabel 2 — Functiestoornissen',
    title: 'Neurologische functiestoornissen — Tabel 2, Reader CNA',
    content: `<p class="mb-2">Tabel 2 — Overzicht van alle neurologische functiestoornissen per functie, met onderscheid naar negatieve (min-) en positieve (plus-) symptomen en bijpassende klinimetrie.</p>
<table class="table table-sm">
<thead><tr><th>Functie</th><th>Negatief (hypo-/afwezig)</th><th>Positief (hyper-/dys-)</th><th>Klinimetrie</th></tr></thead>
<tbody>
<tr><td><b>Spierkracht</b></td><td>Parese (verminderd) · Paralyse (afwezig)</td><td>—</td><td>MRC · Microfet · MI</td></tr>
<tr><td><b>Spiertonus</b></td><td>Hypotonie · Atonie</td><td>Spasticiteit (cortex) · Rigiditeit (basale kernen) · Paratonie (dementie) · Dystonie · Clonus</td><td>PRPM · MAS (cortex) · PAI (dementie)</td></tr>
<tr><td><b>Sturing</b></td><td>Hypokinesie · Akinesie · Bradykinesie (bas. kernen) · Ataxie (cerebellum) · Synergieën (cortex) · Freezing · Festinatie*</td><td>Hyperkinesie · Dyskinesie · Chorea · Tremor (bas. kernen)</td><td>M-PAS · SARA · FMA · MI</td></tr>
<tr><td><b>Sensibiliteit</b></td><td>Hyp(o)esthesie · Hypoalgesie · Anesthesie · Analgesie</td><td>Hyperesthesie · Par(a)esthesie · Dysesthesie · Allodynie</td><td>EmNSA · globaal: tast, pijn, proprioceptie</td></tr>
</tbody>
</table>
<p class="mt-1 mb-0 small">* Festinatie/freezing: oorzaak niet eenduidig positief of negatief te duiden.</p>`,
    implicatie: 'Bepaal per symptoom: negatief (tekort/afwezig) of positief (overactief/disfunctioneel)? Negatieve symptomen vragen om andere behandeling dan positieve. Laesielocatie bepaalt welk type symptoom verwacht wordt.',
  },

  // ── Therapeutisch proces ──────────────────────────────────────────────────

  {
    id:    'cna-behandelstructuur',
    afk:   'Behandelstructuur',
    title: 'Behandelstructuur — nulmeting, kern, afsluiting (Fig. 3)',
    content: `<p class="mb-2">Elke CNA-behandelsessie bestaat uit drie vaste onderdelen (Fig. 3, Reader CNA). Dit waarborgt dat de hulpvraag centraal staat en de belastbaarheid bewaakt wordt.</p>
<table class="table table-sm">
<thead><tr><th>Onderdeel</th><th>Inhoud</th></tr></thead>
<tbody>
<tr><td><b>Nulmeting</b></td><td>Kort vraaggesprek + status praesens. Vaststellen welke subdoelen en parameters deze sessie aan bod komen (shared decision). Screening: zijn er afwijkingen van het verwachte beloop? Bij onverklaarbare achteruitgang → doorverwijzen naar arts.</td></tr>
<tr><td><b>Kern</b></td><td><b>Hulpvraag centraal</b> — oefenen van de functionele activiteit. Combineren met ondersteunende functies indien nodig. Adviezen en huiswerkoefeningen integreren zodat patiënt ze zelfstandig kan uitvoeren.</td></tr>
<tr><td><b>Afsluiting (nameting)</b></td><td>Evaluatie van de sessie. Terugkoppeling adviezen thuis. Koppeling aan behandeldoel: is het subdoel bereikt?</td></tr>
</tbody>
</table>`,
    implicatie: 'De nulmeting is geen formaliteit — het is het moment waarop de behandeling wordt afgestemd op de patiënt van vandaag. Beloop monitoren is screenend: onverwachte achteruitgang is een reden voor doorverwijzing.',
  },

  {
    id:    'cna-motorisch-leren',
    afk:   'ML-principes CNA',
    title: 'Motorisch leren bij CNA — taakspecificiteit en herhaling',
    content: `<p class="mb-2">Universele principes uit het motorisch leren, toegepast op patiënten met CNA. De neurale processen bij neuraal herstel zijn grotendeels gelijk aan die bij motorisch leren.</p>
<ul>
<li><b>Taakspecificiteit</b> — oefen functionele taken. Niet geïsoleerde kniestrekking maar opstaan uit de stoel; niet losse elleboogflexie maar de pan optillen.</li>
<li><b>Contextspecificiteit</b> — oefen bij voorkeur in de daadwerkelijke omgeving (thuis, buiten); anders zo goed mogelijk nagebootst.</li>
<li><b>Variatie</b> — varieer oefenvormen zodat de vaardigheid in verschillende contexten kan worden uitgevoerd.</li>
<li><b>Herhaling</b> — veel herhaling over meerdere sessies nodig voor retentie. Vele kortere oefenmomenten per dag (bijv. 6 × 5 min) zijn waarschijnlijk effectiever dan één lang moment (Krakauer, 2006).</li>
<li><b>Integratie in dagelijks leven</b> — adviezen en huiswerkoefeningen al tijdens de sessie integreren zodat de patiënt ze zelfstandig kan uitvoeren.</li>
</ul>`,
    implicatie: 'Motorisch leren en neuraal herstel maken gebruik van dezelfde neurale processen. Pas deze principes consequent toe — ook bij degeneratieve CNA of wanneer volledig herstel niet verwacht wordt.',
  },

  // ── Behandelprincipes per laesielocatie ───────────────────────────────────

  {
    id:    'cna-hierarchisch-model',
    afk:   'Hiërarchisch model',
    title: 'Hiërarchisch CZS-model — archi, paleo, neo',
    content: `<p class="mb-2">Het CZS wordt ingedeeld in drie hiërarchische niveaus. De locatie van de laesie op dit model bepaalt welke functies aangedaan zijn en welke compensatiemogelijkheden er bestaan.</p>
<table class="table table-sm">
<thead><tr><th>Niveau</th><th>Locatie</th><th>Functies</th><th>Bij laesie</th></tr></thead>
<tbody>
<tr><td><b>Archi</b></td><td>Ruggenmerg · hersenstam</td><td>Basisreflexen · evenwichtsreacties (hersenstam) · axiale motoriek</td><td>Motoriek en sensibiliteit gestoord op uitvoeringsniveau. Geen cognitieve problemen. Compensatie via neo/paleo niet mogelijk voor aangedane functies.</td></tr>
<tr><td><b>Paleo</b></td><td>Basale kernen · cerebellum</td><td>Automatische handelingen · emotionele motoriek · coördinatie</td><td>Automatisering gestoord. Bewuste compensatie via neo-niveau mogelijk (cognitieve strategie).</td></tr>
<tr><td><b>Neo</b></td><td>Cortex cerebri</td><td>Bewuste waarneming · willekeurige motoriek · hogere cognitie</td><td>Brede gevolgen: selectiviteit, cognitie, leren. Zowel expliciete als impliciete leerstrategieën inzetbaar.</td></tr>
</tbody>
</table>`,
    implicatie: 'De locatie van de laesie op het hiërarchisch model bepaalt welke functies zijn aangedaan én welke leerstrategieën haalbaar zijn. Zie Behandelprincipes per laesielocatie voor uitwerking per niveau.',
  },

  {
    id:    'cna-cortex',
    afk:   'Cortexlaesie',
    title: 'Behandelprincipes bij cortexlaesie — CVA, TBI',
    content: `<p class="mb-2">Schade in de cortex cerebri geeft problemen in bewuste waarneming, willekeurige motoriek en hogere cognitieve functies. Leerstrategieën moeten worden afgestemd op de aanwezige beperkingen.</p>
<table class="table table-sm">
<thead><tr><th>Aspect</th><th>Toelichting</th></tr></thead>
<tbody>
<tr><td><b>Gevolgen</b></td><td>Selectiviteit (sturing + kracht + tonus samen). Werkgeheugen- en communicatieproblemen (afasie). Moeite met dubbeltaken en verbale instructie <em>tijdens</em> uitvoering.</td></tr>
<tr><td><b>Leerstrategie</b></td><td>Expliciete én impliciete strategieën combineren. Impliciete aanpak: voordoen, faciliteren, hands-on begeleiden, omgeving inrichten, veel herhalen. Instructies geven <em>vóór</em> — niet tijdens — de activiteit.</td></tr>
<tr><td><b>Foutloos leren</b></td><td>Bij ernstige cognitieve beperking (dementie): alleen de juiste handeling inslijpen via herhaling zonder fouten (errorless learning). Geen verbale uitleg — voordoen en routine opbouwen.</td></tr>
</tbody>
</table>`,
    implicatie: 'Patiënten met een cortexlaesie kunnen expliciete instructies in rust begrijpen, maar niet altijd toepassen tijdens de activiteit. Geef instructies vóór het oefenen; gebruik daarna impliciete ondersteuning.',
  },

  {
    id:    'cna-basale-kernen',
    afk:   'Basale kernen',
    title: 'Behandelprincipes bij basale kernen — Parkinson, Huntington',
    content: `<p class="mb-2">Schade in de basale kernen geeft problemen in automatische handelingen en emotionele motoriek. De meeste aandoeningen zijn progressief — compensatie staat centraal.</p>
<table class="table table-sm">
<thead><tr><th>Aspect</th><th>Toelichting</th></tr></thead>
<tbody>
<tr><td><b>Gevolgen</b></td><td>Automatisering verstoord. Dubbeltaken problematisch. Bewegingen kleiner, trager, moeilijker te starten/stoppen (zie Sturing). Meeste aandoeningen progressief.</td></tr>
<tr><td><b>Cognitieve strategie</b></td><td>Bewust stap-voor-stap uitvoeren: patiënt leert elke stap van de handeling te bedenken en bewust uit te voeren. Stap-voor-stap aanleren zodat het zelfstandig ingezet kan worden.</td></tr>
<tr><td><b>Externe cues</b></td><td>Auditief (metronoom, klappen) · visueel (strepen op de vloer) · tactiel. Als startsignaal (aftellen) of ritmisch signaal tijdens beweging.</td></tr>
<tr><td><b>Vroege fase</b></td><td>Ook trainen op balans, kracht en dubbeltaken. Er zijn aanwijzingen dat dubbeltaaktraining positief effect kan hebben (De Freitas et al., 2020).</td></tr>
</tbody>
</table>`,
    implicatie: 'Externe cues omzeilen het defect in de basale kernen door een bewuste route te activeren via de cortex. Kies cues die passen bij de activiteit en de context van de patiënt — en controleer of ze in het dagelijks leven bruikbaar zijn.',
  },

  {
    id:    'cna-cerebellum',
    afk:   'Cerebellum',
    title: 'Behandelprincipes bij cerebellaire laesies — ataxie',
    content: `<p class="mb-2">Het cerebellum controleert en coördineert bewegingen op alle drie hiërarchische niveaus. Schade geeft ataxie. Er zijn geen specifieke leerstrategieën — focus ligt op optimaliseren en compenseren.</p>
<table class="table table-sm">
<thead><tr><th>Aspect</th><th>Toelichting</th></tr></thead>
<tbody>
<tr><td><b>Gevolgen</b></td><td>Ataxie: verstoorde coördinatie van evenwicht, axiale spieren en fijne motoriek. Coördinatie is niet overneembaar door andere hersengebieden.</td></tr>
<tr><td><b>Training</b></td><td>Intensieve coördinatietraining voor optimalisatie en behoud (Milne et al., 2017). Retentie is afhankelijk van continu trainen — stoppen leidt tot achteruitgang.</td></tr>
<tr><td><b>Compensatie</b></td><td>Vrijheidsgraden verminderen (gesloten keten, ondersteuning). Bredere gangbreedte of steunbasis bij lopen en staan.</td></tr>
</tbody>
</table>`,
    implicatie: 'Bij cerebellaire laesies geldt: intensief trainen werkt, maar de winst is niet duurzaam zonder voortgezette training. Betrek de patiënt actief bij het volhouden van een zelfstandig oefenprogramma.',
  },

  {
    id:    'cna-ruggenmerg',
    afk:   'Ruggenmerg',
    title: 'Behandelprincipes bij ruggenmergletsel',
    content: `<p class="mb-2">Ruggenmerglaesies geven uitval in motoriek en sensibiliteit, maar géén cognitieve problemen. Compensatie via hogere hersengebieden is niet mogelijk voor de aangedane functies.</p>
<table class="table table-sm">
<thead><tr><th>Aspect</th><th>Toelichting</th></tr></thead>
<tbody>
<tr><td><b>Gevolgen</b></td><td>Motorische uitval en sensibiliteitsstoornissen onder het laesiëniveau. Cognitie intact. Neo- en paleoniveau (hersenen) kunnen aangedane functies niet compenseren.</td></tr>
<tr><td><b>Acute onvolledige laesie</b></td><td>Herstel bevorderen door training. Neuroplasticiteit van het ruggenmerg benutten.</td></tr>
<tr><td><b>Chronisch of volledige laesie</b></td><td>Geen herstel te verwachten. Compensatiestrategieën aanleren: hulpmiddelen, rolstoel, transfers.</td></tr>
</tbody>
</table>`,
    implicatie: 'Onderscheid onvolledig (kans op herstel) van volledig (focus op compensatie) en acuut van chronisch. Dit bepaalt de behandeldoelen volledig.',
  },

  // ── Functies beïnvloeden ──────────────────────────────────────────────────

  {
    id:    'cna-spierkracht',
    afk:   'Spierkracht CNA',
    title: 'Spierkrachttraining bij CNA',
    content: `<p class="mb-2">Spierkrachtverlies bij CNA kan direct (parese/paralyse door CNA-uitval) of indirect (inactiviteit) ontstaan. Trainen is bij vrijwel alle patiënten geïndiceerd.</p>
<ul>
<li><b>Altijd optimaliseren of behouden</b> — ook bij degeneratieve CNA of zonder neurologisch herstel. Alleen bij ernstige paralyse: behoud, compensatie en monitoring.</li>
<li><b>Prikkelparameters</b> — gebruik algemene trainingsleerprincipes, aangepast aan CZS-mogelijkheden. Startpeil via nulmeting: kwaliteit van de beweging + ervaren belasting. Waarschijnlijk lagere belasting en minder herhalingen dan bij een gezond persoon.</li>
<li><b>Energiebudget bewaken</b> — progressief opbouwen; patiënt moet na de sessie nog voldoende energie hebben voor de rest van de dag.</li>
<li><b>Functioneel integreren</b> — oefeningen als deel van de taak. Niet geïsoleerde elleboogflexie maar de échte pan optillen (eerst leeg, daarna gevuld).</li>
</ul>`,
    implicatie: 'Spierkrachttraining is bij vrijwel alle CNA-patiënten geïndiceerd. Integreer training altijd in functionele taken. Monitor het energiebudget: een uitgeputte patiënt na de sessie is contraproductief.',
  },

  {
    id:    'cna-hypertonie',
    afk:   'Hypertonie CNA',
    title: 'Hypertonie bij CNA — Spasticiteit, Rigiditeit, Paratonie',
    content: `<p class="mb-2">Drie vormen van verhoogde spiertonus, elk met eigen laesielocatie, presentatie en behandelbaarheid. Hypertonie is over het algemeen moeilijk langdurig te beïnvloeden door fysiotherapie.</p>
<table class="table table-sm">
<thead><tr><th></th><th>Spasticiteit</th><th>Rigiditeit</th><th>Paratonie</th></tr></thead>
<tbody>
<tr><td><b>Locatie</b></td><td>Cortex / ruggenmerg</td><td>Basale kernen</td><td>Dementie</td></tr>
<tr><td><b>Patroon</b></td><td>Flexie arm · extensie been (antizwaartekracht)</td><td>Tandradfenomeen · loodpijpfenomeen · onafhankelijk van gewrichtsstand</td><td>Onbewuste weerstand bij passief bewegen · neemt toe bij snelle/passieve beweging</td></tr>
<tr><td><b>Kortdurend</b></td><td>Rustig uit het patroon bewegen + ontspanning. Begin proximaal (schouderprotractie) → distaal (elleboog → pols → vingers) vóór de activiteit.</td><td>Nauwelijks beïnvloedbaar door fysiotherapie. Probeer: ontspanningsoefeningen of cues + momentum (bijv. herhaalde romprotaties → benutten snelheid om te rollen).</td><td>Optimale lig-/zithouding instellen · langzaam en voorzichtig bewegen · pijn minimaliseren · til- en verplaatsingstechnieken instrueren aan verzorgenden.</td></tr>
<tr><td><b>Langdurend</b></td><td>Alleen medicatie effectief: botulinetoxine of shockwavetherapie (vergelijkbaar effect, Hsu et al., 2022).</td><td>Dopamine-substitutie (levodopa) heeft positief effect.</td><td>Contractuurpreventie: geassisteerde actieve en passieve oefentherapie (Hobbelen, 2010).</td></tr>
<tr><td><b>Klinimetrie</b></td><td>MAS · PRPM</td><td>PRPM</td><td>PAI</td></tr>
</tbody>
</table>`,
    implicatie: 'Bepaal eerst het type op basis van laesielocatie. Spasticiteit heeft een specifiek patroon en is kortdurend enigszins beïnvloedbaar; rigiditeit nauwelijks; paratonie vraagt om preventieve houding- en bewegingsbegeleiding.',
  },

  {
    id:    'cna-sensibiliteit',
    afk:   'Sensibiliteit CNA',
    title: 'Sensibiliteit bij CNA — stimuleren en compenseren',
    content: `<p class="mb-2">Het is onbekend of specifieke sensibiliteitstraining verlies bij CNA kan herstellen. Focus ligt op functioneel gebruik van resterende sensibiliteit en compensatie.</p>
<table class="table table-sm">
<thead><tr><th>Strategie</th><th>Aanpak</th></tr></thead>
<tbody>
<tr><td><b>Stimuleren</b></td><td>Sterkere prikkels: wrijven of kloppen op de spier, stampen met de voeten. Bewust aandacht richten op het lichaamsdeel. Doel: sensomotore kring activeren om herstelprocessen te bevorderen.</td></tr>
<tr><td><b>Compenseren</b></td><td>Patiënt leren visueel te compenseren: bewust kijken naar voetplaatsing vóór opstaan of lopen. Zintuigsubstitutie: zien vervangt voelen.</td></tr>
<tr><td><b>Klinimetrie</b></td><td>EmNSA (cortex) · globaal onderzoek: grove tast · fijne tast · pijn (scherp-dof) · proprioceptie</td></tr>
</tbody>
</table>`,
    implicatie: 'Er is geen bewijs dat specifieke sensibiliteitstraining het verlies herstelt. Richt behandeling op functioneel gebruik van resterende sensibiliteit en visuele compensatiestrategieën. Bewustwording van het lichaamsdeel is al een therapeutische stap.',
  },

  {
    id:    'cna-sturing',
    afk:   'Sturing CNA',
    title: 'Sturing bij CNA — selectiviteit, coördinatie, hypokinesie',
    content: `<p class="mb-2">Sturing is het vermogen om spieren willekeurig aan te sturen. De term en behandelbaarheid verschillen per laesielocatie. Bij een cortexlaesie is sturing onlosmakelijk verbonden met kracht en tonus (selectiviteit).</p>
<table class="table table-sm">
<thead><tr><th>Locatie</th><th>Term</th><th>Stoornissen</th><th>Behandelprincipe</th></tr></thead>
<tbody>
<tr><td><b>Cortex</b></td><td>Selectiviteit</td><td>Bewegingssynergieën: flexie arm / extensie been. Niet los te zien van kracht en tonus.</td><td>Acuut/herstel: gedissocieerde bewegingen trainen (buiten de synergie). Chronisch: synergie functioneel inzetten voor compensatie.</td></tr>
<tr><td><b>Cerebellum</b></td><td>Coördinatie / ataxie</td><td>Verstoorde coördinatie op alle niveaus. Niet overneembaar door andere hersengebieden.</td><td>Intensieve coördinatietraining (retentie afhankelijk van doorgaan). Compensatie: vrijheidsgraden verminderen, bredere steunbasis.</td></tr>
<tr><td><b>Basale kernen</b></td><td>Hypokinesie · Bradykinesie · Akinesie</td><td>Bewegingen kleiner, trager, moeilijker te starten/stoppen. Freezing · Festinatie.</td><td>Vroege fase: trainen op vaardigheden en functies. Lange termijn: cues, cognitieve strategie, bewust grote bewegingen maken.</td></tr>
</tbody>
</table>`,
    implicatie: 'Sturing en spierkracht zijn bij een cortexlaesie onlosmakelijk verbonden (selectiviteit). Train altijd in de context van de hulpvraag: een geïsoleerde beweging testen is anders dan dezelfde beweging in een functionele taak.',
  },

  {
    id:    'cna-balans',
    afk:   'Balans CNA',
    title: 'Balans bij CNA — systeem, progressie en veiligheid',
    content: `<p class="mb-2">Balanshandhaving is een voorwaarde voor vrijwel alle activiteiten. Balans kan verstoord raken in input, centrale verwerking of motorische output.</p>
<table class="table table-sm mb-2">
<thead><tr><th>Component</th><th>Mogelijke stoornis bij CNA</th></tr></thead>
<tbody>
<tr><td><b>Input</b></td><td>Visueel · somatosensorisch / proprioceptie · vestibulair</td></tr>
<tr><td><b>Verwerking</b></td><td>Cerebellum (controle) · hersenstam (uitvoering)</td></tr>
<tr><td><b>Output</b></td><td>Spierkracht + sturing voor correctieve motorische reacties</td></tr>
</tbody>
</table>
<p class="mb-1"><b>Progressie trainen — eenvoudig naar complex:</b></p>
<table class="table table-sm">
<thead><tr><th>Dimensie</th><th>Makkelijk</th><th>Moeilijk</th></tr></thead>
<tbody>
<tr><td>Type balans</td><td>Statisch</td><td>Pro-actief → reactief (extern verstoord)</td></tr>
<tr><td>Steunvlak</td><td>Breed · meerdere steunpunten</td><td>Verkleind · één steunpunt</td></tr>
<tr><td>Ondergrond</td><td>Stabiel (harde vloer)</td><td>Instabiel (mat, tol)</td></tr>
<tr><td>Aandacht</td><td>Geen afleiding</td><td>Afleiding of dual-task (motorisch/cognitief)</td></tr>
</tbody>
</table>`,
    implicatie: 'Veiligheid staat altijd voorop bij balanstraining. Koppel balansdoelen aan de activiteit uit de hulpvraag. Weeg af: staand aankleden kost veel energie — zittend aankleden is ook zelfstandig en veiliger (compensatie vs. training).',
  },

  {
    id:    'cna-cognitief',
    afk:   'Hogere cognitie CNA',
    title: 'Hogere cognitieve functies bij CNA',
    content: `<p class="mb-2">Bij lokale cortexschade kunnen specifieke cognitieve stoornissen ontstaan; bij gegeneraliseerd neuraal verlies (dementie) een algemene achteruitgang. De fysiotherapeut herkent deze stoornissen en past de behandeling erop aan.</p>
<table class="table table-sm">
<thead><tr><th>Stoornis</th><th>Omschrijving</th></tr></thead>
<tbody>
<tr><td><b>Afasie</b></td><td>Taalstoornis — begrijpen en/of produceren van taal verstoord</td></tr>
<tr><td><b>Neglect</b></td><td>Aandachtsstoornis — aangedane lichaamszijde of ruimtelijke kant wordt genegeerd</td></tr>
<tr><td><b>Apraxie</b></td><td>Stoornis in willekeurig handelen — handeling lukt niet terwijl motoriek en begrip intact zijn</td></tr>
<tr><td><b>Executief disfunctioneren</b></td><td>Problemen met planning, concentratie en besluitvorming</td></tr>
<tr><td><b>Dementie</b></td><td>Gegeneraliseerde cognitieve achteruitgang, vaak met persoonlijkheidsverandering</td></tr>
</tbody>
</table>
<p class="mt-2 mb-0">Rol fysiotherapeut: <b>herkennen, signaleren en aanpassen</b>. Diagnostiek en behandeling primair door neuropsycholoog/logopedist. Fysiotherapeut past sessiestructuur, instructievorm en tempo aan op de aanwezige stoornissen.</p>`,
    implicatie: 'Cognitieve stoornissen beïnvloeden de leerstrategie direct. Instructies geven tijdens uitvoering kan bij cortexlaesies problematisch zijn — impliciete strategieën (voordoen, faciliteren) zijn dan effectiever.',
  },

];

// ── Link-definities ────────────────────────────────────────────────────────────
// rel: 'contextus' = formele/citationele relatie | 'nexus' = semantische relatie

const NEW_LINKS = [
  // contextus: reader-cna → alle (her)gebouwde CNA kennis-nodes
  ...NODES.map(n => ({ from: 'reader-cna', to: n.id, rel: 'contextus' })),

  // nexus: diagnostisch cluster
  { from: 'cna-classificatie',   to: 'cna-wat-hoe-waarom',   rel: 'nexus' },
  { from: 'cna-classificatie',   to: 'cna-hierarchisch-model', rel: 'nexus' },
  { from: 'cna-wat-hoe-waarom',  to: 'cna-observatie',        rel: 'nexus' },
  { from: 'cna-vier-ssen',       to: 'cna-sturing',           rel: 'nexus' },
  { from: 'cna-tabel2',          to: 'cna-sturing',           rel: 'nexus' },
  { from: 'cna-vier-ssen',       to: 'cna-cognitief',         rel: 'nexus' },

  // nexus: therapeutisch cluster
  { from: 'cna-motorisch-leren', to: 'cna-behandelstructuur', rel: 'nexus' },
  { from: 'cna-hierarchisch-model', to: 'cna-cortex',         rel: 'nexus' },
  { from: 'cna-hierarchisch-model', to: 'cna-basale-kernen',  rel: 'nexus' },
  { from: 'cna-hierarchisch-model', to: 'cna-cerebellum',     rel: 'nexus' },
  { from: 'cna-hierarchisch-model', to: 'cna-ruggenmerg',     rel: 'nexus' },
  { from: 'cna-laesielocatie-stub', to: 'cna-cortex',         rel: 'nexus' }, // fallback; echte laesielocatie = de 4 nodes
  { from: 'cna-classificatie',   to: 'cna-cortex',            rel: 'nexus' },
  { from: 'cna-classificatie',   to: 'cna-basale-kernen',     rel: 'nexus' },
  { from: 'cna-cortex',          to: 'cna-hypertonie',        rel: 'nexus' },
  { from: 'cna-cortex',          to: 'cna-sturing',           rel: 'nexus' },
  { from: 'cna-cortex',          to: 'cna-cognitief',         rel: 'nexus' },
  { from: 'cna-basale-kernen',   to: 'cna-hypertonie',        rel: 'nexus' },
  { from: 'cna-basale-kernen',   to: 'cna-sturing',           rel: 'nexus' },
  { from: 'cna-cerebellum',      to: 'cna-sturing',           rel: 'nexus' },
  { from: 'cna-motorisch-leren', to: 'cna-cortex',            rel: 'nexus' },
  { from: 'cna-motorisch-leren', to: 'cna-basale-kernen',     rel: 'nexus' },
  { from: 'cna-motorisch-leren', to: 'cna-cerebellum',        rel: 'nexus' },
  { from: 'cna-motorisch-leren', to: 'cna-ruggenmerg',        rel: 'nexus' },
  { from: 'cna-sturing',         to: 'cna-spierkracht',       rel: 'nexus' },
];

// ── Tags voor nieuwe nodes ─────────────────────────────────────────────────────
const NEW_TAGS = [
  { object: 'cna-sturing',   tag: 'cna' },
  { object: 'cna-cognitief', tag: 'cna' },
];

// ── Node verwijderen ──────────────────────────────────────────────────────────
const DELETE_IDS = ['motorisch-leren-hersenlaesies'];

// ── Toepassen ─────────────────────────────────────────────────────────────────

// 1. Update/add nodes
for (const n of NODES) {
  const existing = data.objects[n.id];
  const fields = { content: n.content };
  if (n.implicatie) fields.implicatie = n.implicatie;

  if (existing) {
    // Behoud id, type, afk, title; vervang alleen fields
    existing.fields   = fields;
    existing.afk      = n.afk;
    existing.title    = n.title;
    existing.modified = Date.now();
  } else {
    data.objects[n.id] = {
      id:       n.id,
      type:     'kennis',
      afk:      n.afk,
      title:    n.title,
      fields,
      links:    [],
      created:  Date.now(),
      modified: Date.now(),
    };
  }
}

// 2. Verwijder nodes + bijbehorende links en tags
for (const id of DELETE_IDS) {
  delete data.objects[id];
  data.links = data.links.filter(l => l.from !== id && l.to !== id);
  data.tags  = data.tags.filter(t => t.object !== id);
}

// 3. Verwijder links die verwijzen naar niet-bestaande nodes of verouderde paren
data.links = data.links.filter(l =>
  data.objects[l.from] && data.objects[l.to]
);

// 4. Voeg nieuwe links toe (deduplicatie op from+to+rel)
const existingLinkSet = new Set(data.links.map(l => `${l.rel}:${l.from}:${l.to}`));
for (const l of NEW_LINKS) {
  if (!data.objects[l.from] || !data.objects[l.to]) continue; // veiligheidscheck
  const key = `${l.rel}:${l.from}:${l.to}`;
  if (!existingLinkSet.has(key)) {
    data.links.push({ id: uid(), ...l });
    existingLinkSet.add(key);
  }
}

// 5. Voeg nieuwe tags toe (deduplicatie)
const existingTagSet = new Set(data.tags.map(t => `${t.object}:${t.tag}`));
for (const t of NEW_TAGS) {
  const key = `${t.object}:${t.tag}`;
  if (!existingTagSet.has(key)) {
    data.tags.push(t);
    existingTagSet.add(key);
  }
}

// ── Wegschrijven ──────────────────────────────────────────────────────────────
const output = `window.SEED_DATA = ${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync(seedPath, output, 'utf8');

// ── Rapport ───────────────────────────────────────────────────────────────────
const cnaKennisCount = Object.values(data.objects).filter(o =>
  o.id.startsWith('cna-') && o.type === 'kennis'
).length;
const cnaLinks = data.links.filter(l =>
  l.from.startsWith('cna-') || l.to.startsWith('cna-') || l.from === 'reader-cna'
).length;

console.log('✓ rebuild_cna.js klaar');
console.log('  CNA kennis-nodes:  ', cnaKennisCount);
console.log('  CNA-gerelateerde links:', cnaLinks);
console.log('  Verwijderd:        ', DELETE_IDS.join(', '));
console.log('  Nieuwe nodes:       cna-sturing, cna-cognitief');
console.log('\nVoer in de browser-console uit om localStorage bij te werken:');
console.log('  fetch("/api/seed").then(...)  — of gebruik DB.reset() na page reload');
