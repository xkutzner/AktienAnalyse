# V11 · Haupttabelle und mobile Analyseansicht

Stand: 06.10.2026, Europe/Berlin. Eigenständiger Paketkontext, Branch `delivery/v11-main-dashboard`.
Ausgangs-main: `2f1cc23b9c248614fd27d8975266aedd50d7da85` (Paket A, PR #18, Merge nach getestetem Head `17131a27dcb8f7e8b56e4d589ecd197d79578a01`). Aktueller main und keine offenen PRs beim Start über GitHub-Plugin-API bestätigt; alle 73 Ausgangsblobs der lokalen Vorlage gegen API-Gitblob-SHAs geprüft. AGENTS, Produktkonzept, Lieferplan, Implementierungsstatus und V01–V04 gelesen. V03 wird nicht erneut implementiert.

## Umsetzung

- `app/index.html`: direkt sichtbare Haupttabelle vor der Analysekarte mit sieben Kernspalten: Aktie, Einschätzung, Nettoszenario bis Tag 20, ungünstiges Szenario/Verlustrisiko, nächster Termin, Datenstand/Verlässlichkeit und Details. Unternehmensnamen werden nicht erfunden; aktueller API-Vertrag liefert keinen qualifizierten Namen.
- Native aufklappbare Details je Aktie zeigen positive/negative historische Kursmerkmale, alle fachlichen Sperrgründe/fehlenden Daten, Einstiegsspanne, gemeinsame vorläufige bzw. Fill-Preisanker, Enddatum, aktuelle Kostenannahmen und tatsächlich verwendete Indikatoren aus der Methodikregistry. Keine neuen Modellformeln, Gewichtungen, Gates oder API-Abfragen.
- Gemeinsame `analysisCardPolicy` erzeugt Status/qualifizierte Szenariowerte für Karte und Tabelle. Fehlende Nettowerte erscheinen mit konkreten Gründen; vorhandene rein experimentelle Szenariowerte behalten ihren Hinweis auf fehlende Prognosefreigabe. Historischer Mittelwert ausschließlich in getrennt beschrifteten Aufklappdetails und alter Referenzansicht: **Historisch, ohne Kosten**; niemals in der Netto-Spalte. Historische Perzentile werden nicht zu Zukunfts- oder Verlustwahrscheinlichkeiten umbenannt.
- Statusfilter und Vergleich von 2–3 unterschiedlichen geprüften Watchlist-Titeln, Rücksetzung auf alle Aktien. Keine neue Renditeberechnung. „Nicht beurteilbar“ und „Aktuell keine geeignete Aktie“ bleiben unterschiedliche gemeinsame Policy-Zustände; positive historische Referenzen erzeugen keine Nettokaufkandidaten.
- Mobile beschriftete Karten unter 780px verwenden denselben semantischen Tabelleninhalt einschließlich aller Details, unter 360px eine Spalte. Ruhige Farbflächen, klare Hierarchie, konsistente Abstände, Textstatus und Zahlen/Einheiten. Native Tastaturbedienung für Filter/Selects/Summary/Buttons; vorhandene Tabfunktionen bleiben erhalten.
- Paket A erhalten: sofortiger Ladezustand, langsame Anfrage, Abbruch/Retry, konkrete Provider-/Qualitätsfehler, Teilergebnisse, versionsgesicherte Antworten. Frühere Ergebnisse erscheinen zusätzlich als **Veraltete Einschätzung** in der Statusspalte. Geänderte Watchlist ersetzt keine fremden früheren Ergebnisse. Nicht nutzbare Aktien bleiben ausgeschlossen; Gründe bleiben im Banner und der Datenprüfung.
- Terminspalte übernimmt den vorhandenen autorisierten Kalenderabruf; kein Zusatzverbrauch ohne Klick. Beobachteter Quellenstand ist „Quelle beobachtet · noch nicht fachlich geprüft“, angegebener Termin unbestätigt, bestätigter Quellenbeleg separat. Unbekannte Unternehmensabdeckung wird nicht als Ereignisfreiheit behauptet.
- Historische Ziel-only-Referenz und experimenteller Rohpreis-/Fillplan sind sprachlich getrennt. Hauptseiten-Hinweis und Detailrisiko behaupten nicht pauschal „kein Stop-Loss“ für jeden Plan.
- `scripts/test-ui.mjs`: gezielte Controllerregressionen für Haupttabelle, sieben Spalten/Labels, Netto-/Historiktrennung, vollständige Details, gemeinsame Qualifikations-/Statuspolicy, Statusfilter, Doppelwahlabwehr und Zweiaktienvergleich, Teil-/Staleergebnisse, Kalenderupdate und Escaping/Deutsche Quellenstatus.
- Dokumentation: dieses Protokoll, Lieferplan, Implementierungsstatus, Roadmap, UI-Abnahme und Fortschreibung Paket A.

## Prüfprotokoll

| Prüfung | Ergebnis / Nachweis | Grenze |
|---|---|---|
| GitHub-Ausgangsstand | main oben, keine offenen PRs; 73/73 Basisblobs bytegleich | API-only Sicherung, kein Gitpush |
| Gezielte UI-Regression | `node scripts/test-ui.mjs` bestanden | tatsächlicher Inlinecontroller, synthetischer Mock-DOM; keine Browserdarstellung |
| Gesamte Regression | `npm test`, 17 Suiten; finaler Head im PR-Prüfkommentar | Software, keine Markt-/Prognosegüte |
| Build/Artefakt | `SOURCE_COMMIT=<getesteter Head> npm run build`, `npm run validate`; finales Protokoll im PR | standalone ESM und Sourcezuordnung, keine Veröffentlichung |
| 320/390/768/Desktop, echte Tastatur/Screenreader | **nicht ausführbar** | private bestehende Site zeigt Anmeldung; Loginaktion zu auth.openai.com vom Browserpolicy mit „Nutzer verweigerte Berechtigung“ abgelehnt. Kein Umgehungsversuch. CSS-/Mock-DOM-Prüfung ersetzt keine echte UX-Abnahme |
| Reales JSON, Verarbeitung und angezeigte Echtdaten | **nicht ausführbar** | Anmeldung blockiert; HTTP200-Logs enthalten keinen JSON-Inhalt. Kein Demoersatz |
| Daten-/Prognosefreigabe | unverändert blockiert | qualifizierte Rohpreise, vollständige Maßnahmen, historische Verfügbarkeit, Liquidität/Netto-/Empirienachweise bleiben notwendig |
| reference/v1 | vier Basisblobs bytegleich | keine Änderung |

Ein ergänzender synthetischer Statusregressionstest schlug zunächst wegen einer bereits zuvor absichtlich auf unbekannt gesetzten Kostenqualifikation der Testfixture fehl; Fixturequalifikation für diesen eigenen Fall wiederhergestellt. Keine Produkt-Gateänderung, kein verbleibender Fehltest.

## Abnahme und nächste Schritte

I: **technisch umgesetzt**, reale visuelle/Nutzerabnahme **offen**. D: echte Anzeige-/Provider-Ende-zu-Ende-Abnahme **blockiert**, V04 bleibt offen. E: für V11 nicht erforderlich; keine Prognosegüte behauptet. Szenariosperren erhalten, historische Daten sind keine Nettoprognose.

PR, getesteter finaler Head und Mergecommit sind im GitHub-PR-/Abschlussprotokoll zuzuordnen, keine selbstreferenzierende Commit-ID im eigenen Commit. Orchestrator prüft und mergt den getesteten Head.

Keine Veröffentlichung durch V11. Nächster separater Paketkontext: passende V22-Abnahme; bei weiter blockierter realer Prüfung kein erfolgreicher benutzbarer Produktionszwischenstand beanspruchen. Bestehende Site: https://aktienlabor-20-tage.sava-kutz.chatgpt.site . Zugangseinstellungen unverändert. Keine neue Site, Datenkäufe, Brokerorders oder Änderung an reference/v1. Nach möglicher einmaliger geprüfter Veröffentlichung Stopp zur Erprobung; V06/weitere Roadmap nicht automatisch fortsetzen.
