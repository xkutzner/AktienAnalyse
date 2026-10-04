# Oberfläche ui-v3 · 04.10.2026

Drei Hauptbereiche: Übersicht, Aktiendetails, Einstellungen & Methodik. Keine Modellformeländerung. HTML/CSS/Vanilla-JS, keine neue Laufzeitabhängigkeit.

## Informationshierarchie
Übersicht: SPY-Kursverlauf als Markttrend, Watchlist und Datenfreigabe, drei Kandidaten nach reference-v1. Weitere Aktien in Tabelle aufklappbar. Mittelwert, historische Zielhäufigkeit und Fallzahl als Hauptwerte. Der beste positive Kandidat ist ausdrücklich nur der beste innerhalb der eingegebenen Watchlist nach der alten, kostenfreien Referenz.

Details: Auswahl per nativem Select oder Kandidatenbutton. Vergangenheit und Merkmalsbegründung in einfachen Sätzen; Chancen ohne Kosten, Risiken und experimentelle Verlustausgänge. Kalender für ausgewählte Aktie, darunter alle Watchlisttermine/Quellen aufklappbar. Keine automatischen zusätzlichen Kalendercredits. Paper-Vormerkungen weiterhin lokal, keine Orders.

Einstellungen: Kosten und Tarife, Ausführungsregeln, Datenqualität/Audit, Erklärung vier Ergebnisarten, alter/neuer Vergleich, alte Rückprüfung, Formeln und To-dos. Native details/summary. Unterabschnitte sind keine zusätzlichen Haupttabs.

## Beschriftung
Historischer Vergleich = bereinigte Kurse ohne Kosten. Experiment = neue Nachbarwahl auf denselben Proxys, nicht auf Nettoausführungen. Kostenszenario = explizite Kosten-/Ausführungsannahme, keine Brokerabrechnung; aktuell gesperrt. Zeitlich getrennter Freigabenachweis fehlt. Häufigkeiten werden nicht als kalibrierte Wahrscheinlichkeiten bezeichnet. Maturity-Filter besagt nur abgeschlossene Folgefenster, nicht damalige Datenverfügbarkeit. Relative Stärke in Prozentpunkten, Preise und feste Gebühren in USD, Schwankung in % pro Jahr, Kosten bp mit Prozentumrechnung. Keine geschätzten Ersatzdaten.

## Akzeptanz und Anfragezustand
Server: quality.usable und frisches Kursende in fetchHistory. Browser: derselbe Status plus Qualitätsdiagnostik für Aktie und SPY, Enddatum und asOf. Karten/Tabelle/Details/best erhalten nur akzeptierte Aktien. Unbrauchbare Quellen in Qualität sichtbar; Formeln des Referenzkerns unverändert.

Jede Anfrageart hat monotonen Zähler, AbortController, captured symbol context und Prüfung nach JSON-Lesen. Änderungen von Symbolen/Kosten/Audit löschen oder sperren betroffene Anzeigen. Alte finally/catch-Blöcke dürfen keine neue Anfrage umschalten. Historischer Backtest/Marktwert wird bei Neuabruf, Watchlistwechsel und Fehlern geleert. Client kann Daten-/Tariffreigaben nicht erzwingen.

## Bedienung und Prüfung
Natives Button-/Select-/Input-/Summary-Verhalten, drei ARIA-Tabs mit Links/Rechts/Home/End, roving tabindex, aktiviertes Detail-Select nach Auswahl, klare Fokusrahmen; horizontale Tabellencontainer sind per Tastatur fokussierbar. Lesetext 16px, Nebenwerte mindestens 14px bei Standardwurzel; zentrale Textpaare rechnerisch ≥4,5:1. Buttons/Inputs/Selects/Summary mindestens44px. Grids wechseln bei780px/420px, Formulare und Kosteneingaben stapeln sich. Keine Farbalone-Signale.

scripts/test-ui.mjs führt das komplette Inline-Skript gegen Mock-DOM mit synthetischen verzögerten API-Antworten aus. Prüft geladen/leer/fehlgeschlagen, defensiven Qualitätsfilter, alte Research-/Kosten-/Audit-/Kalenderantworten, Tastaturtabs und Kontrast. Modeltest prüft defekte frische Aktienreihe und defektes SPY. HTML-Struktur/IDs/Labels separat geprüft. Kein echter Browserlauf: im aktuellen Worker-Starter keine kompatible supervised Preview, lokale Chromium-Binary fehlt. Visuelle Mobile-/Zoom-/Screenreader-Abnahme bleibt offen. Keine Behauptung eines bestandenen Browser-End-to-end-Tests.
