# AktienAnalyse: sequenzielle Paket-Orchestrierung

Der Nutzer hat die Umsetzung der verbleibenden Entwicklungsroadmap und das Mergen geprüfter Pakete autorisiert. Quelle: `docs/DEVELOPMENT-ROADMAP.md`. Aktueller Stand: `docs/IMPLEMENTATION-STATUS.md`.

## Ablauf

1. Für jedes neue Paket einen neuen separaten Agenten-Arbeitskontext verwenden. Das sind keine neuen Chatfenster; diese kann der Orchestrator hier nicht erstellen.
2. Genau ein Implementierungspaket gleichzeitig. Vor Beginn den aktuellen GitHub-main-Commit und die Änderungen gegenüber dem letzten Paket prüfen.
3. Paket auf eigenem Branch umsetzen. Keine Änderungen an `reference/v1`. Keine Site-Veröffentlichung, Brokerorder, Nachricht an andere Personen oder kostenpflichtige Buchung ohne gesonderten Auftrag.
4. Abnahmekriterien testen; bestehende relevante Regressionen, Build und Artefaktprüfung ausführen. Softwareverhalten und empirische Prognosegüte getrennt ausweisen.
5. Stand und Grenzen in `docs/IMPLEMENTATION-STATUS.md`, Paketdokumentation und Roadmap aktualisieren. Keine blockierte empirische Abnahme als erledigt ausgeben.
6. Änderungen ausschließlich über die GitHub-Plugin-API sichern, PR erstellen. Vor Merge aktuellen Head, Konflikte, Reviews und vorhandene Checks prüfen. Getesteten Head über expected_head_sha mergen; kein Force-Push.
7. Erst nach nachgewiesenem Merge das nächste Paket in einem frischen Agenten-Kontext beginnen. Orchestrator prüft die Rückmeldung und den Repository-Stand.
8. Bei fehlenden Daten/Zugängen oder notwendiger künftiger Beobachtung den echten Blocker dokumentieren. Unabhängige technische Arbeit darf weitergehen, aber keine Freigabe oder abhängige Abnahme erfinden.

## Übergabe pro Paket

Ausgangscommit, geänderte Dateien, Tests/Build, offene Grenzen, PR-Link und Mergecommit nennen. Nicht zugewiesene Pakete nicht bearbeiten. Keine eigenen Unteragenten ohne Aufgabe des Orchestrators.
