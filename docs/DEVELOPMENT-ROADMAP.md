# AktienAnalyse – Entwicklungsroadmap

Stand: 04.10.2026 · Grundlage: unabhängiger Review von `xkutzner/AktienAnalyse`, Branch `main`, Commit `4094ce7ed01cc2ebb5cacb980a8bb0061e7de72e`.

**Ziel:** Eine verständliche Entscheidungshilfe für Einzelaktien und Watchlists mit maximal 20 Handelstagen Haltedauer. Sie zeigt plausible Nettoszenarien, Risiken und einen nachvollziehbaren Ein-/Ausstiegsplan. Wenn Voraussetzungen fehlen, ist „Aktuell keine geeignete Aktie“ ein reguläres Ergebnis.

Diese Roadmap ist eine Planung. Sie verändert keinen Code und beauftragt keine Veröffentlichung. Der jeweilige aktuelle Repository-Stand muss vor einer Umsetzung erneut geprüft werden.

## So arbeiten wir mit Sol

- Jeweils **ein Arbeitspaket** beauftragen. Die gesamte Roadmap dient als Kontext, nicht als Auftrag, alles gleichzeitig umzusetzen.
- Sol nennt vor Beginn Branch und Commit, berücksichtigt zwischenzeitliche Änderungen und erhält die eingefrorene Referenz.
- Jedes Paket endet mit Änderungen, passenden Prüfergebnissen, offenen Grenzen und aktualisiertem Roadmap-Status.
- Softwaretests belegen Softwareverhalten. Sie ersetzen keine Prüfung der Prognosegüte auf späteren Daten.
- Keine Site-Veröffentlichung, kostenpflichtige Datenbuchung oder Brokerorder ohne entsprechenden Auftrag.
- Neue Modellvarianten werden zunächst parallel ausgewertet. Die Rangliste wird erst nach einem dokumentierten Vergleich umgestellt.

Status aller nachfolgenden Pakete: **offen**. Bereits vorhandene Funktionen werden weiterverwendet; es ist kein Neubau vorgesehen.

## Überblick

| Phase | Ergebnis | Pakete | Voraussetzung für den nächsten Meilenstein |
|---|---|---|---|
| 1. Fehler und Grundlagen | Korrekte, reproduzierbare Berechnungsbasis | 01–05 | Auswahl ohne Zukunftseinfluss; klare Daten- und Ergebnisverträge |
| 2. Erste Aktienanalyse | Vollständige, verständliche experimentelle Analyse | 06–10 | Kosten, Einstieg, Stop, Ziel, Enddatum und Kein-Kauf-Status konsistent |
| 3. Güte nachweisen | Vergleich mit einfachen Strategien und wenige gezielte Verbesserungen | 11–14 | Zeitlich getrennte Prüfung; Ergebnis darf auch „kein Mehrwert“ sein |
| 4. Kapital und Positionen | Tagesaktuelle Halte-/Ausstiegs- und Umschichtungsbewertung | 15–18 | Erste Analyse steht; Positionen und Cash sind zuverlässig erfasst |

**Wichtig:** Phase 2 darf als experimentelles Research nutzbar werden. Eine belastbar geprüfte Kaufentscheidung darf erst nach den Freigabekriterien aus Phase 3 behauptet werden. Die Vorbereitung der Validierung beginnt bereits in Paket 04.

## Phase 1 – Fehler und Grundlagen

### 01 · Historische Auswahl von späteren Ergebnissen trennen

**Priorität:** P0 · **Abhängigkeit:** keine · **Umfang:** mittel

- `walkForward()` korrigieren: Erst mit dem Wissensstand am Entscheidungstag auswählen, anschließend den späteren Ausgang auswerten.
- Fehlende spätere Kurse dürfen weder einen Ersatzkandidaten noch einen nachträglichen Cash-Trade erzeugen.
- Historische Datenqualität anhand des damaligen Datenpräfixes prüfen. Die heutige strenge Datenfreigabe erhalten.
- Fehlende spätere SPY-Daten dürfen die damalige Aktienauswahl nicht entfernen.
- Korrigierten Pfad versionieren; `reference/v1` einschließlich Hash und Ergebnissen unverändert lassen.

**Abnahme:** Änderungen ausschließlich nach Entscheidungstag t verändern weder damaliges Universum noch Features, Fit oder Auswahl. Der im Review beschriebene Fall A/B bleibt bei A, wenn dessen späteres Open fehlt; nur der Outcome wird unbekannt. Unbekannte Ergebnisse werden separat gezählt und nicht als 0% verbucht. Bestehende Referenzregression bleibt bestanden.

### 02 · Verlustgrenzen und Rohdatenprüfung reparieren

**Priorität:** P0 vor Freigabe des neuen Simulationspfads · **Abhängigkeit:** 01 · **Umfang:** klein bis mittel

- Bei Intraday-Zielverkäufen das bereits bekannte Open in die Grenze des maximalen Zwischenverlusts aufnehmen.
- Einen gemeinsamen Rohdatenadapter vor Simulation und Research verwenden: Duplikate, OHLC, Währung, Börse und Sitzungskalender einheitlich behandeln.
- Datenfreigaben nicht durch pauschales Setzen von `coverageVerified` oder `pointInTimeVerified` umgehen.

**Abnahme:** Einstieg 100, vorheriges Low 99, folgendes Open 90/Low 85/High 106 und Ziel 105 ergeben bei Nullkosten die MAE-Grenzen **−15% bis −10%**. Doppelte Rohdatentage werden gesperrt statt überschrieben. Gap-, Split- und Einstiegstagsfälle bestehen.

### 03 · Verbindlichen Analysevertrag festlegen

**Priorität:** P0 · **Abhängigkeit:** 01 · **Umfang:** klein

Vorläufige Produktentscheidungen:

- Long-only, ungehebelt; zunächst unterstützte US-Aktien in USD innerhalb der angegebenen Watchlist.
- Entscheidung nach abgeschlossenem Tageskurs und bestätigter Datenverfügbarkeit; Einstieg frühestens nächstes reguläres Open.
- Einstiegstag = Handelstag 1; geplanter letzter Ausstieg zum regulären Schluss von Tag 20.
- Aktienrendite am Tag 20, Ertrag einer früher aussteigenden Strategie und Kapitalrendite über das ganze Vergleichsfenster getrennt behandeln.
- Für fixe Gebühren einen sichtbaren, änderbaren **Szenario-Anlagebetrag** vorsehen. Das ist noch keine Depotverwaltung.
- Unbekannt, nicht geeignet und bewusst Cash halten sind getrennte Zustände.

**Abnahme:** API und UI verwenden dieselbe Definition für Horizont, Renditebasis, Währung, Betrag, Kosten und Ergebnisstatus. Die vier Ergebnisbezeichnungen aus dem Review sind verbindlich. Kein historischer Mittelwert wird ohne Nachweis als erwartete Nettorendite ausgegeben.

### 04 · Reproduzierbarkeit und Prüfprotokoll aufbauen

**Priorität:** P0 · **Abhängigkeit:** 03 · **Umfang:** mittel

- Pro Analyse ein Manifest mit Commit, Modellversion, Parametern, Kalenderstand, Universum, Snapshot-IDs und Zeitpunkten speichern.
- Ereigniszeit, Veröffentlichungs-/Verfügbarkeitszeit und Abrufzeit getrennt führen.
- Historische Fälle an einem festen Sitzungsraster verankern; das rollende 1.300-Balken-Fenster darf das Raster nicht unbemerkt verschieben.
- Vor dem ersten neuen Modellversuch Baselines, Testperioden, Kostenannahmen und Hauptkennzahlen festlegen.

**Abnahme:** Eine gespeicherte Analyse ist aus ihren Snapshots identisch wiederholbar. Alte Entscheidungen werden nicht überschrieben. Datenlücken und nicht belegte Verfügbarkeitszeiten bleiben sichtbar. Versuche einschließlich verworfener Varianten sind nachvollziehbar.

### 05 · Datenfähigkeiten prüfen und Freigaben trennen

**Stand:** Technisch umgesetzt, echte Datenabnahme und prospektiver Sammelstart offen. Details: [DATA-CAPABILITIES.md](DATA-CAPABILITIES.md). Drei unabhängige Freigaben bleiben gesperrt; fehlende lokale Credentials sind nicht geprüft.

**Priorität:** P0 · **Abhängigkeit:** 03–04 · **Umfang:** mittel, zuzüglich möglicher Datenbeschaffung

- Tatsächlichen Zugang zu Rohkursen, bereinigten Kursen, Splits, Dividenden, Kalendern und Archiv prüfen, soweit autorisierte Zugänge vorhanden sind.
- Für jede Quelle Umfang, Historie, Aktualität, Kosten und damalige Verfügbarkeit dokumentieren.
- Drei unabhängige Freigaben unterscheiden: retrospektives Kostenszenario, zeitlich korrekte historische Modellprüfung und nachgewiesene Prognosegüte.
- Prospektive Datensammlung beginnen, auch wenn vollständige historische Vintages fehlen.

**Abnahme:** Keine unbekannte Maßnahme wird als „keine Maßnahme“ interpretiert. Fehlende Credentials zählen als nicht geprüft. Kostenszenarien sind nur bei ausreichender dokumentierter Datenbasis möglich; der wissenschaftliche Prognosenachweis bleibt davon getrennt.

**Meilenstein 1:** Die Berechnungsbasis ist reproduzierbar und ihre Grenzen sind maschinenlesbar. Es wird noch keine bessere Prognose behauptet.

## Phase 2 – Erste Aktienanalyse für maximal 20 Handelstage

### 06 · Einen gemeinsamen Ausführungs- und Kostenpfad schaffen

**Stand:** Technisch lokal umgesetzt, Review/Upload/Merge ausstehend; echte historische Labels und Kostenabnahme blockiert. Details: [EXECUTION-LABELS.md](EXECUTION-LABELS.md). Synthetische Parität ist keine Daten- oder Prognosefreigabe.

**Priorität:** P0 · **Abhängigkeit:** 02–05 · **Umfang:** groß

- Historische Trainingslabels, Szenarien und Strategievergleiche über denselben versionierten Ausführungskern berechnen.
- Gebühren, Spread, Slippage und gegebenenfalls FX getrennt modellieren; Doppelzählung vermeiden.
- Rohpreise für Ausführung, bereinigte Reihen für geeignete Merkmale und Maßnahmenledger sauber verbinden.
- Cash nach frühem Verkauf und Dividendenforderungen separat behandeln.

**Abnahme:** Derselbe Trade erzeugt im Label- und Simulationspfad denselben Ertrag. Gebühren reagieren korrekt auf Anlagebetrag/Stückzahl. Fehlendes FX verhindert eine scheinbare EUR-Nettorendite. Bereinigte historische Proxys werden nicht durch pauschalen Kostenabzug zu „realen Nettoergebnissen“ umbenannt.

### 07 · Einstieg, Stop, Ziel und Enddatum ergänzen

**Priorität:** P1 · **Abhängigkeit:** 06 · **Umfang:** groß

- Gültigkeitszeitpunkt und zulässigen Einstiegspreisbereich definieren; außerhalb neu bewerten oder verzichten.
- Einen einfachen Stop als experimentelle Regel ergänzen; die alte +5%-Referenz erhalten.
- Gewinnmitnahme, Zeitablauf und Wegfall der Kaufthese als getrennte Exitgründe speichern.
- Konkretes geplantes Enddatum aus Börsensitzungen berechnen.
- Negativen Gap durch den Stop, Ziel und Stop am selben Tag sowie Handelsunterbrechungen abbilden.

**Abnahme:** Keine Ausführung garantiert zum Stoppreis. Bei unbekannter Intraday-Reihenfolge konservative Annahme/Ergebnisband statt erfundener Reihenfolge. Kein stilles Verschieben des Einstiegs oder Verlängern des Enddatums. Nicht ausführbarer Tag-20-Ausstieg bleibt eine sichtbare Ausnahme.

### 08 · Wenige grundlegende Risiko- und Ereignisdaten ergänzen

**Priorität:** P1 · **Abhängigkeit:** 05–07 · **Umfang:** mittel pro Teilpaket

Bei Bedarf als **08a** und **08b** getrennt beauftragen:

- **08a Handelbarkeit/Risiko:** Volumen erhalten; durchschnittlichen täglichen Handelswert, Eröffnungslücken und ein zusätzliches Downside-Maß berechnen. Fehlende Werte bleiben unbekannt.
- **08b Ereignisse:** bestätigte Quartalszahlen und relevante Kapitalmaßnahmen mit Quelle, Verfügbarkeitszeit und Änderungen erfassen. Ereignisfenster bis zum tatsächlichen geplanten Enddatum statt pauschal 35 Kalendertage.

**Abnahme:** Keine zukünftigen Daten in Features. Ein Split wird nicht als wirtschaftlicher Kurscrash interpretiert. Kein Kalender-Treffer ist nicht automatisch bestätigte Ereignisfreiheit. Neue Handelsschwellen bleiben bis Paket 12 experimentell.

### 09 · Szenarien, Kein-Kauf-Regeln und Analysekarte

**Priorität:** P1 · **Abhängigkeit:** 06–08 · **Umfang:** mittel

Eine verständliche Hauptansicht erstellen:

- Status: geeignet im geprüften Modus / experimentell beobachten / aktuell keine geeignete Aktie / nicht beurteilbar.
- Zwei kurze Gründe für den Status.
- Einstiegspreisbereich, mittleres und ungünstiges Nettoszenario, Stop/Ziel und letztes geplantes Ausstiegsdatum.
- Sichtbarer Datenstand, Kostenannahme und Ergebnisstatus; technische Details aufklappbar.
- Harte Sperren für Daten-/Kosten-/Liquiditätsprobleme und überschrittenes Risikobudget; Cash als reguläre Alternative.

**Abnahme:** Keine Kaufkandidaten nur zum Füllen der Oberfläche. Historische Quantile werden nicht als garantierte Zukunftsspanne bezeichnet. Ohne geprüfte Kalibrierung keine prognostischen Wahrscheinlichkeiten. Bei unzureichenden Daten bleiben Rendite-/Risikowerte unbekannt. Vor Paket 14 kein freigegebener geprüfter Kaufstatus.

### 10 · Oberfläche und echte Leseintegration abnehmen

**Priorität:** P1 · **Abhängigkeit:** 09 · **Umfang:** mittel

- 320/375/780px, Desktop, 200%-Zoom, Tastatur und Screenreader prüfen.
- Ladezustände, Fehler, leere Watchlist, fehlende Daten, negative Kandidaten und verspätete Antworten testen.
- Mit autorisiertem Anbieterzugang mindestens einen echten Analyse-/Archiv-/Replay-Durchlauf durchführen; sonst offen dokumentieren.
- Kurze deutsche Texte, USD/EUR, Prozent/Prozentpunkte und Basispunkte konsistent anzeigen.

**Abnahme:** Kerninformationen verständlich und erreichbar; kein abgeschnittener primärer Inhalt. Kein alter Wert bleibt nach Fehler oder Symbolwechsel als aktuell stehen. Mock-DOM und echte Browserabnahme werden separat ausgewiesen.

**Meilenstein 2:** Eine vollständige experimentelle Einzelaktien-/Watchlistanalyse ist nutzbar. Automatische Orders und Depotverwaltung sind weiterhin nicht erforderlich.

## Phase 3 – Prognosegüte prüfen und gezielt verbessern

### 11 · Zeitlich getrennten Vergleich durchführen

**Priorität:** P0 vor Prognosefreigabe · **Abhängigkeit:** 04–07; 08 optional als Challenger · **Umfang:** groß

- Training, Validierung und spätere Testblöcke strikt trennen; überlappende Ergebnisfenster an Grenzen entfernen.
- Gegen Cash, SPY mit gleicher Exitpolitik, SPY-Buy-and-hold und einfache Watchliststrategien vergleichen.
- Eingefrorene Referenz nur als historische Reproduktion behandeln; ihren bekannten Auswahlfehler nicht als Gütemaß übernehmen.
- Nettorendite über die gesamte Kapitalzeit, täglichen Drawdown, Verlustschwere, Turnover, Cashanteil und unbekannte Outcomes auswerten.
- Prognosefehler und Bandabdeckung zusätzlich zur Strategieperformance messen.

**Abnahme:** Vollständige Ergebnisdateien und negative Befunde; Parameterwahl ausschließlich vor dem äußeren Test. Alle Varianten erhalten vergleichbare Kosten-/Ausführungsannahmen. Bei zu kurzer qualifizierter Historie bleibt die Aussage experimentell; eine Mindestzahl von zwölf Fällen ist kein Prognosenachweis.

### 12 · Drei Ergänzungsgruppen einzeln auf Mehrwert testen

**Priorität:** P1 · **Abhängigkeit:** 08 und 11 · **Umfang:** mittel pro Experiment

Nacheinander, jeweils gegen das unveränderte Basismodell:

1. **Handelbarkeit und Gap-/Downside-Risiko:** Verbessern sich Nettogüte oder Verlustbegrenzung?
2. **Earnings-/Ereignisfilter:** Werden Verluste reduziert, und welche positiven Trades gehen verloren?
3. **Markttrend plus ein Stressmaß:** etwa realisierte Marktvolatilität oder VIX; keine Sammlung vieler ähnlicher Signale.

**Abnahme:** Zusätzlicher Nutzen auf späteren Daten, Kostenstress und mehreren Marktphasen dokumentiert. Cashquote und verpasste Erholungen zählen mit. Eine wirkungslose Gruppe wird verworfen. Schwellen nicht nachträglich auf den Testgewinner zuschneiden.

### 13 · Höchstens einen zusätzlichen Renditeansatz testen

**Priorität:** P2 · **Abhängigkeit:** 11–12 · **Umfang:** mittel

Erster Kandidat: relative Stärke gegenüber dem Sektor. Danach nur bei Bedarf kurzfristige Umkehr oder längeres Momentum/Abstand zum 52-Wochen-Hoch. Eine einfache regularisierte Regression oder Quantilregression kann gegen features-v2 antreten; komplexere Modelle brauchen erheblich mehr geeignete Daten.

**Abnahme:** Mehrwert gegenüber vorhandenen Preismerkmalen ist separat messbar; Kosten und Sektorabhängigkeit berücksichtigt. Keine Verbesserung allein durch zusätzliche Modellkomplexität behaupten.

### 14 · Prospektiver Schattenbetrieb und Freigabeentscheidung

**Priorität:** P0 vor geprüftem Kaufstatus · **Abhängigkeit:** 10–12, optional 13 · **Umfang:** laufend; nicht auf wenige Tage reduzierbar

- Tägliche Analysen vor der nächsten Eröffnung unveränderlich speichern und später auswerten.
- Datenqualität, Bandabdeckung, Kostenannahmen und Auswahlstabilität überwachen.
- Einen vollen 20-Tage-Zyklus für technische Abläufe nutzen; daraus noch keine statistische Freigabe ableiten.
- Genügend unabhängige Zeiträume und unterschiedliche Marktbedingungen sammeln; keine feste kleine Tradezahl als Garantie.

**Abnahme:** Für den Anspruch einer höheren Nettorendite muss eine vorab definierte Überlegenheit zur starken Baseline im unangetasteten Test einschließlich Unsicherheit belegt sein; Risikogrenzen eingehalten. Ein reiner Risikofilter darf über vorab definierte Verlustreduktion bei begrenztem Renditeverzicht bestehen. Andernfalls bleibt das Tool experimentell oder empfiehlt keinen Kauf.

**Meilenstein 3:** Dokumentierte Entscheidung, was tatsächlich besser geworden ist. Erst jetzt darf eine belegte Variante „Auf zeitlich getrennten Daten geprüft“ heißen. Auch ein sauber belegtes negatives Ergebnis ist ein erfolgreicher Forschungsabschluss.

## Phase 4 – Kapital, offene Positionen und tägliche Bewertung

### 15 · Kapital und Positionsledger

**Priorität:** P2 · **Abhängigkeit:** stabile Phase 2; Prognosestatus aus Phase 3 · **Umfang:** groß

Gesamtkapital, verfügbares Cash, Stückzahlen, Ausführungspreise, Währungen, Gebühren und Dividendenforderungen erfassen. Bestehende Browser-Vormerkungen nicht als echte Trades übernehmen. Jede Position speichert Originalthese, ursprünglichen Stop und unveränderliches ursprüngliches Enddatum.

**Abnahme:** Cash, Bestände und Forderungen stimmen rechnerisch überein. Forderungen sind vor Zahlung keine Kaufkraft. Manuelle Käufe/Verkäufe sind nachvollziehbar und nicht doppelt gebucht.

### 16 · Tägliche Positionsbewertung

**Priorität:** P2 · **Abhängigkeit:** 15 · **Umfang:** groß

Für jede Position: Halten, reduzieren, aussteigen oder mangels Daten nicht beurteilbar. Zuerst harte Risiko-/Zeitregeln prüfen, dann Restnutzen bis zum ursprünglichen Enddatum bewerten. Keine täglich neu beginnende 20-Tage-Haltedauer.

**Abnahme:** Ein Long-Stop wird wirtschaftlich niemals gelockert; Splitanpassungen ändern das normierte Risiko nicht. Jede Anpassung ist begründet und protokolliert. Ein Ausführungsproblem verlängert nicht stillschweigend die Strategie.

### 17 · Umschichtung mit Kosten und Entscheidungspuffer

**Priorität:** P2 · **Abhängigkeit:** 16 · **Umfang:** mittel bis groß

Halten mit Verkauf/Neukauf und Cash vergleichen. Zusätzliche Gebühren, Spread, Liquidität, Sektor-/Einzeltitelkonzentration und Unsicherheit berücksichtigen. Wechsel erst bei ausreichend großem zusätzlichem Nutzen; kleine Rangänderungen allein reichen nicht.

**Abnahme:** Wechselpuffer/Hysterese verhindert Rangflattern, blockiert aber keine Stop-/Risikoeingriffe. Vergleich auf gemeinsamem Kapitalhorizont. Teilverkäufe und Mindestgebühren korrekt berücksichtigt.

### 18 · Tagesbetrieb stabilisieren

**Priorität:** P2 · **Abhängigkeit:** 16–17 · **Umfang:** mittel

Tägliche Jobs, Wiederanläufe, Ausfallanzeige, Datenalter, Auditprotokoll und Sicherung umsetzen. Benachrichtigungen nur nach gesondertem Nutzerauftrag. Automatische Orderausführung bleibt ein eigenständiges späteres Projekt.

**Abnahme:** Wiederholter Tageslauf erzeugt keine doppelten Buchungen. Ausfälle sind sichtbar; fehlende Daten führen nicht zu erfundenen Handlungen. Entscheidungen bleiben reproduzierbar.

## Bewusst zurückgestellt

| Thema | Wann wieder aufnehmen? |
|---|---|
| Analystenrevisionen und Ergebnisüberraschungen | Nach belastbarem PIT-Datenvertrag und funktionierendem Vergleichsrahmen |
| Zinsen, Kreditbedingungen, Inflation, Konsum und Konjunktur als zusätzliche Modellmerkmale | Einzelne Hypothesen nach Paket 12; historische Veröffentlichungsstände nötig |
| Fundamentals/Bewertung | Wenn inkrementeller Nutzen für den kurzen Horizont plausibel und prüfbar ist |
| Nachrichten-KI | Zuerst belegte Faktenextraktion; historische Modellkenntnis/Datenlecks prüfen |
| Optionsdaten und Short Interest | Erst nach Kosten-/Lizenz-/Historienprüfung und konkreter Nutzenhypothese |
| Viele weitere technische Indikatoren | Nur bei belegbarem Zusatznutzen gegenüber vorhandenen Merkmalen |
| Deep Learning, automatische Orders, weltweites Screening | Nach stabiler Analyse und ausreichender Daten-/Betriebsbasis |

## Entscheidungen, die später benötigt werden

Der Start von Paket 01 benötigt keine weitere Entscheidung. Vor der wirtschaftlichen Freigabe müssen Basiswährung, tatsächlicher Handelsplatz/Broker, Datenbudget, akzeptierter Verlust und Umgang mit Earnings festgelegt werden. Bis dahin gelten dokumentierte Szenarioannahmen, keine stillschweigend gewählten persönlichen Risikogrenzen.

## Nächster Schritt

**Paket 01 an Sol geben.** Der ausführliche kopierbare Auftrag steht im Reviewbericht in Abschnitt 12. Danach Paket 02, anschließend 03–05. Erst nach Meilenstein 1 den vollständigen Analyseplan aus Phase 2 umsetzen.

Referenz: `AktienAnalyse-Review-2026-10-04.md` mit Codebelegen, reproduzierten Fehlern und Indikatoren-/Quellenvergleich. Diese Roadmap übernimmt dessen Befunde; sie enthält keine neue empirische Prognosevalidierung.
