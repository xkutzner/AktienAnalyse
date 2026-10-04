# Implementierungsstand und Arbeitswarteschlange

Stand: 04.10.2026. Autoritative Planung: [DEVELOPMENT-ROADMAP.md](DEVELOPMENT-ROADMAP.md). Paketdetails stehen in den jeweils verlinkten Dateien. Dieser Bericht behauptet keine Prognosegüte.

## In main umgesetzt

| Paket | Ergebnis | Commit / Merge | Prüfung |
|---|---|---|---|
| 01 | Präfixbasierte historische Auswahl vor späterer Auswertung; unbekannte Outcomes separat | `b52c1fb` / `eb21ca4` · PR #1 | Neun Testsuiten, Build, Artefakt; eingefrorene Referenz unverändert |
| 02 | MAE mit bekanntem Open; gemeinsamer Rohdatenadapter, Duplikatsperre | `1484678` / `8cbe210` · PR #2 | Abnahme −15 % bis −10 %, Duplikate, OHLC, Metadaten und Kalender; neun Testsuiten, Build, Artefakt |
| 03 | Gemeinsamer Analysevertrag, USD-Szenario-Anlagebetrag, getrennte Renditebasis/Status | `9c87906` / `cf272e2` · PR #3 | Zehn Testsuiten, Build, Artefakt; API/UI-Vertrag und Betragsübertragung geprüft |

Details: [SELECTION-V2.md](SELECTION-V2.md), [RAW-ADAPTER-MAE.md](RAW-ADAPTER-MAE.md), [ANALYSIS-CONTRACT.md](ANALYSIS-CONTRACT.md).

## Offen, in Reihenfolge

| Paket | Status | Ergebnis / Abhängigkeit |
|---|---|---|
| 04 | Als Nächstes | Manifest, archivierte Analysen/Replays, stabiles Sitzungsraster, vorab festgelegtes Prüfprotokoll |
| 05 | Wartet auf 04 | Quellen-/Datenfähigkeiten, getrennte Freigaben, prospektive Sammlung; tatsächlichen Zugang prüfen |
| 06 | Wartet auf 02–05 | Gemeinsamer Label-/Ausführungs-/Kostenpfad |
| 07 | Wartet auf 06 | Einstieg, Stop, Ziel, Enddatum |
| 08a | Wartet auf 05–07 | Handelbarkeit, Gap-/Downside-Risiko |
| 08b | Wartet auf 05–07 | Bestätigte Ereignisse, Verfügbarkeit und Änderungen |
| 09 | Wartet auf 06–08 | Szenarien, Kein-Kauf-Regeln, Analysekarte |
| 10 | Wartet auf 09 | UI-Abnahme und echter Analyse-/Archiv-/Replay-Durchlauf |
| 11 | Wartet auf 04–07 | Zeitlich getrennter Vergleich; qualifizierte Daten sind notwendig |
| 12 | Wartet auf 08 und 11 | Drei Ergänzungsgruppen einzeln auf Mehrwert prüfen |
| 13 | Wartet auf 11–12 | Höchstens ein zusätzlicher Renditeansatz |
| 14 | Wartet auf 10–12 | Prospektiver Schattenbetrieb und Freigabe; benötigt spätere Marktbeobachtungen |
| 15 | Wartet auf stabile Phase 2 | Kapital-/Positionsledger; Prognosestatus getrennt führen |
| 16 | Wartet auf 15 | Tägliche Positionsbewertung bis zum ursprünglichen Enddatum |
| 17 | Wartet auf 16 | Umschichtung mit Kosten und Entscheidungspuffer |
| 18 | Wartet auf 16–17 | Stabiler Tagesbetrieb, Sicherung und Audit |

## Grenzen des aktuellen Produkts

- Research bleibt experimentell auf heute abgerufener bereinigter Historie. Historische Veröffentlichungsstände und vollständige Kapitalmaßnahmenabdeckung fehlen.
- Erwartete Nettorendite und separat definierte Tag-20-Aktienrendite sind weiterhin unbekannt, soweit kein belegter Ausführungspfad vorliegt.
- Aktuelle Rangliste bleibt die bisherige Referenzmethode; keine Prognosefreigabe und kein geprüfter Kaufstatus.
- Kein neuer Stop, keine echte Depotverwaltung und keine automatische Orderausführung.
- Bisherige UI-Prüfung ist strukturell/Mock-DOM. Echte Browser- und Providerabnahme noch offen.
- Keine neue Site-Veröffentlichung durch diese Orchestrierung. GitHub-main und live veröffentlichte Site sind getrennte Stände.

## Orchestrierungsregel

Ein frischer Agent pro Paket, genau ein Paket gleichzeitig, dokumentierte Prüfungen und PR, Merge des getesteten Heads vor dem nächsten Start. Neue Chatfenster lassen sich in dieser Umgebung nicht automatisch öffnen. Fehlende Zugänge und künftige Daten werden als echte Blocker erfasst; kein Paket wird nur durch Dokumentation oder synthetische Tests empirisch freigegeben.
