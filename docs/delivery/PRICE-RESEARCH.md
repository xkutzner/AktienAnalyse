# Vorläufige Bewertung und Kursszenarien · 06.10.2026

Ausgang: `main` / `4eed08605a25361e2a66802a023e8fb9b32dba3d`. Genau dieses Nutzerpaket, keine neuen Indikatoren oder weitere V-Pakete. Technisch umgesetzt; reale Provider-/Browser-/Prognoseabnahme offen. Keine Veröffentlichung.

## Nutzerergebnis

- Haupttabelle: vorläufige Merkmalsbewertung und vorhandener 0–100-Referenzscore separat von Anlagefreigabe. Alle fünf Merkmale müssen endlich vorliegen; fehlender Wert wird nicht durch Null oder Ersatzscore aufgefüllt.
- Letzter Rohschluss je Aktie in USD, Schlussdatum und ausdrücklicher Tageskursstatus, kein Livekurs. Separater kompakter `time_series`, `adjust=none`, `outputsize=2`-Abruf pro Aktie, parallel zur Historie; keine zusätzliche SPY-Quote. Scheitert er, ist der letzte verfügbare bereinigte Schluss ausdrücklich Ersatzbasis. Keine Ausführungs-, Maßnahmen- oder PIT-Freigabe durch einen Rohschluss.
- Getrennte 1/5/10/20-Handelssitzungs-Kursszenarien: Signal-Schluss t bis Schluss t+h; keine Umrechnung oder Skalierung der bisherigen +5%-Strategierendite. Bereinigter Szenarioanker separat vom Rohschluss sichtbar. Nur endliche positive Preiswerte anzeigen.
- Vorläufige Bewertung bleibt auch bei zu wenigen Vergleichsfällen sichtbar; dann sind Szenariopreise unbekannt. Fehlende Benchmark-/Merkmalsdaten erlauben nur eine Preiszeile mit unbekannter Bewertung. Gescheiterte Aktualisierung kennzeichnet frühere Ergebnisse weiterhin als veraltet.
- Aufklappbare Datenprüfung zeigt vorhandene/verwendete und fehlende/ausgeschlossene Kernmerkmale. Handelswert, Earnings/Maßnahmen und nicht integrierte Makro-/Sektordaten tragen keinen neuen Bewertungseinfluss.

## Berechnung und Grenzen

`price-research-v1` verwendet die unveränderte `features-v2`-Ähnlichkeitsmethode auf eigenständigen Labels `C[t+h]/C[t]−1`, mit dem bisherigen 20-Sitzungs-Raster ab Index 80. Für alle Horizonte konservativ nur Fälle mit vollständig vergangenem 20-Sitzungs-Fenster verwenden; keine neuen jüngeren 1-Tages-Fälle oder überlappenden Raster. Je Horizont vollständige Sitzungspfade und gültige Schlusskurse erforderlich. Trainingsskalierung und Auswahl sind outcome-unabhängig, mindestens 12 Fälle, effektiv 8 und 4 Zeitblöcke. Szenario-Mittelpreis = bereinigter Schlussanker × (1 + gewichteter historischer Mittelwert); Ergebnisbereich aus gewichteten historischen 10.–90.-Perzentilen.

Es handelt sich um Brutto-Kursproxies auf vom Anbieter bereinigten Reihen; mögliche Dividendenanpassung verhindert die Bezeichnung als reine handelbare Rohkursprognose. Mittelwert und historische Ergebnisperzentile sind keine kalibrierte Erwartung/80%-Zukunftsabdeckung. Die vorhandenen Netto-, Kosten-, Ausführungs- und Prognosegates bleiben gesperrt. Kein neuer Rankingalgorithmus, keine Freigabe echter Kaufkandidaten.

Rohquote samt Abruf-/Normalisierungszeit, Quelle, Snapshot-ID und Fehlerzustand wird im unveränderlichen Analyseinput und Manifest archiviert. Replay restauriert diese Beobachtung ohne neue Providerabfrage. Der übergeordnete Recordhash schützt auch die gespeicherte Quote; es wird keine heutige Quote in einen alten Replay eingefügt.

## Prüfung

Erweiterte bestehende Offline-Suiten: unabhängige Horizonte, kein Strategieproxy, Veränderung von t+1 betrifft nur 1-Tages-Label, keine künftigen Beobachtungen, fehlende Zwischen-Sitzungen, nicht endliche Preis-/Merkmalsdaten, zu kurze Analogiehistorie, vorhandene vorläufige Bewertung, sichtbare vier Horizonte, Rohkursabruf und exakter providerfreier Replay einschließlich Fehlerantworten. Bestehende Referenzdateien unverändert. Vollständige 17 Suiten mit gesetztem Sourcecommit einschließlich exaktem Replay, Build und Artefaktprüfung bestanden; tatsächliche Commit-/PR-Nachweise im Abschluss.

Echte Rohquote-/Tarifabnahme, reale Desktop-/Mobilanzeige, Kalibrierung und Prognosegüte weiterhin offen. Neue Providerabfragen können verfügbare Tagescredits belasten; Fehler verhindern keinen bereinigten Researchfallback. Kein Datenkauf, kein Tarifwechsel, keine automatische Order.
