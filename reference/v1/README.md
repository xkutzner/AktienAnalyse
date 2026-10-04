# Reproduzierbare Referenz reference-v1

Ausgangsquellstand: `c58cef8f5b7c08c0e35bda2871e18abe4cb738af` (Git). `model.mjs` ist eine eingefrorene Kopie der tatsächlichen Kernberechnung einschließlich bekannter Einschränkungen. `parameters.json` nennt Parameter und SHA-256. Nicht nachträglich überschreiben; spätere Referenzen in eigenen Verzeichnissen ablegen.

Ausführen: `node scripts/test-reference.mjs`. Läuft ohne Netzwerk/Schlüssel. Prüft eingefrorenen Quellhash, bekannte Formeln und 20-Tage-Ausgänge, Maturity-Filter, identische Ergebnisse des aktiven Kerns sowie eine gespeicherte Ergebnisdatei.

`expected.json` basiert ausschließlich auf der deterministischen, ausdrücklich synthetischen Testserie im Testskript. Das ist ein Regressionstest, keine reale Renditehistorie oder Prognosegüte. Die Serie ist bei jedem Lauf identisch (1300 Sessions, feste Anfangswerte, Sinus/Cosinus-Renditen, keine Zufallszahlen, kein heutiges Datum).

Reale frühere API-Ergebnisse können ohne archivierte OHLC-Eingaben nicht exakt wiederhergestellt werden: Providerdaten und die letzten 1300 Bars ändern sich. Hier werden keine fehlenden realen Daten erfunden.

## Tatsächliche Formeln
`r20=C[t]/C[t-20]-1`, `r60=C[t]/C[t-60]-1`, `rel20=r20-SPY_r20`, `trend50=C[t]/mean(C[t-49..t])-1`. Volatilität: Stichprobenstandardabweichung der 20 einfachen täglichen Close-Renditen (Teiler 19), multipliziert mit sqrt(252).

Scores: clamp(50+300*r20), clamp(50+150*r60), clamp(50+300*rel20), clamp(50+250*trend50), clamp(100-80*vol20), jeweils 0..100. Gewichte 25/20/25/20/10 Prozent. Keine weiteren Indikatoren.

Historische Fälle: alle 20 Sessions ab Index80. Ausschließlich Fälle mit `index+20 <= Entscheidungsindex`. SPY-Regime = r20>=0; bei mindestens12 Fällen derselben Richtung bevorzugt, andernfalls alle reifen Fälle. Kleinste absolute Scoredistanz, maximal30. Ertrag = Mittelwert Strategieausgänge, Zielchance = Treffer/n; unter12 keine Schätzung. Wilson95 mit z=1,96. Quantile: sortierte Erträge an floor((n-1)*p), p=.1/.9.

Eintritt: Open von t+1; Ausgang: idealisierte +5% bei einem High>=Entry*1.05 innerhalb t+1..t+20, sonst Close t+20/Entry−1. Kein Stop, keine Kosten. Rangfolge: Ertrag, Zielchance, Score; positive Schätzung und mindestens12 Fälle, sonst Cash.

Walk-forward: Start max(260,n−504), Schritt20, nur vollständig vorhandene Folgefenster. SPY gleiche Exitregel. Geometrisch verkettete Periodenerträge für Drawdown. Limitationen und weitere Quellen: `docs/ROADMAP.md`, `README.md`.
