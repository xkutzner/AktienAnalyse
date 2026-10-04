# Datenbasis data-v2 · 04.10.2026

## Drei getrennte Ebenen
1. `time_series?interval=1day&outputsize=1300&adjust=all`: nachträglich split- und dividendenbereinigte Indikatorreihe. Referenzkern/ Gewichte unverändert. Nicht als tatsächlicher damaliger Ausführungspreis verwenden. Spätere Anbieterrevisionen und Bereinigungen sind nicht point-in-time belegbar.
2. Gleicher Endpunkt mit `adjust=none`: getrennte historische OHLC-Antwort für reguläre US-Tageskurse. Keine Skalierung dieser Rohkurse in der Simulation. OHLC sind Anbieteraggregate und keine Tick-/Order-Fill-Nachweise. Tageshistorien können nachträglich korrigiert werden.
3. `/splits` und `/dividends?adjust=false`: separate Ereignisantworten, jeweils laut Anbieter 20 Credits und Grow/Venture oder höher. Im derzeit beobachteten Tarif ist Zugang nicht bestätigt. Keine Ersetzung durch aus Preisbrüchen geschätzte Ereignisse. Weitere Maßnahmen (Spin-offs, Bezugsrechte, Fusionen etc.) sind unbekannt.

Der zusätzliche Audit wird ausschließlich mit dem Knopf „Kursreihen & Kapitalmaßnahmen prüfen“ für ein Symbol ausgelöst, nicht für die ganze Watchlist. Vier parallel abgefragte Quellen können Tarif-/Kreditgrenzen erreichen. Fehler und Archivzustand werden pro Quelle angezeigt. Keine automatischen Wiederholungsversuche mit Zusatzkosten.

## Handelskalender und Uhrzeit
Unterstützt werden nur bestätigte USD-Instrumente mit MIC XNAS/XNGS/XNMS/XNCM/XNYS/ARCX/XASE und `exchange_timezone=America/New_York`. Unbekannte Metadaten, Börsen, Währungen und Zeiträume werden nicht stillschweigend auf US-Handel umgestellt.

Reguläre Sitzungen 09:30–16:00 ET, verkürzte Sitzungen bis 13:00 ET. Datum und Uhrzeit werden mit IANA-Zeitzone und Sommerzeit verglichen: vor Schluss vorherige Sitzung; nach Schluss heutige Sitzung, wenn der Provider den abgeschlossenen Tageskurs liefert. Fehlt er, ist die Antwort veraltet/unvollständig. Veröffentlichungszeit wird dadurch nicht erfunden. NYSE/Nasdaq haben derzeit dieselben hier unterstützten regulären Kalender; kein Overnight-/Extended-Hours-Backtest.

Version `us-core-2021-2027-20261004`: regelbasierte Feiertage mit frühen Schlüssen und Sonder-Schließung 09.01.2025. 2025–2027 Kalender aus offiziellen Veröffentlichungen geprüft. 2021–2024 Regeln sind als historisch nicht vollständig verifiziert markiert; außergewöhnliche Schließungen können fehlen. Keine automatische Nachrichtenerkennung neuer Sonderschließungen. Außerhalb 2021–2027 kein Kalenderersatz. Quellenstand ist ein fester Stand, keine Live-Börsenstatusgarantie.

## Datenqualität
- Positive endliche OHLC; High mindestens Open/Close/Low und Low höchstens Open/Close/High. Ungültige Datensätze ausgeschlossen und gemeldet.
- Doppelte Tagesdatensätze vollständig ausgeschlossen, nicht mit „letzter gewinnt“ überschrieben.
- Keine Kurse für noch nicht abgeschlossene Sitzungen; Nicht-Handelstagskurse als Fehler markiert.
- Fehlende Sitzungen seit erstem verfügbaren Kurs bis erwartetem letzten Handelstag explizit gezählt. Das SPY-Raster enthält erwartete Sitzungen, damit SPY-Lücken nicht den Horizont verkürzen. Keine vorgetragene/fiktive OHLC-Reihe.
- Fehlendes erwartetes Kursende = veraltet. Kein aktueller Kandidat aus einer als unbrauchbar gekennzeichneten Reihe. Nicht unterstützte oder fehlende Metadaten führen zu fehlender Analyse.
- Sprünge über 50 % werden zur Prüfung markiert. In bereinigten Reihen keine Kandidatenfreigabe; bei Rohkursen können echte Splits die Ursache sein, ohne Maßnahmenprüfung gibt es trotzdem keinen strengen Test.
- Lücken vor Börseneinführung sind nicht automatisch festgestellt: geprüft wird erst ab erstem vorhandenem Kurs, nicht ab angenommener IPO-Historie.

## Archiv und Verfügbarkeit
R2-Binding `BUCKET` speichert unveränderliche JSON-Snapshots unter zufälliger ID für jeden Abruf: Quelle, schlüsselfreie Requestparameter, Bezugszeitraum, Request-/Abrufzeit, HTTP-Status, Anbieterantwort oder Fehler, Datenversion. Historische Veröffentlichungszeit und damaliger Versionsstand sind `null`, `pointInTimeVerified=false`. Abrufzeit bedeutet nicht Veröffentlichungszeit. Neue Snapshots überschreiben alte nicht. Originale gültige Antworten bleiben erhalten, auch wenn Qualitätsregeln einzelne Reihen ausschließen.

Snapshots der getrennten Prüfung sind über einen Link in der privaten Site lesbar. Fällt das Archiv aus, wird „nicht verfügbar“ angezeigt; eine persistente Sicherung wird dann nicht behauptet. Schlüssel ausschließlich als Runtime-Secret; nicht in Snapshotparametern, Ausgabe oder Browser. Die R2-Sicherung beginnt erst mit dieser Version, sie erzeugt keine nachträglichen Vintage-Daten.

## Simulation und Verbot zukünftiger Informationen
`simulateRaw` ist getrennt vom eingefrorenen Referenzkern. Es nutzt `adjust=none`, Einstieg nächstes Open, 20 Sitzungen, +5%-Preisziel. Bei Splits vor der jeweiligen Eröffnung steigt/fällt die Stückzahl um `1/ratio`; die Preiszielorder passt invers an. Twelve-Data-Beispiel: ratio=.25 bedeutet 4:1, also vierfache Stückzahl. Am Einstiegstag ist der Rohkurs bereits ex-split, daher kein zweites Anwenden.

Dividenden am Ex-Tag gelten nur bei Bestand vor dem Ex-Tag (nicht bei Einstieg am selben Open). Betrag pro damaliger Aktie × Stückzahl wird separat als Forderung erfasst. `adjust=false` vermeidet spätere Splitbereinigung der Dividendenbeträge. Zahlungsdatum fehlt beim Anbieter: kein erfundener Cashzufluss und keine Wiederanlage. Preisrendite und Dividendenertrag werden getrennt zurückgegeben, keine zusätzliche Dividende auf einer bereits dividendenbereinigten Ausführungsreihe. Tageshoch-Zieltreffer und Open-Gaps sind idealisierte Ausführungen; keine intraday Reihenfolgesicherheit.

Die strenge Simulation erfordert bestätigte vollständige Maßnahmenabdeckung und point-in-time Daten. Der aktuelle Adapter bestätigt beides ausdrücklich NICHT. Daher wird der strenge Test gesperrt, statt rückwirkende Infos oder geschätzte Ereignisse als damals bekannt zu verwenden. Weitere Kapitalmaßnahmen bleiben unbekannt. Der Simulator ist mit ausdrücklich synthetischen, vollständig definierten Ereignissen geprüft; das ist kein realer Performancebeleg.

Die bestehenden Referenzmetriken bleiben zur Vergleichbarkeit erhalten, sind jetzt als `reference-retrospective-only` gekennzeichnet und **kein freigegebener Backtest**. Der Maturity-Filter schützt lediglich vor zukünftigen Outcome-Fenstern, nicht vor später korrigierten Daten. Die strenge Datenpipeline nutzt diese Referenzzahlen nicht als geprüfte Ergebnisse.

## Prüfung
`npm test`: ursprünglicher Referenzkern unverändert; feste synthetische Referenz; Kurs-/Kalenderqualität; UTC/ET-Sommerzeit, Feiertage, frühere Schließung; Split/reverse split, Dividendenausschluss am Einstiegsex-Tag, getrennte Dividendenforderung; Archivsicherung und Sperre bei fehlenden Nachweisen. Kein behaupteter erfolgreicher Live-Kapitalmaßnahmenabruf. Die UI zeigt Quellenstand und Archiv-/Qualitätsstatus, technische Fehler ersetzen keine Historie.

## Offizielle Quellen
- https://twelvedata.com/docs (time_series adjust=all/splits/dividends/none, splits ratio, dividends ex_date/amount/adjust=false)
- https://support.twelvedata.com/en/articles/5745849-timezones
- https://twelvedata.com/news/april-2026-updates (daily timestamps immer Exchange local; dividends ex-date statt payout date)
- https://www.nyse.com/trade/hours-calendars
- https://www.nasdaq.com/market-activity/stock-market-holiday-schedule
- https://www.nasdaq.com/press-release/nyse-group-announces-2025-2026-and-2027-holiday-and-early-closings-calendar-2024-11
- https://www.nyse.com/publicdocs/nyse/markets/american-options/rule-interpretations/2025/National_Day_of_Mourning_20250102.pdf
