# Layout Manifest — Fysiograaf

Elke UI-wijziging moet getoetst worden aan dit document.
Als een wijziging tegen een regel in botst: óf het manifest aanpassen (met reden), óf de wijziging herzien. Geen stille uitzonderingen.

Dit manifest is zelfstandig: een nieuwe sessie kan hier starten zonder eerst andere files te lezen.

---

## 0. Status & resume

### Waar zijn we
- Kleursysteem is **geformaliseerd** — blijft het eigen "klinisch & fris" palet, niet Tol. Reden: dubbelmode (licht/donker) werkt al, colorblind-safety is minder kritiek voor UI dan voor data-viz.
- Topbar is **echte Bootstrap `navbar-expand-lg`** — geen handmatige flexbox meer.
- Relatie-kleuren zijn **CSS tokens** (`--rel-*`), live gelezen in `graph.js`.
- `.brand` en `.dropdown-menu-wide` classes bundelen eerdere inline styles.
- `kleuren_overzicht.html` en `CHANGELOG.md` zijn up-to-date.

### Open punten (backlog)
- [ ] Contrast-audit light + dark voor alle badges/pills (WCAG AA).
- [ ] `layout_voorbeeld.html` migreren of schrappen (hardcoded `#ff5900`).
- [ ] `data/seed.js` legacy inline styles: resterende migratie via `migrate_seed.js`.
- [ ] Cards-view (cna-spierkracht etc.) afgekapt in detailpanel — panel-hoogte issue.
- [ ] Klinische implicatie-blokken visueel gewicht geven (voorgesteld: `bg-secondary bg-opacity-10 rounded p-2`).
- [ ] Colorblind-simulatie test (Chrome DevTools → Rendering → Emulate vision deficiencies).

### Waar te vinden
- `css/style.css` — alle design tokens (primitives + semantic + categorisch)
- `js/views/graph.js` — `_readPalette()` helper, leest live uit CSS vars
- `index.html` — topbar (navbar), legenda-modal met `var(--rel-*)`
- `kleuren_overzicht.html` — visuele swatch-pagina (referentie)
- `CHANGELOG.md` — chronologische wijzigingshistorie

---

## 1. Kernprincipes

1. **Bootstrap-first.** Gebruik Bootstrap utility-classes of componenten voor alles wat Bootstrap biedt. Schrijf alleen eigen CSS voor wat Bootstrap níet levert. Check eerst `--bs-<component>-*` CSS-variabelen voordat je custom CSS schrijft.
2. **Klinisch & fris, dual-mode.** Light mode = verzadigd voor contrast op wit. Dark mode = zachter/lichter voor contrast op zwart. Identiteit blijft dezelfde kleurziel — "één ziel, twee uitvoeringen".
3. **Eén bron van waarheid per kleur.** Alle kleuren komen uit CSS custom properties in `css/style.css`. Geen losse hex in HTML, JS of inline `style=""`.
4. **Redundante encoding voor categorische data.** Node-types worden onderscheiden via vorm (`bi-circle-fill`, `bi-square-fill`, etc.) én kleur. Kleur-overlap met domeinen is daardoor toegestaan.
5. **Semantiek > esthetiek.** Liever een correct `<h6 class="modal-title">` dan een mooier gestylde `<div>`. Bootstrap-componenten in hun bedoelde rol.
6. **Progressive disclosure.** Detail-panelen, offcanvas, modals. De graph heeft floating controls; hoofdweergave blijft rustig.

---

## 2. Kleursysteem

### 2.1 Principe

Elke semantische kleur heeft één **ziel** (bv. munt = stabiel/vitaal) met twee **uitvoeringen**:
- light mode = donkerder/verzadigder → contrast op wit
- dark mode = lichter/zachter → contrast op zwart

De identiteit blijft herkenbaar, de helderheid past zich aan. Contrast getoetst op AA (≥4.5:1) tegen witte/zwarte bg.

### 2.2 Token-lagen

| Laag | Voorbeelden | Doel |
|---|---|---|
| Brand | `--brand` | Wordmark; buiten het systeem |
| Semantisch (UI-rollen) | `--c-accent`, `--c-success`, `--c-warning`, `--c-danger`, `--c-info-alt`, `--c-purple` | Knoppen, links, UI-states |
| Categorisch: node-types | `--type-instrument` + `-edge`, etc. | 4 types; kleur + vorm (redundant) |
| Categorisch: domeinen | `--rca`, `--cna`, `--msa`, `--mtt`, `--onco`, `--ger` | 6 domein-tags op objecten |
| Categorisch: relaties | `--rel-nexus`, `--rel-contextus`, `--rel-usus`, `--rel-sequens` | 4 relatie-types op edges |
| Overige | `--type-richtlijn`, `--badge-ric` | Specifiek gebruik |

### 2.3 Volledige token-tabel

**Brand**

| Token | Light | Dark | Rol |
|---|---|---|---|
| `--brand` | `#ff5900` | `#ff5900` | Wordmark identiteit (geen dark-variant) |

**Semantisch — UI-rollen**

| Token | Light | Dark | Rol |
|---|---|---|---|
| `--c-accent` | `#0B6FBF` | `#5AB4F0` | Primaire links/knoppen |
| `--c-success` | `#0F9D8A` | `#4ED3BD` | Positief/afgerond |
| `--c-warning` | `#E8833A` | `#FFB366` | Let op / attentie |
| `--c-danger` | `#D1365A` | `#F2708C` | Fout / destructief |
| `--c-info-alt` | `#4A8A2E` | `#9CD66B` | Alternatieve info (natuur) |
| `--c-purple` | `#7A4FBF` | `#B89AF5` | Categorisch paars |

**Categorisch — node-types (4)**

| Token | Light | Dark | Rol |
|---|---|---|---|
| `--type-instrument` | `#E8833A` | `#FFB366` | oranje — instrument |
| `--type-instrument-edge` | `#A35B1F` | `#CC7A3D` | border/stroke |
| `--type-kennis` | `#0B6FBF` | `#5AB4F0` | blauw — kennis |
| `--type-kennis-edge` | `#084A80` | `#2E7AB0` | border/stroke |
| `--type-bronnen` | `#7A4FBF` | `#B89AF5` | paars — bronnen |
| `--type-bronnen-edge` | `#543585` | `#7D5BC0` | border/stroke |
| `--type-casuistiek` | `#0F9D8A` | `#4ED3BD` | munt — casuïstiek |
| `--type-casuistiek-edge` | `#0A6E60` | `#1F9080` | border/stroke |

**Categorisch — domeinen (6)**

| Token | Light | Dark | Rol |
|---|---|---|---|
| `--rca` | `#D1365A` | `#F2708C` | Revalidatie CA |
| `--cna` | `#7A4FBF` | `#B89AF5` | CNA |
| `--msa` | `#E8833A` | `#FFB366` | MSA |
| `--mtt` | `#0B6FBF` | `#5AB4F0` | MTT |
| `--onco` | `#4A8A2E` | `#9CD66B` | Oncologie |
| `--ger` | `#0F9D8A` | `#4ED3BD` | Geriatrie |

**Categorisch — relatie-types (4)**

| Token | Light | Dark | Karakter |
|---|---|---|---|
| `--rel-nexus` | `#F97316` | `#FB923C` | Structureel / anker |
| `--rel-contextus` | `#7C3AED` | `#A78BFA` | Associatief / duidend |
| `--rel-usus` | `#E11D48` | `#FB7185` | Functioneel / actie |
| `--rel-sequens` | `#16A34A` | `#4ADE80` | Narratief / volgorde |

**Overige**

| Token | Light | Dark | Rol |
|---|---|---|---|
| `--type-richtlijn` | `#831eff` | `#831eff` | Richtlijn-badge (geen aparte dark) |
| `--badge-ric` | `#DC2626` | `#DC2626` | RIC badge (geen aparte dark) |

*Bewuste overlap:* 4 node-type kleuren zijn identiek aan 4 van de 6 domeinkleuren (oranje/blauw/paars/munt). Types worden onderscheiden via **vorm** (redundante encoding), dus kleur-overlap is geen bug maar ontwerp.

### 2.4 Regels

- **Alle kleuren** via `var(--token)`. Geen hardcoded hex in `.html`, `.js` of inline `style`.
- **Defensieve fallbacks** in JS (`#555`, `#fff`, `#000`) alleen wanneer `getComputedStyle()` een ontbrekende var kan opleveren. Niet als esthetische keuze.
- **Contrast:** alle body-tekst ≥ 4.5:1 (WCAG AA). Badges/tags ≥ 3:1. Getoetst light én dark.
- **Nieuwe kleur toevoegen?** Alleen als geen bestaande semantische token past. Dan: token toevoegen in `style.css` met light + dark variant, deze tabel bijwerken, `kleuren_overzicht.html` bijwerken.
- **Canvas-componenten** (vis-network) mogen geen hex dupliceren; lees CSS-vars via `getComputedStyle()`.

---

## 3. Typografie

- **Headings (`h1`-`h6`):** pure Bootstrap. Geen `font-monospace`, geen inline `font-family`, geen custom size-overrides. Bootstrap regelt dark-mode inversie.
- **Monospace** (`font-monospace`): alleen voor codes/identifiers (afk, IDs, versie-labels, relatie-labels). Niet voor leesbare tekst.
- **Body-text:** Bootstrap defaults. Hierarchie via `fs-*`, `fw-*`, `text-*` utilities.
- **Geen custom `@font-face`.** Alleen Bootstrap's system font stack en `--bs-font-monospace`.

---

## 4. Iconen

- **Alleen Bootstrap Icons** (`bi-*`). Geen Font Awesome, geen emoji's in UI, geen SVG-inlining tenzij semantisch nodig.
- **Type-mapping vast:** `bi-circle-fill` = instrument, `bi-triangle-fill` = kennis, `bi-square-fill` = bronnen, `bi-diamond-fill` = casuïstiek, `bi-pentagon-fill` = skill. Niet hergebruiken voor andere doelen.
- **Icon-kleur** altijd via `color:var(--type-*)` — niet hardcoded.

---

## 5. Spacing & layout

- Spacing via Bootstrap utilities (`gap-*`, `p-*`, `m-*`). Geen pixel-hardcoding in inline style tenzij component-eigenaardig (vis-network canvas).
- Grid & flex via Bootstrap classes. Geen custom media queries behalve waar Bootstrap tekortschiet (bijv. `sidebar-collapsed` gedrag).
- **`min-width`/`max-width` in inline style is een smell.** Bootstrap heeft geen pixel min-width utilities — gebruik in plaats daarvan de `--bs-<component>-*` CSS-variabele van het component (idiomatisch Bootstrap 5.3+). Voorbeeld: `.dropdown-menu-wide { --bs-dropdown-min-width: 16rem; }` ipv inline `style="min-width:260px"`.

---

## 6. Responsief

- **Mobile-first.** Testen bij breakpoints: <576px (xs, phone), 576-991 (sm/md, tablet), ≥992px (desktop).
- **Topbar:** `navbar-expand-lg`; op mobile collapst de nav, search krijgt eigen rij via `order-last order-lg-0`.
- **Sidebar:** offcanvas op mobile, statisch/collapsible op desktop. Gedragswissel via `d-lg-*` utilities. Toggle-knop gebruikt `bi-funnel` (niet `bi-list`) zodat hij visueel verschilt van de navbar-toggler.
- **Detail-panel:** full-screen op phone, zij-panel op tablet en groter.

---

## 7. Theme-switching

- `data-bs-theme` op `<html>` stuurt light/dark. Gezet via `localStorage.theme`.
- Componenten die op canvas/niet-DOM renderen (vis-network graph): moeten via `getComputedStyle()` live de CSS-vars lezen bij elke render. Géén vaste map in JS-code dupliceren. Zie `_readPalette()` in `graph.js` als referentie.
- Bootswatch-theme wissel (andere `bootstrap.min.css` URL) moet werken zonder dat eigen tokens overschreven worden. Test: na theme-switch zijn `--type-*`, `--rel-*` nog leesbaar via DevTools.

---

## 8. Anti-patterns (doen we niet)

- `<style>`-blokken in view-files — alles in `css/style.css`.
- Inline `style="..."` waar Bootstrap een utility heeft (`d-flex`, `gap-2`, `text-muted`, etc.).
- Inline `style="min-width:...px"` — gebruik `--bs-<component>-min-width` via een modifier class.
- `!important` zonder expliciete rechtvaardiging in comment.
- Kleuren hardcoden "voor nu, fix ik later". Nooit.
- Headings als `<div>` of spans stylen. Gebruik de semantische tag.
- Eigen dropdown/modal/offcanvas CSS schrijven. Gebruik Bootstrap's.
- Inline `<script>` in view-files. Logica hoort in `js/`.
- Hardcoded hex in `graph.js` of andere canvas-componenten. Lees uit CSS-vars.

---

## 9. Toetslijst — elke wijziging

Vóór commit / review, loop deze lijst langs:

- [ ] Geen nieuwe hardcoded hex-waarden in `.html` of `.js` (grep: `#[0-9a-fA-F]{3,8}` in diff).
- [ ] Geen nieuwe inline `style="..."` die een Bootstrap utility of `--bs-*` variabele vervangt.
- [ ] Nieuwe kleur? Token in `style.css` + light/dark + gedocumenteerd in §2.3 hier + in `kleuren_overzicht.html`.
- [ ] Nieuwe heading? Semantische tag (`h1`-`h6`), geen override-classes.
- [ ] Getest in light én dark mode.
- [ ] Getest bij ≥1 mobile breakpoint + desktop.
- [ ] Geen nieuwe icon-library / font / CDN-dependency zonder rechtvaardiging.
- [ ] Geen `!important` zonder inline comment die 'm uitlegt.
- [ ] Print-view (`@media print` in style.css) nog intact?
- [ ] Handmatige grep op nieuwe hex / inline styles zonder errors.

---

## 10. Uitzonderingen

Geregistreerde uitzonderingen op bovenstaande regels. Elke nieuwe uitzondering hier documenteren, anders telt hij niet.

- **`--brand` `#ff5900`** — staat buiten het semantische systeem. Toegestaan in topbar. Niet hergebruiken.
- **`.brand` class (wordmark)** — het woord "Fysiograaf" in de topbar gebruikt monospace als wordmark-identiteit, niet als code/identifier. Uitzondering op §3 "monospace alleen voor codes". Bundelt kleur + font + gewicht in `style.css`; gebruik geen utility-classes op het brand-element.
- **`layout_voorbeeld.html`** — losstaand layout-experiment, niet productie. Mag van dit manifest afwijken. (Op de backlog: migreren of schrappen.)
- **`data/seed.js`** — legacy inline styles in body-HTML. Wordt gemigreerd door `migrate_seed.js`; nieuwe entries moeten wél token-conform zijn.
- **Print-kleuren** (`#fff`, `#111`, `#ddd`, `#555` in `@media print`) — geen dark-mode in print, hardcoded toegestaan.
- **vis-network font-colors** (`#000000`, `#FFFFFF` in `graph.js` TYPE_META) — pure zwart/wit voor label-tekst op node-fills, geen onderdeel van het kleursysteem maar typografische functie.

---

**Onderhouder:** Vincent
**Laatst bijgewerkt:** 2026-04-17
**Wijziging aan dit manifest?** Zelf ook toetsen — is de nieuwe regel consistent met de kernprincipes? Anders kernprincipe herzien.
