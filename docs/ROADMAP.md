# Roadmap · tatsächlicher Stand 04.10.2026

## Produktziel
Research für eine eingegebene US-Aktien-Watchlist und maximal 20 Handelstage. Einstieg nächstes reguläres Open, Einstiegstag=Tag1, +5 % Preisziel, Tag20-Close als Zeitausstieg, kein Stop-Loss. Kein gesicherter Profit, keine Netto-Kaufempfehlung, keine Orderausführung. Schrittweise Umsetzung; folgende Planung ist keine automatische Beauftragung.

## Umgesetzt

| Bereich | Stand | Aussagegrenze |
|---|---|---|
| Übersicht | Markttrend SPY, analysierte Watchlist, Datenstand, drei führende Vergleichskandidaten, aufklappbare Gesamtliste | Beste Option nur innerhalb der Watchlist nach alter Referenz |
| Aktiendetails | verständliche Kursbegründung, historische Chancen, experimentelle Verlustausgänge, Risiken, ausgewählte Kalendertermine, virtuelle Vormerkungen | Historische Häufigkeiten nicht als Prognosewahrscheinlichkeiten kalibriert |
| Einstellungen & Methodik | Kostenprofile, Ausführung, Datenprüfung, Alt/Neu-Vergleich, alte Rückprüfung, Formeln und To-dos | Details aufklappbar; bestehende Funktionen erhalten |
| reference-v1 | eingefrorener Kern, Parameter, Hash und synthetische Regression | Ranking weiter alter bereinigter Vergleich ohne Kosten |
| data-v2 | US-Kalender 2021–2027, Zeitzonen, Qualitätsprüfung, getrennte Kursarten/Maßnahmen, R2-Snapshots | 2021–2024 historisch nicht vollständig kalenderverifiziert; Vintages/Maßnahmenabdeckung fehlen |
| execution-v2 | Rohkurs-Engine, Kosten, Gaps/Limits, Splits, Dividenden, Tageskurven, Drawdown, Exkursionen | Synthetisch geprüft; reale Netto-/Drawdown-Ergebnisse gesperrt |
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
- Einheitlicher Ausführungs-/Outcomepfad für Labels, neue Schätzung und täglichen Strategietest fehlt; derzeit Proxys über `simulateTarget()`, separater execution-v2-Kern.
- Vollständige Experimentmanifeste (Snapshotzuordnung, Modellhash, Zeitpunkt, Parameter, Ergebnis) und Replay ergänzen.

### P1 – Validierung und Auswahl
- Vorab festgelegte zeitlich getrennte Entwicklungs-/Testperioden, Kostenannahmen und Benchmarks.
- Neue Vergleichsmethode fair gegen unveränderte Referenz prüfen; Gewichte/Grenzen nur im Training optimieren.
- Negative Ergebnisse, Kalibrierung, Verlustschwere und tägliche Netto-Drawdowns berichten; keine Verbesserung vor Nachweis.
- Cash-/Trade-Mittel, SPY-Zielstrategie und zusätzlicher Buy-and-hold-/Cashvergleich unterscheiden.
- Bedingter Bootstrap berücksichtigt keinen Refit; Blocklängen und Modellwahlunsicherheit prüfen.
- Bewegliches 1.300-Bar-Fenster verschiebt Sampling ab Index80; feste historische Verankerung erwägen.

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
