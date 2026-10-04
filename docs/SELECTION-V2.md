# Paket 01 · Historische Auswahl und spätere Auswertung

Ausgangsbranch `main`, Commit `4094ce7ed01cc2ebb5cacb980a8bb0061e7de72e`.

## Verhalten

`walkForward()` verwendet `selection-v2`. Für jedes bestehende 20-Sitzungs-Fenster prüft es zunächst das Universum am Entscheidungstag, berechnet Merkmale und die Schätzung aus bis dahin abgeschlossenen Trainingsausgängen und legt die Auswahl fest. Erst danach liest es spätere Aktien- und SPY-Kurse.

Die historische Qualitätsprüfung führt `validatePrices()` auf dem Rohantwortpräfix bis einschließlich Entscheidungstag aus. Dadurch zählen Duplikate, ungültige OHLC, Lücken, unterstützte Börse/Währung und Kurssprünge nur, soweit sie im damaligen Präfix vorkommen. Die heutige strenge Freigabe wird weiterhin mit der vollständigen Antwort durchgeführt. Aktuelle Fehler führen weiterhin zu einem gesperrten aktuellen Kandidaten bzw. HTTP 502 bei gesperrtem SPY. Historische Entscheidungen werden auch in dieser Fehlerantwort separat geliefert. Die UI zeigt diese Fehlerhistorie derzeit nicht zusätzlich an.

### Ergebnisvertrag

| Feld | Bedeutung |
|---|---|
| `outcomeStatus: known` | Gewählte Aktie, späteres Proxy-Ergebnis auswertbar |
| `outcomeStatus: unknown` | Gewählte Aktie bleibt erhalten, späteres Ergebnis unbekannt |
| `outcomeStatus: cash` | Am Entscheidungstag keine positive geeignete Auswahl; Fensterertrag 0 |
| `realizedReturn`, `targetHit`, `averageAdverseMove` | Bei unbekanntem Aktienergebnis `null` |
| `benchmarkStatus`, `benchmarkReturn` | SPY separat bekannt/unbekannt; unbekannte SPY-Ergebnisse entfernen keine Aktienentscheidung |
| `decisions` | Vollständige historische Entscheidungen inklusive Universum und gerankten Merkmalen/Schätzungen |
| `recent` | Letzte zehn Entscheidungen, gleiche Struktur |
| `unknownOutcomeCount`, `unknownBenchmarkCount` | Separat gezählte unbekannte Ausgänge |
| `knownOutcomeCount`, `knownWindowCount`, `knownBenchmarkCount` | Explizite Nenner für bekannte Trades, Auswahlfenster einschließlich Cash und SPY |
| `pairedWindowCount` | Fenster mit bekanntem Auswahl- und SPY-Ergebnis |

Renditemittel und Trefferquoten verwenden ausschließlich bekannte Ergebnisse. Fehlende Outcomes zählen nicht als Verlust, Nullertrag oder Nichttreffer. Der Überschuss wird nur über paarweise bekannte Fenster gemittelt. Die verbleibende Stichprobe kann durch fehlende Daten verzerrt sein. Ein verketteter Drawdown wird bei unbekannten Aktienausgängen nicht berechnet (`null`). Der weiterhin vorhandene Drawdown ist ein Fensterrenditen-Drawdown, kein täglicher Depot-Drawdown.

## Abnahme und Referenz

`npm test` enthält zusätzlich `scripts/test-selection.mjs`:

- A/B: A wird gewählt; fehlendes späteres Open ändert die Entscheidung nicht, Outcome bleibt unbekannt.
- Fehlende spätere Sitzung, ungültige spätere OHLC und beliebige spätere Kursänderungen ändern weder Universum, Merkmale, Schätzungen noch Auswahl am betrachteten Entscheidungstag.
- Fehlender späterer SPY-Kurs lässt die Aktienentscheidung bestehen.
- Nach zukünftigen Veränderungen neu aufgebaute Trainingsrecords liefern am betrachteten Entscheidungstag denselben Fit.
- Bewusste Cash-Entscheidung bleibt von unbekannten Outcomes getrennt.
- Spätere rohe Duplikate/Fehler beeinflussen die historische Präfixqualität nicht; bekannte Duplikate sperren sie. Die aktuelle vollständige Qualitätsprüfung sperrt weiterhin.
- API-Integration: Ein späteres Duplikat sperrt AAPL heute, lässt die frühere vollständige Entscheidung unverändert. Ein späterer SPY-Fehler sperrt die aktuelle Analyse, liefert frühere Entscheidungen weiterhin.

`reference/v1` wird nicht bearbeitet. Der Referenztest prüft den bisherigen SHA-256 und die vollständige eingefrorene synthetische Regression einschließlich der alten Walk-forward-Ergebnisse weiterhin. Aktive Merkmale und Prognoseschätzungen werden mit der Referenz verglichen; der bewusst korrigierte Auswahlpfad muss nicht mehr denselben fehlerhaften Backtest erzeugen. Die synthetische Exit-Testfixture verwendet jetzt plausible OHLC (Low 97 bei Close 98).

## Grenzen und nächster Schritt

Die Präfixprüfung simuliert den damaligen Wissensumfang innerhalb heute abgerufener Daten. Sie beweist keine damalige Veröffentlichung, Datenverfügbarkeit oder Unverändertheit bereinigter historischer Kurse. Metadaten sind heutige Angaben. Der bestehende Testbeginn hängt weiterhin von der Länge der Reihe ab; ein festes Sitzungsraster folgt in Paket 04. Keine neue Prognosefreigabe, keine Änderung der aktuellen Ranglistenmethode, keine neue Site-Veröffentlichung.

Paket 02 bleibt offen: insbesondere MAE-Grenzen bei Intraday-Zielverkauf und ein gemeinsamer Rohdatenadapter für Simulation/Research. Der Ausführungskern wurde in Paket 01 nicht verändert.
