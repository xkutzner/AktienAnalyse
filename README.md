# Aktienlabor · 20 Handelstage

Research-Tool für eine US-Aktien-Watchlist. Drei Bereiche: Übersicht, Aktiendetails sowie Einstellungen & Methodik. Keine Brokerorders.

Die Rangliste nutzt `reference-v1`: historische Vergleiche auf bereinigten Kursen ohne Kosten. `selection-v2` korrigiert die historische Auswahl; `reference/v1` bleibt das unveränderte historische Archiv mit bekanntem Auswahlfehler. `features-v2` ist experimentell und verwendet keine Referenzgewichte. `execution-v4` ist implementiert; reale Nettoergebnisse bleiben bei fehlenden historischen Datenständen und Kapitalmaßnahmen gesperrt. Historische Häufigkeiten sind keine kalibrierten Prognosewahrscheinlichkeiten.

## Ausführen und prüfen

Node.js 22 oder neuer und Bash. Keine externen npm-Abhängigkeiten.

```bash
npm ci
npm test
npm run build
npm run validate
```

`worker/index.js` und `dist/` werden generiert und sind nicht eingecheckt. 17 offline ausführbare Testsuiten prüfen Berechnung, Verträge, Kalender, Referenz, Auswahl, Daten, Simulation, Vergleiche, Broker, UI, Archiv, Fähigkeiten, Labels, Tradeplan, Analysekarte und Methodikregistry. UI-Tests nutzen einen Mock-DOM.

Die zentrale [Methodikregistry](worker/methodology.js) erzeugt die Seitendokumentation und GET `/api/methodology`; aktive Datenpipeline: `data-v4`. Versionen stammen aus den jeweiligen Modulkonstanten. Verwendete, experimentelle und geplante Funktionen sind getrennt. Kalender-/Tarifstatus gilt je Abruf und Konto, nicht pauschal; reale Anbieterentitlements bleiben V04.

## Sites und Daten

`.openai/hosting.json` erhält die bestehende Sites-Projekt-ID und R2-Bindung. Runtime-Secret `TWELVEDATA_API_KEY` ausschließlich serverseitig setzen; Schlüssel sind nicht enthalten. Keine Neuveröffentlichung durch diese Sicherung.

Details: [Roadmap](docs/ROADMAP.md), [Daten](docs/DATA-BASIS.md), [Simulation](docs/SIMULATION.md), [Vergleiche](docs/ANALOGUES.md), [Oberfläche](docs/UI.md). Die bisherige README bleibt in [ORIGINAL-README.md](docs/ORIGINAL-README.md) erhalten.

## Sicherungsstand

Quellstand: `0cf416518645e1fd2873d5a4b7f5f091d4313c6e` (04.10.2026). Neue GitHub-Historie ausdrücklich autorisiert. Die ursprünglichen 14 Commits bleiben im separat bereitgestellten `Aktienlabor-2026-10-04.bundle` erhalten. Das Bundle enthält historische Build-Dateien und wird daher nicht in dieses bereinigte Quellcode-Repository aufgenommen.

## Produktziel und detaillierter Lieferplan · 05.10.2026

Das [Produktkonzept für 20 Handelstage](docs/PRODUCT-CONCEPT-20D.md) beschreibt Ergebnisanzeige, Rendite-/Risikogewichtung, Datenbedarf, Ereignisse, Kaufjournal und Erfolgsmessung. Der [Lieferplan mit 24 Arbeitspaketen](docs/DELIVERY-PLAN-20D.md) enthält Prioritäten, Aufwand, Abhängigkeiten und ein fortschreibbares Abnahmebuch. Diese Planung ist keine Implementierungs- oder Prognosefreigabe.
