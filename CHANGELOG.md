# Changelog

> **Governance:** alle UI-wijzigingen worden getoetst aan [`LAYOUT_MANIFEST.md`](./LAYOUT_MANIFEST.md).
> De checklist in sectie 9 is verplicht voor elke commit die HTML/CSS/JS raakt.

## [2026-04-17] Topbar + manifest-uitbreiding

### Gedaan
- **Topbar gerefactord** van handmatige `<header>` flexbox naar echte Bootstrap `<nav class="navbar navbar-expand-lg">`
  - Mobile: brand + filter-toggle (`bi-funnel`) + navbar-toggler op rij 1; search op eigen rij (`order-last order-lg-0`); view-switcher + utilities in collapse
  - Desktop: alles inline op één rij
  - View-switcher Rolodex/Graph/Tabel nu in `btn-group` (segmented control)
  - `<div class="vr d-none d-lg-block">` tussen view-switcher en utilities
- `.brand` class toegevoegd aan `style.css` — bundelt kleur + monospace + bold; vervangt inline `style="color:var(--brand);"` + utility classes
- `.dropdown-menu-wide` class toegevoegd — gebruikt `--bs-dropdown-min-width: 16rem` ipv inline `style="min-width:260px"` (idiomatisch Bootstrap 5.3+)
- Print-stylesheet bijgewerkt: `nav` toegevoegd aan hide-list zodat topbar niet in print verschijnt
- `LAYOUT_MANIFEST.md` uitgebreid tot zelfstandig referentie-document:
  - §0 Status & resume (waar zijn we / open punten / waar te vinden)
  - §2 Kleursysteem vervangt §2 Kleurbeleid — inclusief volledige token-tabel met light + dark hex voor brand, semantische UI, node-types, domeinen, relaties
  - §10 Uitzonderingen uitgebreid met `.brand` wordmark en vis-network font-colors

## [2026-04-17] Kleurensysteem geformaliseerd

### Gedaan
- Ontwerpprincipe "één ziel, twee uitvoeringen" vastgelegd als kop-comment in `css/style.css`
- Vier relatie-tokens toegevoegd (`--rel-nexus`, `--rel-contextus`, `--rel-usus`, `--rel-sequens`) met light + dark varianten
- `--c-info-alt` toegevoegd op de semantische laag (was alleen als `--onco` aanwezig)
- `graph.js` leest nu live via `getComputedStyle()` — theme-switch werkt automatisch door, geen dubbele bron van waarheid
- `index.html`: 17 hardcoded hex-waarden in legenda-modal vervangen door `var(--rel-*)`
- Fallback-bug gefixt: `cards.js:114` (#8B5CF6 → #831eff)
- `<h6 class="modal-title">` `font-monospace` override verwijderd — headings zijn nu pure Bootstrap
- `LAYOUT_MANIFEST.md` aangemaakt als toetssteen voor alle UI-wijzigingen
- `kleuren_overzicht.html` bijgewerkt naar post-refactor status

## [WIP] Bootstrap HTML migratie content-velden

### Gedaan
- **23 kennis-objecten** omgezet van bare `<div>` naar Bootstrap 5 HTML in `data/seed.js`
  - CNA-objecten (18): cna-classificatie, cna-wat-hoe-waarom, cna-rps-model, cna-cla, cna-observatie, cna-vier-ssen, cna-tabel2, cna-hypertonie, cna-hierarchisch-model, cna-behandelstructuur, cna-motorisch-leren, cna-cortex, cna-basale-kernen, cna-cerebellum, cna-ruggenmerg, cna-spierkracht, cna-sensibiliteit, cna-balans
  - sPAV-objecten (5): spav-indicatiestelling, spav-behandelschema, spav-fitt-looptraining, spav-activeringsprogramma, spav-differentiaaldiagnose
- Patronen gebruikt: `row g-2 mb-2` / `col-12 col-md-6` / `border rounded p-2` / `table-responsive mb-2` / `table table-sm`
- **Reset DB knop** toegevoegd in sidebar footer naast + Nieuw en ↓ Export (`btn-outline-danger`)
- Migratiescript bewaard als `data/migrate_bootstrap.js`

### Nog te doen (visuele verbeteringen)
- `h-100` weghalen van panel-divs — trekt lege ruimte omhoog bij panels met weinig content (zichtbaar bij cna-spierkracht)
- Nested border-in-border simplificeren (bijv. Direct/Indirect in cna-spierkracht → `<strong>` tekst zonder eigen kader)
- Klinische implicatie blokken meer visueel gewicht geven — voorstel: `bg-secondary bg-opacity-10 rounded p-2` i.p.v. `text-secondary small`
- Controleren: cna-classificatie en cna-hypertonie worden afgekapt in detailpanel — panels te lang bij stacking
