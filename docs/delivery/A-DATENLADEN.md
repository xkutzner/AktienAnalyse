# A · Datenladen und Diagnose des Zwischenstands

## Auftrag und Ausgangsstand

- Nutzerauftrag 06.10.2026 (Europe/Berlin): A → V11 → passende V22 → einmalige Veröffentlichung auf der bestehenden Site → Stopp zur Erprobung. V06 und weitere Pakete zurückgestellt.
- Eigener Paketkontext und Branch `delivery/a-reliable-stock-loading`, Basis `main` / `8ad4380d9ead2aeadfc33b78c089332018116155`. Beim Start keine offene PR laut GitHub-API. V01–V03/PR #14–16 bleiben vorhandene Umsetzung; V04/PR #17 bleibt umfassende reale Daten-/Lizenz-/Archivabnahme offen.
- Bestehende Site: https://aktienlabor-20-tage.sava-kutz.chatgpt.site
- Nichtziel: Nettoprognosefreigabe, Datenkauf, Brokerorder, Änderung an `reference/v1`, V06-Umsetzung oder neue Site.

## Nachgewiesene technische Ursache und Korrektur

`/api/stocks` berechnet vor aktueller Analyse synchron `historicalBacktest()`. Je Aktie und historischem Entscheidungsdatum prüft dieser sämtliche Präfixpreise einschließlich Börsensitzung/Feiertagen erneut. `session()` berechnete jedes Mal Feiertage und Kurzsitzungen neu; dieselbe SPY-Präfixprüfung lief außerdem für jede Aktie erneut. Diese Arbeit blockierte den ersten Datenabruf, selbst bei bereits gelieferten Providerdaten.

Reproduzierbarer synthetischer CPU-Nachweis mit 1300 Tagesbalken, sieben Aktien und SPY: `node scripts/benchmark-loading.mjs` rekonstruiert den vorherigen Rechenpfad. **Vorher 13.178 ms, nachher 954 ms**, 51 Entscheidungen, alle Ergebnisfelder identisch. Die Zahl ist lokale CPU/Wandzeit ohne Provider und kein Produktionslatenzversprechen. Die vom Nutzer genannten Produktionslogs HTTP200/12–14s/9–12s CPU passen zur Last, beweisen jedoch allein weder diese Ursache noch eine funktionierende Browseranzeige.

Korrektur: maximal 2556 unveränderliche Kalendertage (2021–2027) im Worker-Isolate speichern; unsupported MIC/Datum vor Cachezugriff abweisen, Rückgabe kopieren gegen Mutation. Preise, aktueller Sitzungsabschluss, Qualifikation und Anbieterantworten werden nicht gecacht. Innerhalb genau einer historischen Rechnung SPY-Präfixqualität je Entscheidungsindex einmal verwenden. Alle bisherigen Qualitätsprüfungen bleiben bestehen; kein neuer Daten-/Prognose-Gate. Historische Zusatzanalyse bleibt erhalten, nachdem ihre unnötige CPU-Last nachgewiesen beseitigt wurde. Keine Snapshot-/Replay-/Auswahlversion verändert.

## Fehlerführung und erhaltene Teilergebnisse

- Sofort Ladezustand; nach acht Sekunden ausdrücklich „Anfrage noch in Bearbeitung“; nach 30 Sekunden Abbruch und „Erneut versuchen“. Andere Abbrüche separat benannt. Requestversionen verhindern alte verspätete Antworten.
- HTTPstatus und tatsächlicher Inhalt getrennt geprüft. Auch HTTP200 mit Providerstatus/code, unvollständigem Analyseobjekt, ungültigem JSON, Null-/Arraypayload sind keine erfolgreiche Datenanalyse. Timeout, Nichterreichbarkeit, Tarif-/Creditfehler und JSONformat getrennt; keine geheimen Anbieter-/Exceptiontexte ausgegeben.
- Fachlich brauchbare einzelne Aktien bleiben bei fehlerhafter anderer Aktie sichtbar; Ausschlussgrund je Symbol im Banner. Die notwendige SPY-Freigabe bleibt unverändert.
- Ergebnisse derselben Watchlist bleiben bei neuer Anfrage oder Fehlversuch sichtbar, ausdrücklich „Veraltet · noch nicht erneut geprüft“. Keine frühere positive Auswahl als aktueller Kandidat und keine neue virtuelle Vormerkung. Watchliständerung entfernt nicht dazugehörige Ergebnisse weiterhin vollständig.
- „Historische Analyse verfügbar · Netto gesperrt“ unterscheidet Datenanzeige von qualifizierter Nettoprognose. Nicht nutzbare Daten heißen nicht automatisch „Aktuell keine geeignete Aktie“.

## Geänderte Dateien

- `worker/data.js`: bounded immutable Kalenderfakten, sichere differenzierte Providerfehler.
- `worker/index.template.js`: einmalige SPY-Präfixprüfung je Entscheidungsdatum innerhalb einer Rechnung.
- `app/index.html`: Inhaltsschema, langer Abruf/Timeout/Retry, veraltete frühere Ergebnisse und konkrete Ausschlussgründe.
- `scripts/test-data.mjs`, `scripts/test-selection.mjs`, `scripts/test-ui.mjs`: zielgerichtete Regressionen.
- `scripts/benchmark-loading.mjs`: reproduzierbarer synthetischer Alt/Neu-CPU-Vergleich mit vollständiger Ergebnisparität.
- `docs/DELIVERY-PLAN-20D.md`, `docs/IMPLEMENTATION-STATUS.md`, `docs/DEVELOPMENT-ROADMAP.md`, dieses Protokoll: neue Nutzerpriorität und Nachweise.

Rollback: Paket-PR revertieren; keine Datenmigration und keine geänderten Preise/Archivobjekte.

## Prüfprotokoll

| Prüfung | Ergebnis | Nachweis / Grenze |
|---|---|---|
| Repository/API/main/offene PR | bestanden | Basis oben, API-Tree; keine offene PR beim Start |
| Materialisierung/Referenz | bestanden nach Korrektur | zusätzliche Materialisierungs-Newline verursachte ersten Referenztestfehler; API-Gitblob-SHAs bytegenau korrigiert, keine Referenzänderung |
| 17 Regressionstestsuiten | bestanden | `npm test`; finales Head mit Sourcecommit gesondert vor Merge geprüft |
| Kalendercached/uncached | bestanden | jeder Tag 2021–2027, XNAS/XNYS/ARCX; unsupported Datum/MIC, Kurzsitzung und Mutationsschutz |
| Historische Ergebnisparität | bestanden | alle Felder Alt/Neu; bekannte Duplikate, Benchmarklücke und spätere Defekte; Qualitätsprüfungen bleiben wirksam |
| 1300×7 synthetische CPU | bestanden | 13.178→954 ms, 51 Entscheidungen, vollständige Ergebnisparität; ohne Netzwerk |
| Providerfehler | bestanden | semantischer HTTP200/429/403/400, ungültiges JSON/Schema, Timeout, Netzwerk, Secretredaktion; synthetisch |
| UI-Fehlerführung | bestanden | langer Abruf, Timeout/Retry, stale Versionsschutz, Teilergebnisgründe/Watchliständerung; Mock-DOM, keine reale UI-Abnahme |
| Build/Artefakt | ausstehender finaler Headnachweis | PR-Prüfkommentar ergänzt exakten Head und Prüfergebnis |
| Echte Browser-/Produktionsprobe | Orchestrator führt sie separat aus | HTTP200 und synthetischer DOM ersetzen keine reale Abnahme; endgültiger Nachweis spätestens passende V22 |

## Reale Produktionsgrenzen

Im Paket-A-Kontext wurde kein Site-Secret gelesen; fehlendes lokales Environment wurde nicht als fehlender Produktionsschlüssel ausgegeben. Die autorisierte reale Site-/Browserprobe übernimmt der Orchestrator und dokumentiert Status, Inhalt, veröffentlichten Stand und etwaigen konkreten Zugangshinderungsgrund. Bis dahin kein Anspruch einer bestandenen realen Daten-/Browserabnahme. Umfassende V04-Entitlements, Maßnahmen-/Earningscoverage, Rechte und Archiv bleiben eigenständige offene Nachweise.

## Abschluss

- I: technisch umgesetzt und offline geprüft. D: reale Prüfung separat durch Orchestrator/V22, keine alleinige HTTP200-Freigabe. E: nicht erforderlich für Softwarekorrektur; keine Prognoseempirie.
- PR, getesteter Head und Mergecommit: autoritative GitHub-PR-Metadaten und finaler Prüfkommentar; Orchestrator prüft und mergt erst getesteten Head.
- Deployment in diesem Paket: nicht erfolgt. Weiter ausschließlich V11 im frischen Paketkontext nach geprüftem Merge; danach passende V22, einmalige bestehende Siteveröffentlichung und Stopp.

## Fortschreibung nach A-Merge · 06.10.2026

PR #18 geprüft gemergt: getesteter Head `17131a27dcb8f7e8b56e4d589ecd197d79578a01`, Merge `2f1cc23b9c248614fd27d8975266aedd50d7da85`. Die synthetisch nachgewiesene CPU-Blockade ist eine passende Produktionshypothese; ohne echten JSON-/Browserpfad ist sie **keine bestätigte vollständige Produktionsfehlerursache**.

Orchestrator hat die bestehende Sites-Version 17 lesend zugeordnet: Sites-Sourcecommit `3948603e19c4a66738ec0556bafe3fd8362249cb`, erfolgreicher Deployment `appgdep_6ac3d6f480588191a1d50c8501439a6c` vom 05.10.2026 16:58:22Z, Environmentrevision 6. Das veröffentlichte Artefakt `dist/server/index.js` stimmt bytegleich mit `worker/index.js` überein und enthält GitHub-SOURCE_COMMIT `42e6fc14083dba423423547228212c7711def0cb` (V02-Merge). Alle 67 GitHub-getrackten Blobs dieses Commits entsprechen der gelesenen Sites-Quelle; drei weitere Dateien sind generiert. V03/V04 und Paket A waren damit bisher nicht veröffentlicht. Sites- und GitHub-Commit-IDs sind verschiedene Referenzen; die Zuordnung stützt sich auf Blob-/Artefaktvergleich.

Erneut gelesene Produktionslogs: mehrere HTTP200-Antworten mit 11.655–14.740 ms Wandzeit und 9.280–11.547 ms CPU; letzter abgebrochener Abruf 05.10.2026 22:30:46Z mit 8.751 ms Wandzeit / 7.684 ms CPU. Kein JSON-Inhalt in diesen Logs, kein Beweis brauchbarer Ergebnisse oder einer UI-Ursache.

Private Site zeigt Anmeldung. Loginaktion zu auth.openai.com durch Browserpolicy mit „Nutzer verweigerte Berechtigung“ abgelehnt; keine Umgehung. Daher echte Datenantwort, Desktop-/Mobilanzeige und Ende-zu-Ende-Abnahme weiterhin **nicht ausführbar**. Kein Secretwert gelesen/ausgegeben; aus lokal fehlendem Schlüssel keine Aussage zum Produktionsschlüssel. V11 kann technisch unabhängig umgesetzt werden; V22 dokumentiert den verbleibenden Freigabeblocker. Keine Veröffentlichung ohne erforderliche reale Abnahme.
