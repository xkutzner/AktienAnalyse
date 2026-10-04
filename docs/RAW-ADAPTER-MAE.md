# Paket 02 · Verlustgrenzen und gemeinsame Rohdatenprüfung

Ausgangsstand: `main`, Commit `eb21ca4c9fd52163e612765464815b61a1e1a102`.

## Änderung

`execution-v3` berechnet beim Intraday-Zielverkauf den bereits bekannten Verlust am Open als Bestandteil der oberen MAE-Grenze. Das Low bleibt Bestandteil der unteren Grenze, weil OHLC die Reihenfolge von Tief und Zielverkauf nicht belegt. Split-Normierung erfolgt über die aktuellen Stückzahlen wie im bestehenden Kern. Ein Open-Zielverkauf nimmt kein späteres Low auf.

`data-v3` stellt `adaptPrices()` als gemeinsame Normalisierung bereit. `validatePrices()` für Research und `adaptRawSnapshot()` für archivierte Ausführungssnapshots verwenden diese Funktion. Unterstützte Börse, USD, Zeitzone, Kalender, abgeschlossene Sitzung, OHLC, Duplikate und fehlende Sitzungen werden damit identisch behandelt. Der separate Map-Parser der Simulations-API wurde entfernt.

Doppelte Tage werden komplett ausgeschlossen statt überschrieben. Duplikate zählen auch dann, wenn die zweite OHLC-Zeile ungültig ist. Eine dritte Zeile kann den Tag nicht wiederherstellen. Der Adapter bewahrt auch einen ungültigen ersten Sitzungstag im Sitzungsraster als fehlend. `sessionBars` ist das erwartete Raster; `bars` enthält nur normalisierte gültige, eindeutige Zeilen.

Aktuelle Research-Abfragen prüfen weiterhin Aktualität bis zum letzten heute abgeschlossenen Handelstag. Ein archiviertes Ausführungsszenario wird bis zu seinem letzten gemeldeten unterstützten Sitzungstag geprüft, maximal bis zur zum Prüfzeitpunkt abgeschlossenen Sitzung. Diese unterschiedliche Aktualitätsanforderung ist explizit; die Normalisierungsregeln sind gemeinsam.

Die Simulation liefert bei Rohdatendefekten `status: blocked`, `dataQuality` und unbekannte Renditen. Bei sauberen Rohpreisen bleiben Maßnahmenabdeckung und historische Verfügbarkeitsprüfung separat erforderlich. Weder der Adapter noch Client-Felder setzen `coverageVerified` oder `pointInTimeVerified` auf wahr.

## Abnahmefälle

| Fall | Erwartung |
|---|---|
| Einstieg 100, vorheriges Low 99, Open 90 / Low 85 / High 106, Ziel 105, Nullkosten | MAE-Grenzen −15 % bis −10 % |
| Gleiche wirtschaftliche Preise nach Split 4:1 | Identische MAE-Grenzen |
| Intraday-Ziel am Einstiegstag, Open 100 / Low 85 | −15 % bis 0 % |
| Zielverkauf am Open 106, späteres Low 85 | Späteres Low ausgeschlossen; vorherige MAE −1 % bleibt |
| Gültige zweite, ungültige zweite oder dritte Rohdatenzeile am gleichen Tag | Tag ausgeschlossen; Simulation gesperrt |
| EUR, unsupported MIC oder falsche Zeitzone | Datenprüfung und API-Simulation gesperrt |
| Fehlender mittlerer Sitzungstag | Kalenderlücke explizit; keine Zeitkompression |
| Ungültige erste Sitzung / Nicht-Handelstag / noch laufende Sitzung | Fehler bzw. Ausschluss sichtbar |
| Saubere Rohpreise, Client behauptet Maßnahmen-/PIT-Freigabe | Simulation weiterhin wegen fehlender serverseitiger Freigabe gesperrt |

Prüfungen sind in den bestehenden `test-data.mjs` und `test-simulation.mjs` ergänzt. Paket-01-Mutationstests und vollständige Referenzregression laufen unverändert weiter.

## Grenzen

Synthetische Tests belegen Rechen- und Sperrverhalten, keine Prognosegüte oder tatsächlichen Fills. Historische Vintages, vollständige Maßnahmenabdeckung und echte Intraday-Reihenfolgen fehlen weiterhin. Der Kalenderumfang bleibt 2021–2027. Keine Site-Veröffentlichung. Paket 03 ist noch offen.
