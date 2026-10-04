# Paket 04 · Reproduzierbare Analysen und Prüfprotokoll

Implementiert ab `analysis-archive-v1`, auf Basis main `46616b423bdfd0dad309184e9c1aa42b3b726fbe`. Keine Prognosefreigabe und keine neuen Modellvarianten.

## Manifest und unveränderliches Archiv

`/api/stocks` und `/api/simulation` speichern unter einer neuen UUID Analyseergebnis, Eingabe und Manifest in `BUCKET/analyses/`. Conditional Create (`etagDoesNotMatch: '*'`) verhindert Ersatz eines bestehenden Objekts. Replay schreibt nichts. Ohne Archiv oder vollständige Snapshots bleibt die Archivfreigabe unbekannt. Ohne Quellcommit kann die Analyse gespeichert werden, aber keine identische Quellversion behauptet werden.

Das Manifest enthält tatsächlichen **Buildquellcommit**, Modell-/Vergleichsversion und Parameter, USD-Szenariobetrag und Kosten, fixen Kalenderstand, Universum einschließlich SPY, Snapshot-IDs und SHA256 der vollständigen archivierten Providerobjekte, Normalisierungs-/Abrufzeiten, Ergebnis-SHA256 und Prüfprotokoll. Ein weiterer SHA256 prüft Manifest/Eingabe/Ergebnis gemeinsam. Dies erkennt Beschädigungen; es ist keine kryptografische Signatur gegen Administratoren mit Schreibzugriff.

Der Build verlangt bei vorhandener Variable einen vollständigen 40-stelligen SHA aus `SOURCE_COMMIT`, alternativ `GITHUB_SHA`. Der Checkout/Buildworkflow muss dessen Übereinstimmung mit dem gebauten Source sicherstellen. Ohne Variable wird `null` eingebettet, niemals main, ein Versionslabel oder ein erfundener Commit. Ein Testbuild mit dem bekannten Ausgangscommit prüft lediglich die Commitweitergabe; erst der Orchestratorbuild mit dem tatsächlichen neuen Commit prüft dessen Identität. Generierter Worker und Source müssen aus demselben Build stammen.

`GET /api/analysis?id=<UUID>` liest den ursprünglichen Datensatz. `GET /api/replay?id=<UUID>` verlangt exakt denselben Quellcommit und lädt ausschließlich dessen Snapshots; Research läuft mit den ursprünglichen Normalisierungszeitpunkten erneut, Kostenszenarien mit dem ursprünglichen Auswertungszeitpunkt. Fehler-/gesperrte Ergebnisse bleiben ebenfalls reproduzierbar. Ergebnisabweichung, fehlendes Archiv, falscher Commit oder veränderte Snapshots führen zu sichtbar unbekannt/HTTP 409, niemals zum Anbieterfallback.

Ereigniszeit wird als Quellzeitraum geführt. `publicationTime` und `availableAt` bleiben separat **null**, wenn unbelegt. `retrievedAt` und `normalizationAt` sind keine historischen Verfügbarkeitsnachweise. Archivierte heute abgerufene bereinigte Historie ist kein Historical Vintage. Die strengen PIT-/Kapitalmaßnahmen-Gates bleiben erhalten.

## Sitzungsraster

Researchspines beginnen unveränderlich mit der regulären US-Sitzung 2021-01-04. Referenz-/Vergleichsfälle beginnen auf Sitzungsindex 80, Walk-forward-Fenster auf Index 260, jeweils Abstand 20 Sitzungen. Fehlende/noch nicht existente frühere Kurse stehen als null; sie werden weder eingefüllt noch zeitlich komprimiert. Fenster ohne auswertbare Kandidaten sind unbekannt (`unknownDecisionCount`), kein künstlich bekannter 0%-Cashfall; nur bekannte negative Kandidaten können bewusst Cash begründen. Das Providerfenster bleibt 1.300 Balken, seine Verschiebung ändert aber nicht mehr die Phase der Falltermine. Alte historische Ergebnisse werden ausschließlich mit ihrer archivierten Datenbasis verglichen; eine neue Analyse darf wegen weggefallener Trainingsdaten andere Fits haben.

Die Sitzungstabelle deckt 2021–2027 ab; historische Kalenderqualifikation vor 2025 bleibt eingeschränkt. Keine 2028-Sitzung wird erfunden. Zu kurze zusammenhängende Historie und unbekannte Sitzungen verhindern Features/Ausführung. Vorlaufverluste und Einführungsdaten erzeugen keine synthetischen Kurse. `reference/v1` bleibt vollständig unverändert.

## Prüfprotokoll und Versuchsereignisse

`GET /api/protocol` liefert ein versioniertes festes Vorbereitungsprotokoll: Training 2021–2023, Validierung 2024–2025, **explorative** Diagnose 2026, künftig prospektiver äußerer Test 2027-01-04 bis 2027-11-30; 20 Outcome-Sitzungen werden an Grenzen entfernt. Der frühere Endpunkt ermöglicht Outcomes innerhalb des derzeit abgedeckten Kalenders. Die Auswertung muss die qualifizierte tatsächliche Stichprobe prüfen.

Baselines: Cash, SPY mit gleicher Exitpolitik, SPY Buy-and-hold, gleichgewichtete Watchlist und einfache 20-Tage-Momentumwatchlist. Hauptgrößen sind Nettokapitalertrag gegenüber SPY gleicher Exitpolitik und täglicher Nettodrawdown. Verlustschwere, Turnover, Cashanteil, unbekannte Outcomes, Prognosefehler und Bandabdeckung werden zusätzlich erfasst. Fixe USD-Kostenszenarien entsprechen den derzeitigen separaten Fee-/Slippageparametern; Stress verdoppelt sie. Spread bleibt separat unbekannt/nicht modelliert. Daraus folgt keine Freigabe echter Nettorenditen.

`POST /api/experiment` registriert Modell, Parameter und Begründung vor einem künftigen Versuch (`status: registered`). Abschlüsse einschließlich `rejected`/`failed` werden als neue Ereignisse mit `registeredId` gespeichert; Modell und Parameter müssen unverändert sein. `GET /api/experiment?id=<UUID>` liest ein Ereignis. Ergebnisse können auf eine existierende Analyse verweisen. Das ersetzt keine unbeobachtete Testperiode, keine vollständige Versuchsauswertung und keine Zugangsprüfung. Bereits bestehende features-v2-Versuche sind **nicht rückwirkend vorregistriert**. Mehrere Abschlussereignisse sind sichtbare Historie, kein Überschreiben eines Statusfelds; keine neue Variante wird hier gerechnet.

## Technische Prüfung und offene empirische Grenzen

Replaytests verwenden synthetische Providerdaten und ein In-Memory-Archiv: geänderte/ausfallende Providerantwort, identischer Research-/Kostenszenariopfad, Snapshotmanipulation/-verlust, gesperrte Provider-/Qualitätsanalysen, neues Analyseobjekt statt Überschreiben, conditional-create-Konflikt, fehlendes Archiv/Commit, feste Rasterphase trotz fehlendem Präfix und neuem Ende, Kalendergrenzen sowie registrierte/verworfene Versuche. Bestehende Referenz und Regressionen bleiben geprüft.

Reale BUCKET-Conditional-Write-/Providerintegration, Lizenz-/Archivfähigkeit, historische Vintages und Maßnahmenabdeckung sind noch nicht abgenommen. Das Protokoll schafft technische Vorbereitung, keine empirische Überlegenheit. Der endgültige Build mit tatsächlichem neuen Quellcommit, unabhängige Datenqualifikation und spätere Beobachtung sind erforderlich.
