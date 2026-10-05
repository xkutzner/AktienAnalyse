# V02 · Gemeinsame Preisanker für Stop und Ziel

## Auftrag und Stand
- Ziel: Eine gemeinsame Funktion für vorläufige Schlussreferenzmarken und Marken am modellierten oder angegebenen tatsächlichen Fill; Kostenbasis und Splits nachvollziehbar. Bestehende Exitregeln erhalten.
- Nichtziel: neue Exitstrategie, reale Fills/Orders, Netto-/Datenfreigabe, Siteveröffentlichung oder Änderung an `reference/v1`.
- Ausgangscommit: `8434cb1204aba5e1920d4e2a0e82cec3d11c61c8` (`main`, V01-Merge), 05.10.2026. Keine offenen PRs beim Start.
- Verantwortlicher: separater Implementierungsagent V02; Branch `delivery/v02-price-anchors`; Implementierung technisch erledigt, PR folgt.
- Bezug: Produktkonzept §9.2, Lieferplan V02, bisherige Pakete 06/07/09.
- Abhängigkeiten: Simulator/Tradeplan vorhanden. Reale qualifizierte Rohkurse, Maßnahmen, Kosten und Fillbelege fehlen; V04/V09/V17 bleiben separat.

## Geplante Abnahme
- [x] Schluss 100 / Fill 101: vorläufig Stop 95 / Ziel 105; am Fill Stop 95,95 / Ziel 106,05. Karte, Simulator und Labelpfad sind konsistent.
- [x] Gaps, Spread/Slippage, Fix-/Notionalgebühren, Einstiegstag-Split, Folge-Split und Reverse-Split getestet.
- [x] Vorläufige Referenzmarken und modellierte Fillmarken sind eindeutig beschriftet; ungültige Fill-/Splitbasis erzeugt unbekannte Marken und unbekannten Kartenstatus.
- [x] Ziel-only ohne Plan, konservativer Stop+Ziel-Fall, Stopgap, Zielgap, These, Zeitende und Halt-Regeln bleiben regressionsgeprüft.
- [ ] Reale Daten-/Ausführungs-/Maßnahmen-/Kostenabnahme: ohne qualifizierte Datensätze und anonymisierte Fillbelege nicht ausführbar.
- [x] Empirische Prüfung nicht erforderlich für diese Softwarekorrektur; keine Prognosegüte behauptet.

## Umsetzung
- `worker/contract.js`: `tradePriceLevels()` ist einzige Stop-/Zielformel. `analysisCardPolicy()` gibt identische `priceLevels` und kompatible `stop`/`target` aus; ungültiger angegebener Fill blockiert den qualifizierten Status.
- `worker/simulation.js`: berechnet Einstiegmarken und splitbezogene Marken mit derselben Funktion; stellt `initialPriceLevels`, `priceLevels` sowie Marken im Entry-/Splitledger bereit. Trigger, Gross-Stopbasis und Anzeige verwenden diese Werte.
- `scripts/render-page.mjs`, `scripts/render-worker.mjs`: identische Funktion in Browser und Worker einbetten; keine zweite Formel oder Runtime-Abhängigkeit.
- `app/index.html`: vorläufiger/fillbezogener Status und Kostenbasis in Karte; Simulator zeigt Marken und kumulativen Splitfaktor.
- `scripts/test-analysis-card.mjs`, `scripts/test-tradeplan.mjs`: funktionale Preisankerabnahme und API/Browser-/Simulator-/Labelparität.
- Dokumentation: Lieferplan-Statusregister, IMPLEMENTATION-STATUS, DEVELOPMENT-ROADMAP und dieses Protokoll im selben PR.
- Versionen: additive `price-anchor-v1`; `analysis-card-v1`, `trade-plan-v1`, `execution-v4` und `execution-label-v1` bleiben kompatibel. Keine neuen Modellparameter/Exitregeln.
- Formel: `Stop = Anker × (1 − stopFraction) / kumulativer Splitfaktor`, `Ziel = Anker × 1,05 / kumulativer Splitfaktor`. Vor Einstieg Anker Rohschluss, danach Fillpreis. Ein Split am Einstieg ist bereits im Roh-Open enthalten und wird nicht doppelt gebucht.
- Kostenbasis: modellierter Fill = Open × (1 + EntrySpread + EntrySlippage); Gebühren verändern Cash/Nettoertrag, nicht die Preisgrenzen. Ziel ist ein Preisziel, kein garantierter +5%-Nettogewinn. Ausstiegskosten/Stopgaps werden unverändert modelliert.
- Karte optional `entryFill: {price, basis: 'modeled'|'actual', shareFactor}`: `actual` kennzeichnet nur die angegebene Preisbasis. `fillVerified:false`; kein Vertrauens-/Freigabeflag, keine produktive Brokerintegration. Research bleibt ohne qualifizierten Rohplan unbekannt.
- Migration: zusätzliche Felder, bestehende kompatible `stop`/`target` und Trades bleiben erhalten. Rollback durch Revert dieses PR; keine Datenmigration, keine Archivänderung.

## Prüfprotokoll
| Prüfung | Befehl oder Ablauf | Ergebnis | Nachweis | Einschränkung |
|---|---|---|---|---|
| Paketabnahme | `node scripts/test-analysis-card.mjs` und `node scripts/test-tradeplan.mjs` nach Render | bestanden | Schluss/Fill, Kostenbasis, Splits, unbekannte Eingaben, Karten-/Simulator-/Labelparität | synthetisch, keine echten Fills |
| Regression | `SOURCE_COMMIT=<tatsächlicher finaler PR-Head> npm test` | finales Ergebnis im PR-Abschluss | alle 16 Suiten inkl eingefrorener Referenz | Offline/Mock-DOM, keine Prognosegüte |
| Build | `SOURCE_COMMIT=<tatsächlicher finaler PR-Head> npm run build` | finales Ergebnis im PR-Abschluss | Sourcecommit wird eingebettet | keine Site-Veröffentlichung |
| Artefakt | `npm run validate` und Sourcecommit-Abgleich | finales Ergebnis im PR-Abschluss | valides ESM/`default.fetch`, tatsächlicher Head | lokales Buildartefakt |
| Git-Integrität | SHA1 aller Gitblobs gegen API-Tree, Referenzpfade unverändert | finales Ergebnis im PR-Abschluss | bytegenaue Basis und finaler Sourcebaum | keine Force-Pushes |
| Reale Ausführung/Browser | qualifizierte Rohkurse/Aktionen, anonymisierte Fill-/Kostenbelege und reale Sitzung | nicht ausführbar | Zugänge/Belege fehlen; keine reale Behauptung | V04/V09/V17/V22 |
| Korrigierte Zwischenprüfung | zusätzlicher Karten-Zahlentest | zunächst fehlgeschlagen, korrigiert | IEEE-754-Rundung 53,025000000000006 statt exakter Literale; Toleranz <1e-10 | keine Produktionsformeländerung dafür |

## Daten- und Forschungsnachweis
- Quellen/Snapshots/Zeitraum/Universum: ausschließlich deterministische synthetische US-Sitzungsfixtures, u.a. 27.11.–28.12.2026; keine Anbieter-/Brokerdaten oder personenbezogenen Depotdaten in Git.
- Kostenannahmen: Nullkosten und getrennte EntrySpread/EntrySlippage/Fixed-/Notional-/Exitkosten; kumulative 2:1- und 1:4-Splits. Sie sind Softwarefälle, keine qualifizierten Marktannahmen.
- Experiment-ID: keine Modellstudie. Es wurde kein Renditemodell getunt und kein Evaluationsergebnis freigegeben.
- Ergebnis einschließlich negativer Befunde: invalid Fill-/Splitbasis bleibt unbekannt, kein erfundener Einstieg; echte Daten und Browser-/Fillabnahme fehlen.
- **I: erledigt** – gemeinsame Preisanker, explizite Basis, Regressionen. **D: offen** – reale Preise/Aktionen/Kosten/Fills über V04/V09/V17 zu beschaffen und zu prüfen. **E: nicht erforderlich** – Softwarekorrektur; Prognoseempirie weiterhin gesperrt.

## Abschluss
- PR / getesteter Head / Mergecommit: im PR-Abschluss nach finaler Git-/Testprüfung; PR-Link wird vor Merge in allen drei Statusdokumenten ergänzt. Mergecommit entsteht erst beim Merge und ist über den PR nachvollziehbar.
- Offene Restpunkte: qualifizierte tatsächliche Ausführungsdaten V04/V09, tatsächlicher Ledger V17, angemeldeter Browser V22. Kein synthetischer Fall ersetzt diese Abnahmen.
- Produktfreigabe: Preisanker sind technisch konsistent und die Referenzmarken ehrlich vorläufig. Keine Netto- oder Kaufempfehlungsfreigabe; alle Capability-Gates bleiben gesperrt.
- Deployment: nicht erfolgt.
- Nächster sinnvoller Auftrag: V03 Methodik-/Versionsregistry und Textbereinigung im frischen Agentenkontext nach nachgewiesenem Merge.
