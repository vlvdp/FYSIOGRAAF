# Plan volgende sessie — Bootstrap content fixes

## Doel
De 23 gemigreerde kennis-objecten visueel verbeteren. De structuur klopt, de HTML is Bootstrap-conform — maar een aantal patronen zien er niet goed uit in de detailpanel.

## Stap 1 — h-100 weghalen
**Probleem:** `h-100` op elke panel-div trekt lege ruimte omhoog zodat korte panels even lang zijn als de langste in de rij. Zichtbaar bij cna-spierkracht (linker panel heeft grote lege onderkant).

**Fix:** `h-100` verwijderen uit alle `border rounded p-2 h-100` → `border rounded p-2`

**Aanpak:** sed-replace in seed.js, of migrate_bootstrap.js aanpassen en herdraaien.

---

## Stap 2 — Nested border-in-border opruimen
**Probleem:** Sommige objecten hebben een bordered panel met daarbinnen kleine bordered subpanels (bijv. Direct/Indirect in cna-spierkracht). Ziet er rommelig uit.

**Fix:** Subpanels vervangen door gewone tekst met `<strong>` labels:
```html
<!-- oud -->
<div class="row g-1">
  <div class="col-6"><div class="border rounded p-1 small"><div class="fw-semibold">Direct</div>...</div></div>
</div>

<!-- nieuw -->
<p class="small mb-1"><strong>Direct</strong> — Parese of paralyse door CNA-uitval</p>
<p class="small mb-0"><strong>Indirect</strong> — Inactiviteit door de beperking → secundaire deconditionering</p>
```

**Objecten om te checken:** cna-spierkracht, cna-balans (heeft ook geneste subpanels)

---

## Stap 3 — Klinische implicatie meer gewicht geven
**Probleem:** `text-secondary small` valt weg, lijkt op voetnoot terwijl het juist de kern is.

**Fix:** Licht achtergrondblokje:
```html
<div class="bg-secondary bg-opacity-10 rounded p-2 mt-2 small">
  <strong>Klinische implicatie:</strong> ...
</div>
```

**Aanpak:** globale sed-replace op het patroon `<p class="mt-2 mb-0 small text-secondary">` in seed.js.

---

## Stap 4 — Visuele check alle 23 objecten
Na de fixes: elk object kort doorklikken in de app (na DB.reset()) en controleren op:
- Geen lege ruimte
- Geen dubbele borders
- Klinische implicatie zichtbaar
- Tabellen niet afgekapt

Prioriteit checken: cna-classificatie, cna-hypertonie, cna-vier-ssen, cna-cla, cna-spierkracht

---

## Werkwijze
1. `node data/migrate_bootstrap.js` herdraaien na aanpassingen in het script
2. In browser: Reset DB knop (rood, onderaan sidebar) → herlaadt seed
3. Objecten doorklikken via `OVZ.showDetail('id')` in console of via de UI
