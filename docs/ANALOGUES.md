# Historische Merkmalsvergleiche features-v2 · 04.10.2026

## Umfang und Vergleich
Altes Verfahren und Score bleiben unverändert sichtbar. Neues Verfahren verwendet ausschließlich Momentum20 (`r20`), Momentum60 (`r60`), relative Stärke SPY (`rel20`), Abstand SMA50 (`trend50`), annualisierte Volatilität (`vol20`). Keine neuen Indikatoren. Rangfolge/Kandidatenwahl weiterhin alte Referenz; keine Behauptung einer Verbesserung. Außerhalb des Trainings noch nicht geprüft.

Die aktuelle Anbieterhistorie besitzt keine belegten damaligen Vintages. Deshalb sind die beiden sichtbaren Ertragsvergleiche ausdrücklich **bereinigte Referenz-Proxys**, keine Nettoausführungserträge. Der neue Nettopfad existiert, akzeptiert aber nur `netVerified=true`, `pointInTimeVerified=true`, endliche Nettoausgänge und `knownAtIndex` zwischen Ende des Ergebnisfensters und Entscheidungstag. Der derzeitige Adapter liefert keine solchen Fälle: Nettoertrag, Netto-Median/Verlustschwere/Verlustwahrscheinlichkeit bleiben unbekannt. Kein Abziehen frei geschätzter Kosten vom bereits bereinigten Proxy und keine Umdeutung zum realen Nettoergebnis.

## Training am jeweiligen Entscheidungstag
Beobachtungen derselben Aktie alle 20 Sitzungen ab Index80. Verwendbar nur, wenn `record.index+20 <= currentIndex` und alle fünf Merkmale vorhanden. Nettobeobachtungen zusätzlich mit belegtem verfügbarem Datenstand. Gleicher SPY-20-Tage-Trend wird bevorzugt, wenn mindestens12 qualifizierte Fälle existieren; sonst alle qualifizierten Trainingsfälle. Der aktuelle Query wird nicht in das Training aufgenommen. Skalierungsparameter und Distanzschwelle werden neu nur aus dieser Trainingsmenge berechnet.

Mindestens13 Trainingsfälle nötig, damit 12 andere Nachbarn für die Schwellenkalibrierung existieren. Nichtendliche Merkmale, doppelte Beobachtungen und überlappende oder nicht konsistent im 20-Session-Raster liegende Ergebnisfenster werden abgewiesen. Die Proxys verhindern keine nachträglichen Providerrevisionen: „nur abgeschlossene Trainingsfenster“ ist nicht gleich „vollständig historisch verfügbare Daten“.

## Skalierung und Korrelation
Je Merkmal Trainingsmittel μ und Stichprobenstandardabweichung s (Teiler n−1). `z=(x−μ)/s`. Konstante Merkmale (s ≤ 1e−10) werden aus der Distanz entfernt; weicht ein aktueller Query in einem solchen Merkmal ab, gibt es keine Schätzung.

Trainingskorrelation `R` aus standardisierten Merkmalen. Regularisierte Matrix `Rλ=0,9R+0,1I`, feste dokumentierte Schrumpfung (kein Testdaten-Tuning). Inversion per pivotierter Gauss-Jordan-Elimination. Starke positive/negative Korrelationen werden dadurch bei der Distanz berücksichtigt, statt fünf unabhängige Stimmen anzunehmen. Keine perfekte Redundanzkorrektur bei endlicher Regularisierung.

Effektiver Rang `r_eff = p² / sum_ij(R_ij²)` (p aktive Dimensionen).

**Distanz:** `d(x,y)=sqrt((z_x−z_y)' inverse(Rλ) (z_x−z_y) / r_eff)`.

Die fehlende endgültige Sicherheit der Trainingsdaten ist auch bei korrektem Fit-Fenster zu beachten. Weder Gewichte des Gesamtscores noch dessen skalierter Wert gehen in diese Distanz ein.

## Maximale Distanz nur aus Training
Für jeden Trainingsfall Abstand zum zwölften anderen nächsten Trainingsfall bestimmen (sich selbst ausgeschlossen). Grenze D = empirisches 75. Perzentil dieser Abstände, Minimum 1e−8. Weder aktuelle Querymerkmale noch Ergebnisse nach dem Entscheidungstag oder Testperioden setzen D. Die Perzentil-/Nachbarregel ist ein fester Startentwurf, keine empirisch optimale Grenze. Die Skalierung/Korrelation stammen aus derselben Trainingsmenge; Leave-one-out gilt hier für die Nachbarschaft, nicht für einen vollständigen inneren Fit.

Geeignete Fälle: d ≤ D. Höchstens30 mit kleinster Distanz. Gewicht `w=exp(−0,5(d/(D/2))²)`. Nicht geeignete Fälle werden nicht durch weit entfernte Ersatzfälle ergänzt.

## Fallqualität und Kennzahlen
- Rohfallzahl n: Anzahl ausgewählter Fälle.
- Kish-Effektivfallzahl `n_eff=(sum w)²/sum(w²)`. Bezieht sich auf Gewichte, **keine** Anzahl unabhängiger Fälle.
- Durchschnittliche Ähnlichkeit = ungewichteter Mittelwert der Kernelgewichte, Werte0–1; keine Gewinnwahrscheinlichkeit. Mittlere Distanz und Grenze zusätzlich in API.
- Zeitblöcke: ausgewählte Fälle auf ursprünglichem 80-Session-Zeitraster; nicht auf zusammengedrängter Regime-/Nachbarauswahl.
- Freigabeschwelle: n ≥12, n_eff ≥8 und mindestens4 Zeitblöcke. Sonst **„Keine belastbare Schätzung“** ohne Renditekennzahlen.

Gewichteter Mittelwert `sum(w*y)/sum(w)`. Gewichteter Median. Verlustwahrscheinlichkeit `sum(w für y<0)/sum(w)`. Historische Verlustschwere: gewichteter mittlerer Ertrag unter negativen Fällen; null wenn keine Verluste beobachtet. Zusätzlich mittlerer Ertrag der schlechtesten10 % Gewichtungsmasse, mit anteiliger Randbeobachtung. Kein prognostizierter Maximalverlust.

## Ergebnisbereich versus Mittelwertunsicherheit
**Historischer Ergebnisbereich:** gewichtetes10.–90. Perzentil einzelner Ergebnisse (80 % der gewichteten Vergleichsmasse). Keine Zusicherung zukünftiger Einzelrenditen.

**Mittelwertunsicherheit:** Moving-block bootstrap über die ursprüngliche chronologische 20-Session-Zeitleiste. Unausgewählte/anderes-Regime/nicht qualifizierte Fälle bleiben als Nullgewicht auf der Zeitachse; nicht aneinander anschieben. Blöcke4 aufeinanderfolgende Beobachtungen (=80 Sessions) berücksichtigen überlappende60-Session-Merkmalsfenster und kurzfristige Abhängigkeit der nicht überlappenden Ergebnisfenster. 500 Wiederholungen mit reproduzierbarem Seed aus Entscheidungsindex; Ziehen von zusammenhängenden Blöcken mit Zurücklegen, bis ursprüngliche Zeitlinienlänge erreicht ist. Wiederholungen ohne ausgewählte Masse werden verworfen; weniger400 gültige Wiederholungen => keine Schätzung. Nominales95%-Intervall =2,5./97,5. Perzentil der Mittelwerte.

**Grenzen:** konditional auf bereits gefittete Skalierung, Korrelation, Schwelle und Auswahl; diese werden im Bootstrap nicht erneut angepasst. Längere zeitliche Abhängigkeit und Modell-/Regimewahlunsicherheit können damit unterschätzt sein. Viererblöcke sind eine dokumentierte Startannahme, kein bewiesener optimaler Wert und keine Garantie95%-Abdeckung. Weitere Blocklängen und vollständiges Refit gehören in eine spätere, außerhalb des Trainings durchgeführte Prüfung. Überlappende20-Tage-Outcomes werden aktuell gesperrt statt mit einer unpassenden Formel ausgewertet.

## Oberfläche und API
Je Aktie `newAnalogs.proxy` und `newAnalogs.net` neben unveränderten alten Werten. Netto bleibt bei fehlenden Nachweisen leer; Fälle und Kennzahlen des sichtbaren Vergleichs klar als Proxys markiert. API enthält Fit-Mittel/Skalen, Korrelation, effektiven Rang, Trainingsanzahl/-ende, Grenzwert, Bandbreite und Status. Parameter `ANALOGUE_PARAMETERS` im Modul und in `/api/stocks`. Version `features-v2`, `rankingChanged=false`, `outOfSampleVerified=false`.

## Tests und weiterer Prüfbedarf
`npm test` enthält `scripts/test-analogues.mjs`: zukünftige/extreme Daten verändern keinen Fit, Outcomes verändern keine Schwelle, Einheitenwechsel beeinflusst Distanz nicht, hoch korrelierte Duplikate dominieren nicht doppelt, fehlende Nettoqualifikation, zeitliche Verfügbarkeit, unähnliche Querys, Mindestfallzahl, doppelte/überlappende Beobachtungen, deterministischer Block-Bootstrap und gewichtete Kennzahlen. Ausschließlich klar synthetische Testdaten, keine belegte bessere Performance.

Als nächster separat zu beauftragender Schritt: unveränderte Referenz und neue Methode auf vorab festgelegten, späteren Testperioden mit qualifizierten Nettoausführungen vergleichen; Parametertuning ausschließlich vor dem Test. Bis dahin weder Rangfolge umstellen noch Verbesserung behaupten.
