# Produktkonzept: verständliche Aktienauswahl für 20 Handelstage

Ergänzung 06.10.2026: Schon Stufe A zeigt eine **vorläufige Merkmalsbewertung** aus verfügbaren Daten, separat von der weiterhin gesperrten Anlagefreigabe. Letzter geprüfter Rohschluss je Aktie (USD, Datum, kein Livekurs), bei Abruffehler ausdrücklich bereinigter Ersatzschluss. Vier experimentelle Kursszenarien für Schluss t+1/t+5/t+10/t+20 beziehen sich auf folgenden regulären Handelssitzungen ab dem Signal-Schluss. Ihr historischer Mittelwert und 10.–90.-Perzentil stammen aus festen bereinigten Kursrenditen, ohne frühes Strategieziel und ohne Kosten. Der bereinigte Szenarioanker bleibt separat vom Rohschluss sichtbar. Keine kalibrierte Wahrscheinlichkeit oder handelbare Rohkursprognose. Fehlende Daten ergeben unbekannte Teilwerte, verfügbare Merkmale bleiben bewertbar. Neue Indikatoren benötigen vor Aufnahme eine dokumentierte Datenprüfung. Siehe [Paketprotokoll](delivery/PRICE-RESEARCH.md).

Version 1.0 · 05.10.2026 · Planungsgrundlage: `main` / `ee283932a888f54e957f43a53c107dee27574b1e`.

**Ziel:** In einer verständlichen Übersicht erkennen, welche Aktien unseres definierten Universums innerhalb der nächsten maximal 20 Handelstage das attraktivste Verhältnis aus plausibler Nettorendite, Verlustrisiko und Verlässlichkeit der Einschätzung bieten. Wenn keine Aktie die Bedingungen erfüllt, ist „Aktuell keine geeignete Aktie“ das richtige Ergebnis.

Dieses Dokument ist ein umsetzbares Zielkonzept, kein Nachweis einer funktionierenden Prognose. Die tatsächlich renditestärkste Aktie im Voraus sicher zu erkennen, ist kein erreichbares Abnahmekriterium. Erreichbar sind nachvollziehbare Szenarien, kontrollierte Risiken, reproduzierbare Entscheidungen und ein ehrlicher Vergleich mit einfachen Alternativen.

## Dokumente und Arbeitsweise

- **Dieses Dokument:** fachliches Ziel, Produktumfang, Architektur, Daten, Bewertungsmethode und Freigabekriterien.
- **[DELIVERY-PLAN-20D.md](DELIVERY-PLAN-20D.md):** abarbeitbare Pakete, Reihenfolge, Aufwand, Abhängigkeiten, Status und Abnahmevorlage.
- **[IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md):** bereits vorhandene technische Umsetzung; Einträge bleiben historische Nachweise und werden nicht durch diesen Plan „fertiggeschrieben“.
- **[DEVELOPMENT-ROADMAP.md](DEVELOPMENT-ROADMAP.md):** bisherige Pakete 01–18. Die neuen IDs V01–V24 ergänzen und konkretisieren sie; Zuordnung im Lieferplan. Keine bestehenden IDs umnummerieren.

Für weitere Arbeit gilt das neuere Zielkonzept bei fachlichen Zielkonflikten; vorhandene Repository-Regeln für Branch, Prüfung, PR und Merge bleiben bestehen. Eine Dokumentationsfreigabe startet nicht automatisch alle Implementierungspakete. Deployment, Datenkäufe und Brokerorders sind separate Aufträge.

## 1. Was ein gutes Tool zwingend können muss

### 1.1 Die acht Antworten auf einen Blick

1. Welche Aktie ist unter meinen Bedingungen am attraktivsten – oder ist Cash sinnvoller?
2. Welches mittlere Nettoszenario und welche Ergebnisbandbreite ergeben sich bis Tag 20?
3. Welche Verluste können im ungünstigen Szenario und bei Kurslücken entstehen?
4. Welcher Einstiegspreisbereich gilt und wann verfällt die Einschätzung?
5. Was sind Ziel, Stop, sonstige Ausstiegsgründe und verbindliches Enddatum?
6. Welche bevorstehenden Ereignisse können die Einschätzung verändern?
7. Wie aktuell, vollständig und empirisch geprüft sind Daten und Verfahren?
8. Was geschah später tatsächlich – beim Modell und bei meinen eigenen Käufen?

### 1.2 Umfang in drei nutzbaren Stufen

| Stufe | Fertiges Nutzerergebnis | Muss enthalten | Darf noch fehlen |
|---|---|---|---|
| A: transparentes Analysewerkzeug | Watchlist mit korrekten historischen Vergleichen, Datenstatus und Terminen | Fehlerbereinigung, Datenvertrag, Quellen, einfache Tabelle, Dokumentation, Kein-Kauf-/Unbekannt-Zustände | Freigegebene Nettoprognose, automatische Positionsvorschläge |
| B: experimentelle 20-Tage-Entscheidungshilfe | Qualifizierte Nettoszenarien, Risikobewertung, nachvollziehbarer Plan | Rohdaten/Kosten/Aktionen, gemeinsame Ausführung, empirischer Vergleich, Schattenbetrieb und dokumentierte Grenzen | Anspruch auf bewiesene Überlegenheit; diese kann ausbleiben |
| C: persönliches Depot und laufende Entscheidungen | Käufe dokumentieren, Erfolg vergleichen, täglich Halten/Ausstieg prüfen | Transaktionsjournal, Cash, FX, tägliche Bewertung, Planhistorie, Wechselkosten | Brokerautomatisierung |

Ein einfaches Kaufjournal aus C kann vor der Prognosefreigabe aus B umgesetzt werden. Es zeichnet reale Tatsachen auf und braucht keine profitable Strategie. Tägliche algorithmische Positionsentscheidungen benötigen dagegen die qualifizierte Analyse.

### 1.3 Universum und Entscheidungskonvention

Start: unterstützte US-Stammaktien auf XNAS/XNYS innerhalb einer ausdrücklich gespeicherten Watchlist, Long ohne Hebel. SPY dient als Marktvergleich, nicht automatisch als Aktienkandidat. Analyse in USD; später zusätzlich tatsächliches Anlegerergebnis in gewählter Depotwährung. Keine stillschweigende Mischung verschiedener Börsenplätze, ETFs, ADRs und Währungen.

Der aktuelle Code erlaubt kleine Watchlists. Zuerst diese zuverlässig bedienen; anschließend ein versioniertes, liquides Universum von beispielsweise 50–200 Titeln erproben. Das ist ein Kapazitätsziel, keine bereits unterstützte Funktion. Eine heute ausgewählte Watchlist ist kein survivorship-freies historisches Universum.

Entscheidung nach verfügbarem regulärem Tagesabschluss; frühester Einstieg nächste reguläre Sitzung innerhalb der angegebenen Preisspanne. Sitzung 1 ist der Einstiegstag, Sitzung 20 endet am regulären Schluss. Bei abweichendem Einstieg ist eine neue Entscheidung nötig. Eine Nachmittagsabfrage erhält kein neues 20-Tage-Fenster auf Basis veralteter Schlussdaten ohne klare Kennzeichnung.

Vier Ergebnisgrößen getrennt speichern:

- **Aktienrendite bis Tag20:** festes Halten vom definierten Einstieg bis Tag20, inklusive korrekt behandelter Ausschüttungen; Brutto/Netto-Basis ausdrücklich nennen.
- **Strategierendite:** Ertrag bis zum früheren Stop-/Ziel-/These-/Zeitausstieg einschließlich Kosten.
- **Kapitalfensterrendite:** Wert des gesamten eingesetzten Szenariokapitals bis Tag20, einschließlich Cash nach frühem Verkauf.
- **Tatsächliche Depotrendite:** aus echten Ausführungen, Buchungen, Geldflüssen und Bewertungen.

Primäres Rankingziel für die Handelsentscheidung: erwartete **Nettokapitalfensterrendite** bei definierter Ausstiegspolitik und Risikogrenzen. Die feste Tag20-Aktienrendite bleibt sichtbar, damit eine attraktive Aktie nicht mit einer bestimmten Exitregel verwechselt wird. Mittelwert, Median und Zielkurs sind unterschiedliche Größen.

## 2. Ausgangslage und vorhandene Bausteine

Am genannten Commit vorhanden: bereinigtes Research, fünf Kernmerkmale, alte Referenzauswahl und experimentelle mehrdimensionale Analogien, Rohdatenadapter, Kosten-/Ausführungssimulator, Snapshots und Replay, Tradeplan, Ereignisrevisionen, Analysekarte, Vergleichsharness und 16 offline getestete Suiten.

Noch offen: reale Daten-/Archivabnahme, vollständige Unternehmensereignisse, Qualifizierungsadapter und Ende-zu-Ende-Verbindung zur Nettokarte, empirische Güte, echte mobile Abnahme, Transaktionsjournal und tägliche Depotbewertung. Die Capability-Sperren sind teilweise fest codiert. Ein Datenabo allein löst diese Integrationslücken nicht.

Vorrangige Reviewbefunde:

- `calendar()` / UI-Kalenderhandler: vor Abruf eingefrorenes `asOf` schließt frisch beobachtete BLS-Termine aus der aktuellen Anzeige aus.
- `analysisCardPolicy()` vs. `simulateTrade()`: Stop/Ziel vom Referenzschluss versus modelliertem Einstieg; vor Freigabe vereinheitlichen.
- Seitendokumentation/README: veraltete Modellversionen, Testzahl und Kalenderbeschreibung.
- Research: Nettoszenario und qualifizierter Rohpreisplan bleiben unbekannt; historische Rangfolge darf keine Kaufentscheidung vortäuschen.
- Event-Registry: kein produktiver Evidenzvalidator, kein automatischer Symbolindex in der normalen Kalenderanzeige.
- Vormerkungen: browserlokal, ohne Menge, tatsächliche Ausführung, Kosten oder Cash.

Die neue Arbeit soll vorhandene Komponenten verbinden und abnehmen, nicht sämtliche Module neu schreiben.

## 3. Die gewünschte Oberfläche

### 3.1 Hauptseite „Aktien vergleichen“

Oben: Watchlist/Universum, Analysezeitpunkt, Kursstand, Risikoprofil und Szenariobetrag. Danach ein Satz, beispielsweise „Keine Aktie erfüllt derzeit alle Kriterien – bei drei Titeln fehlen bestätigte Termine.“ Datenlücke und negatives Ergebnis getrennt zählen.

| Aktie | Einschätzung | Netto bis Tag20 | Ungünstiges Szenario | Risiko | Nächster Termin | Verlässlichkeit |
|---|---|---|---|---|---|---|
| Watchlist-Titel | Experimentell beobachten | Mittelszenario + Spanne, soweit qualifiziert | Prozent und Betrag | Erhöht · Kurslücken | Earnings in n Sitzungen | Experimentell · Daten aktuell |
| Weiterer Titel | Nicht beurteilbar | — | — | Unbekannt | Abdeckung fehlt | Unternehmensquelle fehlt |

Diese Zeilen beschreiben Felder, keine echten Marktergebnisse. Zahlen nur aus dem gemeinsamen Analyseobjekt. Standard sieben Spalten; mobil Karten mit Status, Nettoszenario, Verlustszenario und Termin, Rest aufklappbar. Keine 20-spaltige Tabelle als mobile Hauptansicht.

Zeilen können aufgeklappt werden: zwei Gründe dafür, zwei Risiken, Einstiegsspanne, Positionsbetrag, Ziel/Stop, Stressverlust, Enddatum, Kosten, Datenlücken und ursprüngliche These. Vergleich von zwei oder drei Titeln mit gleicher Basis ist hilfreicher als viele isolierte Kennzahlen.

### 3.2 Eindeutige Statusbegriffe

- **Nicht beurteilbar:** notwendige Daten/Nachweise fehlen oder widersprechen sich.
- **Nicht geeignet:** ausreichend beurteilbar, aber Regel/Risikogrenze verletzt.
- **Experimentell beobachten:** qualifiziertes Szenario, Verfahren noch nicht ausreichend empirisch freigegeben.
- **Kandidat im geprüften Verfahren:** nur nach tatsächlicher Freigabe; bedeutet weiterhin keinen sicheren Gewinn.
- **Aktuell keine geeignete Aktie:** aggregiertes Ergebnis, wenn kein zulässiger Kandidat existiert. Bei Datenlücken Zusatz „Beurteilung eingeschränkt“.

Keine Ampel „geringes Risiko“ bei unbekannter Ereignisabdeckung. Keine Nullrendite bei fehlenden Werten. „Beste Aktie“ immer ergänzen um Universum, Datum und Risikoprofil.

### 3.3 Nutzertest und Alltag

Fünf Laien sollen ohne Erklärung Aktie/Status, Grund, Datenalter, ungünstiges Szenario und Ausstiegsdatum finden. Ziel: mindestens vier von fünf erledigen jede Aufgabe in höchstens einer Minute, ohne historischen Ertrag mit Prognose zu verwechseln. Dieses Ziel ist eine Produktabnahme, keine statistische UX-Studie.

Tastatur, sichtbarer Fokus, verständliche Screenreader-Namen; 320/390/768-Pixel-Ansichten ohne abgeschnittene Kerninformationen. Lade-, Teilfehler-, Rate-Limit-, Offline- und Leerzustände mit letzter erfolgreicher Aktualisierung. Alte Daten nicht nur durch eine neue Abrufzeit frisch aussehen lassen.

## 4. Wie Rendite und Risiko gewichtet werden

### 4.1 Drei Ebenen statt eines undurchsichtigen Scores

**Ebene 1 – Zulässigkeit:** Datenqualität, Kostenbasis, Handelbarkeit, Ereignisabdeckung, Risikobudget und gültiger Plan. Eine Verletzung wird nicht durch hohes Momentum kompensiert.

**Ebene 2 – wirtschaftliche Attraktivität:** plausible Nettorendite gegen Verlustschwere und Cashalternative abwägen. Kandidaten mit mehr Rendite und zugleich weniger Risiko sichtbar bevorzugen; bei Zielkonflikten Nutzerpräferenz verwenden.

**Ebene 3 – Verlässlichkeit:** Fallzahl, zeitliche Streuung, Modellabweichung, Teststatus und Datenalter separat anzeigen. „Daten vollständig“ ist keine „hohe Prognosesicherheit“.

### 4.2 Konkreter Vorschlag für eine prüfbare Rangfolge

Zunächst Rendite-/Risikotabelle und Dominanzvergleich ohne willkürlichen 0–100-Kaufsignalwert. Für ein späteres experimentelles Ranking:

`Nutzen_i = muNet20_i − cashNet20 − lambda * tailLoss_i − kappa * uncertainty_i`

Alle Beträge in denselben Rendite-Prozentpunkten über dasselbe Kapitalfenster:

- `muNet20`: geschätzter Mittelwert der Nettokapitalfensterrendite, nicht Median und nicht willkürliches Kursziel.
- `cashNet20`: gleiche Währung und Zeit, tatsächlicher verfügbarer Netto-Cashzins; ohne Nachweis explizites 0%-Szenario, nicht erfundener Zinsertrag.
- `tailLoss`: positive Verlustschwere im unteren Rand der Ergebnisverteilung, beispielsweise `max(0, −Mittel der schlechtesten 10%)`. Nur bei ausreichender qualifizierter Datengrundlage; sonst unbekannt und keine Zahl vortäuschen.
- `uncertainty`: Unsicherheit des geschätzten Mittelwerts, etwa blockweise ermittelte Intervallhalbbreite. Kein bloßes historisches Ergebnisquantil. Bei zu dünner Datenbasis keine Anwendung dieser Formel.
- `lambda`: persönliche Risikoaversion; `kappa`: konservativer Unsicherheitsabschlag. Beide versioniert, nachvollziehbar und vor äußerer Prüfung festgelegt.

Eine mögliche **reine Experimentkonfiguration** ist `lambda=0,5`, `kappa=1`. Sie ist weder Nutzerpräferenz noch optimales Gewicht. Fiktives Rechenbeispiel ohne Unsicherheitsabschlag und bei Cash 0: Aktie A mit 3% Mittel und 8% Randverlust erhält −1 Prozentpunkt; B mit 2% und 3% erhält +0,5. B wäre unter dieser Präferenz attraktiver, obwohl A mehr Rendite verspricht. Unter anderen Präferenzen kann die Reihenfolge wechseln.

Vor Produktfreigabe nur wenige vorab definierte Profile testen; Risikopräferenz nicht nachträglich anhand des besten Backtests wählen. Kein Ranking erzwingen, wenn Nutzen nicht positiv genug gegenüber Cash und Unsicherheit ist. Bei praktisch ununterscheidbaren Werten „ähnlich attraktiv“ statt täglich wechselnder Platznummer.

Vermeidung von Doppelzählung: Kosten sind bereits in `muNet20`; nicht nochmals pauschal abziehen. Gap-Risiko, das bereits Teil der Randverteilung ist, nicht unbemerkt ein zweites Mal bestrafen. Separates Gap-Stressszenario ist eine Grenze/Diagnose. Konzentrationsrisiko gehört erst bei bekannten Beständen in die Portfolioentscheidung.

### 4.3 Risikobewertung und persönliche Grenzen

| Dimension | Messung | Verwendung |
|---|---|---|
| Verlustschwere | Ungünstiges Szenario, Randverlust, schlimmste historische Fälle | Risikobudget und Ranking |
| Kursschwankung | Realisierte Volatilität / Downside | Größenordnung, Regime, Positionsgröße |
| Kurslücken | Bereinigte Overnight-Gaps, Ereignisnähe | Stressrechnung und Stop-Grenzen |
| Handelbarkeit | Rohpreis × Volumen, später Spread/Quotequalität | Harte Grenze, Kostenannahme |
| Markt/Sektor | Markttrend, Marktvolatilität, Beta/Korrelation bei ausreichender Stichprobe | Regime, spätere Konzentrationskontrolle |
| Ereignisse | Bestätigte/geschätzte Earnings, Kapitalmaßnahmen, Makro | Einstiegspause/Neubewertung, keine pauschale Richtung |
| Modell/Daten | Alter, Coverage, Teststatus, Verteilungsabweichung | „Unbekannt“, experimentell, ggf. keine neue Position |

Persönliche Verlust- und Konzentrationsgrenzen können nicht seriös aus einem Backtest „optimiert“ werden. Bis zur Festlegung keine reale Positionsgrößenempfehlung. Vorschau mit ausdrücklich hypothetischem Budget ist erlaubt.

Späterer Größenansatz: Positionswert höchstens Minimum aus verfügbarem Cash, Konzentrationslimit, Handelswertgrenze und Risikobudget geteilt durch modellierten Verlustanteil. Das ist ein Szenariolimit, keine Verlustgarantie. Mehrere korrelierte Tech-Aktien sind nicht automatisch diversifiziert.

## 5. Prognosekonzept und Modellstufen

### 5.1 Erst das Ziel messen, dann das Modell erweitern

Die heutige frühe Gewinnmitnahme bei +5% begrenzt die Strategieergebnisse und erklärt nicht automatisch, welche Aktie am Tag20 am meisten steigt. Deshalb feste Aktienrendite und ausführbare Strategie getrennt modellieren und vergleichen. Die gemeinsame Ausführung erzeugt versionierte Zielgrößen; ohne qualifizierte Labels keine Nettoprognose trainieren.

Ausgabe als ungünstiges/mittleres/günstiges Szenario plus separate Stressverluste. Ein Mittelwert ist keine sichere Erwartung im Einzelfall; ein historisches 10.–90.-Perzentil ist keine kalibrierte 80%-Prognosebandbreite. Letztere erst nach überprüfter Abdeckung so nennen. Wahrscheinlichkeiten erst nach Kalibrierung und ausreichender zeitlich getrennter Prüfung.

### 5.2 Modellauswahl mit begrenztem Suchraum

| Modellstufe | Zweck | Umsetzung | Entscheidung |
|---|---|---|---|
| M0: einfache Baselines | Ehrlicher Vergleich | Cash, SPY, einfache Momentum20-Auswahl, Gleichgewicht | Immer mitführen |
| M1: vorhandene Analogien | Verständlicher Ausgangspunkt | Bestehende features-v2 kausal an Nettolabels anbinden; Distanz und Fallqualität zeigen | Erster Kandidat für experimentellen Betrieb |
| M2: regularisiertes lineares/Quantilmodell | Stabiler einfacher Gegenentwurf | Wenige Merkmalsgruppen, Training-only-Skalierung, Regularisierung, getrennte Quantile | Ein zusätzlicher Ansatz nach qualifiziertem Vergleich |
| M3: flache Boosting-Bäume | Nichtlineare Wechselwirkungen | Kleine vorregistrierte Parameterliste, monotone/komplexitätsbegrenzende Regeln wo sinnvoll | Nur wenn M2 nicht genügt und Datenmenge trägt |
| Ensemble | Robustheit bei komplementären Fehlern | Einfache eingefrorene Kombination von höchstens zwei nachgewiesen nützlichen Modellen | Später; Uneinigkeit sichtbar |
| LLM-Renditevorhersage | Nicht ausreichend begründeter Kern | Keine frei erfundenen Kursziele aus Text | Nicht im Kernmodell |

Bei kleiner Watchlist und wenigen Jahren existieren nur wenige unabhängige 20-Tage-Fälle je Aktie. Cross-sectional Pooling ähnlicher Aktien kann die Stichprobe erweitern, erzeugt aber keine unabhängigen Marktjahre. Gleichzeitige Marktbewegungen bei Bootstrap und Tests gemeinsam clustern. Für M2/M3 daher Datenmenge und Unterschiedlichkeit der Regime prüfen, nicht nur Zeilenzahl.

Originalforschung von Gu/Kelly/Xiu zeigt Nutzen nichtlinearer Verfahren in einer großen Asset-Pricing-Untersuchung und nennt Momentum, Liquidität und Volatilität als wichtige Gruppen [Q1]. Das rechtfertigt einen kontrollierten Vergleich, nicht die Übertragung ihrer Resultate auf unsere kleine Watchlist, exakt 20 Handelstage oder unsere Handelskosten.

## 6. Indikatoren: was wirklich hinein soll

„Muss“ bedeutet unverzichtbare Daten-/Risikofunktion, nicht zwangsläufig ein zusätzliches Renditemerkmal. Redundante Merkmale werden gruppiert; kein fünffaches Gewicht für denselben Trend durch Momentum, RSI, MACD, SMA und Hochabstand.

| Gruppe | Nutzen / Rolle | Ausgangsstand | Priorität und Evidenz | Datenaufwand / Überschneidung / Test |
|---|---|---|---|---|
| Momentum20/60, relative Stärke, SMA50 | Einstieg/Referenz | Vorhanden | Behalten als Baseline, lokale Güte offen | Keine neue Quelle; hohe Trendüberschneidung; Gruppe entfernen/hinzufügen im Test |
| Volatilität, Downside, Gaps | Risiko, Größe, Ausstieg | Vorhanden/teilqualifiziert | Muss; Renditeeffekt separat prüfen | OHLC plus Aktionen; Maßnahmenneutralität, Verlustschwere und Stresskosten |
| Tageshandelswert, Nullvolumen, fehlende Sitzungen | Handelbarkeit | Teilweise vorbereitet | Muss; Daten-/Ausführungsgrundlage | Roh-OHLCV; keine Illiquidität als Alpha; Schwellen vorab testen |
| Earnings-Nähe, bestätigt/geschätzt, Sitzungslage | Gap-Warnung, Eintrittspause | Registry ohne produktive Quelle | Muss für Risiko; Richtungsbonus unbelegt | IR/API, Revisionen; Tradeausfälle und vermiedene/entgangene Ergebnisse messen |
| Markttrend + Marktvolatilität | Schlechte Marktphasen, Cash | Einfacher SPY-Regimeansatz | Erste Zusatzgruppe; Hypothese | SPY-Reihe; feste kleine Regelmenge, Netto/Drawdown/Cashquote |
| Sektorrelative Stärke und Sektorrisiko | Auswahl, Konzentration | Fehlt | Nächstes Experiment | Sektormapping mit Gültigkeit + liquide Vergleichsreihe; gegenüber SPY abgrenzen |
| Kurzfristige Umkehr 1–5 Tage | Einstiegstiming | Fehlt | Optional testen; Forschung zu Liquiditätszusammenhang [Q2] | Tageskurse vorhanden, Ausführung sensibel; gleiche Kosten und Kapitalfenster |
| Abstand zu Hoch/Tief | Trend/Überdehnung | Fehlt | Günstiger Test, niedriger Zusatznutzen möglich | Historische rollierende Fenster, keine zukünftigen Hochs; Trendgruppenvergleich |
| Relatives Volumen | Bestätigung/Aufmerksamkeitsproxy | Basis teilweise vorhanden | Optional nach Datenabnahme | Konsistente Volumenbereinigung; normale vs. Ereignistage separat |
| EPS-/Umsatzüberraschung, Revisionen | Ereignisfolge, Unternehmensentwicklung | Fehlt | Später; heute lokale Hypothese | Zeitstempel und damals gültiger Konsens teuer; reine Ist-Zahlen reichen nicht |
| Bewertung, Wachstum, Profitabilität | Kontext/Segmentierung | Fehlt | Optional; langsame Größen nicht als präzises 20-Tage-Timing verkaufen | SEC/API, veröffentlichte statt Perioden-Enddaten; redundante Bilanzgrößen begrenzen |
| Zinsniveau/-änderung, Kreditspread | Marktfilter | Fehlt | Kleine zweite Makrogruppe | FRED/ALFRED, Veröffentlichungsstände; erst Zusatznutzen gegen Preisregime |
| Inflation, Konsum, Konjunktur | Kalenderwarnung, später Regime | Teilweise Terminliste | Kalender zuerst, Werte später | BLS/BEA/FRED; Revisionen und Publikationsverzögerung; gemeinsame Makrogruppe |
| Marktbreite | Stress/Regime | Fehlt | Später bei breiterem Universum | Historische Mitgliedschaft nötig; kleine Watchlist ist keine Marktbreite |
| News/Guidance, Insider, Short/Optionen | Ereignisse/Sonderrisiken | Fehlt | Zurückgestellt | Lizenz, Meldeverzug, Abdeckung; Optionsvolatilität nicht Richtung, Shortvolumen nicht Shortbestand |

### Erstes Merkmalsbudget

Die fünf bestehenden Kernmerkmale beibehalten. Zuerst bestehende Liquiditäts-/Gapmerkmale qualifizieren, Earnings- und Quellenstatus integrieren und einen kleinen Marktfilter prüfen. Keine umfassende Sammlung aller Indikatoren als Voraussetzung für die erste brauchbare Version.

Ein neues Merkmal wird nur produktiv, wenn sein Datenvertrag erfüllt ist und ein vorab festgelegter Mehrwerttest gelingt. Auch ein Nullresultat zählt als abgeschlossene Forschungsaufgabe: Feature dann nicht einbauen oder wieder deaktivieren. Einfachere gleichwertige Modelle bevorzugen.

## 7. Datenbeschaffung und laufende Kosten

### 7.1 Mindestpaket

| Quelle / Daten | Zweck | Beschaffung und Frequenz | Historische Prüfbarkeit / Kostenentscheidung |
|---|---|---|---|
| Bestehender OHLCV-Anbieter | Tageskurse roh/bereinigt, Referenzmarkt | Konto real testen, einmal täglich nach verfügbarer Sitzung, gezielte Wiederholung | Bestehendes Abo zuerst; Preisbereinigung, MIC, Historie und Speicherrechte schriftlich klären |
| Corporate Actions | Splits, Dividenden, Sonderfälle | Qualifizierte API + Stichprobe IR, täglich | Ex-/Zahltag, Beträge, Währung, vollständige Coverage; aktueller Download ist kein alter Datenstand |
| Unternehmens-IR / Earnings-API | Kalender und Meldungen | Kleine Watchlist täglich, revisionsfähig | IR öffentlich; strukturierter Anbieter kann kostenpflichtig sein; Bestätigungsstatus/PIT oft Zusatzproblem |
| Fed/BLS/BEA | Wirtschaftstermine | Offizielle HTML/ICS, tägliche Änderungskontrolle | Öffentlich verfügbar; Entwicklung/Betrieb kostet Aufwand; Snapshots ab jetzt [Q3–Q5] |
| SEC EDGAR | US-Berichte/HV-Dokumente | Einreichungsindex, gezielter Dokumentabruf | Öffentliche Schnittstellen, zulässige Abrufweise beachten; Filingzeit verfügbar, Datenextraktion nötig [Q6] |
| FRED/ALFRED | Zins-/Makroserien, Vintage | Je Veröffentlichung; API-Key falls nötig | Serienrechte prüfen; ALFRED kann damalige Informationsstände abbilden, nicht jede Serie gleich [Q7] |
| Brokerabrechnung / CSV | Wirkliche Käufe, Gebühren, FX | Manuell/Import nach Handel | Kein Trading-API-Abo für Journal nötig; identische Daten sichern |
| FX und Benchmark | Depotbewertung und fairer Vergleich | Täglich, gleiche Bewertungskonvention | Transaktions-FX aus Broker; Referenz-FX ist kein Ausführungspreis |
| Historische Quotes / Delistings / Konsens | Fortgeschrittene Prüfung | Erst nach konkretem Experimentangebot | Potenziell teuer; separate Freigabe, kein Kauf nur „für Vollständigkeit“ |

Twelve Data führt Dividenden-, Split- und Earnings-Kalender als Produkte [Q8]. Endpunktangebot ist keine Bestätigung des eigenen Tarifs, der Datenvollständigkeit oder der Vintages. Keine aktuellen Preisversprechen ohne konkretes Angebot. Makrotermine sollten nicht der Grund für ein pauschales teures Zusatzabo sein.

### 7.2 Beschaffungsentscheidung vor jedem Upgrade

Für jeden Anbieter ein einseitiger Nachweis: unterstützte Börsen/Instrumente, Felder, Historienbeginn, Bereinigungslogik, Veröffentlichungszeit, Korrekturen, Rate-Limits, Speicherung/Anzeige-/Weitergaberechte, Preis inklusive nötiger Zusatzrechte, Kündigung und Export. Repräsentative Antworten prüfen: normaler Tag, Split, Dividende, Earnings, gelöschter/verschobener Termin, unvollständige Antwort.

Angebot nur dann kaufen, wenn eine konkrete Pflichtfunktion oder ein begrenztes Experiment damit möglich wird. Budgetvorgabe zunächst offen; kein Abo allein zur Erzeugung eines beeindruckenderen Scores.

Abrufbudget transparent: `Symbole × Endpunktgewicht × Aktualisierungen + Wiederholungen`, plus gemeinsame Markt-/Makroabrufe und Speicher-/KI-Kosten. Endpunkte können unterschiedlich viele Credits verbrauchen. Ein zentraler Snapshot pro Sitzung statt erneuter Vollabrufe bei jedem Seitenwechsel. Backend-Caching mit Quellzeit, nicht nur Abrufzeit.

### 7.3 Zwei Zeitachsen sind Pflicht

Jeder Datensatz enthält Ereignis-/Handelszeit und tatsächliche Beobachtungs-/Verfügbarkeitszeit. Spätere Korrekturen werden neue Revisionen. Historische Analyse darf keine Information verwenden, die erst später verfügbar war. Prospektives Archiv ab jetzt ist wertvoll, beweist aber rückwirkend keine historische Verfügbarkeit.

Ein leerer Kalender ist nicht automatisch vollständig. Ein lückenloser Kursdownload beweist keine korrekte Kapitalmaßnahmenbehandlung. Qualifikation pro Fähigkeit: aktuelle Anzeige, retrospektives Kostenszenario, historischer Informationsstand, empirische Prognosegüte.

## 8. Ereignispipeline und KI

Gemeinsames Ereignisschema für Earnings, FOMC-Entscheidung, CPI/PPI/Arbeitsmarkt, PCE/GDP, Dividenden, HV und Kapitalmaßnahmen. `scope` Unternehmen/Markt, Instrument-ID optional, Typ, Datum, Uhrzeit/Zeitzone oder explizit unbekannt, Sitzungslage, bestätigt/geschätzt, geplant/verschoben/abgesagt, Quelle, Belegstelle, Originalsnapshot, beobachtet/verwendbar-ab, Revision und Validierungsstatus.

Dividende: Ankündigung, Ex-Tag, Record-Tag, Zahltag und Betrag/Währung getrennt. HV: Versammlungsdatum nicht mit Einreichungs- oder Stimmberechtigungsdatum verwechseln. Fed: Sitzung, Zinsentscheidung, Projektionen und Protokoll sind eigene Ereignisse. Zinssatz ist ein Wert, kein Termin.

Umsetzung: Rohquelle speichern → deterministischer Parser → optional KI-Extraktion für HTML/PDF → Schema-/Plausibilitätsprüfung → Quelle/Beleg validieren → Revision und Symbol-/Zeitindex → Anzeige. Unternehmensereignisse müssen ohne interne Registry-IDs auffindbar sein.

KI darf Inhalte strukturieren, nicht die Rendite „wissen“ oder Termine erfinden. Bei Quellenkonflikten manuelle Prüfung; abgeleitete Vermutung nie als bestätigter Termin. Inhalte aus Dokumenten als Daten behandeln, nicht als ausführbare Anweisungen. Quellen erlaubnisbasiert abrufen, kein beliebiger serverseitiger URL-Fetch aus Nutzereingaben. Extraktionsversion, Modellversion und ggf. Kosten protokollieren.

Aktueller Kalender: zuerst Quelle beobachten/archivieren, dann aktuellen Anzeigenstand fixieren. Historischer Replay: nur damalige Revisionen. So wird der festgestellte Zeitfilterfehler behoben, ohne Look-ahead einzuführen.

## 9. Einstieg, Ausstieg und schlechte Marktphasen

### 9.1 Eintrittsregeln

Nur im vorgesehenen Sitzungskalender, innerhalb gültiger Preisspanne, bei erfüllter Daten-/Risiko-/Liquiditätsprüfung. Preisbewegung außerhalb der Spanne bedeutet verzichten oder neu bewerten; kein nachträgliches Verschieben des Einstiegstags im Backtest. Ein qualifiziertes Ereigniswarnsignal kann einen neuen Einstieg verhindern, ohne eine bestehende Position automatisch zu liquidieren.

### 9.2 Exitvarianten kontrolliert vergleichen

| Regel | Startvorschlag | Wesentlicher Test |
|---|---|---|
| Verlustbegrenzung | Bestehenden festen experimentellen Stop als Baseline; volatilitätsabhängige Variante später | Gap unter Stop, Kosten, Stop+Ziel am selben Tag, Handelsunterbrechung |
| Gewinnmitnahme | Bestehendes +5%-Ziel gegen reinen Zeitausstieg vergleichen | Wird Rendite durch frühes Abschneiden positiver Bewegungen verschenkt? |
| Zeitablauf | Tag20, nicht still verlängern | Feiertage, verkürzte Sitzung, fehlender Ausführungskurs |
| These ungültig | Vorab definierte Gründe: Datenkorrektur, relevantes Ereignis, Regelbruch | Signal erst nach tatsächlicher Verfügbarkeit nutzen |
| Trailing/Teilausstieg | Später, nur eine begrenzte Variante | Mehrkosten, Intraday-Mehrdeutigkeit, kein Backtest-Overfitting |

Stop und Ziel nach tatsächlichem oder modelliertem Einstieg aus derselben Funktion ableiten. Vor Einstieg nur vorläufige Referenzmarken bzw. Bereiche. Ein Stopauftrag garantiert keinen Ausführungskurs; Stop-Limit kann unausgeführt bleiben [Q9]. Tages-OHLC kann die Reihenfolge von Stop- und Zielberührung nicht zuverlässig bestimmen. Konservative Annahme oder Band statt erfundener Intraday-Präzision.

### 9.3 Marktfilter

Zuerst SPY-Trend plus Marktvolatilität als kleine, vorregistrierte Regelgruppe; später Sektor und Kreditbedingungen. Kalenderereignisse zuerst Warnung, kein unbelegter „vor jedem Fed-Termin alles verkaufen“-Mechanismus. Grenzwerte experimentell festlegen und nicht als historisch optimal ausgeben.

Filterauswertung: Drawdown, schlechteste Verluste, Nettorendite, vermiedene Trades, entgangene Gewinne, Cashdauer, Turnover. Ein Filter kann das Risiko senken und trotzdem Rendite kosten; dieser Zielkonflikt muss sichtbar sein. Cash ist ein Kandidat mit eigenen Zins-/Währungsannahmen.

## 10. Technische Zielarchitektur

Die bestehende Worker-Anwendung behalten, Module klar trennen. Keine neue Microservice-Landschaft als Voraussetzung.

1. **Instrumente/Universum:** Symbol, dauerhafte ID, MIC, Währung, Zeitzone, Sektor, Gültigkeitszeitraum.
2. **Sammlung/Archiv:** zentraler Tageslauf, Quellantwort, Hash, Zeitstempel, Lizenzstatus, Revision.
3. **Normalisierung/Qualifikation:** OHLCV/Aktionen/Ereignisse, unabhängige Capability-Gates, maschinenlesbare Blockgründe.
4. **Merkmale/Labels:** nur erlaubtes Präfix; Merkmalsregistry und gemeinsame Ausführungsversion.
5. **Modelle/Szenarien:** parameter- und datenabhängiges Ergebnis; fehlende Werte bleiben unbekannt.
6. **Entscheidung/Plan:** Grenzen → Rangfolge → These/Preisbereich/Exit/Enddatum.
7. **Journal/Bewertung:** reale Orders/Fills/Cash unabhängig vom Modell; tägliche Positionen.
8. **UI/Dokumentation:** dieselbe API-Wahrheit; keine zweite Risikoberechnung im Browser.
9. **Evaluation/Betrieb:** eingefrorene Prognosen, Outcomes, Baselines, Kosten, Datenalarm, Replay und Wiederherstellung.

### Zentrale Objekte

| Objekt | Unverzichtbare Felder |
|---|---|
| AnalysisRun | ID, Entscheidungszeit, Universe-Version, Quellcommit, Modell-/Merkmals-/Kosten-/Exit-Version, Snapshot-IDs, Status |
| CandidateAssessment | Instrument, Datenqualifikation, getrennte Renditegrößen, Szenarien, Risiko, Gründe, Rang/Gruppe, Plan-ID |
| PredictionRecord | Unveränderliche ex-ante Prognose inklusive abgelehnter Kandidaten, Zieldefinition und geplantem Fälligkeitstag |
| TradePlan | Ursprungsanalyse, These, Referenzanker, Einstiegsspanne, Risikobudget, Stop/Ziel-Regel, gültiger Einstieg, fixes Ende |
| EventRevision | Quellenbeleg, Ereignis-/Verfügbarkeitszeit, Status, vorherige Revision, Coverage |
| Order / Fill | Orderabsicht getrennt von tatsächlich ausgeführter Menge, Preis, Zeit, Gebühren, Währung und FX |
| LedgerEntry | Kauf/Verkauf/Geldfluss/Dividende/Gebühr/Steuer/Split/Korrektur mit Referenzen |
| Valuation | Datum, Cash, Positionen, Forderungen, Kurse/FX/Qualität, Gesamtwert |
| EvaluationRun | Unveränderte Dateneingaben, Testabschnitte, Variantenregister, Ergebnisse und Grenzen |

R2-artige Objektspeicherung passt zu unveränderlichen Rohsnapshots. Für Journal, Instrumentindex und konkurrierende Schreibvorgänge transaktionale Speicherung oder ein nachweisbar atomarer Ledger wählen; Plattformfähigkeit erst prüfen. Keine garantierte Datenbankverfügbarkeit annehmen. Benutzer-/Depotzugriff und Importdubletten serverseitig absichern. Ausführungsbelege und Kontodaten gehören nicht ins öffentliche Git-Repository.

## 11. Kaufjournal, Depot und Erfolgsmessung

### 11.1 Erst Tatsachen zuverlässig aufzeichnen

Manueller Kauf/Verkauf und CSV-Import mit Vorschau. Pflicht: Instrument, tatsächliche Ausführungszeit/-zone, Menge, Kurs, Währung, Gebühren. FX/Steuern/Abrechnungsreferenz bei Bedarf. Mehrere Käufe, Teilverkäufe, Teilfüllungen und Stornos unterstützen. Eine Order ohne Fill erzeugt keinen Bestand. Historischer Analysepreis ist kein Kaufpreis.

Bestand und Cash aus Buchungen ableiten; Änderungen als Korrekturbuchungen, nicht unbemerkbar überschreiben. Import-ID/Hash verhindert doppelte Verbuchung. Definierte Dezimalpräzision, Export/Restore und Brokerabstimmung. Vorläufig keine steuerrechtliche Bescheinigung erzeugen.

### 11.2 Tägliche Bewertung und Umschichtung

Ursprünglichen Plan erhalten. Neue Bewertung mit Halten/Reduktion prüfen/Ausstieg prüfen/Unbekannt, Gründen und Datenstand danebenstellen. Stop bei Long nicht zur Rechtfertigung wachsender Verluste absenken; Splitanpassung ist technisch gesondert. Zeitende nicht automatisch neu starten. Überfällige, wegen Unterbrechung nicht geschlossene Position sichtbar eskalieren.

Wechselentscheidung: neues Investment gegen Beibehalten vergleichen, nicht lediglich neue Rangnummer 1 kaufen. Verkauf/Kaufkosten, zusätzliche Unsicherheit, Konzentration und Liquidität berücksichtigen. Vergleichbares Restfenster bis ursprünglichem Ende als Hauptvergleich; ein neues 20-Tage-Investment gesondert als neue Kapitalbindung ausweisen. Mindestvorteil und Hysterese vermeiden tägliches Hin-und-her. Pflichtausstieg wegen Regelbruch wird nicht durch Hysterese verhindert.

### 11.3 Drei Erfolgsansichten

| Ansicht | Kernkennzahlen | Verhindert |
|---|---|---|
| Echtes Depot | Gewinn in Währung, realisiert/unrealisiert, Dividenden, Gebühren, FX, TWR, täglicher Drawdown; XIRR optional | Einzahlungen als Gewinn, offene Verluste unsichtbar |
| Virtuelle Strategie | Netto-Kapitalfenster, Cash, Turnover, Verlustschwere und Baselines | Rosige Bruttoergebnisse ohne Ausführungskosten |
| Prognosequalität | Fehler ex-ante Mittelwert, Quantilverlust, Bandabdeckung; Kalibrierung nur bei Wahrscheinlichkeiten | Nachträgliche Umdeutung historischer Häufigkeiten |

SPY inklusive Ausschüttungen, gleiche Währung/Zeiträume und gleiche externe Geldflüsse; Cash und einfache Watchliststrategie ergänzen. Kein nachträglicher Benchmarkwechsel. Alle abgelehnten Kandidaten ebenfalls protokollieren, damit Nichtkäufe und verpasste Chancen auswertbar bleiben.

Dividenden bei Rohkursbewertung separat, bei Total-Return-Kursen nicht doppelt. Forderung am Ex-Tag und Cashzahlung später nicht doppelt als Ertrag. Fehlender Kurs macht Bewertung unbekannt/geschätzt, nicht kostenlos unverändert. TWR mit Bewertungen an externen Geldflüssen; Näherung sonst kennzeichnen. XIRR kann mathematisch mehrdeutig oder nicht bestimmbar sein.

## 12. Empirischer Prüfplan und Freigaben

### 12.1 Zeitliche Trennung

Bestehendes Protokoll: Training 2021–2023, Validierung 2024–2025, 2026 explorative Diagnose, 2027 äußerer prospektiver Test. 2027-Ergebnisse existieren heute nicht. Das Protokoll kann durch dokumentierte neue Forschungsentscheidung geändert werden, nicht durch nachträgliches Umbenennen bereits gesehener Daten als Test.

Walk-forward innerhalb der erlaubten Abschnitte. Transformationen, Gewichte und Schwellen ausschließlich aus erlaubten Trainingsdaten. 20-Tage-Labels an Abschnittsgrenzen entfernen; bei überlappenden Tagesentscheidungen entsprechende Purging-/Abhängigkeitsbehandlung. Keine zufällige Zeitreihenaufteilung. Historische Mitgliedschaften, Delistings und echte Bekanntheitszeit berücksichtigen oder die Aussage ausdrücklich begrenzen.

### 12.2 Vergleich und Suchdisziplin

Vor jedem Experiment: Hypothese, Merkmalsgruppe, Parameterliste, Primärmetrik, Risikogrenzen, Kosten und Abbruchkriterium festhalten. Bestehendes kausal korrigiertes Modell sowie Cash, SPY und einfache Strategie vergleichen. Alte fehlerhafte Referenz nur zur Reproduktion, nicht als Gütemaß.

Primärmetrik: Netto-Kapitalfensterüberschuss unter vorab festgelegten Risikobedingungen; ergänzend Quantilverlust/Prognosefehler, täglicher Drawdown, Randverlust, Turnover und Cashquote. Unsicherheit zeitblockweise und marktweit gemeinsam berücksichtigen. Viele Aktien am selben Tag sind keine unabhängigen Wiederholungen.

Alle Varianten einschließlich negativer Ergebnisse dokumentieren. Kosten verdoppeln, Slippage-/Spreadstress, verspätete Daten, Lücken und Grenzwerte prüfen. Keine präzise Trefferquotenzusage und kein Erfolgsziel „mindestens X% Gewinn pro Monat“ als Entwicklungsanforderung.

### 12.3 Stufenweise Freigabe

| Gate | Voraussetzung | Was danach gesagt werden darf |
|---|---|---|
| G1 Datenanzeige | Identität, Alter, Format, Quellen nachvollziehbar | Aktuelle/historische Information mit Qualitätsstatus |
| G2 Kostenszenario | Rohpreise, Maßnahmen, Ausführung und Kosten qualifiziert | Retrospektives Kostenszenario mit dokumentierten Annahmen |
| G3 historischer Vergleich | Damalige Verfügbarkeit, kausale Auswahl, getrennte Zeiträume | Auf den benannten zeitlich getrennten Daten geprüft; genaue Grenzen nennen |
| G4 experimenteller Livebetrieb | Unveränderliche ex-ante Snapshots, sichere Fehlerzustände, reale Betriebsabnahme | Experimentelle Schätzung im Schattenbetrieb |
| G5 geprüfter Entscheidungsmodus | Vorgegebenes Evaluationsprotokoll erfüllt, ausreichende Fälle/Regime, dokumentierte wirtschaftliche und Risikokriterien | Kandidat im geprüften Verfahren, kein Gewinnversprechen |

Ein Mindestumfang für eine **erste diagnostische** prospektive Auswertung kann drei Monate und mindestens drei gereifte nicht überlappende Marktfenster sein; das ist ausdrücklich viel zu wenig für breite Überlegenheitsbehauptungen. Erforderliche Dauer/Fallzahl für G5 aus gewünschter Unsicherheit, Abhängigkeiten und Regimeabdeckung vorab bestimmen. Wenn die Daten keine belastbare Entscheidung erlauben, bleibt G5 geschlossen. Keine fixe Anzahl Tage macht ein Modell automatisch gut.

Ein fachlich gutes Werkzeug kann am Ende nachweisen, dass seine aktive Strategie keinen Vorteil hat. Dann bleiben Journal, Datenübersicht und ehrliche Nichtkaufentscheidung nutzbar; unnütze Modellkomplexität wird entfernt.

## 13. Dokumentation auf der Seite und im Repository

Zentrale Merkmalsregistry statt handgeschriebener veraltender Texte: Name, Formel, Einheit, Quelle, Preisbasis, Rückblick, verfügbare-ab-Regel, Zweck, aktiv/experimentell/deaktiviert, Gewicht oder Einflussart, Version, Grenzen und Testnachweis. Daraus lesbare Methodik und technische Detailtabelle erzeugen.

Feste Ergebnisbezeichnungen:

- Historischer Vergleich auf bereinigten Kursen, ohne Kosten.
- Retrospektives Kostenszenario mit dokumentierten Annahmen.
- Experimentelle Schätzung.
- Auf zeitlich getrennten Daten geprüft – nur mit tatsächlichem Nachweis.

Bisherige Scoregewichte 25/20/25/20/10% für Momentum20/Momentum60/relative Stärke/SMA50/Volatilität als **alte Referenz** dokumentieren. Die gemeinsame Distanzmethode von features-v2 hat nicht dieselbe lineare Gewichtsbedeutung. Eine Feature-Wichtigkeit ist außerdem kein kausaler Beweis.

Jede erledigte Aufgabe im Lieferplan erhält PR/Commit, Prüfung, Einschränkung und verlinktes Ergebnis. „Implementiert“, „mit echten Daten abgenommen“ und „empirisch geprüft“ sind separate Felder. Negative Experimente dürfen abgeschlossen sein, ohne das Feature produktiv zu schalten.

## 14. Betrieb, Grenzen und bewusste Nichtziele

Tageslauf nach bestätigter Verfügbarkeit statt starrer deutscher Uhrzeit; US-/EU-Sommerzeitverschiebung berücksichtigen. Idempotente Jobs, begrenzte Wiederholungen, Rate-Limit-Rücknahme, Ausfallmeldung, Datenalter, Kostenbudget, Backup/Restore und letzte erfolgreiche Analyse. Modellwechsel mit Vergleich/Zurückrollen und eingefrorenen alten Entscheidungen.

Keine automatische Orderübermittlung, Intraday-/Hochfrequenzstrategie, Optionen-/Hebelstrategie, weltweiter Vollscanner oder unbegrenztes News-Sammeln in der ersten Version. Kein neues Framework nur für den Plan. Brokeranbindung und erweiterte Märkte später separat bewerten.

## 15. Entscheidungen und Annahmen

| Entscheidung | Vorläufige Annahme | Wann zwingend klären |
|---|---|---|
| Universum | Kleine unterstützte US-Watchlist | Vor Universumerweiterung |
| Depotwährung | USD-Analyse; Depotwährung konfigurierbar, noch offen | Vor realem Journal-/Performancebetrieb |
| Broker/Kosten | Vorhandene Szenarioprofile unbestätigt | Vor G2 und Importadapter |
| Maximalverlust/Konzentration | Keine persönliche Grenze erfinden | Vor Positionsgrößen- oder geprüftem Kandidatenmodus |
| Datenbudget | Bestehende Quellen zuerst, keine neue Buchung | Vor kostenpflichtigem Upgrade |
| Steuerbetrachtung | Nettorendite nach Handel/FX, vor persönlicher Steuer; tatsächliche Steuern separat | Vor anlegerspezifischem Vergleich |
| Benutzer/Depots | Zunächst ein Nutzer, Datenmodell mit Depot-ID | Vor Mehrnutzerbetrieb |
| Cashzins | Ohne belegte Verzinsung 0%-Szenario | Vor fairer verzinster Cashbaseline |

Diese Annahmen blockieren weder Kalenderkorrektur noch Dokumentation und UI-Grundstruktur. Ein fehlender Zugang ist ein konkreter Blocker für eine Datenabnahme, kein Grund, sämtliche unabhängige Arbeit aufzuschieben.

## Quellen und Evidenzgrenzen

Abruf/Prüfung 05.10.2026. Quellen begründen Datenverfügbarkeit und Forschungsansätze, keine bereits bewiesene lokale Handelsrendite.

- Q1: Gu, Kelly, Xiu, *Empirical Asset Pricing via Machine Learning*: https://www.nber.org/papers/w25398
- Q2: *Reversals and the Returns to Liquidity Provision*: https://www.nber.org/papers/w30917
- Q3: Fed, FOMC-Kalender: https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
- Q4: BLS, Kalender/ICS: https://www.bls.gov/schedule/ und https://www.bls.gov/schedule/news_release/bls.ics
- Q5: BEA-Veröffentlichungskalender: https://www.bea.gov/news/schedule
- Q6: SEC EDGAR APIs: https://www.sec.gov/search-filings/edgar-application-programming-interfaces
- Q7: FRED/ALFRED, Real-Time Periods: https://fred.stlouisfed.org/docs/api/fred/realtime_period.html
- Q8: Twelve Data Fundamentals/Kalender: https://twelvedata.com/fundamentals
- Q9: SEC/Investor.gov, Stop-, Stop-Limit- und Trailing-Stop-Orders: https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-15
