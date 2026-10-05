# Paket 05 · Datenfähigkeiten und unabhängige Freigaben

> V04-Fortschreibung 05.10.2026: [Reale Datenabnahme und Beschaffungsliste](delivery/V04-DATENABNAHME.md). Kein ausführbarer autorisierter Provider-/Archivzugang im aktuellen Kontext; tatsächliche Kontoprobe, Lizenz und Archiv weiter blockiert. Upgradeentscheidung nicht entscheidbar ohne Angebot/Entitlements. Keine Änderung an Gates oder Adaptercode.

Basis: main `78a14ca9709901961dacee100d39ce11d22bc30c`. Technisch vorbereitet, tatsächliche Datenabnahme **nicht geprüft**. Kein Prognosenachweis.

## Zugang und dokumentierte Quellen

Lokaler Preflight am 04.10.2026: `TWELVEDATA_API_KEY` und `SOURCE_COMMIT` fehlen. Keine Provideranfrage mit echten Credentials, keine kostenpflichtige Buchung, keine Veröffentlichung. Daraus folgt keine Aussage über Secrets eines bestehenden Site-Servers. Reale BUCKET-Integration, Archivlizenz und historische Vintages sind nicht geprüft.

| Quelle | Implementierter Umfang / Historie | Aktualität / damalige Verfügbarkeit | Kosten / tatsächlicher Zugang |
|---|---|---|---|
| Twelve Data `/time_series`, `adjust=none` | Tägliches OHLC, maximal 1.300 angeforderte Balken je Symbol, US/USD; tatsächlichen Zeitraum separat aus Antwort führen | Normalisierung gegen letzte abgeschlossene Sitzung; Abrufzeit ist kein damaliger Verfügbarkeitsbeleg | Kontotarif und reale Rohdaten nicht geprüft |
| Twelve Data `/time_series`, `adjust=all` | Bereinigte Merkmalsreihe; dieselbe Fensterbegrenzung | Heute abgerufene Historie kann revidiert sein; keine Vintage | Kontotarif und reale Reihe nicht geprüft |
| Twelve Data `/splits` | Angefordert 2021-01-01 bis Abrufdatum; beobachteter Zeitraum separat | Veröffentlichungszeit und Abdeckung unbekannt, leere Antwort beweist keine Maßnahmenfreiheit | Freischaltung, Gewicht und Lizenz im tatsächlichen Konto nicht geprüft |
| Twelve Data `/dividends`, `adjust=false` | Angeforderter Zeitraum wie Splits; Zahlungstage nicht erfunden | Leere Antwort, fehlender Zeitraum oder Fehler bleiben unqualifiziert | Freischaltung, Gewicht und Lizenz im tatsächlichen Konto nicht geprüft |
| NYSE reguläre Sitzungen | Versionierte lokale Tabelle 2021–2027; aktuelle offizielle Seite dokumentiert 2026–2028 | Historische Qualifikation vor 2025 eingeschränkt; außerplanmäßige Schließungen unbekannt; keine automatische Erweiterung auf 2028 | Öffentliche Dokumentation gelesen; kein separater Live-Kalenderadapter abgenommen |
| BUCKET Snapshot-/Analyse-/Sammlungsarchiv | Conditional Create, SHA256 und immutable UUID-Objekte | Beginn ab tatsächlichen Abrufen; kein rückwirkender PIT-Beleg | In-Memory getestet; reale Integration und Speicher-/Lizenzkosten nicht geprüft |

Öffentliche Primärquellen geprüft am 04.10.2026:

- [Twelve Data API-Dokumentation](https://twelvedata.com/docs/markets/market-state): `adjust` unterstützt `all`, `splits`, `dividends`, `none`; Standard `splits`. Die explizite Parametrisierung ist daher notwendig.
- [Twelve Data Anpassungen](https://support.twelvedata.com/en/articles/5179064-are-the-prices-adjusted): Tagesreihen sind standardmäßig splitbereinigt; Splits-/Dividendenendpunkte existieren. Daraus folgt keine Maßnahmenvollständigkeit oder PIT-Garantie.
- [Credits](https://support.twelvedata.com/en/articles/5615854-credits) und [Preise](https://twelvedata.com/pricing): Endpunktgewichte und Kontingente bestimmen Verbrauch; das öffentliche Beispiel nennt einen Credit je Symbol für `/time_series`. Keine Folgerung auf Freischaltung, tatsächlichen Gesamtpreis oder Archivrecht des unbekannten Kontos. Die UI enthält keinen ungeprüften pauschalen Corporate-Action-Preis mehr.
- [NYSE Kalender](https://www.nyse.com/trade/hours-calendars): 2026/2027 Feiertage und frühe Schließungen entsprechen dem unterstützten Kalenderstand. 2028 bleibt außerhalb der implementierten Tabelle.

## Maschinenlesbare Grenzen und drei Gates

`data-capabilities-v1` trennt pro Quelle Zugang (`not-checked` / `observed` / `incomplete`), Antwortform, Zeitraum, Abrufzeit, Datenqualität, Archiv und Abdeckung. Eine erfolgreiche Anfrage ist keine Qualifikation. `GET /api/capabilities` liefert die Grenzen ohne Anbieterabruf; `/api/data`, Research und Simulation ergänzen beobachtete Quellen. Historische Analysen und Replay berechnen diese Felder ausschließlich aus denselben archivierten Quellen, ohne aktuelles Environment oder aktuelle Uhrzeit.

Die Freigaben sind unabhängig: `retrospectiveCostScenario` verlangt dokumentierte Rohpreis-/Maßnahmenbasis und Ausführung/Kostenabnahme; `historicalModelValidation` verlangt qualifizierte historische Vintages/Verfügbarkeiten und zeitliche Auswertung; `empiricalForecastQuality` verlangt unangetasteten Test, Baselines und Unsicherheit. Alle bleiben derzeit gesperrt. Das Modul nimmt keine Client-Overrides oder pauschalen `coverageVerified`-/`pointInTimeVerified`-Schalter an. Eine spätere evidenzbasierte Freigabelogik benötigt einen eigenen qualifizierten Vertrag; Paket 05 erfindet keinen solchen Nachweis.

## Prospektive Sammlung

`POST /api/collection` mit JSON `{"symbol":"AAPL"}` ruft ausdrücklich vier Reihen ab (bereinigt, roh, Splits, Dividenden). Kein automatischer Scheduler und kein zusätzlicher Abruf bei normaler Watchlistanalyse. Der Pfad benötigt den Server-Key und BUCKET, erstellt einen unveränderlichen Sammlungsdatensatz mit Snapshot-Hashes, Quellcommit (null wenn unbekannt), Abrufbeobachtungen und `historicalVintageStatus: unknown`. Fehlende Credentials stoppen vor dem Netz; fehlende Speicherung oder Konflikt verhindern einen Erfolg. Archivierte Providerfehler dürfen als Fehlversuchbeobachtung gespeichert werden; sie qualifizieren keine Daten.

`GET /api/collection?id=<UUID>` prüft Datensatz und alle Snapshots ohne Providerfallback. Wiederholte POSTs sind neue Beobachtungen und überschreiben nichts. Die Sammlung dokumentiert erstmaliges tatsächliches Abrufen, keine historische Veröffentlichung und keine Entscheidung vor dem nächsten Open (`decisionBeforeNextOpenStatus: not-evaluated`). Der Prüfzeitraum des Protokolls wird dadurch nicht rückwirkend verändert.

**Echter Sammelstart offen:** kein autorisierter lokaler Key/BUCKET verfügbar. Nach berechtigter Serverkonfiguration kann der explizite Pfad ausgeführt werden. Regelmäßiger Betrieb, Entscheidungen vor Open und spätere Outcome-Beobachtung bleiben Aufgaben der späteren Pakete.

## Prüfung

Zwölf Testsuiten: bestehende Regressionen plus Credentials/no-network, getrennte Gates, leere Actions/unknown, vier Quellen, Providerfehler, immutable Sammlung und Manipulations-/Verlustsperre. Replay wird zusätzlich mit explizitem synthetischem Test-SHA geprüft; das ist keine Produktionsidentität. Finaler neutraler Build enthält null; Root erstellt nach Commit den Build mit tatsächlichem SHA. Build/Artefaktprüfung ersetzen keinen Live-Durchlauf und keine Prognoseprüfung.
