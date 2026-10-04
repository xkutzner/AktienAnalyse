# Roadmap · tatsächlicher Stand 04.10.2026

## Paket 01 · umgesetzt

Ausgangspunkt: `main`, `4094ce7ed01cc2ebb5cacb980a8bb0061e7de72e`. Umsetzung gemäß angehängter Entwicklungsroadmap vom 04.10.2026, Paket 01. Pakete 02–04 sind ebenfalls technisch umgesetzt und gemergt; Paket07 ist technisch implementiert und wartet auf Upload/PR/Mergeprüfung; Pakete10–18 bleiben offen.

- `selection-v2` entscheidet anhand des Datenpräfixes bis zum Entscheidungstag. Spätere Kurse werden erst für die Auswertung gelesen.
- Fehlender späterer Einstiegskurs, ungültige spätere OHLC und fehlende spätere SPY-Sitzungen ändern keine damalige Auswahl. Unbekannte Outcomes bleiben `null`; kein Ersatzkandidat, kein nachträglicher Cash-Trade.
- Historische Präfixprüfung ist von der heutigen strengen Kursfreigabe getrennt. Auch aktuell gesperrte Aktien können in früheren, damals fehlerfreien Präfixen vorkommen.
- Referenzdateien, Hash und Golden-Ergebnisse unter `reference/v1` unverändert. Aktuelle Rangliste bleibt auf den bisherigen Preismerkmalen und Referenzschätzungen.
- Neun Testsuiten, Build und Artefaktprüfung bestanden. Details und Abnahmefälle: [SELECTION-V2.md](SELECTION-V2.md).

Dies korrigiert den Auswahlfehler, belegt aber keine Prognosegüte. Historische Vintages, Rohkursausführung und Kostenfreigaben fehlen weiterhin. Keine Site-Veröffentlichung.

## Paket 02 · umgesetzt

Ausgangspunkt: `main`, `eb21ca4c9fd52163e612765464815b61a1e1a102`.

- `execution-v3` nimmt das bekannte Open am Intraday-Zielverkaufstag in die obere MAE-Grenze auf. Der Abnahmefall liefert bei Nullkosten −15 % bis −10 %.
- `data-v3`: Research und archivierte Rohkurssimulation verwenden denselben Adapter für Metadaten, OHLC, Duplikate und Börsensitzungen. Doppelte Tage werden dauerhaft ausgeschlossen; auch ungültige zweite Zeilen zählen als Duplikate.
- Rohdatendefekte sperren die API-Simulation vor der Ausführung. Archivierte Szenarien verwenden ihren letzten abgeschlossenen Datentag als Ende; aktuelle Research-Freigabe bleibt streng auf den heutigen Datenstand bezogen.
- Maßnahmenabdeckung und historische Verfügbarkeit werden nicht hochgestuft; Client-Overrides bleiben unwirksam. Referenz unverändert.
- Alle neun Testsuiten, Build und Artefaktprüfung bestanden. Abnahme und Grenzen: [RAW-ADAPTER-MAE.md](RAW-ADAPTER-MAE.md).

## Paket 03 · umgesetzt

Ausgangspunkt: `main`, `8cbe210ba2a32f5ef2432607fcd5772a0e40d65d` (Merge Paket 02).

- `analysis-v1`: gemeinsamer Produktvertrag aus `worker/contract.js` für API und beim Build eingebettete Oberfläche.
- Long-only, ungehebelt, unterstützte US-Aktien/Watchlist, USD; Entscheidung nach Tagesabschluss und bestätigter Verfügbarkeit; frühestens nächstes reguläres Open. Einstiegstag 1, letzter geplanter Ausstieg zum regulären Schluss von Tag 20.
- Szenario-Anlagebetrag in USD sichtbar, editierbar, lokal gespeichert und an Simulation übermittelt; keine Depotverwaltung.
- Aktienrendite am Tag 20, Strategieertrag beim Ausstieg und Kapitalrendite im ganzen Fenster getrennt. Historischer Referenzmittelwert bleibt Proxy ohne Kosten, erwartete Nettorendite unbekannt.
- Vier verbindliche Ergebnisarten sowie getrennte Zustände für unbekannt, nicht geeignet, bewusst Cash und experimentell beobachten. Kein freigegebener geprüfter Kaufstatus.
- Alle zehn Testsuiten, Build und Artefaktprüfung bestanden. Abnahme und Grenzen: [ANALYSIS-CONTRACT.md](ANALYSIS-CONTRACT.md).

## Produktziel
Research für eine eingegebene US-Aktien-Watchlist und maximal 20 Handelstage. Einstieg nächstes reguläres Open, Einstiegstag=Tag1, +5 % Preisziel, Tag20-Close als Zeitausstieg, kein Stop-Loss. Kein gesicherter Profit, keine Netto-Kaufempfehlung, keine Orderausführung. Schrittweise Umsetzung; folgende Planung ist keine automatische Beauftragung.

## Umgesetzt

| Bereich | Stand | Aussagegrenze |
|---|---|---|
| Übersicht | Markttrend SPY, analysierte Watchlist, Datenstand, drei führende Vergleichskandidaten, aufklappbare Gesamtliste | Beste Option nur innerhalb der Watchlist nach alter Referenz |
| Aktiendetails | verständliche Kursbegründung, historische Chancen, experimentelle Verlustausgänge, Risiken, ausgewählte Kalendertermine, virtuelle Vormerkungen | Historische Häufigkeiten nicht als Prognosewahrscheinlichkeiten kalibriert |
| Einstellungen & Methodik | Kostenprofile, Ausführung, Datenprüfung, Alt/Neu-Vergleich, alte Rückprüfung, Formeln und To-dos | Details aufklappbar; bestehende Funktionen erhalten |
| reference-v1 | eingefrorener Kern, Parameter, Hash und synthetische Regression | Ranking weiter alter bereinigter Vergleich ohne Kosten |
| data-v3 | US-Kalender 2021–2027, Zeitzonen, Qualitätsprüfung, getrennte Kursarten/Maßnahmen, R2-Snapshots | 2021–2024 historisch nicht vollständig kalenderverifiziert; Vintages/Maßnahmenabdeckung fehlen |
| execution-v3 | Rohkurs-Engine, Kosten, Gaps/Limits, Splits, Dividenden, Tageskurven, Drawdown, Exkursionen | Synthetisch geprüft; reale Netto-/Drawdown-Ergebnisse gesperrt |
| features-v2 | Trainingsskalierung, Korrelationsdistanz, Trainingsgrenze, Gewichte, Fallqualität, bedingter Block-Bootstrap | Experimentelle Proxy-Schätzung, noch kein zeitlich getrennter Nachweis; Ranking unverändert |
| Brokerpreise | TR Best-/Direktpreis, IBKR, CapTrader, LYNX; Quellen und Prüfstand | Heutige Basispreise, keine historischen Tarifstände; EUR nicht als USD verrechnet |
| Kalender | BLS/Fed/Earnings mit Quellenstatus und Ersatzstand; Punkte je Termin | Keine Modellwirkung; Unternehmenszugriff bisher gesperrt, BLS403; 35 Kalendertage statt exaktem Horizont |
| KI | dokumentiertes To-do | Keine KI-/Newsanbindung |

## Ergebnisbeschriftung ui-v3

1. **Historischer Vergleich auf bereinigten Kursen, ohne Kosten:** Referenzrendite, historische Zielhäufigkeit und alter Walk-forward. Keine behauptete historische Informationsverfügbarkeit.
2. **Retrospektives Kostenszenario mit dokumentierten Annahmen:** modellierte Ausführung, kein bestätigter Fill; reale Ausgabe derzeit gesperrt.
3. **Experimentelle Schätzung:** features-v2, aktuelle sichtbare Kennzahlen weiterhin kostenfreie Proxys. Ergebnisbereich und Mittelwertunsicherheit getrennt.
4. **Auf zeitlich getrennten Daten geprüftes Ergebnis:** derzeit kein freigegebener Netto-Modellvergleich vorhanden. Keine Ergebniszahl bekommt diesen Status allein durch Maturity-Filter oder bestandene Softwaretests.

## Zusammengeführte Kursfreigabe

`fetchHistory()` gibt eine Kursreihe für Research nur bei `quality.usable=true` und aktuellem erwartetem Enddatum frei. Damit gilt dieselbe Akzeptanz für SPY, Referenzrangliste, best, Vergleichsdiagnostik und die verfügbaren Aktien des alten historischen Vergleichs. Der Browser prüft diese Flags und Datumsübereinstimmung defensiv nochmals für Tabelle, Karten und Details. Fehler bleiben in der Qualitätsanzeige sichtbar. Die strengere Datenannahme kann die Zahl der angezeigten Kandidaten reduzieren; Indikatorformeln, Gewichte, Distanzformeln und Exitregeln wurden nicht verändert.

Historische Qualitätsfreigabe ist dadurch noch nicht point-in-time: die heutige Gesamtqualität der geladenen Reihe wird benutzt. Keine neue Behauptung historischer Prognosegüte.

## Anzeige- und Antwortzustände

Watchlistwechsel entfernt alte Kurs-/Ranking-/Detail-/Benchmark-/Backtestwerte und Kalenderzustände. Jeder Research-, Simulations-, Audit- und Kalenderabruf besitzt einen Versionsschutz und Abbruchsignal. Auch verspätete Antworten, die ein Abort ignorieren, werden verworfen. Kostenänderung schützt Simulation; Audit-Symbolwechsel verwirft alte Snapshots. Simulationsanzeigen nennen die geprüfte Aktie. Lade-, Fehler- und Leerzustände sowie Tastaturnavigation sind getestet.

## Prüfung dieser Änderung

`npm test`: Modell/Referenz/Daten/Ausführung/Vergleich/Broker sowie neues vollständiges Inline-UI-Ablaufharness mit synthetischen Antworten. Geprüft: shared quality gate, defekte Aktien-/SPY-Reihen, alte Antworten nach Wechseln, Datenreset bei HTTP-/Netzwerkfehler, drei Tabs, Roving-Tab-Fokus, zentrale Textkontraste ≥4,5:1, responsive CSS und HTML-Struktur. Tests nutzen Mock-DOM/VM, keine echten Trades und keine neuen Anbieterabrufe. Echte Browser- und visuelle Mobile-/Zoomprüfung mangels Browser-Laufzeit hier noch offen. Referenzhash und numerische Regression unverändert.

## Verbleibende Probleme, priorisiert

### P0 – Daten und belastbare Ergebnisbasis
- Veröffentlichungsstände/Vintages und vollständige Maßnahmen inkl. weiterer Kapitalmaßnahmen sowie Dividenden-Zahlungstage beschaffen oder die Einschränkung bewusst beibehalten.
- Historisches Universum/Delistings: heutige kleine Tech-Watchlist rückwirkend ist selektiv.
- Alter `walkForward()` filtert vor Auswahl auf verfügbare spätere Outcomes; mögliche Hindsight-/Availability-Verzerrung separat beheben und prüfen. In diesem UI-Schritt unverändert.
- Paket 06 technisch lokal umgesetzt: execution-v4 für versionierte Rohpreislabels, Szenarien und Portfoliovergleich. Qualifizierte historische Trainingsdaten fehlen weiterhin; experimentelle adjusted-Proxys bleiben separat und werden nicht in Netto umbenannt. Review/Upload/Merge ausstehend; siehe [EXECUTION-LABELS.md](EXECUTION-LABELS.md).
- Paket 04 technisch umgesetzt: Buildcommit-/Parameter-/Kalender-/Snapshotmanifest, unveränderliche Research- und Kostenszenarioarchive, providerfreier Replay mit Integritätsgate. Reale Archivintegration bleibt offen; siehe [REPRODUCIBILITY.md](REPRODUCIBILITY.md).

### P1 – Validierung und Auswahl
- Paket 04 legt Entwicklungs-/Validierungsblöcke, künftigen prospektiven Test 2027, Baselines, Szenariokosten und Hauptmetriken fest. 2026 ist retrospektive Diagnose; vorhandene Versuche bleiben nicht vorregistriert. Qualifizierte Auswertung noch offen.
- Neue Vergleichsmethode fair gegen unveränderte Referenz prüfen; Gewichte/Grenzen nur im Training optimieren.
- Negative Ergebnisse, Kalibrierung, Verlustschwere und tägliche Netto-Drawdowns berichten; keine Verbesserung vor Nachweis.
- Cash-/Trade-Mittel, SPY-Zielstrategie und zusätzlicher Buy-and-hold-/Cashvergleich unterscheiden.
- Bedingter Bootstrap berücksichtigt keinen Refit; Blocklängen und Modellwahlunsicherheit prüfen.
- Paket 04 verankert Sampling am US-Sitzungsraster ab 2021-01-04; fehlender Präfix bleibt sichtbar. Trainingsumfang kann im 1.300-Bar-Fenster weiterhin schrumpfen; kein erfundener Datenergänzungspfad.

### P2 – Produkt und Betrieb
- Visuelle Browserprüfung auf 320/375px, Desktop, 200%-Textzoom und Screenreader ergänzen.
- Brokerprofilkatalog/FX/Zusatzkosten und historische Tarife; keine automatischen Preisupdates bislang.
- Ein-Positions-/Cashfenster, frühzeitige Wiederanlage und Weiterhalten nach Tag20 konzeptionell entscheiden, nicht implizit ändern.
- Datenrechte und Mehrbenutzerbetrieb für Freunde klären; aktuell private Site und gerätelokale Profile/Vormerkungen.
- Keine täglichen Hintergrundläufe oder echte Brokerautomation; Betriebs-/Login-/Orderregeln separat planen.

### P3 – spätere Erweiterungen
- Neue Indikatoren nur einzeln mit belegtem Zusatznutzen.
- Kalenderzugang, exakte Handelstage, differenziertes Markt-/Unternehmensrisiko, historische Terminstände.
- KI/News: Quellen, strukturiertes Schema, Validierung und zusätzlicher Vergleichstest.

## Detaildokumentation
[DATA-BASIS.md](DATA-BASIS.md), [SIMULATION.md](SIMULATION.md), [ANALOGUES.md](ANALOGUES.md), [BROKER-PROFILES.md](BROKER-PROFILES.md), [UI.md](UI.md), [Referenz](../reference/v1/README.md).


## Paket 07 · technisch implementiert

trade-plan-v1 ergänzt decision-time Rohpreisbereich, next-open Gültigkeit, experimentellen Stop und exakte regularSessions-Deadline. Gemeinsamer Kern und Labels behalten die alte Referenz ohne Plan. Konservative Stop/Ziel-Reihenfolge, Gap unter Stop, getrennte Exitgründe und blockierter Tag20-Halt sind geprüft. Vierzehn Suiten plus Build/Artefakt; reale Datenabnahme und Mergeprüfung offen. Details: [TRADE-PLAN.md](TRADE-PLAN.md).

Paket08a: Volumen und experimenteller Präfix-Risikoaudit lokal implementiert; Review/Upload/PR/Merge ausstehend. Details: [RISK-FEATURES.md](RISK-FEATURES.md). Keine Schwellen- oder Kaufstatusfreigabe; Paket08b und reale Datenabnahme bleiben offen.
