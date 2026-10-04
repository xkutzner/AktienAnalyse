# Aktienlabor · 20 Tage

Private Sites research tool for ranking US equity setups over 20 trading days and checking those selections against a walk-forward historical simulation. It estimates the chance of reaching a +5% target from similar completed historical situations; it does not promise returns or place orders.

## Data source

The Worker calls Twelve Data's `time_series` endpoint from the server for up to 1,300 adjusted daily bars per symbol (`adjust=all`) and selects the last completed regular exchange session using validated US MIC/timezone metadata. It loads SPY as a broad US-market regime proxy. The browser never receives the API key. Set the Sites runtime secret `TWELVEDATA_API_KEY` before using the data endpoint.

## Model and historical check

The ranking uses fixed, documented factors: 20-session momentum (25%), 60-session momentum (20%), 20-session relative strength versus SPY (25%), distance from the 50-session average (20%), and an annualized-volatility penalty (10%). For each stock, expected strategy return and probability of reaching +5% come from up to 30 nearest same-stock score observations, preferring the same SPY 20-session regime. The displayed interval is a Wilson 95% interval for the target-hit rate.

The backtest uses non-overlapping 20-session decisions. It tests the latest two years where data allows; each forecast uses only fully matured prior observations. Entry is modeled at the next session's open, a +5% limit exit is modeled from daily highs, and otherwise the position closes after 20 sessions. The comparison applies the same target and horizon to SPY. Fees, slippage, taxes, market impact, delisted-stock survivorship, and point-in-time corporate news/fundamentals are not included. Fewer than 12 test recommendations are marked insufficient.

The Basic individual plan is for personal/internal use. Keep this Site private unless data redistribution rights are arranged with the provider and relevant exchanges.

## Build

```sh
node scripts/render-worker.mjs
bash scripts/build.sh
node scripts/validate-artifact.mjs
```

The paper portfolio is stored only in the current browser's local storage. It is a tracking aid, not a broker account or trade execution record.

## Version und Weiterentwicklung

Aktuell: `reference-v1` (20 Handelstage / +5 %). [Roadmap](docs/ROADMAP.md), [eingefrorene Referenz](reference/v1/README.md), [Parameter](reference/v1/parameters.json). `npm test` prüft Modell, Kalender und feste synthetische Referenz; `npm run build` erzeugt den Worker aus der aktuellen Oberfläche, damit keine alte HTML-Einbettung gebaut wird.

Offizielle Quellen: [Twelve Data API](https://twelvedata.com/docs), [BLS Kalender](https://www.bls.gov/schedule/), [Fed Kalender](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm). Implementierte Requests sind im Worker dokumentiert; Kalenderdaten beeinflussen die Modellberechnung nicht. Kursstände werden in der Oberfläche angezeigt; Anbieterantworten werden seit data-v2 bei verfügbarem BUCKET als unveränderliche Snapshots archiviert. Dies erzeugt keine rückwirkenden historischen Informationsstände. Kalender-Quellenstatus kennzeichnet fehlende Daten und feste Ersatzstände.

## Datenpipeline data-v2

Siehe [Datenbasis](docs/DATA-BASIS.md): exchange calendar / timezone cutoff, separate adjusted indicators and raw OHLC, corporate-action audit, immutable R2 snapshots (`BUCKET`) and explicit quality/PIT status. The reference performance is retrospective only; strict historical simulation is blocked when historical availability or complete corporate-action coverage cannot be established.

## Ausführung execution-v2

[Simulationsregeln und Kosten](docs/SIMULATION.md). Einstiegsdatum zählt als Tag1. Neues Modul für Kosten, Verkaufslimit, tägliche Depotkurven und Exkursionen; keine Änderung am eingefrorenen Referenzkern. Strenge reale Simulation bleibt mangels Datenfreigabe gesperrt.

## Merkmalsvergleich features-v2

[Formeln, Training, Unsicherheit und Grenzen](docs/ANALOGUES.md). Der alte Score und die Auswahl bleiben erhalten; neue gewichtete Vergleichsfälle werden daneben gezeigt. Netto- und Proxy-Ergebnisse getrennt, keine behauptete Verbesserung ohne spätere Testperioden.

## Oberfläche ui-v3

Drei Hauptbereiche: Übersicht, Aktiendetails, Einstellungen & Methodik. [UI und Ergebnisstatus](docs/UI.md), [aktuelle Roadmap](docs/ROADMAP.md). Referenzvergleiche ausdrücklich bereinigt/ohne Kosten; neue Methode experimentell, keine kalibrierten Prognosewahrscheinlichkeiten oder freigegebenen Nettoempfehlungen. Einheitliche Kursfreigabe und Versionsschutz gegen veraltete API-Antworten. `npm test` enthält UI-Ablauf-/Kontrastprüfung im Mock-DOM; echte visuelle Mobile-/Browserprüfung noch offen.
