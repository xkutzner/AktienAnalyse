# Implementierungsstand und Arbeitswarteschlange

> Planungsupdate 05.10.2026: Neues [Produktkonzept](PRODUCT-CONCEPT-20D.md) und [Lieferplan mit getrenntem Implementierungs-/Daten-/Empiriestatus](DELIVERY-PLAN-20D.md). Der unten dokumentierte Implementierungsstand bleibt unverändert. V01 bis V03 sind technisch umgesetzt; reale Betriebs-/Ausführungsabnahmen bleiben offen. V04 reale Datenabnahme bleibt blockiert; Beschaffungsliste erstellt und Upgradeentscheidung ohne Kontoangebot unentschieden. Weitere V-Pakete gemäß Lieferplan.

Stand: 04.10.2026. Autoritative Planung: [DEVELOPMENT-ROADMAP.md](DEVELOPMENT-ROADMAP.md). Paketdetails stehen in den jeweils verlinkten Dateien. Dieser Bericht behauptet keine Prognosegüte.

## Lieferplan V01–V24

| Paket | Implementierung | Datenabnahme | Empirie | Nachweis |
|---|---|---|---|---|
| V01 | technisch erledigt, [PR #14](https://github.com/xkutzner/AktienAnalyse/pull/14), Merge im Abschluss | offen: reale Archiv-/Browserabnahme; BLS HTTP200/Parserprobe bestanden | nicht erforderlich; keine Prognosefreigabe | [Kalenderzeitpunkt](delivery/V01-KALENDERZEITPUNKT.md) |
| V02 | technisch erledigt, [PR #15](https://github.com/xkutzner/AktienAnalyse/pull/15) | offen: reale Rohkurs-/Fill-/Maßnahmen-/Kostenabnahme V04/V09 | nicht erforderlich; keine Prognosefreigabe | [Preisanker](delivery/V02-PREISANKER.md) |
| V03 | technisch erledigt, [PR #16](https://github.com/xkutzner/AktienAnalyse/pull/16) | nicht erforderlich: reine Registry-/Dokumentationsintegration | nicht erforderlich; keine Prognosefreigabe | [Methodikregistry](delivery/V03-METHODIKREGISTRY.md) |
| V04 | teilweise vorhanden: Adapter/Prüf- und Beschaffungsliste, [PR #17](https://github.com/xkutzner/AktienAnalyse/pull/17) | blockiert: kein ausführbarer autorisierter Provider-/Archivzugang; Entitlements/Lizenz/Angebot fehlen | nicht erforderlich; keine Prognosefreigabe | [Datenabnahme](delivery/V04-DATENABNAHME.md) |

Nächster unabhängiger Auftrag: V06 Instrumente/Universum/gemeinsame Zeitbasis, danach V05 gemäß Welle 1. V04 bleibt offen; Upgradeentscheidung nicht entscheidbar ohne Angebot/Entitlements. V03 Methodikregistry erzeugt versionsgleiche API-/Seitendokumentation; keine Berechnungsänderung oder Prognosefreigabe. V02 verwendet dieselbe Preisankerfunktion für vorläufige Referenzmarken und modellierte/angegebene tatsächliche Fillmarken; kumulative Splits ändern Marken und Stückzahl gemeinsam. Angegebene Fills sind nicht verifiziert. Aktueller Kalender fixiert `displayAsOf` nach Quellenbeobachtung/Archivversuch. Historischer Modus ruft keine heutige Makroquelle ab und nutzt ausschließlich explizite hashgeprüfte Snapshot-IDs. Leere/unvollständige Quellen belegen keine Ereignisfreiheit.

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
| 08a | Volumen und präfixbasierter Handelswert-/Gap-/Downside-Audit | `c6c17b7` / `a704b67` · PR #8 | Vierzehn Suiten mit tatsächlichem Sourcecommit, 13 bytegenaue Git-Blobs inklusive Referenz, Build und Artefakt; reale Datenabnahme offen |
| 08b | Immutable Ereignisrevisionen und exaktes Tag20-Fenster; reale Unternehmensintegration offen | `9166ff8` / `c30dd2f` · PR #9 | Vierzehn Suiten mit tatsächlichem Sourcecommit, 14 bytegenaue Git-Blobs inklusive Referenz, Build und Artefakt |
| 09 | Gemeinsame Analysekarte und harte Kein-Kauf-Regeln | `377cd83` / `83e823c` · PR #10 | Fünfzehn Suiten mit tatsächlichem Sourcecommit, 15 bytegenaue Git-Blobs inklusive Referenz, Build und Artefakt; empirische Freigabe offen |
| 10 | UI-Fehlerführung und funktionale Mock-Abnahme; echte Integration offen | `396cd25` / `95e03aa` · PR #11 | Fünfzehn Suiten direkt offline mit tatsächlichem Sourcecommit, 9 bytegenaue Git-Blobs inklusive Referenz, Build und Artefakt; Browser/Screenreader/Provider offen |
| 11 | Technische Vergleichsvorbereitung; empirische Abnahme blockiert | `6a22d76` / `984c390` · PR #12 | Sechzehn Offline-Suiten mit tatsächlichem Sourcecommit, 15 bytegenaue Git-Blobs inklusive Referenz, Build und Artefakt; qualifizierte Daten fehlen |

Details: [COMPARISON-PREPARATION.md](COMPARISON-PREPARATION.md), [ANALYSIS-CARD.md](ANALYSIS-CARD.md), [EVENT-REGISTRY.md](EVENT-REGISTRY.md), [RISK-FEATURES.md](RISK-FEATURES.md), [TRADE-PLAN.md](TRADE-PLAN.md), [EXECUTION-LABELS.md](EXECUTION-LABELS.md), [DATA-CAPABILITIES.md](DATA-CAPABILITIES.md), [REPRODUCIBILITY.md](REPRODUCIBILITY.md), [SELECTION-V2.md](SELECTION-V2.md), [RAW-ADAPTER-MAE.md](RAW-ADAPTER-MAE.md), [ANALYSIS-CONTRACT.md](ANALYSIS-CONTRACT.md).


## Offen, in Reihenfolge

| Paket | Status | Ergebnis / Abhängigkeit |
|---|---|---|
| 12 | Eigener neuer Agentkontext prüft Vorbereitung; reale Experimente blockiert | Drei Ergänzungsgruppen einzeln auf Mehrwert prüfen |
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
- Ereignisimporte bleiben claimed-unverified; bestätigte Earnings-/Kapitalmaßnahmenabdeckung und PIT-Verfügbarkeit fehlen. Kein Treffer bestätigt keine Ereignisfreiheit.
- Aktuelle Rangliste bleibt die bisherige Referenzmethode; keine Prognosefreigabe und kein geprüfter Kaufstatus.
- Optionaler experimenteller Stop im Tradeplan, keine echte Depotverwaltung und keine automatische Orderausführung.
- Bisherige UI-Prüfung ist strukturell/Mock-DOM. Echte Browser- und Providerabnahme noch offen.
- Keine neue Site-Veröffentlichung durch diese Orchestrierung. GitHub-main und live veröffentlichte Site sind getrennte Stände.

## Orchestrierungsregel

Ein frischer Agent pro Paket, genau ein Paket gleichzeitig, dokumentierte Prüfungen und PR, Merge des getesteten Heads vor dem nächsten Start. Neue Chatfenster lassen sich in dieser Umgebung nicht automatisch öffnen. Fehlende Zugänge und künftige Daten werden als echte Blocker erfasst; kein Paket wird nur durch Dokumentation oder synthetische Tests empirisch freigegeben.

