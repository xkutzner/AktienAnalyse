# SPY-Ladefehler und Anbietercredits · 06.10.2026

Ausgang: `main` / `c52823841bd328e511fccfb2d740ed804d928d58`, PR #21. Keine offenen PRs bei Paketbeginn. Einzelauftrag zur Reparatur des gemeldeten Ladefehlers, keine neuen Indikatoren.

## Diagnose

Der Orchestrator prüfte den angemeldeten Live-Endpunkt. Eine einzelne AAPL-Abfrage lieferte HTTP 200 mit AAPL und SPY vom 06.10.2026 und vier experimentellen Horizonten. Die Standardwatchlist mit fünf Aktien lieferte HTTP 502: SPY und GOOGL meldeten HTTP 429 / „Kreditlimit erreicht“, während die vier anderen Historien vorhanden waren. Der bisherige generische SPY-Text verdeckte die Anbieterursache. Das Paket aus PR #21 startete elf parallele Abrufe: sechs Historien plus fünf automatische Rohschlussabfragen. Das konkrete Konto-/Tageskontingent ist damit nicht vollständig abgenommen.

## Änderung

- Nur sechs Historienabrufe für die fünf Standardaktien plus SPY, maximal acht bei sieben Aktien. SPY erhält den ersten Abruf. Keine zusätzlichen automatischen Rohquotes und keine automatische Wiederholung.
- Die Tabelle verwendet den letzten bereinigten Schluss mit Datum und ausdrücklich ungeprüftem Rohkursstatus. Szenarien und Preisanker verwenden weiterhin die belegte bereinigte Historie; keine falsche Rohkurs- oder Livekurskennzeichnung.
- SPY-Fehler nennen Anbieterursache bzw. genaue Qualitätsprobleme sowie vorhandenes und erwartetes Schlussdatum. Kreditlimit nennt eine Wartezeit vor erneutem Versuch und möglichen länger dauernden Tageskontingentblocker.
- Strenge Frische-/OHLC-/Lücken-/Duplikatsprüfung unverändert. Kein Umdeuten alter Kurse als frisch, kein Benchmarkersatz, keine neue Handels-/Netto-/Prognosefreigabe.
- Bereits archivierte Rohquotes bleiben geschützte Replayinputs; neue Analysen benötigen keine Zusatzquote. Replay verwendet keine neuen Anbieterabrufe.

## Prüfung und Grenzen

Offline-Regressionsfixture mit acht erlaubten Anbietercredits: Standardwatchlist liefert fünf vorläufige Bewertungen, alle vier Horizonte und genau sechs Abrufe; SPY zuerst. Konkrete 429-Meldung, weiterhin gesperrter veralteter SPY-Schluss und providerfreier Replay geprüft. Bestehende 17 Suiten, Build und Artefaktprüfung werden am tatsächlichen PR-Head durchgeführt; Nachweise im Abschluss.

Die Live-Prüfung des korrigierten Deployments übernimmt der Orchestrator. Wiederholte Aktualisierungen können das Minuten-/Tageskontingent weiterhin verbrauchen; es gibt in diesem Paket keinen neuen persistenten Providercache. Prognosegüte und reale Ausführung bleiben ungeprüft.
