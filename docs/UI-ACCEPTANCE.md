# Paket 10 · Oberflächenabnahme und Leseintegration

Stand 04.10.2026 · Ausgangsmain `efa82b15057783e537147bb0bc644103484115df`, nach Paket09-Merge `83e823c26931a368656193a3b8c44f4385cbed16`.

Die technische Zustandsabnahme verwendet den tatsächlichen gerenderten Inline-Scriptcode mit synthetischem Mock-DOM. Sie belegt keine Browserdarstellung, Screenreaderansage oder empirische Prognosegüte. Eine vollständige reale Oberflächen-/Providerabnahme bleibt offen.

| Kriterium | Status | Evidenz / Grenze |
|---|---|---|
| Laden, Fehler, leere / ungültige Watchlist | PassedMock | Werte werden gelöscht, keine Requests für ungültige Eingabe; Fokus auf erreichbare Watchlist, verknüpfte Fehlermeldung und aria-invalid, danach Rücksetzung |
| Fehlende Daten, negative historische Beobachtungen | PassedMock | Unbrauchbarer SPY sperrt alle Selektoren; negative Referenz erhält keine positive Auswahl/Vormerkung; keine erfundenen Kandidaten |
| Verspätete Antworten und Konfigurationswechsel | PassedMock | Antworten trotz ignoriertem Abort dürfen keine alten Symbol-/Kosten-/Kalender-/Risikowerte zurückschreiben |
| Tastaturfunktion der Tabs / Fehlerkorrektur | PassedMock | Pfeile, Home/End, roving tab focus und Eingabefokus; echte Tastaturbedienung offen |
| Statussemantik | PassedMock | Banner als atomare höfliche Statusregion; die vollständige Analysekarte ist keine konkurrierende große Live-Region; bestehende Überschriften, native Details und fokussierbare Tabellen |
| Deutsch und Einheiten | PassedMock | Prozent und Prozentpunkte getrennt; USD-Szenario, EUR/FX-Sperre und bp-Kostenbeschriftung; Häufigkeit/Ähnlichkeit mit deutschem Dezimalkomma |
| 320 / 375 / 780 px, Desktop | unavailable | CSS strukturell geprüft, kein Nachweis von Layout/Clipping; schmale Suchlabels und Metriken können umbrechen |
| 200 % Zoom / echte Tastatur | unavailable | Kein zulässiger Browserlauf verfügbar |
| Screenreader | unavailable | Kein reales Screenreaderwerkzeug verfügbar; ARIA/Mock-Fokus ist kein Ansagenachweis |
| Echter Analyse-/Archiv-/Replay-Durchlauf | unavailable | Lokaler letzter Preflight: TWELVEDATA_API_KEY fehlt; keine Aussage über Site-Secrets. Kein tatsächlicher BUCKET-Zugang nachgewiesen. Kein Providerrequest erzeugt |
| Synthetisches immutable Archiv / providerfreies Replay | PassedMock | Bestehende Reproduzierbarkeitssuite mit synthetischem Storage und Providerfixtures |
| Reale Browser-/Providerprüfung | kein PassedReal | Offene externe Abnahme, keine Software-/Prognosefreigabe |

## Werkzeuggrenzen und offene Abnahme

Runtime enthält Playwright, jedoch fehlen die erwarteten Chromium- und Firefox-Binaries. Es wurden keine Pakete/Binaries geladen und keine Credentials gesucht. Der Orchestrator fand Cloud-Chrome; die direkte lokale file://-Navigation wurde von dessen Browser-URL-Sicherheit abgewiesen (nur http/https). Keine alternative Bereitstellung oder Umgehung und keine Site-Veröffentlichung. Diese Browser-Sicherheitsgrenze ist keine automatische Freigabeprüfung.

Ein npm-Sammelbefehl wurde von der automatischen Freigabeprüfung wegen eines registry.npmjs.org-Zugriffs außerhalb des autorisierten No-Download-Workflows zurückgewiesen. Nach Prüfung der Scripts laufen die Tests, der reine Kopierbuild und die Artefaktprüfung direkt mit Node/Bash offline. Kein npm-Retry oder Package-Download.

Noch erforderlich: reales Rendering jeder Breite und bei 200 % Zoom auf horizontalen Hauptinhaltüberlauf kontrollieren; vollständigen Tastaturpfad und Screenreaderansagen einschließlich Fehlerkorrektur manuell abnehmen; bei vorhandenem autorisiertem Zugang echte Analyse unveränderlich archivieren und identisches providerfreies Replay belegen. Diese Nachweise fehlen. Die drei Capability-Gates und Prognosefreigabe bleiben gesperrt.

## Technische Änderung

Ungültige/leer eingegebene Watchlists erhalten jetzt einen direkt mit dem Eingabefeld verknüpften Fehler, aria-invalid und Fokus auf das Feld, auch nach Auslösung aus einem anderen Arbeitsbereich. Beim Bearbeiten oder gültigen Versuch verschwindet der Fehler. Das Banner kündigt eine vollständige kurze Statusmeldung atomar an; der lange Karteninhalt ist keine zusätzliche Live-Region. Schmale Metriken/Vormerkungen und Suchlabels können umbrechen. Zwei historische Prozentdarstellungen verwenden ebenfalls das deutsche Dezimalkomma.

Neutralbuild: SOURCE_COMMIT=null. Der Orchestrator führt die tatsächliche Uploadheadprüfung separat aus. `reference/v1` unverändert; generierte worker/index.js und dist sind keine Uploadquellen. Paket11 ist nicht bearbeitet.

Prüfkommando (lokal, ohne npm): `node scripts/render-worker.mjs`; danach sequenziell `node scripts/test-{model,contract,calendar,reference,selection,data,simulation,analogues,broker,ui,reproducibility,capabilities,execution-labels,tradeplan,analysis-card}.mjs` (jeweils einzeln); `bash scripts/build.sh`; `node scripts/validate-artifact.mjs`. Alle fünfzehn Suiten, lokaler Build und Artefaktprüfung bestanden. Tests verwenden explizite Fixtures und keine realen Providerzugänge. Die Reproduzierbarkeitssuite weist beim Neutralbuild ausdrücklich den fehlenden tatsächlichen Commit und dadurch gesperrtes Replay aus; der tatsächliche Source-SHA-Lauf folgt durch den Orchestrator.
