# Startreparatur und sequenzielle Feature-Abnahme

06.10.2026 · Ausgang main: `9c309b8fe35c4d498a3c1454603327af573a8545` · keine offenen PRs zum Arbeitsbeginn.

## Reproduzierter Fehler

Site-Version 18 führt Quellenstand `063d987303cb562cc0f1dbafb874c441931a2e94`. Ihr `app/index.html` entspricht dem aktuellen main, der Seitenrenderer jedoch einer älteren Version: Er ersetzt nur Analysevertrag und Kartenpolicy. Der tatsächlich vom Worker gelieferte HTML-Text enthält `__METHODOLOGY_JSON__`, außerdem zwei Methodik-HTML-Platzhalter. Beim Start wirft `const UI_METHODOLOGY=__METHODOLOGY_JSON__` einen ReferenceError vor Registrierung der Buttonhandler und vor dem ersten Datenabruf. Deshalb bleiben alle Buttons ohne Funktion und der initiale Ladetext stehen. Ein Datenprovider-Timeout ist dafür nicht erforderlich.

Der vollständige main-Renderer behebt bereits diese Inkonsistenz. Veröffentlichung muss sämtliche zusammengehörigen Quellen desselben geprüften Commits übernehmen; nur `app/index.html` zu kopieren genügt nicht.

## Änderung und Nachweis

- Der HTML-Einbau in den Worker verwendet eine Ersetzungsfunktion: Zeichenfolgen mit `$` werden als wörtliche Nutzdaten übernommen.
- Artefaktabnahme ruft den gebauten Worker auf, vergleicht dessen vollständigen HTML-Text mit dem aktuellen Renderer und sperrt nicht aufgelöste Platzhalter; alle eingebetteten Scripts werden geparst.
- Der vollständige vorhandene UI-Workflowtest kann den gebauten Worker als HTML-Quelle verwenden. `npm run validate` prüft dadurch auch Start, Handler, Tabs, Anfragen, Fehler, Timeout/Wiederholung, Tabelle und Vergleich am tatsächlich ausgelieferten Artefakt.
- `npm test` (18 Suiten), `npm run build`, `npm run validate` bestehen. Das sind Software-/Mock-DOM-Nachweise. Browseranmeldung, reale Anbieterantworten, mobile visuelle Bedienung und Prognosegüte werden dadurch nicht als bestanden erklärt.

Die neue Nutzerpriorität erlaubt die technische Reparatur und Bereitstellung eines prüfbaren Zwischenstands unabhängig von früheren dokumentierten Echtdaten-Abnahmeblockern. Diese bleiben für Daten-/Prognosefreigaben wirksam. Die gesonderte Veröffentlichung übernimmt der Orchestrator; dieses Implementierungspaket veröffentlicht nicht selbst.

## Nächste Features jeweils einzeln abnehmen

| Reihenfolge | Einzelnes Feature | Isolierte Abnahme vor nächstem Feature |
|---|---|---|
| 1 | Seitenstart und Navigation | Nach Öffnen Ladetext verlassen; alle drei Tabs und Einstellungen bedienbar; bei Datenfehler sichtbarer Grund und Wiederholung |
| 2 | Kursabruf für eine Aktie | AAPL einzeln, Datenstand/Quelle und Fehlerfall; keine Analyse/Rankingfreigabe allein aus Datenabruf |
| 3 | Watchlist und Datenqualität | Zweite Aktie ergänzen; ungültiges Symbol, fehlende/alte Reihe und Teilfehler nachvollziehbar |
| 4 | Ergebnistabelle und Details | Jede nutzbare Aktie sichtbar; unbekannte Nettozahlen, Filter, Vergleich und Detailnavigation korrekt |
| 5 | Historische Kennzahlen | Jedes Merkmal mit festen Prüfdaten gegen seine eigene dokumentierte Formel vergleichen |
| 6 | Kosten und Preisplan | Betrag/Gebühren/Stop/Ziel isoliert; unbekannte Rohpreise/FX/Maßnahmen sperren Ergebnisse |
| 7 | Ereignisse und Kalender | Quellen, Zeitpunkte und fehlende Abdeckung isoliert prüfen |
| 8 | Kombination | Erst nach protokollierter Einzelabnahme der benötigten Features; gleiche Daten-/Kostenbasis und Unbekannt-/Kein-Kauf-Zustände prüfen |

Pro Feature ein separater Auftrag/Branch, Testprotokoll mit bestanden/offen/fehlgeschlagen, Regression, PR und geprüfter Merge. Bestehende Komponenten gezielt abnehmen/reparieren, nicht neu bauen. Nach dem technischen Fix zunächst Feature 1 und dann Feature 2 mit dem Nutzer prüfen; kein automatisches Durchlaufen aller Pakete.
