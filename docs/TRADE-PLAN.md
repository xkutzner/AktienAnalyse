# Paket 07 · Einstieg, Stop, Ziel und Enddatum

Stand 04.10.2026 · Ausgangsmain `f39787373f4871c7be3870e381c4bb8c581438c8`.

`trade-plan-v1` ergänzt eine explizite experimentelle Konfiguration des gemeinsamen execution-v4-Kerns. Ohne Plan bleibt die alte +5%-Strategie ohne Stop erhalten, ebenso die Referenzrangliste und reference/v1. Labels und Simulation verwenden denselben Kern und denselben optionalen Plan. Die Planversion und vollständigen Parameter stehen separat im Archivmanifest; immutable Request/Replay bewahrt Plan und Theseereignisse.

`createTradePlan` / POST `/api/tradeplan` benötigen Entscheidungstag, asOf, belegtes closeAvailableAt, unterstützten MIC, raw-Schluss und Preisbasis. Kein aktuelles Datum wird als Default eingesetzt. Nur der letzte abgeschlossene reguläre Schluss mit bereits verfügbarem Preis wird akzeptiert; Sommerzeit und frühe Schlüsse folgen dem gemeinsamen Kalender. Der Plan benutzt ausschließlich diese Entscheidungsinputs und die nächsten 20 regularSessions, keine späteren OHLC. Eingabe einer Verfügbarkeitszeit ist eine Szenariobehauptung, keine Providerqualifikation.

Der zulässige modellierte Füllpreis liegt standardmäßig ±1% um den bekannten Rohschluss. Einstieg ausschließlich am nächsten regulären Open, letzter Ausstieg am Schluss der zwanzigsten Sitzung; außerhalb des Bereichs verzichten/neu entscheiden, niemals Einstieg verschieben oder Deadline verlängern. Der einfache Stop liegt standardmäßig 5% unter dem tatsächlich modellierten Einstiegspreis und wird bei Splits in Stückzahlen umgerechnet. Beide Defaults sind experimentelle Szenarioannahmen, keine erfundenen Nutzer-Risikopräferenzen. Ziel bleibt +5%. Adjusted Research erhält keinen scheinbar ausführbaren Rohpreisplan.

Exitgründe und Kategorien sind separat: Ziel, Stop, Zeitablauf und Theseverlust. Theseereignisse sind explizite Szenarioinputs mit Datum, availableAt und phase=before-open. Nur vor dem tatsächlichen regulären 09:30-New-York-Open verfügbare Ereignisse werden am betreffenden Open berücksichtigt (Sommerzeit eingeschlossen); intraday Ereignisfeeds und automatische Thesenbewertung sind nicht implementiert.

Ein negativer Gap durch den Stop füllt modelliert am Open abzüglich Ausführungskonzession, auch unter dem Stop. Berühren Low und High Stop und Ziel bei unbekannter Reihenfolge, gilt konservativ Stop zuerst. `exitPriceBounds` bezeichnet nur die zwei modellierten Triggeralternativen, keine reale garantierte Ausführungsbandbreite; MAE bleibt als Intervall. Stop-Fills sind ausdrücklich angenommen. Ein belegtes Ziel am Open geht einem erst später berührten Stop vor. Halt verhindert Ausführung; nicht ausführbarer Tag20 bleibt blocked/partial mit ursprünglicher plannedEndDate. Keine spätere Ersatzsitzung.

Vierzehn synthetische Suiten, Build und Artefaktprüfung umfassen Gap, Entrybar mit beiden Triggern, Labelparität, Day20-Halt, exakte Kalenderdeadline, DST/earlyclose, fehlende Verfügbarkeit/MIC, Verzicht ohne Verschieben, getrennte Exitkategorien und unveränderte Referenz. Tatsächlicher Uploadcommit wird vom Orchestrator separat geprüft; Neutralbuild hat SOURCE_COMMIT=null.

Reale Provider-/PIT-/Maßnahmenabnahme bleibt offen. Die drei Capability-Gates bleiben gesperrt, Simulation akzeptiert keine Clientfreigabe der Maßnahmenabdeckung. Keine Nettofreigabe, keine Orders oder Veröffentlichung. Risiko-/Featurepaket08 und Produktkarte09 sind nicht Teil dieses Pakets.

Paket08a ergänzt getrennte experimentelle Präfix-Risikowerte; [RISK-FEATURES.md](RISK-FEATURES.md). Adjusted Research bleibt ohne ausführbaren Rohpreisplan; die Risikoergänzung verändert keine Einstieg-/Stopregel und qualifiziert keine Datenfreigabe.
