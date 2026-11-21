# Spezifikation: Handball-Liveticker als Web-App für das iPhone

| | |
|---|---|
| **Arbeitstitel** | HandballLive (Name noch offen) |
| **Art** | Web-App (Webseite), optimiert für Safari auf dem iPhone, zum Home-Bildschirm hinzufügbar |
| **Version des Dokuments** | 2.0 – Entwurf (ersetzt die Fassung 1.0 „native iOS-App“) |
| **Stand** | 21.11.2026 |

---

## 1. Ziel und Zusammenfassung

Eine **Webseite**, die auf dem iPhone in Safari geöffnet wird und Handball-Spiele einer **wählbaren Jugend** (z. B. „männliche B-Jugend“) in einer **wählbaren Spielklasse** (z. B. „Bezirksoberliga“) live darstellt. Eine native App, App Store, Apple-Developer-Account oder Mac mit Xcode sind **nicht** nötig.

Die Webseite kombiniert zwei Datenquellen:

1. **Quelle A – Liveticker:** Eine Webseite mit dem Spielverlauf (Tore, Zeitstrafen, Auszeiten, Spielzeit).
2. **Quelle B – Spielstand und Ergebnisse:** Eine andere Webseite mit Spielplan, Spielständen und Tabelle (typischerweise das Ergebnisportal des Verbands).

Die Daten werden im Browser auf dem Handy zusammengeführt und angezeigt. Einstellungen und zuletzt geladene Daten werden **lokal auf dem Handy** gespeichert. Es gibt keine Nutzerkonten und keine Datenbank auf einem Server.

> **Quellen:** Welche Webseiten konkret verwendet werden, wird in Phase 0 festgelegt (Kapitel 12). Für deutsche Ligen kommen in der Regel **handball.net** (DHB) sowie die Ergebnisdienste der Landesverbände (z. B. **Handball4All / H4A**, **SIS-Handball**, **nuLiga**) in Frage. Quellen werden über austauschbare *Adapter* angebunden.

---

## 2. Die zentrale technische Einschränkung: CORS

Ein Browser darf aus Sicherheitsgründen (*Same-Origin-Policy / CORS*) **keine fremden Webseiten auslesen**. JavaScript auf `meine-seite.de` kann den Inhalt von `handball.net` nur lesen, wenn `handball.net` das ausdrücklich erlaubt (Header `Access-Control-Allow-Origin`). Das ist bei Ergebnisportalen meist **nicht** der Fall.

Deshalb wird ein **Weiterleitungsdienst (Proxy)** gebraucht. Er ruft die Quellseiten ab und reicht sie an die eigene Webseite weiter. Der Proxy ist absichtlich minimal: Er speichert nichts dauerhaft, kennt keine Nutzer und leitet nur Anfragen an eine feste Liste erlaubter Adressen weiter.

| Variante | Beschreibung | Vorteile | Nachteile |
|---|---|---|---|
| **P1: Serverless-Proxy (empfohlen)** | Webseite als statische Dateien (z. B. GitHub Pages, Cloudflare Pages, Netlify). Proxy als kleine Funktion (z. B. Cloudflare Worker, Netlify Function). | Unterwegs über Mobilfunk nutzbar, kostenlos im Free-Tarif, kein eigener Rechner nötig | Benötigt ein kostenloses Konto bei einem Anbieter |
| **P2: Lokaler Rechner im Heimnetz** | Kleines Programm (z. B. Node.js oder Python) auf PC, Laptop oder Raspberry Pi liefert Webseite und Proxy aus. Aufruf am Handy z. B. über `http://192.168.178.20:8080`. | Läuft komplett zu Hause, kein externer Dienst | Funktioniert nur im eigenen WLAN (unterwegs nur per VPN); Rechner muss laufen |
| **P3: Ohne Proxy** | Nur möglich, wenn eine Quelle eine öffentliche JSON-Schnittstelle **mit CORS-Freigabe** anbietet. | Am einfachsten | In Phase 0 prüfen; meist nicht gegeben |

Webseite und Adapter sind so gebaut, dass alle drei Varianten **denselben Code** nutzen. Nur die Proxy-Adresse wird in einer Konfigurationsdatei eingetragen.

---

## 3. Begriffe

| Begriff | Bedeutung |
|---|---|
| **Jugend / Altersklasse** | A- bis E-Jugend, jeweils männlich, weiblich oder gemischt; zusätzlich Minis. |
| **Spielklasse / Staffel** | Konkrete Liga, z. B. „Bezirksoberliga Staffel 2“, mit eindeutiger ID in der Quelle. |
| **Tickerereignis** | Tor, 7-Meter, Zeitstrafe, Gelbe/Rote/Blaue Karte, Auszeit, Halbzeit, Spielende. |
| **Adapter** | JavaScript-Modul, das eine Quellseite ausliest und in das interne Datenmodell übersetzt. |
| **Proxy** | Kleiner Dienst, der Quellseiten im Auftrag der Webseite abruft (Kapitel 2). |
| **PWA** | „Progressive Web App“: Webseite, die über „Zum Home-Bildschirm“ wie eine App mit eigenem Symbol und ohne Safari-Leisten startet. |

---

## 4. Funktionale Anforderungen

Die Prioritäten: **MUSS** gehört zur ersten Version, **SOLL** ist für später geplant, **KANN** ist optional.

### 4.1 Einrichtung und Auswahl

| ID | Anforderung | Prio |
|---|---|---|
| F-01 | Beim ersten Aufruf führt ein Assistent durch die Auswahl: **Verband → Saison → Altersklasse (Jugend + Geschlecht) → Staffel**. | MUSS |
| F-02 | Die Auswahllisten werden aus Quelle B geladen. Falls das zu aufwendig ist, reicht für die erste Version eine **Konfigurationsdatei** (`config.json`) mit einer oder mehreren fest eingetragenen Staffeln. | MUSS (eine der beiden Formen) |
| F-03 | Optional kann eine **Lieblingsmannschaft** gewählt werden, deren Spiele hervorgehoben werden. | MUSS |
| F-04 | Mehrere Staffeln speicherbar, Wechsel per Auswahlmenü. | SOLL |
| F-05 | Die Auswahl steckt auch in der Adresse (z. B. `…/#/staffel/12345?team=678`), damit man direkte Links als Lesezeichen anlegen oder an andere Eltern weitergeben kann. | SOLL |
| F-06 | Die Auswahl wird lokal im Browser gespeichert (`localStorage`) und ist in den Einstellungen änderbar. | MUSS |

### 4.2 Spielübersicht

| ID | Anforderung | Prio |
|---|---|---|
| F-10 | Liste der Spiele, gruppiert nach Datum: Heim, Gast, Anwurfzeit, Halle, Status, Spielstand. | MUSS |
| F-11 | Status: *geplant*, *läuft* (mit Halbzeit/Minute), *Halbzeit*, *beendet*, *abgesagt/verlegt*, *Wertung*. | MUSS |
| F-12 | Laufende Spiele stehen oben, deutlich markiert („● LIVE“). | MUSS |
| F-13 | Automatische Aktualisierung (siehe 4.5) und ein Knopf „Aktualisieren“. | MUSS |
| F-14 | Spiele der Lieblingsmannschaft sind hervorgehoben. | MUSS |

### 4.3 Spieldetail / Liveticker

| ID | Anforderung | Prio |
|---|---|---|
| F-20 | Kopfbereich: Mannschaften, großer Spielstand, Halbzeitstand, Spielminute, Status. | MUSS |
| F-21 | Tickerereignisse chronologisch, das neueste oben: Minute, Symbol, Mannschaft, ggf. Spieler/Nummer, Stand danach. | MUSS |
| F-22 | Neue Ereignisse werden kurz farbig hervorgehoben. | SOLL |
| F-23 | Kleine Statistik: 7-Meter, Zeitstrafen, Auszeiten je Mannschaft. | SOLL |
| F-24 | Ohne Ticker wird nur der Spielstand aus Quelle B angezeigt, mit dem Hinweis „Kein Liveticker verfügbar“. | MUSS |
| F-25 | Link „Originalseite öffnen“ als Quellenangabe. | MUSS |
| F-26 | **Bildschirm wach halten** (Screen Wake Lock API) während eines laufenden Spiels, per Schalter. | SOLL |

### 4.4 Tabelle

| ID | Anforderung | Prio |
|---|---|---|
| F-30 | Tabelle: Platz, Mannschaft, Spiele, S/U/N, Tore, Differenz, Punkte. | MUSS |
| F-31 | Vorläufige Live-Tabelle mit den aktuellen Spielständen, gekennzeichnet als „vorläufig“. | KANN |

### 4.5 Aktualisierung

| ID | Anforderung | Prio |
|---|---|---|
| F-40 | Ein Spiel läuft und die Seite ist sichtbar: Abruf alle **15 s** (einstellbar 10–60 s). | MUSS |
| F-41 | Spieltag ohne laufendes Spiel: alle **5 min**. Sonst nur beim Öffnen und manuell. | MUSS |
| F-42 | Ist die Seite nicht sichtbar (Tab im Hintergrund, Bildschirm aus), wird **nicht** abgerufen (Page Visibility API). Beim Zurückkehren wird sofort aktualisiert. | MUSS |
| F-43 | Anzeige „Aktualisiert vor 12 s“. Sind die Daten älter als 2 min, erscheint ein Warnhinweis. | MUSS |
| F-44 | Bei Fehlern wird schrittweise länger gewartet (Backoff bis max. 2 min). | MUSS |

### 4.6 Offline und Fehler

| ID | Anforderung | Prio |
|---|---|---|
| F-50 | Die Webseite selbst funktioniert offline (Service Worker). Die zuletzt geladenen Daten werden aus dem lokalen Speicher angezeigt, mit dem Hinweis „Offline – Stand von 14:32 Uhr“. | MUSS |
| F-51 | Fällt eine Quelle aus oder hat sich ihre Struktur geändert, wird eine verständliche Meldung angezeigt; die andere Quelle wird weiter genutzt. | MUSS |

### 4.7 Bewusst nicht enthalten

Diese Funktionen gibt es nur für native Apps oder sie brauchen einen dauerhaft laufenden Server. Sie entfallen gegenüber Fassung 1.0:

- Live Activity und Dynamic Island
- Home-Screen-Widgets
- Aktualisierung im Hintergrund bei geschlossener Seite

**Push-Mitteilungen** sind zwar seit iOS 16.4 für Web-Apps auf dem Home-Bildschirm möglich, setzen aber einen Server voraus, der die Spiele dauerhaft beobachtet. → **KANN**, nur falls später doch ein Server betrieben wird.

---

## 5. Nicht-funktionale Anforderungen

| ID | Anforderung |
|---|---|
| NF-01 | **Zielgerät:** Safari ab iOS 17 auf dem iPhone. Funktioniert zusätzlich in aktuellen Desktop-Browsern. |
| NF-02 | **Mobile first:** Bedienung mit dem Daumen, Tippflächen mindestens 44 × 44 pt, keine horizontale Scrollleiste, Berücksichtigung der „Safe Areas“ (Notch/Dynamic Island). |
| NF-03 | **PWA:** `manifest.webmanifest` mit Name, Symbol (180 × 180 px Apple-Touch-Icon) und `display: standalone`, damit die Seite vom Home-Bildschirm wie eine App startet. |
| NF-04 | **Leistung:** Erste Anzeige aus dem Cache < 1 s, gesamte Seite (ohne Daten) < 200 KB. |
| NF-05 | **Darstellung:** Hell- und Dunkelmodus nach Systemeinstellung, Schriftgröße folgt der Systemeinstellung, Kontraste nach WCAG AA. |
| NF-06 | **Datenschutz:** Keine Konten, kein Tracking, keine Cookies, keine externen Schriftarten oder Skripte. Daten liegen nur lokal im Browser. Der Proxy protokolliert keine IP-Adressen (bzw. nur kurzfristig zur Fehlersuche). |
| NF-07 | **Wartbarkeit:** Jede Quelle ist ein eigenes Adapter-Modul. CSS-Selektoren und URL-Muster stehen zentral als Konstanten im Adapter. |
| NF-08 | **Rücksicht auf Quellen:** Der Proxy hält Antworten 10 s im Zwischenspeicher, damit mehrere Handys nicht mehrfach abrufen. Er sendet einen eindeutigen User-Agent und beachtet `robots.txt` und die Nutzungsbedingungen. |
| NF-09 | **Sicherheit:** Der Proxy leitet **nur** an eine feste Liste erlaubter Hosts weiter (kein offener Proxy). Nur `GET`-Anfragen. Antwortgröße begrenzt (z. B. 2 MB). Inhalte aus Quellseiten werden nie ungeprüft als HTML eingefügt, sondern nur als Text (`textContent`), um Cross-Site-Scripting zu vermeiden. |

---

## 6. Architektur

### 6.1 Übersicht

```
iPhone (Safari / Home-Bildschirm-App)
┌──────────────────────────────────────────────┐
│  Web-App (statische Dateien)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ UI       │ │ Merger   │ │ Adapter A/B  │  │
│  │ (Views)  │◄┤          │◄┤ (DOMParser)  │  │
│  └──────────┘ └──────────┘ └──────┬───────┘  │
│  localStorage / IndexedDB         │          │
│  Service Worker (Offline)         │          │
└───────────────────────────────────┼──────────┘
                                    │ fetch("/proxy?url=…")
                          ┌─────────▼──────────┐
                          │  Proxy (P1 oder P2)│
                          │  - Host-Allowlist  │
                          │  - 10-s-Cache      │
                          └───┬────────────┬───┘
                              │            │
                      ┌───────▼───┐  ┌─────▼─────┐
                      │ Quelle A  │  │ Quelle B  │
                      │ Ticker    │  │ Ergebnisse│
                      └───────────┘  └───────────┘
```

**Grundsatz:** Der Proxy ist „dumm“ und reicht die Antworten nur durch. Das Auslesen geschieht **im Browser auf dem Handy** mit dem eingebauten `DOMParser` (HTML) bzw. `JSON.parse`. So muss bei Änderungen einer Quellseite nur die Webseite neu hochgeladen werden.

*Ausnahme:* Erzeugt eine Quellseite ihre Inhalte erst per JavaScript und gibt es keine JSON-Schnittstelle, kann der Browser sie nicht auslesen. Dann muss der Proxy die Seite mit einem Headless-Browser (z. B. Playwright) rendern. Das geht nur bei Variante P2 oder bei einem Anbieter, der das unterstützt, und wird in Phase 0 geklärt.

### 6.2 Technologie

| Bereich | Technologie |
|---|---|
| Sprache | JavaScript (ES-Module) oder TypeScript |
| Aufbau | **Ohne Framework** (Vanilla JS mit Web Components oder einfachen Render-Funktionen) **oder** ein kleines Framework wie Preact/Svelte. Entscheidung durch den Entwickler; Ziel ist eine kleine, schnelle Seite. |
| Build | Optional Vite. Ohne Build-Schritt muss die Seite trotzdem lauffähig sein, falls Vanilla JS gewählt wird. |
| HTML-Parsing | `DOMParser` (im Browser eingebaut, keine Bibliothek nötig) |
| Speicher | `localStorage` für Einstellungen, `IndexedDB` (oder `localStorage`) für den Daten-Cache |
| Offline | Service Worker: App-Dateien „cache first“, Daten „network first“ mit Cache-Rückfall |
| Bildschirm wach halten | Screen Wake Lock API (`navigator.wakeLock`) |
| Proxy P1 | Cloudflare Worker oder Netlify Function (JavaScript, ca. 50 Zeilen) |
| Proxy P2 | Node.js (ohne Abhängigkeiten oder mit Express) bzw. Python, der zugleich die statischen Dateien ausliefert |
| Tests | Vitest (Adapter, Merger) mit gespeicherten Beispielseiten; Playwright für Oberflächentests in WebKit (entspricht Safari) im iPhone-Format |

### 6.3 Projektstruktur (Vorschlag)

```
/
├─ index.html
├─ manifest.webmanifest
├─ sw.js                    Service Worker
├─ config.json              Proxy-URL, Standard-Staffel, Intervalle
├─ icons/                   App-Symbole
├─ src/
│  ├─ main.js               Start, Routing (#/…)
│  ├─ store.js              Einstellungen + Cache
│  ├─ poller.js             Aktualisierungstakt, Backoff, Sichtbarkeit
│  ├─ merger.js             Zusammenführung A + B
│  ├─ model.js              Datentypen (JSDoc oder TypeScript)
│  ├─ adapters/
│  │  ├─ results-<quelle>.js
│  │  └─ ticker-<quelle>.js
│  └─ views/
│     ├─ setup.js  games.js  game-detail.js  standings.js
├─ styles/app.css
├─ proxy/
│  ├─ worker.js             Variante P1
│  └─ server.js             Variante P2
└─ tests/
   ├─ fixtures/             gespeicherte HTML/JSON-Beispiele
   └─ *.test.js
```

### 6.4 Adapter-Schnittstelle

```js
/** Quelle B */
export const resultsSource = {
  id: "beispielportal",
  async leagues({ association, season, youth, gender }) { /* → League[] */ },
  async games(leagueId)     { /* → Game[] */ },
  async standings(leagueId) { /* → StandingRow[] */ },
};

/** Quelle A */
export const tickerSource = {
  id: "beispielticker",
  async findTicker(game)  { /* → TickerRef | null */ },
  async snapshot(tickerRef) { /* → TickerSnapshot */ },
};

/** Gemeinsame Hilfsfunktion: alle Abrufe laufen über den Proxy */
export async function fetchViaProxy(url) {
  const res = await fetch(`${config.proxyUrl}?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new SourceError(url, res.status);
  return res.text();
}
```

**Robustheit:** Jeder Adapter prüft seine Ergebnisse auf Plausibilität (Stände ≥ 0, Minute passend zur Spielzeit, Namen nicht leer). Schlägt die Prüfung fehl, wird eine `SourceError` geworfen, der letzte gültige Stand bleibt sichtbar und die Seite zeigt einen Hinweis.

### 6.5 Zusammenführung (Merger)

1. **Quelle B ist führend** für Spielplan und Spiel-IDs.
2. **Zuordnung Ticker ↔ Spiel:** zuerst über eine gemeinsame Spielnummer. Sonst über Datum + Anwurfzeit (±30 min) + normalisierte Mannschaftsnamen: Kleinschreibung, Präfixe wie „HSG/TV/SG/JSG“ entfernen, Umlaute vereinheitlichen, Mannschaftsnummern („2“, „II“) beachten, Ähnlichkeitsvergleich. Unsichere Treffer werden nicht übernommen. Für Sonderfälle gibt es eine manuelle Zuordnung in `config.json`.
3. **Während des Spiels** gilt der Spielstand aus dem Ticker (aktueller).
4. **Nach Spielende** gilt Quelle B (offizielles Ergebnis). Bei Abweichung erscheint der Hinweis „Ergebnis laut Verband“.
5. Jeder Wert führt `source` und `fetchedAt` mit.

### 6.6 Proxy – Anforderungen im Detail

| Punkt | Vorgabe |
|---|---|
| Aufruf | `GET /proxy?url=<URL-kodiert>` |
| Allowlist | Nur Hosts der festgelegten Quellen (z. B. `["www.beispielportal.de", "ticker.beispiel.de"]`), sonst `403` |
| Antwort | Originalinhalt und Content-Type, plus `Access-Control-Allow-Origin: <eigene Domain>` |
| Zwischenspeicher | 10 s für Ticker, 60 s für Spielpläne/Tabellen |
| Zeichenkodierung | Falls die Quelle ISO-8859-1 liefert, in UTF-8 umwandeln oder den Zeichensatz im Header korrekt weitergeben |
| Begrenzung | Max. 2 MB pro Antwort, Timeout 8 s, einfache Ratenbegrenzung pro IP |
| Protokolle | Keine dauerhafte Speicherung personenbezogener Daten |

---

## 7. Datenmodell

Beschrieben als JSDoc-Typen; bei TypeScript entsprechend als `type`/`interface`.

```js
/** @typedef {"a"|"b"|"c"|"d"|"e"|"minis"} Youth */
/** @typedef {"male"|"female"|"mixed"} Gender */
/** @typedef {{ youth: Youth, gender: Gender, label: string }} AgeGroup */   // "männliche B-Jugend"

/** @typedef {{ id: string, name: string, ageGroup: AgeGroup, season: string,
 *              halfLengthMin: number, sourceUrl: string }} League */
// halfLengthMin: A-Jugend 30, B/C-Jugend 25, D/E-Jugend oft 20 (verbandsabhängig, konfigurierbar)

/** @typedef {{ id: string, name: string, shortName?: string }} Team */

/** @typedef {"scheduled"|"live"|"halftime"|"finished"|"cancelled"|"awarded"} GameState */
/** @typedef {{ home: number, away: number }} Score */

/** @typedef {{
 *   id: string, gameNumber?: string, leagueId: string,
 *   home: Team, away: Team,
 *   kickoff: string,            // ISO 8601, Anzeige in Europe/Berlin
 *   venue?: string,
 *   state: GameState, minute?: number, half?: 1|2,
 *   score?: Score, halftimeScore?: Score,
 *   ticker?: TickerRef,
 *   scoreSource: "ticker"|"results",
 *   fetchedAt: string
 * }} Game */

/** @typedef {"goal"|"penaltyGoal"|"penaltyMissed"|"suspension"|"yellowCard"|
 *            "redCard"|"blueCard"|"timeout"|"halftime"|"gameStart"|"gameEnd"|"other"} TickerEventType */

/** @typedef {{
 *   id: string,                 // stabil: aus der Quelle oder Hash(Zeit+Typ+Team+Stand)
 *   clock: string,              // "23:41"
 *   type: TickerEventType,
 *   side?: "home"|"away",
 *   playerName?: string, playerNumber?: number,
 *   scoreAfter?: Score,
 *   text?: string               // Originaltext als Rückfall
 * }} TickerEvent */

/** @typedef {{ sourceId: string, tickerId: string, url: string }} TickerRef */
/** @typedef {{ events: TickerEvent[], state: GameState, score?: Score, fetchedAt: string }} TickerSnapshot */

/** @typedef {{ rank: number, team: Team, played: number, won: number, drawn: number, lost: number,
 *              goalsFor: number, goalsAgainst: number, points: string }} StandingRow */  // "14:4"
```

**Lokale Speicherung:**

| Schlüssel | Inhalt |
|---|---|
| `settings` | gewählte Staffeln, Lieblingsmannschaft, Intervall, Wake-Lock-Schalter |
| `cache:league:<id>:games` | letzte Spielliste + `fetchedAt` |
| `cache:league:<id>:standings` | letzte Tabelle |
| `cache:game:<id>:ticker` | letzter Ticker-Snapshot (nach 7 Tagen automatisch löschen) |

---

## 8. Bedienung auf dem iPhone

1. Webseite in Safari öffnen.
2. **Teilen → „Zum Home-Bildschirm“**. Danach startet die Seite mit eigenem Symbol im Vollbild wie eine App.
3. Beim ersten Start die Staffel wählen; danach öffnet sich direkt die Spielübersicht.

Hinweis für Variante P2: Das Handy muss im selben WLAN wie der Rechner sein. Die Adresse lautet dann z. B. `http://<IP-des-Rechners>:8080`. Ohne HTTPS funktionieren Service Worker und „Bildschirm wach halten“ in Safari nicht (außer bei `localhost`). Für den vollen Funktionsumfang ist daher Variante P1 oder ein lokales Zertifikat nötig.

---

## 9. Rechtliches (vor Entwicklungsbeginn klären)

1. **Nutzungsbedingungen der Quellseiten** prüfen. Viele Portale untersagen automatisiertes Auslesen. Idealerweise eine Erlaubnis beim Verband bzw. Betreiber einholen; manche bieten offizielle Schnittstellen oder Widgets an.
2. **Privat oder öffentlich?** Eine Seite nur für den Eigengebrauch oder die Familie ist weniger kritisch. Ist sie öffentlich erreichbar (Variante P1), gelten Impressumspflicht, Datenschutzerklärung und das Datenbankrecht an den Ergebnissen (§§ 87a ff. UrhG) stärker. Empfehlung: Bei P1 die Seite nicht öffentlich verlinken oder mit einem einfachen Zugangsschutz versehen (z. B. Cloudflare Access oder ein geheimer Pfad).
3. **Jugendspieler sind minderjährig:** Spielernamen standardmäßig **ausblenden** (nur Trikotnummer), sofern nicht ausdrücklich gewünscht und erlaubt.
4. **Vereinslogos** nur mit Erlaubnis; sonst Platzhalter mit Initialen.
5. **Quellenangabe** mit Link auf jeder Ansicht.

---

## 10. Qualitätssicherung

| Bereich | Maßnahme |
|---|---|
| Adapter | Unit-Tests gegen gespeicherte Beispielseiten (vor, während, Halbzeit, nach dem Spiel, abgesagt, ohne Ticker, Sonderzeichen/Umlaute). |
| Merger | Tests für Zuordnung (eindeutig, ähnliche Namen, zwei Mannschaften eines Vereins, verlegtes Spiel) und Konfliktregeln. |
| Oberfläche | Playwright mit WebKit im iPhone-Profil: Einrichtung, Spielliste, Ticker, Hell/Dunkel. |
| Demo-Modus | `?demo=1` spielt ein aufgezeichnetes Spiel im Zeitraffer ab, damit sich Live-Funktionen ohne echtes Spiel testen lassen. |
| Proxy | Test: Nicht erlaubter Host → 403; Zeitüberschreitung → 504; Zwischenspeicher wirkt. |
| Praxistest | Mindestens zwei echte Spieltage auf einem iPhone. |

---

## 11. Abnahmekriterien

1. Die Seite lässt sich auf dem iPhone zum Home-Bildschirm hinzufügen und startet im Vollbild.
2. Die Staffel ist in unter 1 Minute ohne Anleitung gewählt.
3. Ein neues Tor erscheint spätestens **30 s** nach Erscheinen auf der Quellseite (Seite geöffnet).
4. Spielplan und Tabelle stimmen mit Quelle B überein (Stichprobe von 3 Spieltagen).
5. Nach Spielende wird das Ergebnis aus Quelle B angezeigt.
6. Im Flugmodus werden die zuletzt geladenen Daten mit Offline-Hinweis angezeigt.
7. Ist die Seite im Hintergrund, finden keine Abrufe statt.
8. Der Proxy lehnt Anfragen an nicht erlaubte Hosts ab.

---

## 12. Umsetzungsplan

| Phase | Inhalt | Ergebnis |
|---|---|---|
| **0 – Klärung** (2–3 Tage) | Quellen festlegen, Nutzungsbedingungen prüfen, im Browser unter *Entwicklertools → Netzwerk* untersuchen: JSON-Schnittstelle vorhanden? CORS erlaubt? Inhalte per JavaScript erzeugt? Beispielseiten speichern. Proxy-Variante wählen. | Entscheidung zu Quellen und Proxy |
| **1 – Proxy + Adapter** (1 Woche) | Proxy, Adapter A und B, Merger, Tests | Getestete Datenschicht |
| **2 – Oberfläche** (1–2 Wochen) | Einrichtung, Spielliste, Spieldetail, Tabelle, Aktualisierung, lokaler Speicher, Demo-Modus | Nutzbare Seite |
| **3 – PWA + Feinschliff** (3–5 Tage) | Manifest, Symbole, Service Worker, Wake Lock, Dunkelmodus, Praxistest | Fertige Version 1.0 |

**Voraussetzungen:** ein beliebiger Rechner (Windows, macOS oder Linux) mit Code-Editor und Node.js. Bei Variante P1 zusätzlich ein kostenloses Konto bei einem Hosting-Anbieter, bei P2 ein Rechner, der im Heimnetz läuft. Ein Mac oder Apple-Developer-Account ist **nicht** nötig.

---

## 13. Offene Punkte

1. **URL von Quelle A** (Beispiel-Ticker eines Spiels).
2. **URL von Quelle B** (Seite der gewünschten Staffel).
3. **Welche Jugend und Klasse** zuerst (z. B. „männliche C-Jugend, Bezirksliga XY, 2026/27“)? Reicht eine fest eingetragene Staffel, oder soll eine Auswahl über alle Staffeln möglich sein?
4. **Proxy-Variante:** P1 (unterwegs nutzbar) oder P2 (nur im Heim-WLAN)?
5. Nur für den **Eigengebrauch** oder auch für andere Eltern bzw. den Verein?
6. Sollen **Spielernamen** angezeigt werden?

---

## Anhang A: Checkliste zur Analyse einer Quellseite

- [ ] URL-Schema für Staffel / Spiel / Ticker (welche Teile sind IDs?)
- [ ] Stehen die Inhalte im HTML oder werden sie per JavaScript nachgeladen?
- [ ] JSON-Anfragen im Netzwerk-Tab? Endpunkt, Parameter, Format
- [ ] Sendet die Quelle `Access-Control-Allow-Origin`? (→ Proxy ggf. unnötig)
- [ ] Darstellung der Status (geplant/live/beendet)
- [ ] Eigenes Aktualisierungsintervall der Seite
- [ ] Zeitzone, Zeichenkodierung (UTF-8 / ISO-8859-1)
- [ ] `robots.txt` und Nutzungsbedingungen geprüft, Ergebnis notiert
- [ ] Mindestens 5 Beispielseiten gespeichert

## Anhang B: Bildschirmübersicht (Hochformat iPhone)

```
┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│ mB-Jugend · BOL St. 2 ▾ │   │ ‹ Zurück   ☀ wach  ↗ Web│   │ Tabelle                 │
│ [Spiele] [Tabelle]   ⟳  │   │  HSG Muster   TV Beisp. │   │ 1 HSG Muster   9  16:2  │
│ ● LIVE                  │   │     14   :   12         │   │ 2 TV Beispiel  9  14:4  │
│ HSG Muster  14:12  38'  │   │  2. HZ · 38:12 (HZ 7:6) │   │ 3 SG Nord      8  10:6  │
│ SG Nord      9:11  31'  │   │ ─────────────────────── │   │ …                       │
│ Sa, 22.11.              │   │ 38' ● Tor Muster  14:12 │   │                         │
│ JSG Süd – TV Ost  16:00 │   │ 37' ⏱ 2 Min. Beispiel   │   │ (vorläufig, live)       │
│ …                       │   │ 36' ● Tor Beisp.  13:12 │   │                         │
│ Aktualisiert vor 8 s    │   │ …                       │   │                         │
└─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘
     Spielübersicht                 Spieldetail / Ticker              Tabelle
```
