# Handelssimulation execution-v3 · 04.10.2026

## Geltungsbereich
Neues, separates Modul `worker/simulation.js`. Der eingefrorene +5%-Referenzkern bleibt unverändert. Die bisherige raw-execution-v1-Hilfsfunktion ist nur für Kompatibilität erhalten; der neue Server-Endpunkt verwendet execution-v3. Keine neuen Indikatoren, kein Stop-Loss.

**Einstiegstag zählt als Handelstag 1.** Entscheidung am abgeschlossenen Tag t; Kauf an der nächsten regulären Eröffnung t+1. Zeitausstieg an der regulären Schlussauktion von t+20, sofern kein früherer Zielverkauf. 20 zählt Börsensitzungen, keine vorhandenen Kurszeilen. Fehlende Sitzungen bleiben im erwarteten Raster, nicht überspringen. Das gleiche Indexschema galt bereits in der Referenz, wird jetzt ausdrücklich benannt.

## Konfiguration
Startkapital standardmäßig 10.000 USD; All-in-Einstieg mit Bruchteilen von Aktien, inklusive reservierter Einstiegsgebühr. Kapital und Gebühren müssen endlich/nichtnegativ sein. Sechs getrennte Kostenparameter:

| Parameter | Standard (Annahme) |
|---|---:|
| Einstiegsgebühr / Ausstiegsgebühr | jeweils 10 bp = 0,10 % |
| Feste Gebühr je Seite | 0 USD |
| Einstiegs-/Ausstiegs-Slippage | jeweils 5 bp = 0,05 % |

Das sind keine Brokerkosten und keine empirisch kalibrierten Handelskosten. `fee=fixed+notional*bps/10000`. Einstiegspreis `Open*(1+entrySlippageBps/10000)`. Stückzahl `(capital-entryFixedFee)/(entryPrice*(1+entryFeeBps/10000))`. Markt-Zeitausstieg `Close*(1-exitSlippageBps/10000)`.

## Verkaufslimit und Lücken
+5 % bezieht sich auf den modellierten tatsächlichen Einstiegspreis, vor Gebühren und ohne Dividenden. Limit über den gesamten Bestand = ursprünglicher Einstiegspreis × ursprüngliche Stückzahl × 1,05 / aktuelle Stückzahl. Splits ändern Stückzahl und Stücklimit invers.

- Eröffnung ≥ Limit: modellierter Preis `max(Limit, Open*(1-exitSlippage))`. Positives Gap kann Mehrerlös erzeugen. Die Teilnahme an der Eröffnungsauktion / Warteschlange und verfügbare Liquidität werden angenommen, nicht aus OHLC bewiesen.
- Intraday: nur wenn `High*(1-exitSlippage) >= Limit`, angenommener Fill **exakt am Limit**. Slippage wird als konservativer Eligibility-Puffer verwendet, nicht als Verkauf unter dem Limit. Ein einfacher Touch ohne Puffer bleibt ungefüllt.
- Auch bei angenommenem Fill bleibt `exitExecutionProven=false`. Keine Tick-, Volumen- oder Orderdaten für sicheren Fillnachweis.
- Negatives Eröffnungsgap: Einstieg zur tatsächlichen nächsten Eröffnung nach Slippage, kein gestriger Close als Ersatz. Kein Stop-Loss.

Fehlt die nächste Eröffnung, gibt es keinen verschobenen Einstieg. Fehlen während offener Position OHLC, sind Wert/Resultat unbestimmt. Dokumentierte Unterbrechung am Einstieg blockiert den Trade; auf anderen Tagen kein Ziel-Fill angenommen. Unterbrechung an Tag20 blockiert den fristgerechten Ausgang. Fehlender Haltfeed ist als Annahme gekennzeichnet, keine bestätigte Unterbrechungsfreiheit. Nach Verkauf reicht im erwarteten Sitzungskalender das Datum für Cashbewertung; fehlende Aktienpreise werden dafür nicht benötigt.

## Cash, Aktien, Dividenden und täglicher Drawdown
Täglicher Nettodepotwert = Cash + aktuelle Stückzahl × regulärer Close + offene Dividendenforderungen. Einstieg-/Ausstiegsgebühren werden beim jeweiligen Fill aus Cash gebucht. Am Ex-Tag Anspruch nur bei Besitz vor der Eröffnung (kein Anspruch bei Einstieg am Ex-Tag). Unbereinigter Betrag × damalige Stückzahl. Bestätigter Zahlungstag wandelt Forderung in Cash um; unbekannter Zahlungstag bleibt unbekannt. Keine Wiederanlage von Forderungen, kein doppeltes Zählen auf dividendenbereinigten Ausführungspreisen.

Bei frühem Verkauf bleibt die tägliche Depotkurve bis Tag20 erhalten: Cash plus eventuell Forderung und spätere bestätigte Zahlung; Trade-Exkursionen enden am Verkauf. Mehrere nicht überlappende 20-Session-Fenster können verkettet werden. Offene unbezahlte Forderungen am Fensterende sperren eine neue All-in-Allokation, statt als handelbares Cash zu gelten. Dies ist eine bewusst begrenzte Ein-Positionssimulation, kein allgemeiner Multi-Asset-Broker.

Täglicher Drawdown `min(equity[t]/max(equity[0..t])-1)` mit Startcash vor Einstieg als Ausgangswert. Nicht der alte Perioden-Drawdown. Intraday-Depotschwankungen können größer sein als der tägliche Drawdown.

Brutto- und Nettoertrag werden je Trade und für das verkettete Portfolio getrennt berechnet. Brutto verwendet **dieselben modellierten Trades und Stückzahlen**, entfernt Gebühren und Marktorder-Slippage. Limitintraday-Fill bleibt derselbe Limitpreis. Ersparte Kosten bleiben im Bruttovergleich als unverzinsliches Cash; keine zweite, anders allokierte Strategie. Formel `(Depotwert bei Ausgang-Startkapital)/Startkapital`. Netto enthält alle sechs Kostenparameter. Dividendenforderungen zählen zum wirtschaftlichen Ertrag, nicht als bereits gezahltes Cash.

## Trade-Exkursionen bis zum tatsächlichen modellierten Ausgang
Preis-Exkursion relativ zum tatsächlichen Einstiegspreis, Bestandswert splitkonsistent. Keine späteren Tage berücksichtigen.
- Ganzer Haltetag / Schlussausstieg: High/Low der gehaltenen regulären Sitzung, inklusive nachteiligem Markt-Ausgangspreis.
- Eröffnungsausgang: ausschließlich Open/Fill; kein späteres High/Low.
- Intraday-Limitausgang: vorherige vollständig gehaltene Tage + Zielpreis für MFE; kein späteres Tageshoch. Die Position hat das Ziel erreicht; Reihenfolge von Low und Ziel unbekannt. `mae=null`, `maeBounds=[worstPossibleBeforeExit,bestKnown]`, nicht scheinexakt das gesamte Tagestief. Ergebnis bleibt angenommene Ausführung.

## Datenzugang und Oberfläche
Kostenfelder auf der Site werden serverseitig validiert. „Gesicherte Rohdaten mit Kosten prüfen“ nutzt nur bestehende Archiv-Snapshots für adjust=none, Splits und unbereinigte Dividenden derselben Aktie. Keine neuen Anbieterabrufe bei einer Kostenänderung. Strenge historische Verfügbarkeit kann nicht vom Browser freigeschaltet werden. Ohne Entscheidungstag würde das letzte vollständig geplante 20-Session-Fenster ausgewählt; die aktuelle Datenfreigabe scheitert vorher an unbestätigter Maßnahmen-/Vintage-Abdeckung.

Der aktuelle Adapter setzt `coverageVerified=false`, `pointInTimeVerified=false`: **keine freigegebenen realen Netto-/Drawdown-Ergebnisse**. UI zeigt unbekannt statt erfundener Statistik. Die neue Logik ist mit ausdrücklich synthetischen definierten Datensätzen geprüft. Die Referenz bleibt als retrospektiver Periodenvergleich sichtbar.

## Gezielte Prüfung
`node scripts/test-simulation.mjs` (auch in `npm test`): Ziel an Tag1, Zeitausstieg Tag20, Eröffnungsgap, Limit-Touch/Puffer, Gebühren und Slippage, fehlende Eröffnung/folgende Kurse, bekannte Unterbrechung, Split und Reverse-Split, Anspruch am Ex-Tag, Zahlung vor/nach frühem Verkauf, unbekannter Zahlungstag, MAE/MFE ohne spätere Preise, Cashkurven, täglicher Portfolio-Drawdown. Lauf ohne Netzwerk oder Schlüssel. Kein Live-Fillnachweis und keine neue Performancebehauptung.

## Automatischer Ablauf
Die Standardkosten werden bei jeder Analyse automatisch verwendet. Die Oberfläche erfordert keinen manuellen Simulationsstart mehr; Kostenfelder liegen im Tab „Broker & Kosten“. Archivierte Audit-Daten werden bei Verfügbarkeit automatisch mit den Kosten geprüft. Ohne qualifizierte Daten wird die Sperre automatisch angezeigt, statt einen nutzlosen Prüfknopf anzubieten. Es werden dadurch keine zusätzlichen kostenpflichtigen Kapitalmaßnahmen-Abrufe ausgelöst.

## Brokerprofil
Der eigene Broker-/Tarifname und die sechs Kostenparameter werden lokal im Browser gespeichert (`aktienlabor-cost-preferences-v1`), validiert und automatisch angewendet. Standardprofil: 10 bp Gebühren und 5 bp Slippage je Seite, feste Gebühren 0 USD. Keine vorgegebenen Anbieterpreise, keine Brokeranbindung. Slippage bleibt eine Marktannahme. Nur das einfache additive Gebührenmodell ist unterstützt; FX, Mindestgebühren, Steuern und Sondertarife fehlen. Die Datensperre bleibt unverändert. Analysepanels sind ausschließlich im Analyse-Tab sichtbar.

## Vorgegebene Brokerprofile
Siehe [BROKER-PROFILES.md](BROKER-PROFILES.md): offizielle heutige Tarife und Quellen; eigenständige Broker-Basisprovision statt manueller Gebühren, Mindest-/Stückgebühren, USD-Kostenszenario nur mit ganzen Einstiegsstücken. Strenge historische Ergebnisse bleiben gesperrt. Trade Republic EUR wird nicht als USD behandelt. Slippage bleibt ein eigener Parameter.


## Paket 02: MAE-Grenze und Rohdatenprüfung

Bei einem angenommenen Intraday-Zielverkauf zählt das Open nach Split-Normierung zum bereits bekannten Zwischenverlust. Die untere Grenze berücksichtigt zusätzlich das möglicherweise vor dem Verkauf liegende Low; dessen zeitliche Reihenfolge bleibt unbekannt. Einstieg 100, bisheriges Low 99, folgendes Open 90 / Low 85 / High 106, Ziel 105 und Nullkosten ergeben −15 % bis −10 %. Ein Verkauf am Open berücksichtigt weiterhin kein späteres Tagestief.

Die API baut Ausführungsreihen über `adaptRawSnapshot()` aus demselben Adapter wie Research. Doppelte Rohdatentage, OHLC-Fehler, unsupported Metadaten und Sitzungslücken sperren die Simulation vor dem Ausführungskern. Historische Maßnahmenfreigaben werden dadurch nicht erteilt.
