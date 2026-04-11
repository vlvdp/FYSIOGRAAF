# Changelog

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
