# Brokerprofile · broker-prices-v1

Geprüft 04.10.2026, offizielle Quellen. Für Privatnutzer in Deutschland; tatsächliche Konto-/Produktfreigaben individuell. Keine Brokerverbindung.

## Trade Republic · Bestpreis
1 EUR je Kauf / Verkauf

Bestpreis, Aktien / ETFs. Keine offizielle öffentliche Trading-API verifiziert; derzeit keine Empfehlung für einen Bot. Andere Ausführungsplätze und EUR-Kurse. Im USD-Simulator gesperrt; keine erfundene Umrechnung.

Quelle: https://support.traderepublic.com/de-de/3372dc64-59cb-4521-a424-1ee812f264a4

## Trade Republic · Direktpreis
2 EUR je Kauf / Verkauf (1 EUR Abwicklung + 1 EUR Handelsplatz)

Direktpreis; gewählte Börse. Keine offizielle öffentliche Trading-API verifiziert. Bei Nicht-EUR-Börsen Währungsumrechnung. Historische FX-Kosten fehlen; USD-Simulation gesperrt.

Quelle: https://support.traderepublic.com/de-de/835f9deb-b864-4587-b428-7facfc55296c

## Interactive Brokers · US Fixed SmartRouting
0,005 USD je Aktie; mindestens 1 USD, höchstens 1 % Orderwert

Ganze US-Aktien, Fixed, SmartRouting; keine direkt gerouteten API-Orders. TWS API / IB Gateway · erste Wahl: direkte API und niedrige Basisprovision. Nur Basisprovision. Regulatorische Verkaufsgebühren, FX, Marktdatenabos und Teilausführungen fehlen.

Quelle: https://www.interactivebrokers.ie/en/pricing/commissions-stocks.php
API: https://interactivebrokers.ie/de/trading/ib-api.php

## CapTrader · US-Aktien
0,01 USD je Aktie; mindestens 2 USD

Standard-US-Aktien, Nasdaq; kein OTC, keine Bruchteile. IB API / IB Gateway · Alternative mit deutschem Ansprechpartner. Nur Basisprovision; Obergrenze nicht verifiziert. Regulatorische Verkaufsgebühren, FX, Marktdatenabos und Sonderfälle fehlen.

Quelle: https://www.captrader.com/konditionen/aktien-handel/
API: https://www.captrader.com/plattformen/handel-via-api/ib-api/

## LYNX · US-Aktien Nasdaq
0,01 USD je Aktie; mindestens 5 USD, höchstens 2 % Orderwert

Ganze US-Aktien, Nasdaq-Standardtarif. TWS API / IB Gateway · weitere Alternative mit deutschem Service. Nur Basisprovision. FX, Steuern, Marktdatenabos, mögliche externe Gebühren und Teilausführungen fehlen.

Quelle: https://www.lynxbroker.de/preise-konditionen/
API: https://www.lynxbroker.de/service/software/trader-workstation/

## Berechnung und Grenzen
USD-Basisprovision = max(Mindestgebühr, Stückzahl × Stückgebühr), ggf. begrenzt auf Prozent × Orderwert. Ganze Einstiegsstücke werden unter Berücksichtigung der Basisprovision bestimmt; Rest bleibt Cash. Bei Splits gilt die tatsächliche neue Stückzahl am Ausstieg. Keine Doppelzählung der manuellen Gebühren. Slippage bleibt separat einstellbare Modellannahme, standardmäßig 5 bp. EUR-Profile ohne historisches FX und passenden Ausführungsplatz gesperrt. Aktuelle Tarife dürfen nicht als historische Brokerabrechnung gelten; strenge Simulation mit Profil gesperrt. Alle realen Ergebnisse bleiben wegen Datenqualität ebenfalls gesperrt. CapTrader-Obergrenze nicht verifiziert; nur Basisszenario. Externe/regulatorische Gebühren, FX, Datenabos, Teilausführungen und erneute tägliche Mindestgebühren persistenter Orders sind unvollständig. Alle drei Automationsempfehlungen nutzen IBKR-Technologie, keine unabhängige technische Diversifikation.
