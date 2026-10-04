# Paket 03 · Verbindlicher Analysevertrag analysis-v1

Ausgangspunkt: `main`, `8cbe210ba2a32f5ef2432607fcd5772a0e40d65d`, nach Merge von Paket 02.

`worker/contract.js` enthält die Produktdefinitionen. Die API liefert sie über `/api/contract` und in Research-/Simulationsantworten. Der Build ersetzt den Vertragsplatzhalter der Oberfläche über `scripts/render-page.mjs` mit denselben Definitionen. Bei einer fremden Vertragsversion in einer Research-Antwort verlangt die UI Neuladen.

## Geltungsbereich und Zeit

Long-only, ungehebelt; zunächst unterstützte US-Aktien in USD aus der angegebenen Watchlist. Entscheidung nach abgeschlossenem Tageskurs und bestätigter Datenverfügbarkeit. Einstieg frühestens zur nächsten regulären Eröffnung. Der Einstiegstag ist Handelstag 1; letzter geplanter Ausstieg ist der reguläre Schluss von Tag 20. Ein fehlendes Open wird nicht verschoben. Ein fehlender Ausstieg wird nicht durch eine verlängerte Strategie ersetzt. Die bestehende historische Referenz ist weiterhin ein bereinigter Proxy, keine handelbare Rohkursausführung.

## Szenario-Anlagebetrag und Kosten

Standard 10.000 USD. Sichtbares editierbares Feld in Broker/Kosten, lokal gespeicherte Einstellung. Der Betrag wird als `capital` in USD an die Simulations-API übertragen und vom Server validiert; positive endliche Zahl, mindestens 0,01 USD, Cent-Schritte. Ungültige Beträge verhindern einen aktuellen Simulationswert. Eine Änderung invalidiert laufende Simulationen, sodass alte Antworten keinen früheren Betrag wieder anzeigen.

Fixe Gebühren sind pro Order in USD, variable Gebühren/Slippage in Basispunkten. Die bestehenden Brokerprofile behalten ihre Währungs- und historischen Datensperren. EUR-Nettorendite wird ohne FX-Daten nicht behauptet. Der Betrag ist weder erfasstes Depotkapital noch eine Orderfreigabe. Feste Gebühren verändern bei gleichem Trade die Kapitalrendite abhängig vom Betrag; dies ist synthetisch geprüft.

## Renditebasis

| Feld | Definition und derzeitiger Stand |
|---|---|
| `returnMetrics.historicalStrategyMean` | Historischer mittlerer Strategie-Proxy auf bereinigten Vergleichskursen ohne Kosten; bestehendes `expectedReturn` bleibt als kompatibles Legacy-Feld erhalten |
| `returnMetrics.stockAt20` | Aktienrendite vom nächsten regulären Open bis Schluss von Tag 20, unabhängig von frühem Strategieausstieg; derzeit separat unbekannt (`null`), kein Proxy-Ersatz |
| `returnMetrics.strategyNet` | Modellierter Nettoertrag bis zum Strategieausstieg; unbekannt bei gesperrter Ausführung |
| `returnMetrics.capitalWindowNet` | Gesamter Szenario-Anlagebetrag bis Schluss von Tag 20, einschließlich Cash nach frühem Verkauf; nur bei vollständigem bekanntem Simulationsfenster |
| `expectedNetReturn` | Prognostische Nettorendite; bleibt ohne Nachweis `null` |

Die Definitionen sind auch in der UI sichtbar. Früher Strategieverkauf und danach unverändertes Cash können denselben Zahlenwert für Strategie- und Fensterertrag erzeugen; die Größen bleiben dennoch getrennt. Die separate Aktienrendite wird hier noch nicht neu berechnet. Der gemeinsame vollständige Label-/Ausführungspfad folgt in Paket 06.

## Ergebnisart und Zustand

Die vier Ergebnisbezeichnungen sind verbindlich: **Historischer Vergleich**, **Retrospektives Kostenszenario**, **Experimentelle Schätzung**, **Auf zeitlich getrennten Daten geprüft**. Sie beschreiben die Evidenzart und sind von den Entscheidungszuständen getrennt.

| `analysisStatus` | Bedeutung |
|---|---|
| `unknown` | Nicht beurteilbar: Daten/Schätzung/Ausführung fehlen |
| `notSuitable` | Nicht geeignet nach der vorhandenen experimentellen Referenzregel: bekannter historischer Mittelwert nicht positiv |
| `cash` | Bewusst Cash halten: alle angefragten Kandidaten sind beurteilbar und nicht geeignet |
| `experimental` | Experimentell beobachten: positiver historischer Referenzkandidat; keine geprüfte Kaufempfehlung |

Fehlende angefragte Symbole werden für die Gesamtentscheidung als unbekannt berücksichtigt; sie verwandeln eine unvollständige Prüfung nicht in eine sichere Cash-Entscheidung. Der Vertrag setzt `validatedPurchaseReleased=false`. Keine historische Häufigkeit oder historischer Mittelwert wird zu einer geprüften Nettoprognose umbenannt. Harte Risiko-/Liquiditätssperren und vollständige Analysekarte folgen in Paket 09.

## Prüfung und Grenzen

`test-contract.mjs` prüft den identischen Vertrag in API und tatsächlich gerenderter Worker-Seite, Betrags-/Währungs-/Horizont-/Long-/Hebelvalidierung, Zustände, unbekannte Nettofelder, fixe Gebühren und getrennte Renditebasen. Die UI-Tests prüfen die Betragsübertragung und Abwehr einer verspäteten Simulationsantwort nach ungültiger Eingabe. Alle bisherigen Paket-01-/02- und Referenzprüfungen bleiben enthalten.

Keine neue Prognosefreigabe, keine historische PIT-Verifikation, keine Depotverwaltung und keine Site-Veröffentlichung. Die Oberfläche wurde im bestehenden Mock-DOM geprüft; echte Browserabnahme bleibt Paket 10. Paket 04 ist offen.
