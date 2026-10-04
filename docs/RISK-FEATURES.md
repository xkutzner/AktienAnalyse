# Paket 08a · Handelbarkeit und Gap-/Downside-Risiko

Stand 04.10.2026 · Ausgangsmain `b01d4a03164e67b5b68a390d80960533475b9b28`, Paket07-Merge `3c100d99913f5af2d92c70b30dbe381d81884d5a`.

`data-v4` erhält optionales Tagesvolumen im gemeinsamen `adaptPrices`. Fehlend, null, leere Zeichenfolge, negative oder nicht endliche Werte bleiben null; beobachtetes Nullvolumen bleibt 0. OHLC-Freigabe hängt nicht von optionalem Volumen ab. Die Datenversion ändert sich wegen der geänderten Normalisierung. Gespeicherte Normalisierungszeit und immutable Snapshots bleiben Grundlage des providerfreien Replays; neue Datenversionen überschreiben alte Archive nicht.

`risk-prefix-v1` / `riskAt` nutzt ausschließlich das Präfix bis zum expliziten Entscheidungsindex. Standard: 20 Rendite-/Gapbeobachtungen aus 21 lückenlosen regulären Sitzungen eines unterstützten MIC. Bei fehlender Sitzung, ungültiger Basis oder unzureichendem Fenster bleiben die Werte unbekannt; kein verkürztes Fenster wird als vollständig behandelt. Berechnet werden minimaler und mittlerer Opening-Gap sowie tägliche Downside-Deviation gegen 0, ohne Annualisierung. Die Beobachtungen und verwendete Basis stehen im Audit.

Durchschnittlicher täglicher Handelswert in USD benötigt Rohschluss und Rohvolumen derselben Sitzungen und vollständiges Volumenfenster. `close * volume` ist ausdrücklich ein Proxy, kein VWAP-Handelswert. Bereinigte Preise mit unbekannter Volumenanpassung ergeben keinen USD-Handelswert. Standardresearch lädt weiterhin nur bestehende bereinigte Reihen, ohne zusätzliche Providerabrufe; sein Handelswert bleibt unbekannt. Gap und Downside sind dort `provider-adjusted-price-return-proxy`, keine historischen verfügbaren oder real ausführbaren Risikonachweise.

`GET /api/data` liefert `rawRisk` aus den bereits vorhandenen vier Auditdownloads ohne Zusatzabruf; Normalisierungszeit ist asOf. Unusable Rohdaten ergeben unbekannte Risikowerte.

Für Rohgap und Rohdownside verlangt der explizite Audit vollständige datierte Maßnahmenabdeckung für das ganze Fenster, belegte historische Verfügbarkeit bis asOf, bekannte Splits/Dividenden und bestätigte Abwesenheit anderer Maßnahmen. Eine leere Maßnahmenliste genügt nicht. Splits normalisieren den vorherigen Schluss mit priceFactor, Dividenden reduzieren den Vergleichsschluss am Ex-Tag; das Ergebnis ist eine maßnahmenbereinigte Preisrendite, keine Netto- oder Total-Return-Ausführung. Ohne diese Qualifikation bleiben Rohgap/Downside unbekannt. Ein Roh-USD-Umsatzproxy benötigt diese Renditenqualifikation nicht, weil jeder Tagespreis mit dem Volumen desselben Tages multipliziert wird.

Keine neue Schwelle, kein Rankingwechsel und keine Kaufstatusfreigabe. Ergänzungsgruppe und mögliche Handelsschwellen bleiben bis Paket12 experimentell. Paket08b-Ereignisfeeds sind nicht implementiert. Live-/PIT-/Maßnahmenabdeckung und Prognosegüte sind unbestätigt; alle drei Capability-Gates bleiben gesperrt.

Vierzehn Suiten einschließlich neuer Tests im Datenadapter: Volumen unbekannt/0, vollständiges Fenster, Zukunftsmutation, fehlende Maßnahmenabdeckung, nach Entscheidung bekannte Maßnahme, splitneutraler Gap/Downside, USD-Basis und bereinigter Proxy. Build/Artefakt und tatsächlicher Sourcecommit werden separat geprüft; Neutralbuild SOURCE_COMMIT=null. Synthetische Daten prüfen Softwareverhalten, keine empirische Risikogüte.
