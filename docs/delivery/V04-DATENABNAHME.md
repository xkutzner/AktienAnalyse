# V04 · Reale Datenabnahme und Beschaffungsentscheidung

## Auftrag und Stand

- Ziel: tatsächliche Anbieterentitlements, Roh-/bereinigte OHLCV, Kapitalmaßnahmen, Earnings, Rechte und Archiv prüfen; erst daraus Beschaffung entscheiden.
- Nichtziel: Datenkauf, Site-Veröffentlichung, Brokerorders, Extraktion von Site-Secrets oder Freigabe von Nettoprognosen.
- Ausgangscommit: `d5accd22308e7f5b977efcb76c71c3d1f907be73`, Branch `delivery/v04-provider-acceptance-blockers`, 05.10.2026. Vor Beginn keine offene PR laut Orchestrator; main separat per GitHub-API bestätigt.
- Verantwortlicher: separater Implementierungsagent V04. **Paket nicht abgeschlossen: reale Abnahme blockiert.** Beschaffungs-/Prüfprotokoll erstellt; kein Anbieterzugang nachgewiesen.
- Grundlage: Produktkonzept Abschnitt 7, Lieferplan V04, vorhandene Adapter in `worker/data.js`, `/api/data` und `/api/collection` in `worker/index.template.js`, [Datenfähigkeiten](../DATA-CAPABILITIES.md).
- Abhängigkeiten: autorisierter ausführbarer Anbieterzugang, eigene Kontofreischaltungen/Vertragsunterlagen und zugängliches Archiv. `SOURCE_COMMIT` ist Buildmetadatum und kein Zugangsblocker.

## Geplante Abnahme

- [ ] Tatsächlicher Zugriff je Endpunkt, einschließlich semantischer Fehler bei HTTP200, belegt.
- [ ] Antwortzeitraum, MIC, Währung, Zeitzone und Preis-/Volumenbereinigung bestätigt.
- [ ] Splits, Dividenden und übrige Maßnahmen getrennt mit Coverage und Quellen bewertet.
- [ ] Earnings-Status, Sitzungslage, Revisionen und Beobachtungszeit belegt.
- [ ] Speicherung, Aufbewahrung und Anzeige für den konkreten Nutzungsmodus dokumentiert.
- [ ] Upgradeentscheidung mit tatsächlichem Angebot/Entitlements oder belegtem „kein Upgrade nötig“.
- [ ] Reale Schreib-/Lese-/Replay-/Restoreprobe im erlaubten Archiv.
- [x] Empirie separat: in V04 nicht erforderlich; keine Prognosegüte aus Datenerreichbarkeit ableiten.

## Umsetzung

Ausschließlich Dokumentation: dieses Protokoll, `docs/DELIVERY-PLAN-20D.md`, `docs/IMPLEMENTATION-STATUS.md`, `docs/DEVELOPMENT-ROADMAP.md`, `docs/DATA-CAPABILITIES.md`. Kein Code, Schema, Modell, Kalender oder Gate verändert. Migration nicht erforderlich; Rollback durch Revert des Dokumentationscommits. `reference/v1` unverändert.

### Tatsächlicher lokaler Preflight

Presenceprüfung ausschließlich für `TWELVEDATA_API_KEY` und `BUCKET` im aktuellen Prozess: **beide fehlen**. Keine Werte ausgegeben, keine `.env` gelesen, keine anderen Verzeichnisse oder Zugangsdaten durchsucht. Die verfügbare Werkzeugregistry enthält keinen mit einem autorisierten Twelve-Data-Secret gebundenen Provideraufruf. Der Site-Environment-Leser wäre ein Secret-Leser, kein solcher Proxy; er wurde nicht aufgerufen. Keine Aussage über Secrets oder Berechtigungen eines bestehenden Site-Servers.

Deshalb keine Provideranfragen, kein Rate-Limit-/HTTP403-Beleg, keine Prüfung des eigenen Kontos, keine echte Archivprobe. Das ist **nicht ausführbar / nicht geprüft**, kein nachgewiesenes negatives Entitlement. Es gibt keine anonymisierten echten Providerantworten, Snapshot-IDs oder Kontoangebote zu diesem Paket. Kein Muster wird als echte Antwort abgelegt.

### Endpunktinventar und offene Zugriffsnachweise

Host für Provideraufrufe: `https://api.twelvedata.com`. Authentifizierung erst im autorisierten Serverprozess, niemals in Git, Log, Bildschirmfoto oder protokollierter URL. Folgende Parameter beschreiben den gelesenen Adapter bzw. eine noch abzustimmende Prüfanforderung, keine ausgeführten Requests.

| Quelle / Endpunkt | Aktueller Adapter / geplante Probe | Tatsächlicher Zugriff | Fehlender Nachweis / Folge |
|---|---|---|---|
| `/time_series`, roh | `symbol`, `interval=1day`, `outputsize=1300`, `adjust=none` | nicht geprüft; nicht ausführbar | OHLCV, Meta und reale Zeilen prüfen; Datumsspanne aus Antwort, nicht 1300 angeforderte Balken als erhaltene Historie behaupten |
| `/time_series`, bereinigt | identische Parameter, `adjust=all` | nicht geprüft; nicht ausführbar | gemeinsame Sitzungstage, Preis- und Volumenanpassung mit Aktionen abgleichen; aktueller Download ist keine historische Vintage |
| `/splits` | `symbol`, `start_date=2021-01-01`, `end_date=Abrufdatum` | nicht geprüft; nicht ausführbar | effektiver Tag, Verhältnisrichtung, Rückwärtssplit, Coverage und Revisionen bestätigen |
| `/dividends` | gleicher Zeitraum, `adjust=false` | nicht geprüft; nicht ausführbar | Ex-/Zahl-/Record-/Ankündigungstag, Betrag, Währung, Sonderdividenden und Bereinigungsbasis ermitteln |
| `/earnings_calendar` / `/earnings` | öffentliche Produkte; kein produktiver Adapter integriert; genaue Kontoparameter erst bestätigen | nicht geprüft; nicht ausführbar | Kalender vs. veröffentlichte Ergebnisse trennen; bestätigter/geschätzter Termin, vor/nach Schluss, Zeitzone und Revisionen |
| `/dividends_calendar` / `/splits_calendar` | öffentliche Produkte; nicht in Sammlung integriert | nicht geprüft; nicht ausführbar | künftig bekannte Aktionen, Quellenzeit und Status für V08; Historie allein ist kein vollständiger Vorwärtskalender |
| `/stocks` / `/symbol_search` / `/exchanges` | Metadatenkandidaten für V06; keine kontobezogene Probe | nicht geprüft; nicht ausführbar | Symbol, MIC, Instrumenttyp, dauerhafte Identität, USD und Exchange-Zeitzone; Metadatentreffer bestätigt keinen Preiszugang |
| Sonstige Aktionen / Delistings / Symbolwechsel | kein qualifizierter Vollständigkeitsadapter | nicht geprüft | Coverage explizit beim Anbieter klären; fehlende Gruppen dürfen nicht als ereignisfrei gelten |
| `BUCKET`, Sammlung/Replay | vorhandene conditional-create-/Hash-/UUID-Technik | nicht geprüft; nicht ausführbar | reale Berechtigung, Retention, Kosten, Lizenz und Wiederherstellung fehlen; keine Infrastruktur gebucht |

### Antwort-/Adapterlücken aus Codelektüre

`normalizeActions()` konsumiert bei Splits nur `date` und numerisches `ratio`; es setzt `shareFactor=1/ratio`. Die Bedeutung des Anbieter-Verhältnisses ist real zu bestätigen, nicht aus dem Feldnamen zu raten. Dividenden konsumieren `ex_date`/`amount`; `paymentDate`, Veröffentlichungszeit und `knownAt` bleiben ausdrücklich null. Eine Quelle mit Zahltag allein behebt diese Integrationslücke nicht: V08/V09 müssen bestätigte Felder korrekt normalisieren. Sonstige Aktionen und beide Coverage-/PIT-Nachweise bleiben unbekannt/falsch. Leere Arrays sind keine Maßnahmenfreiheitsbestätigung.

`loadPrices()` beantragt derzeit kein explizites MIC/Exchange-/Timezone-Filtering. V06 muss Mehrdeutigkeit und gemeinsamen Instrumentvertrag verhindern; V04 muss tatsächliche Metaantworten prüfen. `providerData()` speichert Abrufzeiten, aber keine belegte frühere Veröffentlichung. Wiederholte neue Abrufe schaffen prospektive Beobachtung, keine rückwirkende PIT-Historie. Der bestehende Redaktionsmechanismus ersetzt nicht die Sichtprüfung vor Ablage eines echten Nachweises.

### Repräsentative Prüfkonfiguration nach Zugang

Dies sind **Prüfvorschläge**, keine bestätigten Instrumentmetadaten oder ausgeführten Marktproben. Kleine aktuelle Watchlist plus SPY getrennt als Benchmark, mindestens ein Titel je XNAS/XNYS. Beispielsymbole AAPL, MSFT und SPY sind vor Abruf per MIC/Instrumenttyp aufzulösen. Für Maßnahmen gezielt ein durch Unternehmens-IR belegtes Split-/Reverse-Split-Fenster und ein Dividendenausschüttungsfenster wählen; kein Datum/Verhältnis ohne Quellenbeleg übernehmen.

1. Genehmigten Testumfang und Creditbudget anhand der tatsächlichen Endpunktgewichte festhalten. Erst klein beginnen; Retry mit Obergrenze. Keine absichtliche kostenverursachende Limitüberschreitung.
2. Jede Anfrage mit UTC-Beobachtung, nicht geheimer Parametersignatur, HTTP-/Anbietercode, Schema, tatsächlichem Zeitraum, Zeilenanzahl und fehlenden Feldern protokollieren. Einzelstatus bestanden/fehlgeschlagen/nicht geprüft, niemals aus einem Endpunkt auf andere schließen.
3. Regelmäßige Sitzung, Feiertag, Kurzsitzung, US/EU-Sommerzeitwechsel und letzter abgeschlossener Tagesabschluss prüfen. `exchange_timezone`, `mic_code`, `currency`, Typ und Symbol einschließlich Änderungen explizit bestätigen; keine Angaben aus Nutzerort übernehmen.
4. Roh-OHLCV: eindeutige Datumsschlüssel, OHLC-Beziehungen, endliche positive Preise, nichtnegative/belegt skalierte Volumina; fehlende Sitzungen und Nullvolumen getrennt melden. Identische explizite Zeitfenster roh/bereinigt gegen Split-/Dividendenledger prüfen; Umkehr der Splitratio oder doppelte Bereinigung ausschließen.
5. Actions: IR-Stichprobe plus Anbieter-Coveragevertrag; Ex-Tag, Zahltag, Betrag/Währung, Sonderfälle, Revisionszeit und unvollständige/leere Antwort separat. Vollständigkeit benötigt mehr als einen gelungenen Ereignistreffer.
6. Earnings: tatsächliche IR-Quelle, bestätigt/geschätzt, Uhrzeit oder ausdrücklich unbekannt, Revisionen, Publikations-/Beobachtungszeiten; fehlender Treffer bleibt unbekannt. Keine damalige Verfügbarkeit aus heutigem Kalender rekonstruieren.
7. Zugriffsausfall, semantischer HTTP200-Fehler und unvollständige Antwort richtig klassifizieren. Einen real auftretenden Fehler als Fehlbefund protokollieren; Software-Fehlerpfadtests separat synthetisch kennzeichnen.
8. Erst nach Rechteklärung Originalantwort im erlaubten Archiv speichern; Zugangstoken, Account-/Personendaten und vollständige authentifizierte URL entfernen. Hash, Snapshot-ID, Zeitraum, Quellenverweis und Redaktionsumfang protokollieren. In Git nur erlaubte anonymisierte Ausschnitte/Manifest/Hashes; lizenzierte Vollantworten nicht ungeprüft veröffentlichen.
9. Reale Sammlung mit conditional create, Lesen/Hashprüfung, Replay ohne Providerfallback und Restore nachweisen. Alte Revision muss erhalten bleiben; Wiederholbarkeit/idempotenter Tageslauf ist V05, serverseitige Qualifikation V09.

### Beschaffungsliste und verantwortliche Schritte

| Was fehlt | Wie beschaffen / wer | Beleg für spätere Abnahme |
|---|---|---|
| Ausführbarer Providerzugang | Kontoinhaber konfiguriert berechtigten Serverzugang über vorgesehenes Secretmanagement; keinen Schlüssel im Chat/Git verlangen | Presence und erfolgreicher autorisierter Abruf mit redigiertem Ergebnis; kein Secretwert |
| Eigene Endpunkt-/Börsenentitlements | Kontoinhaber liefert nicht geheime Tarif-/Freischaltungsliste oder autorisierten kontogebundenen Bericht | Kontodatierte Liste für jeden erforderlichen Endpunkt, Markt und Zeitraum |
| Credits/Kapazität | Endpunktgewichte und Minute-/Tageslimits für Watchlist, SPY, Aktionen, Retries und initiale Historie ermitteln | Budgetrechnung aus realen Gewicht-/Limitbelegen, kein pauschaler Preis |
| Angebot | Anbieterangebot für exakt fehlende Rechte/Daten anfordern lassen; hier keine Nachricht versendet | Währung, Steuerbasis, Laufzeit, Börsenaufschläge, Limits, Zusatzpakete und Kündigung separat |
| Actions/Earnings/PIT-Abdeckung | Anbieter erklärt Felder, Lücken, Vintages/Revisionen und Sonderaktionen; IR-Stichproben beilegen | schriftliche Coverage plus tatsächliche Stichproben; historische Modellprüfung bleibt ohne PIT blockiert |
| Archiv- und Anzeigerecht | Kontoinhaber klärt persönlichen/internen vs. öffentlichen/kommerziellen Nutzungsmodus, Servercache, langfristige Vollantworten, Backups, abgeleitete Kennzahlen und Aufbewahrung nach Kündigung | datierter Vertrag/Anbieterfreigabe für konkrete Nutzung; unbekannt ist keine Erlaubnis |
| Reales Archiv | Bestehende autorisierte BUCKET-Bindung und Restorezugang bereitstellen; Retention/Region/Quota/Schreib-Leserecht prüfen | echter Write/Read/Hash/Replay/Restorebericht und Kostengrundlage, keine In-Memory-Probe |

**Upgradeentscheidung: nicht entscheidbar ohne eigenes Angebot und Entitlements.** Fehlender lokaler Schlüssel beweist weder „Upgrade nötig“ noch „kein Upgrade nötig“. Zuerst bestehende Freischaltungen, reale Coverage und Nutzungsrechte prüfen. Reichen sie vollständig, Entscheidung „kein Upgrade nötig“ mit Belegen; fehlt etwas, ausschließlich dessen Zusatzkosten/Alternativen gegenüberstellen. Fehlende Adapterintegration bleibt Entwicklungsarbeit, auch bei kaufbarem Feld. Fehlen historische Vintages, prospektiv erlaubte Daten sammeln und Prognoseprüfung einschränken; kein Abo als Ersatz für künftige Beobachtung buchen.

### Öffentliche Quellenprüfung, getrennt vom eigenen Konto

Am 05.10.2026 öffentliche Primärquellen per Websuche geprüft: [API-Dokumentation](https://twelvedata.com/docs) und [Fundamental-Produkte](https://twelvedata.com/fundamentals) führen Kalender-/Historienendpunkte für Dividenden, Splits und Earnings auf. Dokumentationsvolltext konnte wegen Größenlimit nicht geöffnet werden; Endpunktinventar ist öffentlich belegt, konkrete aktuelle Feld-/Tarifabnahme weiterhin offen. Keine Beispielantwort wurde als Kontobeleg übernommen.

[Commercial and personal usage](https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage), geöffnet am 05.10.2026, unterscheidet persönliche/interne Nutzung und Anzeige/Weitergabe. Metadatenkataloge belegen keinen Preiszugriff. Daraus folgt hier keine Vertragsfreigabe: Nutzungsmodus und Archivbedingungen müssen für das tatsächliche Konto bestätigt werden. Keine aktuelle Preiszahl oder Rechtsfreigabe aus öffentlicher Werbung abgeleitet.

## Prüfprotokoll

| Prüfung | Befehl oder Ablauf | Ergebnis | Nachweis | Einschränkung |
|---|---|---|---|---|
| Ausgangsstand | GitHub-Plugin `fetch_commit(main)` und rekursiver Git-Tree | bestanden | main SHA oben; 70 lokale getrackte Blob-SHAs stimmen mit API-Tree überein | kein Live-Providerbeleg |
| Regeln/Arbeitsstand | AGENTS, fünf Auftragsdokumente, DATA-CAPABILITIES, Adapter gelesen | bestanden | Paket V04 nach V03; eigene Branchbasis | alte Abschlussangaben nicht neu freigegeben |
| Credentials/Archiv | Prozess-Environment ausschließlich Presence | nicht ausführbar für Liveabnahme | TWELVEDATA_API_KEY und BUCKET fehlen | keine Aussage zu bestehender Site |
| Endpunktdaten/Entitlements | reale Anfrage je Inventarzeile | nicht ausführbar | oben einzeln nicht geprüft | kein HTTP-/Providerfehler erfunden |
| Lizenz/Angebot | konkrete Kontoverträge/Angebote vergleichen | nicht ausführbar | keine Unterlagen verfügbar | Upgrade unentschieden |
| Öffentliche Produktdoku | Primärquellensuche/Supportseite öffnen | teilweise bestanden | URLs und Grenzen oben | Docs-Volltext wegen Größenlimit nicht ausführbar; keine Accountabnahme |
| Dokumentation | lokale relative Links, I/D/E, Diff und unveränderte Referenz prüfen | bestanden | fünf Doku-Dateien; alle relativen Links auflösbar; Referenz-Blobs bytegleich | keine Prognoseprüfung |
| Regression/Build/Artefakt | in diesem Paket nicht erneut ausgeführt | nicht erforderlich | dokumentationsreine Änderung; keine neue Softwareabnahme behauptet | letzte Codeprüfungen V03, keine Live-Abnahme |

Kein funktionaler Fehltest durchgeführt. Nicht ausführbare Liveprüfungen bleiben offene Abnahmekriterien; ein sauber dokumentierter Blocker zählt nicht als bestandene Datenprüfung.

## Daten- und Forschungsnachweis

- Quellen/Snapshot-IDs/Zeitraum/Universum: keine echten Provider-/Archivdatensätze dieses Pakets; inventarisierte angeforderte Historie 2021 bis Abruf bzw. maximal 1300 Tagesbalken, tatsächlich erhaltene Historie unbekannt.
- Kosten-/Ausführungsannahmen: unverändert; keine kontobezogene Tarifbestätigung und keine Broker-Fill-Abnahme.
- Experiment-ID/Parameter: kein Modellversuch, keine Evaluation und keine neue Qualifikation.
- Negativer Befund: im aktuellen Arbeitskontext fehlt ausführbarer autorisierter Provider-/Archivzugang. Providerberechtigung selbst nicht negativ getestet.
- **I: teilweise vorhanden** — bestehende Adapter plus vollständige offene Beschaffungs-/Prüfliste; reale Durchführung/Entscheidung ausstehend.
- **D: blockiert** — sämtliche Kontoproben, Maßnahmencoverage, Rights und Archivabnahme fehlen.
- **E: nicht erforderlich für V04** — Datenzugriff würde Prognosegüte nicht beweisen; V13/V16 weiterhin abhängig von echten qualifizierten Daten/Beobachtungen.

## Abschluss

- PR: [#17](https://github.com/xkutzner/AktienAnalyse/pull/17). Überprüfter Head und Mergecommit: autoritative PR-/Git-Metadaten; Abschlussmeldung nach finaler Prüfung mit `expected_head_sha`. Kein Mergeerfolg vor Prüfung behauptet.
- Offene Restpunkte: V04 erneut mit Zugang/Unterlagen aufnehmen; V06 Instrumentvertrag, V05 produktiver Lauf/Restore, V08 Ereignisfelder/Quellen, V09 belegbasierte Qualifikation, V13/V16 Empirie.
- Zulässige Aussage: Anbieterabnahme **blockiert**, Beschaffungsentscheidung **offen**. Keine Nettoprognose, Kaufempfehlung oder Ereignisfreiheitsfreigabe. „Aktuell keine geeignete Aktie“ bleibt reguläres Ergebnis; bei Datenlücken Beurteilung eingeschränkt.
- Deployment: nicht erfolgt. Keine Datenkäufe oder Brokerorders.
- Nächster unabhängiger Auftrag: **V06** gemäß Welle 1 vor V05; technisch sichere Instrument-/Universums-/Sitzungsregeln mit ehrlichem Unbekannt-/Sperrzustand umsetzen. Reale Instrument-/Providerabnahme bleibt ohne Zugang offen; V05-Betriebsabnahme benötigt weiterhin echtes Archiv.
