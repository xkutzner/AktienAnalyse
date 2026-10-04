# Paket 06 · Gemeinsame Ausführung und Labels

Stand: 04.10.2026 · Ausgangsbasis `f1b5bbbac6ddc81c7dfaeb6b3f26a962a24db74e`.

`execution-v4` ist der gemeinsame Kern für Kostenszenarien, Portfolio-Strategievergleiche und `execution-label-v1`. Das Label ruft `simulateTrade` direkt auf und liefert Strategieertrag bis Ausstieg sowie Kapitalrendite bis Fensterende. Bereinigte Merkmale bleiben außerhalb dieses Kerns. Die bestehende experimentelle Proxy-Rangliste und `reference/v1` bleiben erhalten. Research führt parallel explizit unbekannte versionierte Ausführungslabels, weil dort qualifizierte Rohpreis-/Maßnahmenvintages fehlen. `netVerified` bedeutet ausschließlich intern qualifizierter modellierter Outcome (Rohbasis, Maßnahmen-/PIT-Prüfung, strict und Verfügbarkeitsindex); es belegt weder reale Ausführung noch Prognosegüte. Nettoanaloga akzeptieren nur das neue Label-/Kernversionspaar, bestätigte PIT-Qualifikation und abgeschlossene, damals verfügbare Outcomes.

## Kosten und Bewertungsdefinitionen

- Gebühren: benutzerdefinierte fixe und proportionale USD-Gebühren oder Brokerbasisprovision. Gleichzeitige aktive Gebührenmodelle werden gesperrt. Brokerprofile benötigen Nullwerte für eigene Gebühren und bleiben heutige, unvollständige Kostenszenarien.
- Spread und Slippage: getrennte nichtnegative bp-Annahmen je Seite. Spread bedeutet einseitige Ausführungskonzession, nicht voller Bid/Ask-Abstand. Beide verändern den Ausführungspreis additiv und werden nicht erneut vom Cash abgezogen. Bereits im Input enthaltene Kosten dürfen nicht ein zweites Mal angesetzt werden.
- Ein Intraday-Limit-Fill bleibt exakt am Limit; Spread/Slippage verändern nur den erforderlichen High-Puffer. Hier wird kein zusätzlicher Geldabzug erfunden. Beim Open-Gap darf der Verkauf nicht unter dem Limit liegen; tatsächliche modellierte Konzession wird proportional den beiden bp-Annahmen zugerechnet.
- Rohpreise, Split-Stückzahlen und Dividendenforderungen sind getrennt. Kauf am Ex-Tag erzeugt keine Forderung; spätere Ex-Tage bei bestehender Position schon. Forderungen bleiben vor Zahlung außerhalb des Cash. Nach frühem Exit bleibt Cash ohne erfundenen Zinsertrag bis Fensterende; spätere Dividendenzahlung wird separat gebucht.
- Brutto nutzt dieselben Trades/Stückzahlen mit ersparten Kosten als unverzinstem Cash; kein unabhängig neu allokiertes Bruttoportfolio. Der intraday angenommene Limit-Fill wird auch brutto zum Limit bewertet.
- USD bleibt die unterstützte Ausführungs-/Ergebniswährung. Andere Ergebniswährungen und fremdwährungsbezogene Dividenden bleiben ohne belegten FX-/Ausführungsweg gesperrt. Kein scheinbarer EUR-Nettowert.

Das aktuelle Prüfprotokoll ist als evaluation-protocol-v2 versioniert und nennt Spread 0 bp ausdrücklich als ungeprüfte Szenarioannahme. Frühere archivierte Protokolle werden nicht verändert. Eine spätere empirische Bewertung benötigt belegte Kostenannahmen.

## Abnahme und offene Grenzen

Dreizehn Suiten einschließlich neuer synthetischer Label-/Simulationsparität, Betrags-/Stückgebühren, separater Spread-/Slippage-Ausführung, FX-/adjusted-/PIT-Sperren und frühem Cash/Dividendenzahlung. Bestehende Referenz-, API-/UI-, Archiv-/Replay- und Datenfähigkeitsregressionen bleiben Teil der Abnahme. Synthetische Daten belegen Softwareverhalten, keine echte historische Qualifikation oder Prognosegüte.

Reale Kosten-/Labelabnahme bleibt offen: keine lokal verfügbare Providerberechtigung, vollständige Kapitalmaßnahmenabdeckung und historische Vintages unbekannt. Keine Datenfreigabe durch Clientflags; drei Capability-Gates bleiben unabhängig evidenzabhängig. Keine neue Ausgabe realer Daten, Veröffentlichung oder Order. Reproduzierbarkeit behält normalisierte Snapshotzeiten, immutable Entscheidungen und providerfreien Replay bei. Neutralbuilds führen SOURCE_COMMIT=null; tatsächlichen Uploadcommit muss der Orchestrator separat bauen/testen.
