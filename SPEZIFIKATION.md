# Spezifikation: Handball-Liveticker als Web-App für das iPhone

| | |
|---|---|
| **Arbeitstitel** | Neckartenzlingen Live (Name noch offen) |
| **Art** | Statische Webseite, optimiert für Safari auf dem iPhone, zum Home-Bildschirm hinzufügbar |
| **Erste Mannschaft** | TSV Neckartenzlingen, gemischte D-Jugend |
| **Datenquelle** | Handball4All-Liveticker (`spo.handball4all.de`) |
| **Version des Dokuments** | 3.0 (ersetzt 2.0; Quelle analysiert am 21.11.2026) |

---

## 1. Ziel

Eine **einzelne Webseite**, die in Safari auf dem iPhone läuft und den **Liveticker eines Spiels der gemischten D-Jugend des TSV Neckartenzlingen** übersichtlich anzeigt: großer Spielstand, Spielzeit, Halbzeit und Spielverlauf. Die Seite enthält keine Werbung, kann wie eine App vom Home-Bildschirm gestartet werden und speichert alles **lokal auf dem Handy**.

Es gibt **keinen eigenen Server, keinen Proxy und keine App**. Die Seite besteht nur aus statischen Dateien und ruft die Daten direkt vom Handy aus bei Handball4All ab (siehe Kapitel 3).

---

## 2. Ausgangslage: Ergebnis der Quellenanalyse

Analysiert wurde der Ticker-Link des Spiels vom 21.11.2026:

`https://spo.handball4all.de/service/ticker/index.html?token=539bfbddabe9671f0692bb3e87420e80`

**TSV Neckartenzlingen – SG Hegensberg-Liebersbronn**, 14:00 Uhr, Richard-Hirschmann-Halle, Neckartenzlingen (H4A-Spiel-ID `9611841`).

### 2.1 Was die Ticker-Seite technisch macht

- Die Seite `index.html` ist nur eine leere Hülle mit viel Werbung. Den Inhalt erzeugt JavaScript.
- Die Daten kommen aus einer **JSON-Schnittstelle**:
  `https://spo.handball4all.de/service/if_ticker_data.php?token=<TOKEN>&cmd=<BEFEHL>`
- Die Schnittstelle sendet **`Access-Control-Allow-Origin: *`**. Damit darf jede Webseite sie direkt aus dem Browser abfragen, und **es wird kein Proxy gebraucht**.
- Die Originalseite fragt per `POST` ab; `GET` funktioniert ebenfalls. Die Originalseite aktualisiert alle **15 Sekunden**, insgesamt 10-mal, und fordert danach zum Neuladen auf.

### 2.2 Befehle (`cmd`)

| Befehl | Inhalt | Wird genutzt? |
|---|---|---|
| `getGameInfo` | Spielkopf: Mannschaften, Anwurf, Halle, Spiel-ID | **Ja** |
| `getAllTickerMessages` | Alle Ereignisse des Spiels mit Spielzeit und Spielstand | **Ja** |
| `getAllGameInfo` | Mannschaftsaufstellungen mit **Vor- und Nachnamen der Kinder** und Schiedsrichter | **Nein** (Datenschutz, siehe Kapitel 8) |

### 2.3 Antwortformate (Originalbeispiele)

**`getGameInfo`**

```json
{
  "class_lname": "Neckartenzlingen",
  "home_lname": "TSV Neckartenzlingen",
  "guest_lname": "SG Hegensberg-Liebersbronn",
  "datetime": "2026-11-21 14:00:00",
  "gym_name": "Richard-Hirschmann-Halle",
  "gym_town": "Neckartenzlingen",
  "report": { "refereeA": { "name": null, "prename": null }, "refereeB": { "...": null } },
  "id": "9611841",
  "status": 0,
  "status_descripion": "OK"
}
```

- `datetime` ist Ortszeit (Europe/Berlin) und hat keine Zeitzonenangabe.
- `class_lname` enthält hier **nicht** den Liganamen; das Feld wird nicht angezeigt.
- Der Feldname ist in der Quelle falsch geschrieben (`status_descripion`) und muss genau so ausgelesen werden.

**`getAllTickerMessages`**: ein Array, chronologisch, ältestes Ereignis zuerst:

```json
[
  { "game_time": "0",    "home_score": "0",  "guest_score": "0",  "message": "Spielzeit gestartet", "stops_time": false, "status": 0, "status_descripion": "OK" },
  { "game_time": "15",   "home_score": "1",  "guest_score": "0",  "message": "Tor für die Heimmannschaft durch die Nummer 11", "stops_time": false, "...": "" },
  { "game_time": "400",  "home_score": "4",  "guest_score": "1",  "message": "Mannschafts-Auszeit der Heimmannschaft", "stops_time": true, "...": "" },
  { "game_time": "1200", "home_score": "12", "guest_score": "12", "message": "Spielstand 1. Halbzeit", "stops_time": false, "...": "" }
]
```

- Alle Zahlen kommen als **Text** (`"15"`) und müssen in Zahlen umgewandelt werden.
- `game_time` ist die **Spielzeit in Sekunden** seit Anpfiff, durchgehend über beide Halbzeiten (1200 s = 20:00 = Ende der 1. Halbzeit).
- `home_score`/`guest_score` sind der Stand **nach** dem Ereignis.
- `stops_time: true` bedeutet, dass die Uhr nach diesem Ereignis steht.
- Mehrere Ereignisse können dieselbe `game_time` haben (z. B. Uhr gestoppt → Auszeit → Tor → Uhr gestartet).

**Fehlerfälle**

| Fall | Antwort |
|---|---|
| Ungültiger oder unbekannter Token, `getGameInfo` | `{"status":3,"status_descripion":"No ticker data"}` |
| Ungültiger oder unbekannter Token, `getAllTickerMessages` | `[]` |
| Spiel noch nicht begonnen | vermutlich `[]` (**prüfen**) |

### 2.4 Beobachtete Ereignistexte

Die Texte sind fest formuliert und lassen sich mit regulären Ausdrücken zuverlässig auswerten:

| Text in der Quelle | Ereignistyp | Ausgewertete Angaben |
|---|---|---|
| `Spielzeit gestartet` | `clockStart` | – |
| `Spielzeit gestoppt` | `clockStop` | – |
| `Tor für die Heimmannschaft durch die Nummer 11` | `goal` | Seite, Nummer |
| `Erfolgreicher 7m-Wurf für die Heimmannschaft durch die Nummer 19` | `penaltyGoal` | Seite, Nummer |
| `7m-Wurf … ` (nicht verwandelt; Text laut Originalcode, noch nicht beobachtet) | `penaltyMissed` | Seite, Nummer |
| `Verwarnung für die Nummer 29 der Gastmannschaft` | `warning` (Gelbe Karte) | Seite, Nummer |
| `2-min Strafe für die Nummer 27 der Gastmannschaft` | `suspension` | Seite, Nummer |
| `Disqualifikation …` / `Disqualifikation mit Bericht …` (laut Originalcode) | `disqualification` | Seite, Nummer |
| `Mannschafts-Auszeit der Heimmannschaft` | `timeout` | Seite |
| `Spielstand 1. Halbzeit` | `halftime` | – |
| `Spielstand 2. Halbzeit` (**vermutet**, bei Spielende prüfen) | `fullTime` | – |
| alles andere | `other` | Originaltext anzeigen |

„Heimmannschaft“ oder „Gastmannschaft“ im Text legt die Seite fest. Die Nummer ist eine Zahl oder bei Offiziellen ein Buchstabe (A, B, C …).

### 2.5 Spielplan und Tabelle (frühere „Quelle B“)

- Die frühere Handball4All-Ergebnisseite (`spo.handball4all.de/Spielbetrieb`) **leitet inzwischen auf handball.net weiter**.
- **handball.net** lehnt automatisierte Abrufe ab (HTTP 403 durch den Schutzdienst; die frühere Daten-Schnittstelle `/a/sportdata/…` antwortet mit „410 Gone“). Ohne CORS-Freigabe könnte ein Browser die Seite ohnehin nicht auslesen.
- **Folge:** Spielplan und Tabelle werden in Version 1 **nicht** automatisch geladen. Die Web-App verlinkt dafür auf die Vereins- bzw. Mannschaftsseite bei handball.net. Eine automatische Anbindung kommt nur mit Erlaubnis oder einer offiziellen Schnittstelle in Frage (siehe Kapitel 13).

---

## 3. Architektur

```
iPhone (Safari / Home-Bildschirm)
┌──────────────────────────────────────────┐
│  Statische Web-App (HTML/CSS/JS)         │
│  ┌────────┐  ┌──────────┐  ┌───────────┐ │
│  │ UI     │◄─┤ Auswerter│◄─┤ H4A-Client│─┼──► spo.handball4all.de
│  └────────┘  │ (Parser) │  │ (fetch)   │ │    /service/if_ticker_data.php
│              └──────────┘  └───────────┘ │    (CORS: *)
│  localStorage  ·  Service Worker         │
└──────────────────────────────────────────┘
```

- **Hosting:** beliebiger Anbieter für statische Dateien, z. B. **GitHub Pages** direkt aus diesem Repository, Cloudflare Pages oder Netlify. HTTPS ist Pflicht, damit Service Worker und „Bildschirm wach halten“ in Safari funktionieren.
- **Kein Build-Schritt nötig:** reines HTML, CSS und JavaScript (ES-Module). Keine Frameworks, keine externen Schriftarten, kein Tracking.
- **Gesamtgröße** der Seite unter 100 KB.

### 3.1 Dateien

```
/
├─ index.html
├─ manifest.webmanifest
├─ sw.js                     Service Worker (Offline-Hülle)
├─ config.js                 Lieblingsverein, Halbzeitlänge, Intervalle, Links
├─ icons/apple-touch-icon.png (180×180), icon-512.png
├─ src/
│  ├─ main.js                Start, Routing, Polling-Steuerung
│  ├─ h4a.js                 Abruf der Schnittstelle
│  ├─ parse.js               Auswertung der Ereignistexte → Datenmodell
│  ├─ clock.js               Spielzeit-Berechnung und laufende Uhr
│  ├─ store.js               localStorage (Spiele, Einstellungen, Cache)
│  └─ view.js                Darstellung
├─ styles/app.css
└─ tests/
   ├─ fixtures/              echte Antworten (ohne Personendaten)
   └─ parse.test.js, clock.test.js
```

### 3.2 Konfiguration (`config.js`)

```js
export const config = {
  favoriteClub: "TSV Neckartenzlingen",  // wird hervorgehoben, Heim/Gast-Erkennung
  teamLabel: "gemischte D-Jugend",
  halfLengthMin: 20,                      // D-Jugend: 2 × 20 min (am 21.11.2026 bestätigt: Halbzeit bei 1200 s)
  pollIntervalSec: 15,
  apiBase: "https://spo.handball4all.de/service/if_ticker_data.php",
  scheduleUrl: "",                        // Link zur Mannschaftsseite auf handball.net (vom Nutzer einzutragen)
};
```

---

## 4. Funktionale Anforderungen

Die Prioritäten: **MUSS** gehört zu Version 1, **SOLL** ist für später geplant, **KANN** ist optional.

### 4.1 Spiel hinzufügen

Jedes Spiel hat einen eigenen **Token**. Er steht im Ticker-Link, den der Verein oder handball.net für das Spiel bereitstellt.

| ID | Anforderung | Prio |
|---|---|---|
| F-01 | Ein Eingabefeld „Ticker-Link einfügen“ nimmt den kompletten Link entgegen. Der Token (32 Hex-Zeichen) wird daraus gelesen. Ein nackter Token wird ebenfalls akzeptiert. | MUSS |
| F-02 | Aufruf mit `…/index.html?token=<TOKEN>` öffnet das Spiel direkt. So kann man **im Original-Link einfach den Anfang austauschen** oder ein Lesezeichen anlegen. | MUSS |
| F-03 | Nach dem Einfügen wird `getGameInfo` abgefragt. Bei `status ≠ 0` erscheint die Meldung „Für diesen Link gibt es (noch) keine Tickerdaten“, und der Token wird trotzdem gespeichert, weil der Ticker meist erst kurz vor Anpfiff startet. | MUSS |
| F-04 | Gespeicherte Spiele erscheinen als Liste (neuestes zuerst) mit Datum, Gegner und Endstand. Spiele lassen sich per Wischen löschen. Spiele, die älter als 60 Tage sind, werden automatisch entfernt. | MUSS |
| F-05 | Einfügen aus der Zwischenablage per Knopf („Link aus Zwischenablage“). | SOLL |

### 4.2 Spielansicht (Kernfunktion)

| ID | Anforderung | Prio |
|---|---|---|
| F-10 | Kopfbereich: Heim- und Gastmannschaft, **sehr großer Spielstand** (mindestens 64 pt), Spielzeit `mm:ss`, Phase (*vor dem Spiel*, *1. HZ*, *Halbzeit*, *2. HZ*, *beendet*), Halbzeitstand. | MUSS |
| F-11 | Ist der TSV Neckartenzlingen beteiligt, wird er farbig hervorgehoben. Der Spielstand wird aus Sicht des Vereins gefärbt (vorn = grün, hinten = rot, unentschieden = neutral). | MUSS |
| F-12 | **Laufende Uhr:** Ist das letzte Uhr-Ereignis `clockStart`, zählt die Uhr zwischen zwei Abrufen lokal weiter (Zeit seit dem letzten Abruf addieren, höchstens bis zum Halbzeitende). Bei `clockStop`, Auszeit oder Halbzeit bleibt sie stehen. Eine stehende Uhr wird blass mit „⏸“ angezeigt. | MUSS |
| F-13 | Ereignisliste, das neueste oben. Je Zeile: Spielzeit, Symbol, Seite (Heim/Gast farblich), Text, Spielstand nach dem Ereignis. „Spielzeit gestartet/gestoppt“ ist standardmäßig ausgeblendet (Schalter „Alle Ereignisse“). | MUSS |
| F-14 | Trennzeile „Halbzeit 12 : 12“ zwischen den Halbzeiten. | MUSS |
| F-15 | Spielernummern werden angezeigt („Tor durch Nr. 11“). **Namen werden nicht angezeigt** (siehe Kapitel 8). | MUSS |
| F-16 | Neue Ereignisse seit dem letzten Abruf werden für 5 s hervorgehoben. Bei einem Tor der Lieblingsmannschaft vibriert das Gerät kurz, sofern unterstützt (abschaltbar). | SOLL |
| F-17 | Statistik je Mannschaft: Tore, 7-Meter (verwandelt/gesamt), Verwarnungen, 2-Minuten-Strafen, Auszeiten. Zusätzlich eine Torschützenliste nach Nummer. | SOLL |
| F-18 | Kleine Verlaufsgrafik (Tordifferenz über die Spielzeit) als SVG. | KANN |
| F-19 | Links „Original-Ticker öffnen“ und „Spielplan & Tabelle (handball.net)“ (falls `scheduleUrl` gesetzt) als Quellenangabe. | MUSS |
| F-20 | Schalter **„Bildschirm an lassen“** (Screen Wake Lock API), während das Spiel läuft. | SOLL |
| F-21 | Knopf „Teilen“ (Web Share API): Er teilt den Link zur Spielansicht, z. B. in die Eltern-WhatsApp-Gruppe. | SOLL |

### 4.3 Aktualisierung

| ID | Anforderung | Prio |
|---|---|---|
| F-30 | Spiel läuft und die Seite ist sichtbar: `getAllTickerMessages` alle **15 s** abfragen, genau wie das Original. | MUSS |
| F-31 | Vor dem Spiel: bis 30 min vor Anwurf alle 5 min abfragen, danach alle 30 s. | MUSS |
| F-32 | Spiel beendet (siehe 5.3): keine automatischen Abrufe mehr. Endstand und Ereignisse werden lokal gespeichert. | MUSS |
| F-33 | Ist die Seite nicht sichtbar (anderer Tab, Bildschirm aus), wird **nicht** abgefragt (`visibilitychange`). Beim Zurückkehren wird sofort aktualisiert. | MUSS |
| F-34 | Anzeige „Aktualisiert vor 8 s“. Ab 60 s ohne erfolgreichen Abruf erscheint ein gelber Hinweis „Verbindung prüfen“. | MUSS |
| F-35 | Bei Netzwerkfehlern wird schrittweise länger gewartet (15 → 30 → 60 → 120 s). Nach dem ersten Erfolg gilt wieder der normale Takt. | MUSS |
| F-36 | Gibt es im laufenden Spiel 20 min keine neue Meldung, wird nur noch alle 2 min abgefragt (der Ticker wurde vermutlich nicht weitergeführt). | SOLL |

### 4.4 Offline

| ID | Anforderung | Prio |
|---|---|---|
| F-40 | Die Seite selbst lädt auch ohne Netz (Service Worker cacht die App-Dateien). Die API-Antworten werden **nicht** vom Service Worker gecacht, sondern in `localStorage` gespeichert. | MUSS |
| F-41 | Ohne Netz werden die zuletzt gespeicherten Daten mit dem Hinweis „Offline – Stand 14:32 Uhr“ angezeigt. | MUSS |

### 4.5 Bewusst nicht enthalten (Version 1)

- Automatischer Spielplan und automatische Tabelle (siehe 2.5)
- Push-Mitteilungen, Live Activity und Widgets: Dafür bräuchte man einen Server bzw. eine native App.
- Spielernamen aus `getAllGameInfo`

---

## 5. Auswertungslogik

### 5.1 Datenmodell

```js
/** @typedef {{ token: string, gameId: string, home: string, away: string,
 *              kickoff: string,      // "2026-11-21T14:00:00" (Ortszeit)
 *              venue: string, addedAt: string }} SavedGame */

/** @typedef {"clockStart"|"clockStop"|"goal"|"penaltyGoal"|"penaltyMissed"|"warning"|
 *            "suspension"|"disqualification"|"timeout"|"halftime"|"fullTime"|"other"} EventType */

/** @typedef {{
 *   seq: number,                 // Position im Array = stabile ID (Quelle hängt nur hinten an)
 *   t: number,                   // game_time in Sekunden
 *   type: EventType,
 *   side: "home"|"away"|null,
 *   number: string|null,         // "11", "A"
 *   home: number, away: number,  // Stand nach dem Ereignis
 *   stopsTime: boolean,
 *   raw: string                  // Originaltext
 * }} TickerEvent */

/** @typedef {{
 *   phase: "pre"|"first"|"halftime"|"second"|"finished",
 *   clockSec: number, clockRunning: boolean,
 *   score: {home:number, away:number}, halftime: {home:number, away:number}|null,
 *   events: TickerEvent[], fetchedAt: number
 * }} GameState */
```

### 5.2 Erkennungsregeln (in `parse.js`)

```js
const SIDE = { Heimmannschaft: "home", Gastmannschaft: "away" };
const RULES = [
  [/^Spielzeit gestartet/,                                   "clockStart"],
  [/^Spielzeit gestoppt/,                                    "clockStop"],
  [/^Erfolgreicher 7m-Wurf für die (\w+) durch die Nummer (\S+)/, "penaltyGoal"],
  [/^7m-Wurf .*?(Heimmannschaft|Gastmannschaft).*?Nummer (\S+)/,  "penaltyMissed"],
  [/^Tor für die (\w+) durch die Nummer (\S+)/,             "goal"],
  [/^Verwarnung für die Nummer (\S+) der (\w+)/,            "warning"],
  [/^2-min Strafe für die Nummer (\S+) der (\w+)/,          "suspension"],
  [/^Disqualifikation.*?Nummer (\S+) der (\w+)/,            "disqualification"],
  [/^Mannschafts-Auszeit der (\w+)/,                        "timeout"],
  [/^Spielstand 1\. Halbzeit/,                              "halftime"],
  [/^Spielstand 2\. Halbzeit|^Spielende/,                   "fullTime"],
];
// Reihenfolge der Gruppen (Seite/Nummer) unterscheidet sich je Regel → pro Regel festlegen.
// Unbekannte Texte → type "other", raw anzeigen, in der Konsole protokollieren.
```

### 5.3 Spielphase und Uhr

- **pre:** keine Ereignisse.
- **first:** Ereignisse vorhanden, noch kein `halftime`.
- **halftime:** letztes Spielereignis ist `halftime`, oder `t ≥ halfLength` und die Uhr steht.
- **second:** nach `halftime` wieder `clockStart`.
- **finished:** `fullTime`-Ereignis vorhanden **oder** `t ≥ 2 × halfLength` und Uhr gestoppt **oder** mehr als 2 h seit Anwurf ohne neue Meldung.
- **Spielstand:** `home_score`/`guest_score` des **letzten** Ereignisses.
- **Halbzeitstand:** Stand des `halftime`-Ereignisses.
- **Uhr:** `t` des letzten Ereignisses. Läuft die Uhr (letztes Uhr-Ereignis `clockStart`, `stops_time` des letzten Ereignisses `false`), kommt `(jetzt − fetchedAt)` hinzu, begrenzt auf das Ende der laufenden Halbzeit.
- **Plausibilität:** Spielstände dürfen nicht sinken, `t` darf nicht sinken. Bei einem Verstoß das Ereignis trotzdem anzeigen, aber für Stand und Uhr das letzte plausible Ereignis verwenden.

---

## 6. Oberfläche

```
┌───────────────────────────────┐   ┌───────────────────────────────┐
│ ‹ Spiele        ☀ an   ⤴ Teilen│   │ Neckartenzlingen Live    ＋   │
│                               │   │ ┌───────────────────────────┐ │
│ TSV Neckar-      SG Hegens-   │   │ │ Ticker-Link einfügen…     │ │
│ tenzlingen       berg-Liebers.│   │ └───────────────────────────┘ │
│                               │   │  [Link aus Zwischenablage]    │
│        19  :  15              │   │                               │
│     ● 2. HZ  30:29            │   │ ● LIVE  Sa 21.11. 14:00       │
│     Halbzeit 12 : 12          │   │   TSV – SG Hegensberg  19:15  │
│  Aktualisiert vor 6 s         │   │                               │
│ ───────────────────────────── │   │   Sa 14.11. 11:00             │
│ 30:29 ● Tor Nr. 2      19:15  │   │   TV X – TSV          17:21   │
│ 29:40 ● Tor Nr. 18     18:15  │   │ …                             │
│ 23:56 ◎ 7m-Tor Nr. 19  15:13  │   │                               │
│ 22:05 ⏱ 2 Min. Nr. 27 (Gast)  │   │ Spielplan & Tabelle ↗         │
│ ── Halbzeit 12 : 12 ───────── │   │                               │
│ …                             │   │                               │
│ Original-Ticker ↗             │   │                               │
└───────────────────────────────┘   └───────────────────────────────┘
        Spielansicht                        Startseite / Spiele
```

- Hell- und Dunkelmodus nach Systemeinstellung, Schrift skaliert mit, Tippflächen mindestens 44 pt.
- Die Safe Areas (Notch/Dynamic Island) werden berücksichtigt: `viewport-fit=cover` und `env(safe-area-inset-*)`.
- `manifest.webmanifest` mit `display: "standalone"`, Name, Symbol und Farbe. Zusätzlich `apple-mobile-web-app-capable` und `apple-touch-icon`.

---

## 7. Nicht-funktionale Anforderungen

| ID | Anforderung |
|---|---|
| NF-01 | Safari ab iOS 17; funktioniert zusätzlich in aktuellen Desktop-Browsern. |
| NF-02 | Erste Anzeige (aus dem Cache) < 1 s, Seite < 100 KB, keine externen Abhängigkeiten. |
| NF-03 | **Schonender Umgang mit der Quelle:** höchstens 1 Anfrage pro 15 s und Gerät, nur bei sichtbarer Seite, kein Abruf nach Spielende. Es wird nur `getGameInfo` (einmal) und `getAllTickerMessages` genutzt. |
| NF-04 | **Sicherheit:** Texte aus der Quelle nur über `textContent` einfügen, nie als HTML. Content-Security-Policy: `default-src 'self'; connect-src https://spo.handball4all.de`. |
| NF-05 | **Datenschutz:** keine Cookies, kein Tracking, keine Analyse-Dienste. `localStorage` enthält nur Tokens, Spielköpfe, Ereignisse und Einstellungen. |
| NF-06 | Fehler in der Auswertung dürfen die Seite nie zum Absturz bringen. Unbekannte Ereignisse werden im Rohtext angezeigt. |

---

## 8. Datenschutz und Rechtliches

1. **Minderjährige:** Die Schnittstelle `getAllGameInfo` liefert die **vollen Namen aller Kinder** beider Mannschaften. Die Web-App ruft sie **nicht** ab und zeigt nur Trikotnummern. Testdaten im Repository enthalten keine Namen.
2. **Nutzung der Schnittstelle:** Die Schnittstelle ist öffentlich und per CORS für alle Webseiten freigegeben, eine ausdrückliche Nutzungserlaubnis liegt aber nicht vor. Für den **privaten Gebrauch** (Familie, Eltern der Mannschaft) ist das Risiko gering. Vor einer **öffentlichen** Verbreitung Handball4All bzw. den HVW um Zustimmung bitten.
3. **Quellenangabe:** Fußzeile „Daten: Handball4All AG“ mit Link zum Original-Ticker.
4. **Keine Logos und keine Verbands- oder Vereinsmarken** ohne Erlaubnis. Das App-Symbol ist neutral, z. B. ein Handball.
5. Wird die Seite öffentlich (z. B. über GitHub Pages), muss sie ein Impressum haben, und ein Hinweis zur Datenverarbeitung ist zu ergänzen. Alternativ die Adresse nur im Elternkreis weitergeben.

---

## 9. Tests

| Bereich | Maßnahme |
|---|---|
| Auswertung | Unit-Tests mit den echten Antworten vom 21.11.2026 (`tests/fixtures/`): Anzahl Tore = Endstand, Halbzeitstand 12:12, Erkennung aller Ereignistypen, Seite und Nummer korrekt. |
| Uhr/Phase | Tests für: Uhr läuft, Uhr gestoppt, mehrere Ereignisse zur selben Sekunde, Halbzeit, Spielende, kein Ereignis. |
| Fehler | Ungültiger Token (`status: 3`, `[]`), Netzwerkfehler, kaputtes JSON, unbekannter Ereignistext. |
| Demo-Modus | `?demo=1` spielt die gespeicherte Partie im Zeitraffer (60× schneller) aus den Fixtures ab, damit sich alles ohne laufendes Spiel testen lässt. |
| Oberfläche | Playwright mit WebKit im Format „iPhone 15“: Link einfügen, Spielansicht, Dunkelmodus. |
| Praxis | Ein echtes Spiel auf dem iPhone verfolgen und mit dem Original-Ticker vergleichen. |

---

## 10. Abnahmekriterien

1. Mit der gespeicherten Antwort `tests/fixtures/game-9611841-messages.json` (Momentaufnahme bei 34:17, 2. Halbzeit) zeigt die Seite „TSV Neckartenzlingen – SG Hegensberg-Liebersbronn“ mit **20 : 18**, Phase „2. HZ“ und Halbzeitstand **12 : 12**. Nach Spielende wird eine zweite Momentaufnahme mit dem Endstand ergänzt.
2. Bei einem laufenden Spiel erscheint ein neues Tor spätestens **20 s** nach dem Original-Ticker.
3. Die Uhr läuft zwischen den Abrufen flüssig weiter und bleibt bei gestoppter Zeit stehen.
4. Die Seite lässt sich zum Home-Bildschirm hinzufügen und startet im Vollbild ohne Safari-Leisten.
5. Im Flugmodus erscheint der zuletzt gespeicherte Stand mit Offline-Hinweis.
6. Im Hintergrund und nach Spielende finden keine Abrufe statt (prüfbar im Web-Inspektor).
7. Es werden keine Spielernamen abgerufen oder angezeigt.

---

## 11. Umsetzungsplan

| Schritt | Inhalt | Aufwand |
|---|---|---|
| 1 | `parse.js` + `clock.js` mit Tests gegen die Fixtures | ½–1 Tag |
| 2 | `h4a.js`, `store.js`, Polling-Steuerung | ½ Tag |
| 3 | Oberfläche: Startseite, Spielansicht, Dunkelmodus | 1 Tag |
| 4 | Manifest, Symbole, Service Worker, Wake Lock, Teilen | ½ Tag |
| 5 | Veröffentlichen per GitHub Pages, Praxistest am nächsten Spieltag | ½ Tag |

**Voraussetzungen:** beliebiger Rechner mit Editor. Für die Tests wird Node.js gebraucht. Kein Mac, kein Apple-Account, kein Server.

---

## 12. Bedienung auf dem iPhone

1. Webseite in Safari öffnen (z. B. `https://<benutzer>.github.io/handball-/`).
2. **Teilen → „Zum Home-Bildschirm“**.
3. Am Spieltag den Ticker-Link des Spiels (vom Verein, aus der WhatsApp-Gruppe oder von handball.net) kopieren und in der App einfügen. Alternativ im Link `https://spo.handball4all.de/service/ticker/index.html?token=…` den vorderen Teil durch die eigene Adresse ersetzen.

---

## 13. Offene Punkte

1. **Spielende-Meldung:** Wie lautet der Text am Spielende („Spielstand 2. Halbzeit“?) Nach dem Spiel vom 21.11.2026 anhand der gespeicherten Antwort prüfen und Regel und Fixture ergänzen.
2. **Woher kommen die Tokens künftiger Spiele?** Wenn handball.net auf der Spielseite einen Ticker-Link zeigt, reicht das Kopieren. Eine automatische Ermittlung ist ohne Zugriff auf handball.net nicht möglich.
3. **Spielplan und Tabelle:** Sollen sie automatisch kommen, wäre der Weg eine Anfrage beim HVW bzw. bei Handball4All nach einer offiziellen Schnittstelle. Bis dahin genügt ein Link (Adresse der Mannschaftsseite auf handball.net nachtragen).
4. **Privat oder öffentlich:** Soll die Seite nur im Elternkreis genutzt werden? Davon hängen Impressum und Erlaubnis ab (Kapitel 8).
5. Bedeutung des Feldes `ticker_update` (Wert 5) in `getAllGameInfo` ist unklar. Es wird nicht benötigt.
