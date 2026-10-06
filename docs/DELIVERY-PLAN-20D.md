# Lieferplan und Abnahmebuch: Aktienanalyse für 20 Handelstage

## Priorität 06.10.2026: Startreparatur und Einzelabnahme

Der Nutzer meldet eine eingefrorene Site und verlangt künftig einzelne Featuretests vor Kombination. Zuerst technischen Start reparieren; keine weiteren V-Pakete in diesem Auftrag. Details und nächste Einzelabnahmen: [STARTUP-UND-EINZELABNAHME.md](delivery/STARTUP-UND-EINZELABNAHME.md). Bereits implementierte Pakete bleiben vorhanden; ihr technischer Stand ist keine echte Produkt-/Prognoseabnahme.


Version 1.0 · 05.10.2026 · Ausgangscommit `ee283932a888f54e957f43a53c107dee27574b1e`.

Fachliche Grundlage: [PRODUCT-CONCEPT-20D.md](PRODUCT-CONCEPT-20D.md). Bestehende Umsetzung: [IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md). Dieser Plan dokumentiert neue Arbeit; vorhandene Module sind keine automatisch abgeschlossenen neuen Pakete.

## 1. So wird dieser Plan abgearbeitet

1. Genau ein Implementierungspaket beauftragen; aktuellen `main` und Repository-Regeln prüfen. Bereits laufende Arbeit anderer Chats zuerst im Repository abgleichen.
2. Paket in kleine überprüfbare PRs teilen, falls der Umfang zu groß wird. Jeder Teil hat ein eigenständiges Ergebnis; keine monatelange Sammel-PR.
3. Implementierung, reale Datenabnahme und empirische Abnahme getrennt dokumentieren.
4. Relevante Regressionen, bei Codeänderungen Build/Artefakt und Ende-zu-Ende-Verhalten prüfen. Fehlende Schlüssel oder künftige Beobachtungen als Blocker nennen.
5. Geprüften Head nach Repository-Regeln mergen; nächsten Arbeitskontext aus aktuellem `main` starten. Keine Site-Veröffentlichung ohne separaten Auftrag.
6. Statuszeile, Paketprotokoll und bisherige Implementierungsdokumentation im selben PR aktualisieren. Ergebnis muss im Git nachvollziehbar sein.

**Priorität:** P0 = vor entsprechender Entscheidungs-/Datenfreigabe unverzichtbar; P1 = hoher unmittelbarer Nutzen; P2 = nach solidem Kern; P3 = zurückgestellt. P0 bedeutet nicht, dass jede unabhängige P1-Aufgabe darauf warten muss.

**Aufwand:** produktive Entwickler-Arbeitstage einschließlich sinnvoller Tests und Doku, grobe Planungsspanne für den heutigen kleinen Codebestand; keine Zusage und keine Kalenderfrist. Anbieterantworten, Zugang, Reviewwartezeit und Marktbeobachtung zusätzlich. Nach jedem Paket neu schätzen. Bestehende Module sollen wiederverwendet werden.

**Statusspalten:** I = Implementierung, D = reale Daten-/Betriebsabnahme, E = empirische Prüfung. `offen`, `teilweise vorhanden`, `blockiert`, `erledigt`, `nicht erforderlich`. Keine Prozent-Fertigstellung aus bloßer Dateianzahl.

## 2. Schnellübersicht: Nutzen, Aufwand und Beschaffung

| ID | Paket | Priorität | Aufwand | Neue kostenpflichtige Daten? | Wichtigste Abhängigkeit |
|---|---|---|---|---|---|
| V01 | Aktuellen Kalenderzeitpunkt korrigieren | P1 | 1–2 T | Nein | Keine neue Quelle |
| V02 | Preisanker für Stop/Ziel vereinheitlichen | P0 | 1–2 T | Nein | Bestehender Simulator/Plan |
| V03 | Methodik-/Versionsregistry und Textbereinigung | P1 | 1–3 T | Nein | Codeinventar |
| V04 | Reale Datenabnahme und Beschaffungsentscheidung | P0 | 2–4 T + Wartezeit | Erst prüfen | Anbieterzugang, Lizenz, Testantworten |
| V05 | Tageslauf, Archiv, Datenalter und Alarm | P0 | 3–5 T | Infrastruktur ggf. | V04-Zugriff, Archiv |
| V06 | Instrumente, Universum und gemeinsame Zeitbasis | P0 | 2–4 T | Für kleine Watchlist meist kein neues Paket; prüfen | Kursmetadaten |
| V07 | Makrokalender automatisch normalisieren | P1 | 2–4 T | Öffentliche Quellen | V01, V05 |
| V08 | Earnings/Aktionen/HV und Ereignisindex | P0 für Ereignisfreigabe | 4–8 T | Strukturierte API ggf. | V04–V07, Unternehmensquellen |
| V09 | Nettolabels und serverseitige Qualifikation integrieren | P0 | 4–8 T | V04 entscheidet | V02, V04–V06 |
| V10 | Risiko-/Kein-Kauf-Regeln und Erklärungen | P0 | 3–5 T | Nein zusätzlich | V06, V08–V09, Risikoentscheidungen |
| V11 | Aktientabelle und mobile Detailansicht | P1 | 3–5 T | Nein | V03, definierter Analysevertrag |
| V12 | Nettoszenarien mit vorhandenen Analogien | P0 vor Nettoprognose | 4–7 T | Qualifizierte Labels | V09–V10 |
| V13 | Reale Walk-forward-Auswertung und Baselines | P0 vor Güteaussage | 4–8 T + Datenwartezeit | PIT-Daten ggf. | V09, V12 |
| V14 | Drei kleine Zusatzmerkmalsexperimente | P2 | 2–4 T je Gruppe | Sektor-/Earnings-Historie ggf. | V13 |
| V15 | Ein alternatives einfaches Modell | P2 | 3–6 T | Kein neues Abo ohne Begründung | V13, ausreichende Daten |
| V16 | Prospektiver Schattenbetrieb und Freigabedossier | P0 vor geprüftem Modus | 2–4 T Technik + Monate Beobachtung | Laufende Daten | V05, V11–V13 |
| V17 | Manueller Order-/Transaktionsledger | P1 | 4–7 T | Nein | Brokerbeispiel, Depotwährung, Speicherung |
| V18 | CSV-Import, Korrektur, Export und Restore | P1 | 2–4 T pro erstes Format | Nein | V17 |
| V19 | Tägliche Bewertung und fairer Erfolgsvergleich | P1 | 4–7 T | FX/Benchmark/Aktionen ggf. | V04–V06, V17 |
| V20 | Tägliche Positionsprüfung und unveränderlicher Ursprungsplan | P2 | 4–7 T | Keine zusätzliche Gruppe zwingend | V10, V12, V17, V19 |
| V21 | Umschichtung mit Vorteilsschwelle | P2 | 3–5 T | Nein zusätzlich | V20, belastbare Kosten |
| V22 | Betriebssicherheit und angemeldete Live-Abnahme | P0 je Produktfreigabe | 3–5 T | Infrastruktur ggf. | Je freizugebende Funktion |
| V23 | Größeres liquides Universum | P2 | 3–6 T + Datenabnahme | Anbietercredits/PIT-Mitgliedschaft ggf. | Stabiler kleiner Betrieb |
| V24 | Teure Zusatzquellen: begrenzte Machbarkeitsstudie | P3 | 1–2 T je Beschaffungsprüfung; Integration neu schätzen | Wahrscheinlich | Nachgewiesene verbleibende Lücke |

V14 besteht aus drei **separaten** Experimenten, nicht einem gleichzeitigen Featurepaket. V24 ist keine Kaufautorisierung. Zeitspannen nicht zu einem belastbaren Gesamttermin aufsummieren: Daten-, Modell- und Abnahmeentscheidungen können Umfang verkleinern oder vergrößern.

## 3. Low-hanging fruits und teure Vorhaben

### Sofort hoher Nutzen ohne neues Datenabo

- V01: sichtbarer Kalenderfehler, klar reproduzierbar.
- V02: widersprüchliche Stop-/Zielwerte vermeiden, bestehende Komponenten verbinden.
- V03: falsche Versions-/Statusaussagen beseitigen und Wiederholung verhindern.
- V11: verständliche Tabelle auch mit korrekt ausgewiesenen unbekannten Werten; keine Prognosefreigabe nötig.
- Früher Teil von V17: tatsächliche Käufe erfassen, bevor automatische Positionsberatung existiert. Nützlich, aber wegen Buchungsintegrität kein „ein Formular in zwei Stunden“-Paket.

### Mittlerer Aufwand, zentral für ein brauchbares Produkt

Reale Datenabnahme, tägliche Archivierung, Ereignisindex, Kosten-/Risikointegration und einfache Performanceansicht. Diese Arbeit wirkt weniger spektakulär als ein neues Modell, verhindert aber die größten Fehlentscheidungen.

### Aufwendig oder extern abhängig

Historische Point-in-time-Daten, vollständige Maßnahmen/Delistings, Konsensrevisionen, historische Quotes, großes Universum und belastbarer prospektiver Gütenachweis. Entwicklungszeit kann künftige Marktbeobachtungen nicht ersetzen. Fehlende günstige historische Vintages → Aussagen einschränken und prospektiv sammeln, statt Qualifikation zu erfinden.

## 4. Empfohlene Reihenfolge und nutzbare Zwischenziele

**Aktueller Nutzerauftrag 06.10.2026 (Europe/Berlin): A Datenladen/Ende-zu-Ende-Diagnose → V11 verständliche Haupttabelle/mobile Oberfläche → passende V22-Betriebsabnahme → einmalige Veröffentlichung auf der bestehenden Site → STOPP zur Nutzererprobung.** V06 und weitere Pakete sind bis zur Erprobung zurückgestellt. V01–V03 bleiben umgesetzt; V04 reale umfassende Datenabnahme bleibt offen. Die nachfolgenden Wellen sind die spätere Grundplanung, kein Auftrag zur automatischen Fortsetzung.

Paket A: [Diagnose und Korrektur](delivery/A-DATENLADEN.md). Reale Probe, technische Korrektur und weiterhin gesperrte Nettoprognose werden getrennt dokumentiert.

**Welle 1 – korrekte Grundlagen:** V01 → V02 → V03 → V04 → V06 → V05.

**Welle 2 – verständliche Analyse:** V07 → V08 → V11 → V09 → V10 → V12. UI-Vertrag vor V11 festhalten; V11 zunächst mit korrekten Unbekannt-Zuständen liefern und nach V12 echte Szenarien übernehmen.

**Welle 3 – tatsächlichen Nutzen messen:** V13, danach V16-Erfassung so früh wie technisch sicher möglich starten. V14/V15 nur auf erlaubten Entwicklungsdaten; keine laufende äußere Auswertung zum Tunen verwenden.

**Eigenständiger Journalpfad:** V17 → V18 → V19 kann nach Welle 1 eingeschoben werden, falls die Modellarbeit auf Daten wartet. Kein Warten auf nachgewiesenen Alpha-Vorteil.

**Welle 4 – bestehende Positionen:** V20 → V21. V22 jeweils vor der Freigabe einer nutzbaren Stufe; nicht erst ganz am Ende. V23/V24 nur nach Entscheidung über tatsächlichen Bedarf.

| Meilenstein | Voraussetzung | Nutzbar / ausdrücklich noch offen |
|---|---|---|
| M-A: verständlicher Research | V01–V08, V11, passende V22-Abnahme | Quellen, Termine, historische Werte; keine ungeprüfte Nettoprognose |
| M-B: experimentelle Entscheidungshilfe | V09–V13, V16-Sammlung, passende V22-Abnahme | Nettoszenarien/Plan; Prognosegüte weiterhin gemäß tatsächlichem Nachweis |
| M-J: echtes Kaufjournal | V17–V19, passende V22-Abnahme | Käufe und Performance; unabhängig von Modellvorteil |
| M-C: geprüfter Entscheidungsmodus | V13 plus V16-Freigabedossier, relevante Experimente abgeschlossen | Nur für belegtes Universum/Verfahren, keine Gewinngarantie |
| M-D: tägliche Depotunterstützung | V20–V21 und Daten-/Betriebsabnahme | Halten/Ausstieg/Umschichtung als nachvollziehbare Vorschläge |

## 5. Detaillierte Paketkarten

### V01 · Kalenderzeitpunkt

**Ziel:** Frisch erfolgreich geladene Termine erscheinen in der aktuellen Ansicht; historische Entscheidungen bleiben frei von späteren Informationen.

**Umsetzung:** UI-/Server-Zeitvertrag trennen; zuerst aktuelle Quelle beobachten und archivieren, dann aktuellen Anzeigenstand bilden. Historischen Replay nur aus passenden Revisionen. Betroffen: `app/index.html`, `calendar()` in `worker/index.template.js`, bei Bedarf `worker/events.js`.

**Abnahme:** [ ] Erfolgreicher BLS-Abruf zeigt Termin im Fenster. [ ] Eine Sekunde Verzögerung verwirft ihn nicht im aktuellen Modus. [ ] Historischer Modus schließt spätere Beobachtung aus. [ ] Fehler, Revision, leere Quelle und Zeitzone getestet. [ ] Unternehmensabdeckung bleibt ehrlich unbekannt.

**Nicht enthalten:** neue Renditegewichte, neue Datenfreigabe, neues Deployment. Ergebnisnachweis: reproduzierender Test und korrigierter Zeitvertrag.

### V02 · Preisanker

**Umsetzung:** Eine Funktion für vorläufige Referenzmarken und nach Einstieg endgültige Marken; keine getrennte Formel in Karte und Simulator. Splitkorrektur und Kostenbasis explizit.

**Abnahme:** [ ] Schluss 100 / Fill 101 ergibt konsistente tatsächliche Marken. [ ] Gap/Spread/Slippage und Split getestet. [ ] Vorläufige Werte eindeutig gekennzeichnet. [ ] Bestehende Exitregeln sonst unverändert.

### V03 · Methodikregistry

**Umsetzung:** Aktive Versionen, Merkmale, Formeln/Einheiten, Gewichte/Einflussarten und Status zentral erfassen; daraus Seitendoku erzeugen. README/Testanzahl und veraltete Kalender-/Tarifbehauptungen korrigieren.

**Abnahme:** [x] Aktive fünf Referenzmerkmale korrekt erklärt. [x] features-v2 nicht mit Referenzgewichten verwechselt. [x] Daten-/Modellversion stimmt mit API überein. [x] Verwendet/geplant/experimentell getrennt. [x] Keine Behauptung realer Freigabe durch Dokuänderung.

### V04 · Reale Datenabnahme

**Umsetzung:** Anbieterentitlements, Roh-/bereinigte OHLCV, Splits, Dividendenfelder, Earnings, Lizenzen und Archiv prüfen. Repräsentative anonymisierte Antworten und Ergebnisprotokoll, keine Schlüssel ins Git.

**Abnahme:** [ ] Tatsächlicher Zugriff je Endpunkt bestanden/fehlgeschlagen/nicht geprüft. [ ] Perioden/Zeitzonen/MIC/Währungen/Bereinigung bestätigt. [ ] Maßnahmencoverage getrennt bewertet. [ ] Speicher-/Anzeigerechte dokumentiert. [ ] Konkrete Upgrade-Entscheidung mit Kostenangebot oder „kein Upgrade nötig“.

**Blocker:** fehlender Zugang. Output dann vollständige offene Beschaffungsliste, nicht erledigte Datenabnahme.

### V05 · Sammlung und Betrieb

**Umsetzung:** Ein Tageslauf nach belegter Datenverfügbarkeit, idempotente Speicherung, Index, Wiederholungen/Rate-Limits, Datenalter, Alarm und Budgetzähler. Archivtechnik wiederverwenden.

**Abnahme:** [ ] Doppellauf erzeugt keine doppelten Buchungen/semantischen Snapshots. [ ] Alte Revision bleibt replaybar. [ ] Quellausfall sichtbar. [ ] Kein künstlich frischer Kursstand. [ ] Reale Schreib-/Leseprobe und Wiederherstellung dokumentiert.

### V06 · Instrumente und Kalender

**Umsetzung:** Dauerhafte Instrument-ID plus Symbol/MIC/Währung/Zeitzone; Universe-Version und Gültigkeit. Sitzungs- und Datenverfügbarkeitsregeln für alle Komponenten gleich.

**Abnahme:** [ ] Symbolwechsel/Mehrdeutigkeit nicht still vermischt. [ ] Feiertag, Kurzsitzung und US/EU-Sommerzeitwechsel geprüft. [ ] Eintrittstag1/Endtag20 konsistent. [ ] Nicht unterstützte Jahre/Instrumente explizit blockiert. [ ] Historische Watchlistverzerrung dokumentiert.

### V07 · Makrokalender

**Umsetzung:** Fed, BLS, BEA als getrennte Adapter; ICS/HTML normalisieren, Revisionen/Coverage/Alter speichern. FOMC-Termin und Zinswert nicht verwechseln.

**Abnahme:** [ ] Je Quelle normale/verschobene/abgesagte/unlesbare Antwort. [ ] Uhrzeit unbekannt bleibt unbekannt. [ ] Aktuelle Quelle stichprobenweise abgeglichen. [ ] Kein manueller Jahresarray als dauerhafter Primärfeed. [ ] Kein pauschaler Renditebonus/-malus.

### V08 · Unternehmensereignisse

**Umsetzung in Teil-PRs:** (a) Schema, Index, Validator; (b) Earnings/Aktionen für kleine Watchlist; (c) HV-Extraktion/Import. Quellenbeleg Pflicht, KI nur optionaler Extraktor. UI findet Ereignisse über Instrument/Zeit.

**Abnahme:** [ ] Bestätigt/geschätzt/unbekannt getrennt. [ ] Vor/nach Börsenschluss und Terminrevision korrekt. [ ] Dividenden-Datumsarten getrennt. [ ] HV nicht Filing-/Record-Tag. [ ] Kein Treffer ≠ keine Ereignisse. [ ] Kontoprobe/IR-Stichprobe und Konfliktfall dokumentiert.

### V09 · Nettolabels und Qualifikationsadapter

**Umsetzung:** Bestehenden Simulator mit real qualifizierten Snapshots/Aktionen/Kosten verbinden; serverseitige Nachweise statt Clientflags. Aktien-, Strategie- und Kapitalfensterrendite getrennt erzeugen. Gates unabhängig halten.

**Abnahme:** [ ] Rohkurse/Aktionen/Kosten bis UI/Label nachverfolgbar. [ ] Dividende/Split/Gap/fehlende Daten/Kostenstress. [ ] Keine Qualifikation durch `verified:true` aus fremder Eingabe. [ ] Fehlender PIT-Nachweis blockiert historische Modellvalidierung, ohne ehrliches retrospektives Szenario pauschal als Prognose auszugeben.

### V10 · Risikopolicy

**Umsetzung:** Daten-/Liquiditäts-/Ereignis-/Verlustgrenzen, Marktfilterstatus und persönliche Risikokonfiguration in einer Policy. Verlässlichkeit separat von Marktrisiko. Rankingverfahren aus Konzept experimentell konfigurieren.

**Abnahme:** [ ] Hohe Rendite kann harte Sperre nicht überstimmen. [ ] Unbekannt/ungeeignet/Cash unterschiedlich. [ ] Kosten nicht doppelt. [ ] Gleichwertige Kandidaten dürfen Gleichstand haben. [ ] Beispiel für Risikoprofilwechsel erklärt Rangänderung. [ ] Fehlendes persönliches Budget verhindert reale Größenempfehlung.

### V11 · Tabelle und mobile Ansicht

**Technischer Stand 06.10.2026:** [V11-Protokoll](delivery/V11-ERGEBNISTABELLE.md): sieben sichtbare Kernspalten, gemeinsame Policy, Statusfilter, 2–3-Titel-Vergleich, mobile Karten/Details. 17 Offline-Suiten und Artefaktprüfung; echte 320/390/768-/Desktop-/Echtdatenabnahme bleibt wegen abgelehntem Loginzugang offen. Keine Prognosefreigabe und keine Veröffentlichung in diesem Paket.

**Umsetzung:** Sieben Kernspalten, aufklappbarer Plan, mobile Karten, Filter nach Status, Vergleich von 2–3 Titeln. Ein gemeinsames API-Ergebnis, keine UI-Nebenrechnung.

**Abnahme:** [ ] Fehlende Werte als „— + Grund“. [ ] Kein historischer Mittelwert in Netto-Spalte. [ ] 320/390/768 Pixel, Tastatur, Lade-/Fehler-/Leerzustand. [ ] Laienaufgaben aus Konzept dokumentiert. [ ] Benutzbarer Teilzustand bei einer fehlgeschlagenen Aktie, Gesamtranking entsprechend eingeschränkt.

### V12 · Szenarioschätzung

**Umsetzung:** Vorhandene Analogien an qualifizierte Nettolabels anbinden; Mittel/Median/Quantile und Unsicherheit der Schätzung getrennt. Fallzahl/Regime-/Distanzgrenzen, Verteilungsabweichung und Unbekannt-Fallback.

**Abnahme:** [ ] Nur gereifte bekannte Labels. [ ] Zukunftsmutation ändert frühere Prognose nicht. [ ] Zu wenig vergleichbare Fälle erzeugt keine Zahl. [ ] Ziel-/Zeitstrategie und feste Tag20-Aktie getrennt. [ ] Historische Quantile heißen nicht kalibrierte Prognoseintervalle.

### V13 · Reale Evaluation

**Umsetzung:** Bestehenden Harness mit unabhängig qualifiziertem Adapter verbinden; reale Baselines, purged Walk-forward, Kostenstress, Markt-/Zeitblockunsicherheit, alle Ergebnisse und Datenlücken.

**Abnahme:** [ ] Zeitabschnitte/Parameter vor Ergebnisansicht fest. [ ] Kein Zugriff auf spätere Daten im Modellcallback. [ ] Einfache Baselines identische Kosten/Zeiträume. [ ] Negative und unbekannte Ergebnisse enthalten. [ ] Kein synthetischer Testbericht als empirischer Nachweis. [ ] Ergebnis kann „kein Vorteil“ lauten.

### V14 · Drei Ergänzungsgruppen

**V14a:** qualifizierte Handelbarkeit/Gap/Downside. **V14b:** Earnings-Nähe/Abdeckung. **V14c:** Markt-/Sektorregime. Jeweils eigenes Versuchsprotokoll und eigene Entscheidung.

**Abnahme pro Gruppe:** [ ] Hypothese, Primärmetrik und Varianten vorab. [ ] Mit/ohne Gruppe, nach Kosten. [ ] Redundanz und Datenverfügbarkeit geprüft. [ ] Vermiedene Verluste und entgangene Gewinne. [ ] Übernehmen/ablehnen/unklar samt Begründung. Ein abgelehntes Feature ist ein abgeschlossener Versuch.

### V15 · Ein alternatives Modell

**Umsetzung:** Zunächst regularisiertes einfaches Modell oder Quantilmodell gegen Analogien; nicht gleichzeitig mehrere komplexe Modellfamilien. Skalierung/Parameter nur auf erlaubten Daten. Unabhängigkeit der Fälle prüfen.

**Abnahme:** [ ] Kleine vorregistrierte Suche. [ ] Gemeinsame Labels/Kosten. [ ] Nicht nur In-sample besser. [ ] Laufzeit und Erklärbarkeit angemessen. [ ] Komplexeres Modell nur bei belastbarem Zusatznutzen übernehmen; sonst bisheriges behalten.

### V16 · Schattenbetrieb

**Umsetzung:** Alle täglichen Prognosen, Ablehnungen, Datenstände und spätere Outcomes unveränderlich sammeln. Modellversion einfrieren, neue Modelle als getrennte Versuche. Technische Dashboards ohne laufendes Test-Tuning.

**Abnahme Technik:** [ ] Täglicher Snapshot vor Outcome. [ ] Vorherige Auswahl bleibt unverändert. [ ] Reifegrad Tag20 sichtbar. [ ] Offene/unbekannte Fälle nicht als Nullgewinn. **Abnahme Empirie:** [ ] Vorab definierte Dauer/Fallzahl/Regime/Unsicherheit erfüllt. [ ] Freigabe oder begründetes Weiterlaufen/Ablehnung dokumentiert.

**Nicht abkürzbar:** Künftige Marktbeobachtung. Ein guter erster Monat reicht nicht.

### V17 · Kaufjournal

**Umsetzung:** Depot-ID, Orders, Fills, Geldbewegungen, Planverknüpfung, serverseitige Speicherung mit Zugriffsschutz. Zunächst manuell; keine echte Orderübermittlung.

**Abnahme:** [ ] Zwei Käufe derselben Aktie und Teilverkauf korrekt. [ ] Offene Order erzeugt keinen Bestand. [ ] Teilfüllungen/Gebühren/FX konsistent. [ ] Korrektur erhält Original. [ ] Cash/Bestand gegen Musterabrechnung nachvollziehbar. [ ] Echte und virtuelle Käufe getrennt.

### V18 · Import und Datensicherung

**Umsetzung:** Ein konkretes Broker-CSV-Format, Vorschau/Fehlerliste, Dublettenprüfung, revisionsfähige Korrektur, vollständiger Export/Restore. Weitere Broker separat.

**Abnahme:** [ ] Gleicher Import zweimal verändert Bestand nicht doppelt. [ ] Dezimal-/Datums-/Währungsformate korrekt. [ ] Unbekannte Zeile nicht still verworfen. [ ] Wiederherstellung produziert gleiche Cash-/Bestandswerte. [ ] Keine privaten Belege/Schlüssel im Repository.

### V19 · Performance

**Umsetzung:** Tägliche Rohkurs-/FX-Bewertung plus Buchungsledger, Dividendenforderungen, TWR und täglicher Drawdown; optional XIRR. SPY-/Cashvergleich mit gleichen Geldflüssen und Basiswährung.

**Abnahme:** [ ] Einzahlung ≠ Gewinn. [ ] Split wertneutral vor Markteffekt. [ ] Dividende nicht doppelt. [ ] Offene Verluste enthalten. [ ] FX erklärt USD/EUR-Unterschied. [ ] Fehlende Bewertung sichtbar. [ ] Teilverkauf und Gebühren stimmen gegen handgerechneten Fall.

### V20 · Positionsprüfung

**Umsetzung:** Ursprungsplan plus tägliche neue Bewertung, These und feste Endfrist; Halten/Reduktion prüfen/Ausstieg prüfen/Unbekannt. Vorherige Entscheidungen unveränderlich.

**Abnahme:** [ ] Kein automatisches Stopabsenken bei Verlust. [ ] Kein Neustart der 20 Tage. [ ] Splitanpassung nachvollziehbar. [ ] Nachträglicher Termin ändert nicht alten Wissensstand. [ ] Ausstieg bei fehlender Handelbarkeit als nicht ausführbar/offen gekennzeichnet, nicht erfunden.

### V21 · Wechselentscheidung

**Umsetzung:** Beibehalten/Cash/neue Aktie über vergleichbare Horizonte und zusätzliche Wechselkosten; Risiko/Konzentration, Mindestvorteil und Hysterese.

**Abnahme:** [ ] Kleine Rangänderung erzeugt keinen Wechsel. [ ] Hohe Fixgebühren können Wechsel unattraktiv machen. [ ] Pflichtausstieg bleibt wirksam. [ ] Resthorizont und neue Bindung getrennt. [ ] Simulation ohne nachträglich bekannte Gewinnerauswahl.

### V22 · Freigabe des Betriebs

**Umsetzung:** Angemeldeter echter Browser, Serverzugriffsschutz, API-Limits, Quellenausfall, Backups, Kostenkontrolle, Datenfrische und Zurückrollen prüfen. Bereits vorhandene Mechanismen verifizieren statt neu erfinden.

**Abnahme:** [ ] Veröffentlichter Commit nachgewiesen. [ ] Mobil/Tastatur echte Sitzung. [ ] Ein Nutzer sieht nicht fremde Depots. [ ] Alarm und Restore tatsächlich erprobt. [ ] Daten-/Modellstatus korrekt. [ ] Separate Deploymententscheidung; kein ungefragtes Veröffentlichen durch Testpaket.

### V23 · Universum erweitern

**Umsetzung:** Kapazität und Datenkosten zunächst für 50, dann ggf. 200 Titel messen; versionierte Instrumentauswahl, Liquiditätsfilter und sektorale Abdeckung. API-Limit/UI-Paginierung bei Bedarf.

**Abnahme:** [ ] Definiertes Universum und Limit sichtbar. [ ] Teilfehler erzeugen keine globale Bestbehauptung. [ ] Historische Mitgliedschaft/Delistings qualifiziert oder Aussage begrenzt. [ ] Laufzeit, Creditbudget und Snapshotkonsistenz gemessen. [ ] Erweiterung verbessert Nutzen gegenüber kleiner Watchlist oder wird begrenzt.

### V24 · Teure Daten prüfen

**Umsetzung:** Pro Quelle nur eine konkrete Frage, etwa „helfen damalige EPS-Revisionen nach Kosten zusätzlich?“. Datenprobe/Angebot/Lizenz/PIT prüfen, danach begrenztes Experiment planen.

**Abnahme:** [ ] Nutzenhypothese und billigere Alternative. [ ] Wirklicher Preis und Nutzungsrechte. [ ] Historische Bekanntheit. [ ] Integrations-/Betriebsaufwand. [ ] Kaufentscheidung separat. **Nicht automatisch enthalten:** Nachrichtensentiment, Optionen, Short-Feed oder große KI-Pipeline.

## 6. Zuordnung zur bisherigen Roadmap

| Bisherige Pakete | Neue Konkretisierung | Behandlung vorhandener Arbeit |
|---|---|---|
| 01–02 Auswahl/MAE | V02, V09, V13 Regressionen | Erhalten, nicht erneut als offen deklarieren |
| 03 Analysevertrag | V06, V10–V12 | Vertrag präzisieren, nicht still ändern |
| 04 Reproduzierbarkeit | V05, V13, V16 | Reale Abnahme und tägliche Nutzung ergänzen |
| 05 Datenfähigkeiten | V04, V09 | Feste Sperren durch belegte Qualifikation ergänzen |
| 06–07 Ausführung/Plan | V02, V09–V12 | Ende-zu-Ende integrieren |
| 08 Risiko/Ereignisse | V07–V08, V10, V14 | Reale Feeds/Validierung und Zusatznutzentests |
| 09–10 Karte/UI | V03, V11, V22 | Tabelle, echte UX-/Betriebsabnahme |
| 11 Vergleich | V13 | Technischer Harness bleibt; empirische Abnahme offen |
| 12 Ergänzungsgruppen | V14 | Drei getrennte registrierte Versuche |
| 13 Modellalternative | V15 | Höchstens eine neue Familie zunächst |
| 14 Schattenbetrieb | V16 | Erfassung früh starten; Freigabe erst bei Evidenz |
| 15 Ledger | V17–V19 | Journal darf unabhängig von Prognosegüte starten |
| 16–17 Positionen/Wechsel | V20–V21 | Unveränderlicher Plan und Hysterese |
| 18 Tagesbetrieb | V05, V22 | Mindestbetrieb vor erster Freigabe, später vertiefen |
| Erweiterter neuer Umfang | V23–V24 | Nachrangige, ausdrücklich begrenzte Optionen |

## 7. Lebendes Statusregister

**Fortgeschriebener Stand 05.10.2026:** V01 bis V03 technisch umgesetzt; V04-Zugangsprüfung und Beschaffungsliste dokumentiert, reale Datenabnahme weiter blockiert; Upgrade ohne Angebot/Entitlements nicht entscheidbar. Vorübergehende Priorität laut Nutzerauftrag: A → V11 → passende V22 → bestehende Site veröffentlichen → Stopp zur Erprobung; V06 zurückgestellt. Reale Archiv-/Browser-/Ausführungsabnahme offen. „Teilweise vorhanden“ verweist auf Codegrundlagen aus dem Ausgangscommit, nicht auf neue Abnahme. Bei jedem Paketstart ersetzen: Verantwortlicher, Datum, PR/Commit und Nachweis. E = nicht erforderlich bei reinen Softwarekorrekturen; das macht keine Modellgüte frei.

| Paket | I | D | E | Nächster Nachweis / Blocker | PR / Abschluss |
|---|---|---|---|---|---|
| V01 | erledigt | offen | nicht erforderlich | Reale Archiv-/Browserabnahme; BLS HTTP200/Parserprobe bestanden | [Paketprotokoll](delivery/V01-KALENDERZEITPUNKT.md), [PR #14](https://github.com/xkutzner/AktienAnalyse/pull/14) |
| V02 | erledigt | offen | nicht erforderlich | Reale Ausführungs-/Maßnahmenabnahme V04/V09; keine Prognosefreigabe | [Paketprotokoll](delivery/V02-PREISANKER.md), [PR #15](https://github.com/xkutzner/AktienAnalyse/pull/15) |
| V03 | erledigt | nicht erforderlich | nicht erforderlich | Keine Daten-/Prognosefreigabe; V04 echte Datenabnahme | [Paketprotokoll](delivery/V03-METHODIKREGISTRY.md), [PR #16](https://github.com/xkutzner/AktienAnalyse/pull/16) |
| V04 | teilweise vorhanden | blockiert | nicht erforderlich | Kein ausführbarer autorisierter Provider-/Archivzugang; Entitlements/Lizenz/Angebot fehlen; Upgrade unentschieden | [Paketprotokoll](delivery/V04-DATENABNAHME.md), [PR #17](https://github.com/xkutzner/AktienAnalyse/pull/17) · 05.10.2026 · Agent V04 |
| V05 | teilweise vorhanden | offen | nicht erforderlich | Produktiver Lauf/Archiv/Restore | — |
| V06 | teilweise vorhanden | offen | nicht erforderlich | Instrument-/Kalendernachweis | — |
| V07 | teilweise vorhanden | offen | nicht erforderlich | Quellenadapter/Freshness | — |
| V08 | teilweise vorhanden | blockiert | offen | Unternehmensquelle/Validator; Risikoregel separat | — |
| V09 | teilweise vorhanden | blockiert | nicht erforderlich | Qualifizierte Roh-/Maßnahmendaten | — |
| V10 | teilweise vorhanden | offen | offen | Persönliche Grenzen, Regelvergleich | — |
| V11 | technisch umgesetzt | reale UI-/Echtdatenabnahme blockiert | nicht erforderlich | [Haupttabelle/mobile Karten](delivery/V11-ERGEBNISTABELLE.md); private Anmeldung blockiert | PR-/Abschlussmetadaten im Paketprotokoll |
| V12 | teilweise vorhanden | blockiert | offen | Nettolabels und Szenarioabnahme | — |
| V13 | teilweise vorhanden | blockiert | blockiert | Reale qualifizierte Testdaten | — |
| V14 | offen | blockiert | blockiert | V13; jeder Teil separat | — |
| V15 | offen | blockiert | blockiert | V13, Datenumfang | — |
| V16 | teilweise vorhanden | offen | blockiert | Tägliche Erfassung und spätere Outcomes | — |
| V17 | offen | offen | nicht erforderlich | Brokerbeispiel/Depotwährung/Speicherung | — |
| V18 | offen | offen | nicht erforderlich | V17/CSV-Muster | — |
| V19 | offen | offen | nicht erforderlich | Ledger und Bewertungsquellen | — |
| V20 | offen | blockiert | offen | Qualifizierte laufende Analyse | — |
| V21 | offen | blockiert | offen | V20/Wechselkosten | — |
| V22 | teilweise vorhanden | offen | nicht erforderlich | Angemeldete Abnahme/Restore | — |
| V23 | offen | offen | offen | Kapazitäts-/Universumentscheidung | — |
| V24 | offen | offen | offen | Konkreter Bedarf/Angebot; zurückgestellt | — |

## 8. Vorlage für jedes Paketprotokoll

Unter `docs/delivery/Vxx-TITEL.md` ablegen, wenn das Paket beginnt. Noch nicht benötigte leere Dateien nicht massenhaft anlegen.

```markdown
# Vxx · Titel

## Auftrag und Stand
- Ziel / Nichtziel:
- Ausgangscommit und Datum:
- Verantwortlicher / aktueller Status:
- Bezug zum Produktkonzept und bisherigen Paket:
- Abhängigkeiten / offene Zugänge:

## Geplante Abnahme
- [ ] Konkreter funktionaler Fall
- [ ] Fehler-/Leer-/Grenzfall
- [ ] Reale Daten-/Betriebsprüfung oder begründet nicht erforderlich
- [ ] Empirische Prüfung oder ausdrücklich separat/blockiert

## Umsetzung
- Geänderte Dateien und Verhalten:
- Daten-/Modell-/Schema-Version:
- Migration / Rückwärtskompatibilität / Rollback:
- Dokumentationsänderung:

## Prüfprotokoll
| Prüfung | Befehl oder Ablauf | Ergebnis | Nachweis | Einschränkung |
|---|---|---|---|---|
| ... | ... | bestanden/fehlgeschlagen/nicht ausführbar | ... | ... |

## Daten- und Forschungsnachweis
- Quellen/Snapshot-IDs/Zeitraum/Universum:
- Kosten-/Ausführungsannahmen:
- Experiment-ID und vorab festgelegte Parameter:
- Ergebnis einschließlich negativer Befunde:
- I / D / E jeweils mit Begründung:

## Abschluss
- PR / getesteter Head / Mergecommit:
- Offene Restpunkte mit Folgepaket:
- Produktfreigabe: welche Aussage ist jetzt zulässig?
- Deployment: nicht erfolgt oder separat beauftragter Nachweis.
- Nächster sinnvoller Auftrag:
```

Keine Testdaten/-belege mit personenbezogenen Kontoangaben in Git. Große/lizenzierte Rohdaten im geeigneten Archiv; in Git nur nicht geheime Manifeste, Prüfsummen, Schema und Nachweise soweit erlaubt.

## 9. Erster kopierbarer Implementierungsauftrag

> Bearbeite ausschließlich V01 aus `docs/DELIVERY-PLAN-20D.md`. Lies das Produktkonzept und die Repository-Regeln, prüfe den aktuellen main-Commit und bereits laufende Arbeit. Korrigiere den Zeitvertrag zwischen UI und `calendar()`, sodass frisch erfolgreich geladene BLS-Termine in der aktuellen Ansicht erscheinen, historische Replay-Entscheidungen aber keine später beobachteten Daten verwenden. Nutze revisionsfähige Snapshots, falls für diese Trennung nötig. Ergänze Tests für erfolgreiche und verzögerte Antwort, Ausfall, Revision, Zeitzone und historische Unzulässigkeit. Keine Rendite-/Rankingänderung, keine Datenfreigabe, keine neue Veröffentlichung. Dokumentiere Umsetzung, reale Prüflücken, Tests, PR und Commit im Paketprotokoll und Statusregister. Merge nur nach den vorhandenen Repository-Regeln mit geprüftem Head. Starte danach nicht automatisch ein weiteres Paket.

Danach V02; vor Datenkauf V04. Wenn echte Quellenzugänge fehlen, unabhängige Dokumentations-/UI-/Journalarbeit wählen und die Datenabnahme blockiert lassen.

