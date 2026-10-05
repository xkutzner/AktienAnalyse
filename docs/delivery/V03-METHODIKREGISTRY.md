# V03 · Methodik-/Versionsregistry

## Auftrag und Stand
- Ziel / Nichtziel: Versionsgleiche verständliche Methodik aus einer Registry; keine neue Berechnung, Rangfolge, Gewichtung oder Datenfreigabe.
- Ausgangscommit und Datum: main `42e6fc14083dba423423547228212c7711def0cb`, 05.10.2026; V02/PR #15 gemergt.
- Verantwortlicher / aktueller Status: eigener Implementierungsagent V03, Branch `delivery/v03-methodology-registry`; technisch erledigt, PR-/Mergeabschluss unten.
- Bezug: Produktkonzept §§ 5, 6, 13, Lieferplan V03, bestehende Versionen aus V01/V02 und Paketen 01–11.
- Abhängigkeiten / offene Zugänge: Codeinventar vollständig; kein Anbieterzugang für dieses Paket nötig. Reale Entitlements/Daten/Archiv bleiben V04.

## Geplante Abnahme
- [x] Fünf tatsächlich verwendete Referenzmerkmale mit Formel, Einheit, Lookback, Herkunft, Preisbasis, Verfügbarkeit und begrenztem Einfluss korrekt erklärt.
- [x] features-v2 Trainingsskalierung/Korrelation und Vergleichsfallgewichte ausdrücklich von Referenzgewichten getrennt; kein Rankingwechsel.
- [x] Registry/API/generierte Seitendoku verwenden dieselben Daten-/Modellversionen; Versionen aus Modulkonstanten und Policy-Ausgaben.
- [x] Verwendet, experimentell, geplant getrennt; historische Referenzmethodik und fehlerhaftes eingefrorenes Referenzarchiv nicht als identische Auswahl behandelt.
- [x] GET-only API, HTML-Escaping, keine veralteten globalen HTTP403/Tarifbehauptungen; README führt 17 ausführbare Suiten.
- [x] Daten-/Empirieprüfung für reine Dokumentationsintegration nicht erforderlich; bestehende Freigabesperren erhalten.

## Umsetzung
- `worker/methodology.js`: zentrale Registry, tatsächliche Modulversionen, fünf Referenzformeln/Einheiten/Metadaten, statuses, limitations; keine berechnungssteuernden neuen Parameter.
- `worker/index.template.js`: GET `/api/methodology`, no-store, 405 für andere Methoden; aktive Modellversion aus Registrykonstante. Auswahl-/Ausführungscode unverändert.
- `scripts/render-page.mjs`, `scripts/render-worker.mjs`: Registry erzeugt Seitendoku und eingebettete Metadaten; Worker bundelt dieselbe Registry ohne Laufzeitimports.
- `app/index.html`: aktuelle Versionen und Funktionsstatus, Kalenderbeobachtung/Replay, experimentelle Diagnosen; Referenzindikator-Anzeige aus Registry statt doppelter Gewicht-/Formelliste.
- `scripts/test-methodology.mjs`, `package.json`: 17. Suite prüft echte Scorefunktion gegen Registry bei steigenden/fallenden/konstanten Kursen, variable Volatilität mit Teiler19 und SMA50, API/UI-Versionen, GET-only, Escaping, Status, README-Testinventar.
- `README.md`, `docs/DELIVERY-PLAN-20D.md`, `docs/IMPLEMENTATION-STATUS.md`, `docs/DEVELOPMENT-ROADMAP.md`, dieses Protokoll: aktueller Stand und Grenzen.
- Version: `methodology-registry-v1`; bestehende data-v4/reference-v1/selection-v2/features-v2/execution-v4/price-anchor-v1/analysis-card-v1 bleiben erhalten.
- Migration/Rollback: keine Datenmigration; neuer additiver Leseendpunkt, reversible UI-/Dokumentationsintegration. `reference/v1` bytegleich.

## Prüfprotokoll
| Prüfung | Befehl/Ablauf | Ergebnis | Nachweis | Einschränkung |
|---|---|---|---|---|
| main-Rekonstruktion | SHA1 über Gitblobheader + Bytes aller 67 Dateien | bestanden | alle lokalen SHA = GitHub main Tree | lesender Pluginzugriff |
| Registry/API/UI/Formeln | `node scripts/test-methodology.mjs` | bestanden | echte Scorefunktion, Variable-vol20/SMA50, API GET405, Escaping, Registry-UI | synthetische Softwareprüfung |
| Regressionen | `npm test` | bestanden, 17 Suiten | Modell/Vertrag/Kalender/Referenz/Auswahl/Daten/Simulation/Analogien/Broker/UI/Archiv/Capabilities/Labels/Tradeplan/Karte/Vergleich/Registry | Mock-DOM; keine Prognosegüte |
| Anfangsfehler | erster Gesamtlauf: extrahierte Referenzfunktion ohne neue Konstante | fehlgeschlagen, behoben | Auswahlversion-Literal im echten Code unverändert; Registry prüft Konsistenz | kein verbleibender Fehler |
| Build/Artefakt | `SOURCE_COMMIT=<getesteter Head> npm run build && npm run validate` | bestanden | gültiger standalone ESM-Worker; finales Head-Protokoll im PR | keine Site-Veröffentlichung |
| Referenzintegrität | Gitblob-SHAs `reference/v1/*` gegen Ausgangsbaum | bestanden | alle vier Dateien bytegleich | historische Prognosefehler bleiben archiviert |
| Reale Daten/Broker/Browser | keine neue marktbezogene Änderung | nicht erforderlich für V03 | bestehende V04/V09/V22 Grenzen bleiben offen | keine neue reale Abnahme |
| Empirie | kein Modellversuch | nicht erforderlich | keine neuen Labels/Trainings/Prognosen | keine Freigabe |

## Daten- und Forschungsnachweis
- Quellen/Snapshots/Zeitraum/Universum: ausschließlich Repositorycode; keine Marktdatenabfrage oder Snapshotaufnahme für V03.
- Kosten-/Ausführungsannahmen: bestehender execution-v4 unverändert. Nettoszenarien weiterhin gesperrt.
- Experiment-ID/Parameter: kein Experiment; Referenzgewichte 25/20/25/20/10% und features-v2-Parameter unverändert.
- Ergebnis einschließlich negativer Befunde: Softwarekonsistenz nachgewiesen; kein Beleg für Prognosegüte, Renditevorteil, Maßnahmen-/Kalenderabdeckung oder Anbieterentitlements.
- I: erledigt (Registry/API/Seitendoku + Regression). D: nicht erforderlich für reine Registryintegration; übergreifende reale Datenabnahme offen V04. E: nicht erforderlich, kein Modellversuch; übergreifende Empirie offen V13/V16.

## Abschluss
- PR / getesteter Head / Mergecommit: nach PR-Erstellung verlinkt; exakter finaler Test-/Mergehead im PR-Prüfkommentar, Mergecommit ist GitHub-PR-Metadatum (keine selbstreferenzierende Commit-ID).
- Restpunkte: V04 reale Anbieter-/Datenabnahme, V09 qualifizierte Nettolabels, V13/V16 Empirie, V22 echte Browser-/Nutzertests.
- Produktfreigabe: jetzt zulässig sind korrekte Versionen und nachvollziehbare historische/experimentelle Methodik; keine Nettoprognose, Kaufempfehlung oder empirische Überlegenheit.
