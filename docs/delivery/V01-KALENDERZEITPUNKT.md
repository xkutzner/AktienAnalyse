# V01 · Kalenderzeitpunkt

## Auftrag und Stand
- Ziel: Frisch beobachtete BLS-Termine in der aktuellen Anzeige, historischer Replay ohne späteres Wissen. Keine Rendite-/Rankingänderung.
- Ausgangscommit: `4f6a368723a79a317da852c6fe1116ddf2f0c118`, main, 05.10.2026; Root prüfte keine offenen PRs.
- Verantwortlicher: separater Implementierungsagent V01. I erledigt; D offen; E nicht erforderlich.
- Bezug: Produktkonzept Abschnitt 8; bestehende Pakete 08b/10; Lieferplan V01.
- Offene Zugänge: produktiver BUCKET-Schreib-/Lesetest, angemeldeter Browser und veröffentlichter Worker nicht beauftragt. BLS ist öffentlich erreichbar.

## Geplante Abnahme
- [x] Erfolgreicher Abruf und eine Sekunde verzögerte Antwort zeigen Termin im Fenster.
- [x] Historischer Modus schließt spätere Beobachtungen aus und führt keinen Liveabruf aus.
- [x] Ausfall, vollständiger leerer Kalender, Revision/Entfernung, Absage, UTC/Eastern, ungültige Uhrzeit/Datum und Archivintegrität.
- [x] Unternehmensabdeckung und Risikoscore bleiben unbekannt.
- [ ] Reale Archiv-/Browserprüfung; HTTP-/Parserprobe ersetzt diese nicht.
- [x] Empirische Prüfung nicht erforderlich für reine Softwarekorrektur; keine Güteaussage.

## Umsetzung
- `app/index.html`: `mode=current` ohne vor Abruf eingefrorenes Browser-asOf; bestehende Stale-Response-/Fehlerführung erhalten.
- `worker/index.template.js`: current beobachtet BLS und versucht immutable Archivierung vor serverseitigem Anzeigenstand. `mode=historical&asOf=...` (auch Legacy-Anfragen mit asOf) ruft keine aktuelle Quelle ab. `macroSnapshotIds` referenziert nach SHA-256 geprüfte Quellenstände. Kein Archiv bedeutet `unavailable`, fehlgeschlagener Schreibversuch `failed`; Anzeige ist damit nicht replayqualifiziert.
- `worker/events.js`: `macro-calendar-snapshot-v1`; whole-source Snapshots in `macro/bls/<hash>.json`, bedingtes Schreiben statt Überschreiben. Historisch letzte damals beobachtete Quelle, inklusive Entfernung/leerem Stand; gleichzeitige abweichende Stände blockieren. Parser enthält bekannte BLS-Zonenalias `US-Eastern`, US/Eastern, America/New_York; UTC-Datum auf Börsentag in Eastern. Unbekannte Zone/ungültige VEVENTs ergeben Fehler; STATUS:CANCELLED nicht anzeigen.
- `worker/data.js`: expliziter `observationOnly`-Zweck ermöglicht aktuelle Terminansicht tagsüber. Tradeentscheidung behält ihre strenge nächste-Open-Regel; das Kalenderfenster ist kein neuer Tradeplan. Der Horizont bleibt letzte abgeschlossene Sitzung bis Sitzung20.
- `scripts/test-calendar.mjs`: funktionale Grenzregressionen. Dokumentation: Lieferplanregister, Implementation-Status, Roadmap und dieses Protokoll.
- Rückwärtskompatibilität: Anfragen mit asOf werden historisch interpretiert, nur archivierte Makrobeobachtungen; deklarierter Fed-Jahresarray und Ersatzdaten erscheinen ausschließlich current, klar unqualifiziert. Ausfall übernimmt keinen alten BLS-Snapshot als frischen Feed.
- Rollback: PR rückgängig machen; additive neue Snapshotobjekte müssen nicht gelöscht werden. `reference/v1` unverändert.

## Prüfprotokoll
| Prüfung | Befehl oder Ablauf | Ergebnis | Nachweis | Einschränkung |
|---|---|---|---|---|
| Kalenderabnahme | `node scripts/test-calendar.mjs` | bestanden | Current +1s, Revision, leer, Ausfall, Zeitzone, historische Ausschlüsse, Archivfehler/Tamper | Synthetisch, nur Softwareverhalten |
| Regressionen | `SOURCE_COMMIT=<getesteter Head> npm test` | bestanden; exakter Head im finalen PR-Prüfkommentar | 16 bestehende Suiten | Kein Prognosebeleg |
| Build/Artefakt | `SOURCE_COMMIT=<getesteter Head> npm run build && npm run validate` | bestanden; exakter Head im finalen PR-Prüfkommentar | ESM/default.fetch plus eingebetteter Commit | Kein Deployment |
| Reale öffentliche Quelle | BLS-ICS mit fetch, HTTPstatus und Parserprobe | HTTP200; 313 Termine normalisiert; CPI 14.10., PPI 15.10., ECI 30.10.2026 jeweils 08:30 US Eastern | 05.10.2026 | Momentaufnahme; kein historischer PIT-/Lizenznachweis |
| Reales Archiv/Browser | Produktive BUCKET- und angemeldete Sitzung | nicht ausführbar in diesem Paketkontext | Kein produktiver BUCKET-Zugang verwendet, keine Veröffentlichung | D bleibt offen |
| Referenz | API-Blobs gegen lokale Dateien und Referenzsuite | finaler PR-Prüfkommentar | Keine reference/v1-Diffs | Ein temporärer Materialisierungs-Newlinefehler verursachte Erstlauf-Fehlschlag; bytegenau behoben |

## Daten- und Forschungsnachweis
- Quelle: https://www.bls.gov/schedule/news_release/bls.ics. Synthetische Kalender/Archive in Tests; reale Probe nur temporär, keine personenbezogenen Daten.
- Snapshot-IDs und observedAt stehen in API-Antworten; keine historische Veröffentlichungszeit erfunden. Speicherung normalisierter ganzer Quellenstände; Rohquellenarchiv/Index/weitere Adapter V05/V07.
- Kosten-/Ausführungsannahmen unverändert. Keine Modellvariante/Experiment-ID erforderlich.
- I: erledigt, reproduzierbarer korrigierter Zeitvertrag. D: offen, reale Quelle erreicht aber produktives Archiv/Browser nicht abgenommen. E: nicht erforderlich für Softwarekorrektur; unveränderte empirische Gates bleiben gesperrt.

## Abschluss
- PR: [#14](https://github.com/xkutzner/AktienAnalyse/pull/14). Getesteter Head / Mergecommit: finaler Prüfkommentar und GitHub-PR-Metadaten sind autoritativer Abschlussnachweis (Commit kann seinen eigenen Hash nicht enthalten).
- Grenzen/Folgepakete: V05 produktives Archiv/Index/Restore, V07 Rohquellen/Adapter/Coverage/Frische, V08 Unternehmensabdeckung, V22 echter Browser. Keine vollständige ICS-Spezifikation oder makroökonomische Evidenzfreigabe.
- Zulässige Aussage: aktuelle beobachtete Termine mit Quellen- und Archivstatus; historisch nur belegte Beobachtung, keine garantierte Ereignisfreiheit, keine Nettoprognose oder Kaufempfehlung.
- Deployment: nicht erfolgt.
- Nächster sinnvoller Auftrag: V02 im neuen Agentenkontext nach nachgewiesenem Merge.
