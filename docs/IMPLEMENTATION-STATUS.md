# Implementierungsstand und Arbeitswarteschlange

Stand: 04.10.2026. Autoritative Planung: [DEVELOPMENT-ROADMAP.md](DEVELOPMENT-ROADMAP.md). Paketdetails stehen in den jeweils verlinkten Dateien. Dieser Bericht behauptet keine Prognosegüte.

## In main umgesetzt

| Paket | Ergebnis | Commit / Merge | Prüfung |
|---|---|---|---|
| 01 | Präfixbasierte historische Auswahl vor späterer Auswertung; unbekannte Outcomes separat | `b52c1fb` / `eb21ca4` · PR #1 | Neun Testsuiten, Build, Artefakt; eingefrorene Referenz unverändert |
| 02 | MAE mit bekanntem Open; gemeinsamer Rohdatenadapter, Duplikatsperre | `1484678` / `8cbe210` · PR #2 | Abnahme −15 % bis −10 %, Duplikate, OHLC, Metadaten und Kalender; neun Testsuiten, Build, Artefakt |
| 03 | Gemeinsamer Analysevertrag, USD-Szenario-Anlagebetrag, getrennte Renditebasis/Status | `9c87906` / `cf272e2` · PR #3 | Zehn Testsuiten, Build, Artefakt; API/UI-Vertrag und Betragsübertragung geprüft |
| 04 | Manifest, immutable Archive/Replay, festes Raster und Prüfprotokoll | `19c77e2` / `c3e92a4` · PR #4 | Elf Testsuiten mit tatsächlichem Sourcecommit, bytegenaue Git-Prüfung, Build und Artefakt; Liveintegration offen |
| 05 | Quellenfähigkeiten, unabhängige Gates und immutable Sammlung; Datenabnahme offen | `a23ba9e` / `a396b1e` · PR #5 | Zwölf Testsuiten mit tatsächlichem Sourcecommit, 14 bytegenaue Git-Blobs inklusive Referenz, Build und Artefakt |
| 06 | Gemeinsamer execution-v4-Kern und execution-label-v1; getrennte Kosten und FX-Sperren | `28d51aa` / `2d45819` · PR #6 | Dreizehn Suiten mit tatsächlichem Sourcecommit, 20 bytegenaue Git-Blobs inklusive Referenz, Build und Artefakt; reale Datenabnahme offen |

| 07 | Versionierter Einstieg, experimenteller Stop und festes Kalenderenddatum | `2820c4a` / `3c100d9` · PR #7 | Vierzehn Suiten mit tatsächlichem Sourcecommit, 16 bytegenaue Git-Blobs inklusive Referenz, Build und Artefakt; reale Ausführungsabnahme offen |

Details: [TRADE-PLAN.md](TRADE-PLAN.md), [EXECUTION-LABELS.md](EXECUTION-LABELS.md), [DATA-CAPABILITIES.md](DATA-CAPABILITIES.md), [REPRODUCIBILITY.md](REPRODUCIBILITY.md), [SELECTION-V2.md](SELECTION-V2.md), [RAW-ADAPTER-MAE.md](RAW-ADAPTER-MAE.md), [ANALYSIS-CONTRACT.md](ANALYSIS-CONTRACT.md).


## Offen, in Reihenfolge

| Paket | Status | Ergebnis / Abhängigkeit |
|---|---|---|
| 08a | In Umsetzung, eigener neuer Agentkontext | Handelbarkeit, Gap-/Downside-Risiko |
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

- Archivierung/Replay sind technisch synthetisch geprüft; der tatsächliche Quellcommit ist bytegenau geprüft und im finalen Testbuild eingebettet; reale Provider-/Archivintegration bleibt offen. Bestehende Experimente sind nicht rückwirkend vorregistriert.
- Research bleibt experimentell auf heute abgerufener bereinigter Historie. Historische Veröffentlichungsstände und vollständige Kapitalmaßnahmenabdeckung fehlen.
- Erwartete Nettorendite und separat definierte Tag-20-Aktienrendite sind weiterhin unbekannt, soweit kein belegter Ausführungspfad vorliegt.
- Aktuelle Rangliste bleibt die bisherige Referenzmethode; keine Prognosefreigabe und kein geprüfter Kaufstatus.
- Optionaler experimenteller Stop im Tradeplan, keine echte Depotverwaltung und keine automatische Orderausführung.
- Bisherige UI-Prüfung ist strukturell/Mock-DOM. Echte Browser- und Providerabnahme noch offen.
- Keine neue Site-Veröffentlichung durch diese Orchestrierung. GitHub-main und live veröffentlichte Site sind getrennte Stände.

## Orchestrierungsregel

Ein frischer Agent pro Paket, genau ein Paket gleichzeitig, dokumentierte Prüfungen und PR, Merge des getesteten Heads vor dem nächsten Start. Neue Chatfenster lassen sich in dieser Umgebung nicht automatisch öffnen. Fehlende Zugänge und künftige Daten werden als echte Blocker erfasst; kein Paket wird nur durch Dokumentation oder synthetische Tests empirisch freigegeben.
