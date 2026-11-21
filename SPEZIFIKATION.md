# Spezifikation: Handball-Liveticker als Web-App für das iPhone

| | |
|---|---|
| **Arbeitstitel** | Neckartenzlingen Live (Name noch offen) |
| **Art** | Statische Webseite, optimiert für Safari auf dem iPhone, zum Home-Bildschirm hinzufügbar |
| **Verein** | TSV Neckartenzlingen (H4A-Verein `260`, Organisation `216` = Baden-Württembergischer Handball-Verband, Bezirk Neckar-Alb) |
| **Hauptmannschaft** | gemischte D-Jugend, Bezirksklasse Staffel 1 (`gD-BK-1-NA`, Staffel-ID `165421`) |
| **Datenquelle** | Handball4All, ausschließlich öffentliche JSON-Schnittstellen auf `spo.handball4all.de` |
| **Version des Dokuments** | 4.0 (ersetzt 3.0; Quellen analysiert am 21.11.2026) |

---

## 1. Ziel

Eine **einzelne Webseite**, die in Safari auf dem iPhone läuft und für den TSV Neckartenzlingen Folgendes übersichtlich anzeigt:

1. **Vereins-Wochenübersicht:** alle Spiele der Woche, vor allem der gemischten D-Jugend, mit Uhrzeit, Halle, Ergebnis und Live-Kennzeichnung.
2. **Liveticker:** Spielstand, Spielzeit und Spielverlauf eines laufenden Spiels. Der Ticker wird **automatisch gefunden**; man muss keinen Link mehr einfügen.
3. **Staffel:** Tabelle und kompletter Spielplan der Staffel.

Die Seite enthält keine Werbung, startet wie eine App vom Home-Bildschirm und speichert alles **lokal auf dem Handy**. Es gibt **keinen eigenen Server, keinen Proxy und keine App aus dem App Store**: Alle Daten kommen direkt vom Handy aus aus öffentlichen Handball4All-Schnittstellen, die Abrufe von fremden Webseiten ausdrücklich erlauben (`Access-Control-Allow-Origin: *`).

---

## 2. Ergebnis der Quellenanalyse

Analysiert wurden:
- die Vereinsübersicht `https://www.handball4all.de/home/portal/baden-wuerttembergischer-hv#/club?ogId=216&cId=260`
- der Ticker `https://spo.handball4all.de/service/ticker/index.html?token=539bfbddabe9671f0692bb3e87420e80` (TSV Neckartenzlingen – SG Hegensberg-Liebersbronn, 21.11.2026)

Beide Webseiten sind nur Hüllen voller Werbung, deren Inhalt JavaScript nachlädt. Die eigentlichen Daten kommen aus zwei JSON-Schnittstellen, die direkt genutzt werden.

### 2.1 Übersicht der Schnittstellen

| # | Zweck | Adresse | Methode |
|---|---|---|---|
| **S1** | Vereins-Wochenübersicht | `https://spo.handball4all.de/service/if_g_json.php?ca=0&cmd=pcu&og=216&c=260[&do=JJJJ-MM-TT]` | GET |
| **S2** | Staffel: aktuelle Woche + Tabelle | `https://spo.handball4all.de/service/if_g_json.php?ca=0&cmd=ps&og=216&cl=165421` | GET |
| **S3** | Staffel: ganze Saison + Tabelle | `https://spo.handball4all.de/service/if_g_json.php?ca=1&cmd=ps&og=216&cl=165421` | GET |
| **T1** | Ticker: Spielkopf | `https://spo.handball4all.de/service/if_ticker_data.php?token=<TOKEN>&cmd=getGameInfo` | POST (GET geht auch) |
| **T2** | Ticker: alle Ereignisse | `https://spo.handball4all.de/service/if_ticker_data.php?token=<TOKEN>&cmd=getAllTickerMessages` | POST (GET geht auch) |

Allgemeine Eigenschaften:
- Alle Schnittstellen senden `Access-Control-Allow-Origin: *`, deshalb wird kein Proxy gebraucht.
- `if_g_json.php` liefert immer ein **Array mit einem Objekt** `[{ header, menu, head, content, footer, error }]`. Bei unzulässigen Parametern kommt stattdessen `{"status":-1,"statusText":"permission denied"}` (z. B. bei `og=8` oder mit dem Parameter `p`). Die Parameter genau wie oben verwenden.
- Leere Werte sind **ein Leerzeichen** (`" "`), nicht `null`. Vor der Auswertung jeden Wert mit `trim()` behandeln; ein leerer Wert bedeutet „nicht vorhanden“.
- Zahlen kommen meist als Text (`"20"`).
- Datum `"21.11.26"`, Uhrzeit `"14:00"`, immer Ortszeit Europe/Berlin.
- `robots.txt` von `spo.handball4all.de` sperrt nur `/misc/`. `/service/` ist erlaubt. Spielberichte unter `/misc/sboPublicReports.php` werden daher **nur verlinkt, nicht abgerufen**.

### 2.2 S1 – Vereins-Wochenübersicht (`cmd=pcu`)

Liefert alle Spiele **aller Mannschaften** des Vereins in einer Spielwoche (Montag–Sonntag).

**`menu.dt.list`**: alle Spielwochen der Saison, zum Blättern:

```json
"dt": { "list": { "2026-11-16": "16.11.-22.11.26", "2026-11-23": "23.11.-29.11.26", "…": "…" },
        "selected": "2026-11-16" }
```

Ohne `do` wird die aktuelle Woche geliefert. Mit `do=2026-11-23` kommt die gewünschte Woche.

**`head`**:

```json
{ "name": "TSV Neckartenzlingen", "headline1": "Wochenübersicht vom 16.11.2026 - 22.11.2026",
  "headline2": "TSV Neckartenzlingen (13) - Hallenrunde 2026/2027",
  "actualized": "Letzte Änderung: Sa, 21.11.2026, 13:39h", "live": 0 }
```

**`content.classes[]`**: eine Staffel je Mannschaft, darin `games[]`:

```json
{
  "gClassID": "165421", "gClassSname": "gD-BK-1-NA",
  "gClassLname": "gemischte D-Jugend Bezirksklasse Staffel 1",
  "gClassAG": "21", "gClassGender": "g", "gClassAGsDesc": "D", "gClassAGsYear": "11",
  "games": [{
    "gID": "9611841", "sGID": 0, "gNo": "310910",
    "live": true, "gToken": "539bfbddabe9671f0692bb3e87420e80",
    "gDate": "21.11.26", "gWDay": "Sa", "gTime": "14:00",
    "gGymnasiumName": "Richard-Hirschmann-Halle", "gGymnasiumTown": "Neckartenzlingen",
    "gGymnasiumStreet": "Auwiesen", "gGymnasiumPostal": "72654",
    "gHomeTeam": "TSV Neckarten.", "gGuestTeam": "SG He-Li",
    "gHomeGoals": "20", "gGuestGoals": "18",
    "gHomeGoals_1": " ", "gGuestGoals_1": " ",
    "gHomePoints": " ", "gGuestPoints": " ",
    "gComment": " "
  }]
}
```

| Feld | Bedeutung |
|---|---|
| `gClassGender` | `m` männlich, `w` weiblich, `g` gemischt |
| `gClassAGsDesc` | Altersklasse: `A`–`F`, bei Erwachsenen `M`/`F` |
| `live` | `true`, solange für das Spiel ein Liveticker läuft |
| **`gToken`** | **Ticker-Token** für T1/T2; nur gefüllt, wenn ein Ticker existiert |
| `gHomeGoals`/`gGuestGoals` | Tore; **während eines Live-Spiels mit dem aktuellen Stand** gefüllt (beobachtet: 20 : 18 während der 2. HZ) |
| `gHomeGoals_1`/`gGuestGoals_1` | Halbzeitstand |
| `gHomePoints`/`gGuestPoints` | Punkte (2/1/0). **Gefüllt = Ergebnis gewertet bzw. Spiel beendet** |
| `sGID` | ≠ 0, wenn ein Spielbericht existiert (Link: `head.repURL + sGID`) |
| `gHomeTeam`/`gGuestTeam` | **Abgekürzte** Namen („TSV Neckarten.“, „SG He-Li“) |

Beobachtung am 21.11.2026: Die Woche enthält 11 Staffeln mit Spielen, darunter wB, wA, wC, wD, gD, gF und Erwachsene.

### 2.3 S2/S3 – Staffel (`cmd=ps`)

`content` enthält:

| Feld | `ca=0` (S2) | `ca=1` (S3) |
|---|---|---|
| `actualGames.games[]` | Spiele der aktuellen Woche und der Woche davor | leer (`[]`) |
| `futureGames.games[]` | Spiele der nächsten Woche | **alle Spiele der Saison** (56 Spiele, 26.09.26 – 20.03.27) |
| `score[]` | Tabelle | Tabelle |
| `scoreComments[]` | Hinweise zur Tabelle (enthält `<br>`!) | dto. |
| `teamsList[]` | Mannschaften mit voller Bezeichnung und `teamID` | dto. |

**Spiele** haben dasselbe Format wie in S1. **Tabellenzeile:**

```json
{ "tabScore": 4, "tabTeamID": "1493331", "tabTeamname": "TSV Neckartenzlingen", "liveTeam": true,
  "numPlayedGames": 6, "numWonGames": 4, "numEqualGames": 0, "numLostGames": 2,
  "numGoalsShot": 150, "numGoalsGot": 138, "pointsPlus": 8, "pointsMinus": 4 }
```

- Die Tabelle enthält **nur gewertete Spiele**. Das laufende Spiel war am 21.11. nicht enthalten (6 Spiele).
- `tabScore` kann bei Punktgleichheit fehlen. Laut `scoreComments` ist die Mannschaft dann platzgleich mit der vorherigen.
- `tabTeamname` ist die **volle** Bezeichnung, die Spiele haben **Kurznamen**.
- `liveTeam`: Bedeutung unklar, wird nicht ausgewertet.

### 2.4 T1/T2 – Liveticker (`if_ticker_data.php`)

**T1 `getGameInfo`:**

```json
{ "home_lname": "TSV Neckartenzlingen", "guest_lname": "SG Hegensberg-Liebersbronn",
  "datetime": "2026-11-21 14:00:00", "gym_name": "Richard-Hirschmann-Halle", "gym_town": "Neckartenzlingen",
  "id": "9611841", "status": 0, "status_descripion": "OK" }
```

Hier stehen die **vollen** Mannschaftsnamen. `id` entspricht `gID` aus S1/S2. Der Feldname ist in der Quelle falsch geschrieben (`status_descripion`). Das Feld `class_lname` enthält nicht den Liganamen und wird ignoriert.

**T2 `getAllTickerMessages`**: Array, ältestes Ereignis zuerst:

```json
[
  { "game_time": "0",    "home_score": "0",  "guest_score": "0",  "message": "Spielzeit gestartet", "stops_time": false },
  { "game_time": "15",   "home_score": "1",  "guest_score": "0",  "message": "Tor für die Heimmannschaft durch die Nummer 11", "stops_time": false },
  { "game_time": "400",  "home_score": "4",  "guest_score": "1",  "message": "Mannschafts-Auszeit der Heimmannschaft", "stops_time": true },
  { "game_time": "1200", "home_score": "12", "guest_score": "12", "message": "Spielstand 1. Halbzeit", "stops_time": false }
]
```

- `game_time` = Spielzeit in **Sekunden**, durchgehend über beide Halbzeiten. D-Jugend: Halbzeit bei 1200 s (2 × 20 min, bestätigt).
- `home_score`/`guest_score` = Stand **nach** dem Ereignis. `stops_time: true` bedeutet, dass die Uhr danach steht.
- Mehrere Ereignisse können dieselbe Sekunde haben.
- Die Originalseite fragt alle **15 s** ab.
- Unbekannter Token: T1 liefert `{"status":3,"status_descripion":"No ticker data"}`, T2 liefert `[]`.
- **Nicht genutzt:** `cmd=getAllGameInfo`. Diese Antwort liefert die **vollen Namen aller Kinder** beider Mannschaften (siehe Kapitel 9).

**Ereignistexte:**

| Text in der Quelle | Typ | Angaben |
|---|---|---|
| `Spielzeit gestartet` / `Spielzeit gestoppt` | `clockStart` / `clockStop` | – |
| `Tor für die Heimmannschaft durch die Nummer 11` | `goal` | Seite, Nummer |
| `Erfolgreicher 7m-Wurf für die Heimmannschaft durch die Nummer 19` | `penaltyGoal` | Seite, Nummer |
| `7m-Wurf …` (nicht verwandelt; laut Originalcode, noch nicht beobachtet) | `penaltyMissed` | Seite, Nummer |
| `Verwarnung für die Nummer 29 der Gastmannschaft` | `warning` | Seite, Nummer |
| `2-min Strafe für die Nummer 27 der Gastmannschaft` | `suspension` | Seite, Nummer |
| `Disqualifikation …` (laut Originalcode) | `disqualification` | Seite, Nummer |
| `Mannschafts-Auszeit der Heimmannschaft` | `timeout` | Seite |
| `Spielstand 1. Halbzeit` | `halftime` | – |
| `Spielstand 2. Halbzeit` (= Spielende, am 21.11.2026 bestätigt) | `fullTime` | – |
| sonstiger Text | `other` | Rohtext |

---

## 3. Architektur

```
iPhone (Safari / Home-Bildschirm)
┌───────────────────────────────────────────────┐
│  Statische Web-App (HTML/CSS/JS, ohne Build)  │
│                                               │
│  Ansichten: Woche · Spiel/Ticker · Staffel    │
│        ▲                                      │
│  Auswertung: parseClub · parseLeague ·        │
│              parseTicker · clock              │
│        ▲                                      │
│  h4a.js (fetch) ──────────────────────────────┼──► spo.handball4all.de
│  store.js (localStorage) · sw.js (Offline)    │      /service/if_g_json.php      (S1–S3)
└───────────────────────────────────────────────┘      /service/if_ticker_data.php (T1–T2)
```

- **Hosting:** statische Dateien, z. B. **GitHub Pages** aus diesem Repository. HTTPS ist Pflicht für Service Worker und Wake Lock.
- **Technik:** reines HTML, CSS und JavaScript (ES-Module), keine Frameworks, keine externen Schriften, kein Tracking. Gesamtgröße < 100 KB.

### 3.1 Dateien

```
/
├─ index.html
├─ manifest.webmanifest
├─ sw.js                    Service Worker (nur App-Dateien)
├─ config.js
├─ icons/
├─ src/
│  ├─ main.js               Start, Routing (#/woche, #/spiel/<gID>, #/staffel/<clID>), Polling
│  ├─ h4a.js                Abrufe S1–S3, T1–T2
│  ├─ parse-club.js         S1 → Week
│  ├─ parse-league.js       S2/S3 → League
│  ├─ parse-ticker.js       T1/T2 → TickerState
│  ├─ clock.js              Spielzeit, laufende Uhr, Phase
│  ├─ store.js              localStorage
│  └─ views/ week.js  game.js  league.js  settings.js
├─ styles/app.css
└─ tests/
   ├─ fixtures/             echte Antworten vom 21.11.2026 (ohne Personennamen)
   └─ *.test.js
```

### 3.2 Konfiguration (`config.js`)

```js
export const config = {
  orgId: 216,                       // Baden-Württembergischer HV
  clubId: 260,                      // TSV Neckartenzlingen
  clubName: "TSV Neckartenzlingen",
  clubShortMatch: /Neckarten/,      // erkennt die eigene Mannschaft in Kurznamen ("TSV Neckarten. 2")
  favoriteClassId: "165421",        // gemischte D-Jugend Bezirksklasse Staffel 1
  halfLengthByAge: { A: 30, B: 25, C: 25, D: 20, E: 20, F: 15 }, // Standard; D am 21.11.2026 bestätigt
  poll: { tickerSec: 15, weekLiveSec: 60, weekGameDaySec: 300 },
  api: {
    g: "https://spo.handball4all.de/service/if_g_json.php",
    ticker: "https://spo.handball4all.de/service/if_ticker_data.php",
  },
};
```

Andere Vereine oder Mannschaften lassen sich nur durch Ändern von `orgId`, `clubId` und `favoriteClassId` nutzen. Die Vereins-ID steht im Portal-Link (`cId=…`).

---

## 4. Funktionale Anforderungen

Die Prioritäten: **MUSS** gehört zu Version 1, **SOLL** ist für später geplant, **KANN** ist optional.

### 4.1 Startseite: Wochenübersicht (Quelle S1)

| ID | Anforderung | Prio |
|---|---|---|
| F-01 | Beim Öffnen wird die **aktuelle Spielwoche** geladen und angezeigt. Titel: „Woche 16.11.–22.11.2026“. | MUSS |
| F-02 | Spiele nach Tag und Uhrzeit sortiert. Je Spiel: Wochentag, Uhrzeit, Mannschaft (Kurzbezeichnung der Staffel, z. B. „gD“), Heim – Gast, Halle mit Ort, Ergebnis bzw. Halbzeitstand. | MUSS |
| F-03 | Laufende Spiele (`live: true`) stehen ganz oben, mit rotem „● LIVE“ und aktuellem Stand. | MUSS |
| F-04 | Ein Filter oben hat die Stufen **„Meine Mannschaft“** (nur `favoriteClassId`, Standard), **„Jugend“** und **„Alle“**. Die Auswahl wird gespeichert. | MUSS |
| F-05 | Pfeile ‹ › und Wischen blättern zur vorigen/nächsten Spielwoche (Liste aus `menu.dt.list`, Abruf mit `do=`). | MUSS |
| F-06 | Spiele mit `gToken` sind antippbar → Liveticker (4.2). Alle anderen Spiele öffnen die Spieldetailansicht ohne Ticker (Stand, Halle mit Link zu Apple Karten, ggf. Link zum Spielbericht). | MUSS |
| F-07 | Die eigene Mannschaft wird im Spiel fett dargestellt. Ein Ergebnis wird aus Vereinssicht als Sieg/Unentschieden/Niederlage eingefärbt (grün/grau/rot). | MUSS |
| F-08 | `gComment` wird angezeigt, falls gefüllt (z. B. „abgesagt“, „verlegt“). | MUSS |
| F-09 | Halle antippen → Apple Karten mit Adresse (`maps://?q=<Straße>, <PLZ> <Ort>`). | SOLL |

### 4.2 Spielansicht mit Liveticker (Quellen T1/T2)

| ID | Anforderung | Prio |
|---|---|---|
| F-10 | Kopfbereich: volle Mannschaftsnamen (aus T1), **sehr großer Spielstand** (≥ 64 pt), Spielzeit `mm:ss`, Phase (*vor dem Spiel*, *1. HZ*, *Halbzeit*, *2. HZ*, *beendet*), Halbzeitstand. | MUSS |
| F-11 | **Laufende Uhr:** Ist die Uhr laut letztem Uhr-Ereignis gestartet, zählt sie zwischen den Abrufen lokal weiter, höchstens bis zum Halbzeitende. Bei gestoppter Uhr steht sie und wird mit „⏸“ angezeigt. | MUSS |
| F-12 | Ereignisliste, neuestes oben: Spielzeit, Symbol, Seite (farbig), Text, Stand danach. „Spielzeit gestartet/gestoppt“ ist ausgeblendet (Schalter „Alle Ereignisse“). Eine Trennzeile zeigt den Halbzeitstand. | MUSS |
| F-13 | Es werden **nur Trikotnummern** angezeigt („Tor durch Nr. 11“), keine Namen. | MUSS |
| F-14 | Neue Ereignisse werden 5 s hervorgehoben. Bei einem Tor der eigenen Mannschaft gibt es eine kurze Vibration, sofern unterstützt. | SOLL |
| F-15 | Statistik je Mannschaft: Tore, 7-Meter (verwandelt/gesamt), Verwarnungen, Zeitstrafen, Auszeiten. Dazu Tore je Trikotnummer. | SOLL |
| F-16 | Verlaufsgrafik der Tordifferenz (SVG). | KANN |
| F-17 | Schalter „Bildschirm an lassen“ (Screen Wake Lock API). | SOLL |
| F-18 | „Teilen“ (Web Share API) teilt den Link `…/#/spiel/<gID>`. | SOLL |
| F-19 | Link „Original-Ticker“ als Quellenangabe. | MUSS |
| F-20 | Zusätzlich direkter Aufruf mit `?token=<TOKEN>` (z. B. Link aus der Eltern-Gruppe) und manuelles Einfügen eines Ticker-Links als Rückfall. | SOLL |

### 4.3 Staffelansicht (Quellen S2/S3)

| ID | Anforderung | Prio |
|---|---|---|
| F-30 | **Tabelle:** Platz, Mannschaft (volle Bezeichnung), Spiele, S/U/N, Tore, Differenz, Punkte (`8:4`). Eigene Mannschaft hervorgehoben. `scoreComments` als Fußnote (HTML-Tags entfernen, `<br>` → Zeilenumbruch). | MUSS |
| F-31 | **Spielplan** der ganzen Saison (S3), gruppiert nach Monat. Ein Schalter wählt „nur meine Mannschaft“ oder „alle Spiele“. Gespielte Spiele mit Ergebnis, kommende mit Termin. Die Ansicht springt automatisch zum nächsten Spiel. | MUSS |
| F-32 | Die Staffelansicht ist von der Wochenübersicht aus über den Staffelnamen erreichbar. Standard ist `favoriteClassId`. | MUSS |
| F-33 | **Vorläufige Live-Tabelle:** Ist ein Spiel der Staffel live, wird der aktuelle Stand vorläufig in die Tabelle eingerechnet (2/1/0 Punkte, Tore) und als „live, vorläufig“ gekennzeichnet. Die Zuordnung der Kurz- zu den vollen Namen erfolgt über Ähnlichkeit oder eine feste Zuordnungstabelle. | KANN |

### 4.4 Aktualisierung

Abrufe finden **nur statt, solange die Seite sichtbar ist** (`visibilitychange`). Beim Zurückkehren wird sofort aktualisiert.

| Situation | Abruf | Takt |
|---|---|---|
| Ticker geöffnet, Spiel läuft | T2 | **15 s** |
| Ticker geöffnet, vor dem Spiel | T2 | 60 s (ab 30 min vor Anwurf) |
| Wochenübersicht, mindestens ein Spiel `live` | S1 | **60 s** (findet neue Tokens, aktualisiert Stände) |
| Wochenübersicht, Spieltag (Spiel heute), kein Live-Spiel | S1 | 5 min |
| Wochenübersicht, sonst | S1 | beim Öffnen und bei „Ziehen zum Aktualisieren“ |
| Staffelansicht | S2 bzw. S3 | beim Öffnen; S3 höchstens 1-mal pro Stunde (lokal zwischenspeichern) |
| Spiel beendet | – | keine Abrufe mehr |

| ID | Anforderung | Prio |
|---|---|---|
| F-40 | Anzeige „Aktualisiert vor 8 s“. Ab der doppelten Taktzeit ohne Erfolg erscheint ein gelber Hinweis. | MUSS |
| F-41 | Bei Fehlern wird schrittweise länger gewartet (×2, max. 2 min). | MUSS |
| F-42 | T1 wird je Token nur **einmal** abgerufen und gespeichert. | MUSS |

### 4.5 Offline

| ID | Anforderung | Prio |
|---|---|---|
| F-50 | Der Service Worker cacht nur die App-Dateien. API-Antworten werden in `localStorage` gespeichert (letzte Woche, Staffel, Ticker je Spiel). | MUSS |
| F-51 | Ohne Netz werden die gespeicherten Daten mit „Offline – Stand 14:32 Uhr“ angezeigt. | MUSS |

### 4.6 Nicht enthalten (Version 1)

Push-Mitteilungen, Live Activity und Widgets würden einen Server oder eine native App erfordern. Ebenfalls nicht enthalten sind Spielernamen und das Abrufen von Spielberichten.

---

## 5. Auswertungslogik

### 5.1 Datenmodell

```js
/** @typedef {{ id: string, short: string, long: string, ageGroup: string, gender: "m"|"w"|"g" }} LeagueRef */
// short "gD-BK-1-NA", ageGroup "D"

/** @typedef {{
 *   id: string,            // gID
 *   no: string,            // gNo
 *   league: LeagueRef,
 *   kickoff: Date,         // aus gDate + gTime, Europe/Berlin
 *   home: string, away: string,          // Kurznamen
 *   isHome: boolean|null,                // eigene Mannschaft Heim/Gast (clubShortMatch)
 *   venue: { name: string, street: string, postal: string, town: string },
 *   score: {home:number, away:number}|null,
 *   halftime: {home:number, away:number}|null,
 *   points: {home:number, away:number}|null,   // gesetzt = gewertet/beendet
 *   live: boolean, token: string|null,
 *   reportId: string|null,               // sGID ≠ 0
 *   comment: string|null
 * }} Game */

/** @typedef {{ weekStart: string, label: string, weeks: {start:string,label:string}[],
 *              games: Game[], updated: string, fetchedAt: number }} Week */

/** @typedef {{ rank: number|null, teamId: string, name: string, played: number,
 *              won: number, drawn: number, lost: number, goalsFor: number,
 *              goalsAgainst: number, pointsPlus: number, pointsMinus: number }} TableRow */

/** @typedef {{ league: LeagueRef, table: TableRow[], comments: string[],
 *              games: Game[], fetchedAt: number }} League */

/** @typedef {{ seq: number, t: number, type: string, side: "home"|"away"|null,
 *              number: string|null, home: number, away: number,
 *              stopsTime: boolean, raw: string }} TickerEvent */

/** @typedef {{ phase: "pre"|"first"|"halftime"|"second"|"finished",
 *              clockSec: number, clockRunning: boolean,
 *              score: {home:number,away:number}, halftime: {home:number,away:number}|null,
 *              events: TickerEvent[], fetchedAt: number }} TickerState */
```

### 5.2 Regeln für S1–S3

- `val(x)`: `typeof x === "string" ? x.trim() : x`. Ein leerer Wert wird zu `null`.
- `kickoff`: `"21.11.26"` + `"14:00"` → 2026-11-21 14:00 Ortszeit (Jahrhundert 20xx).
- `score` nur, wenn beide Tore-Werte gefüllt sind. `points` nur, wenn beide Punkte-Werte gefüllt sind.
- **Spielstatus:** `live` → *läuft*. Sonst `points` gesetzt → *beendet*. Sonst `score` gesetzt und Anwurf vorbei → *Ergebnis offen*. Sonst *geplant*. Enthält `gComment` „abgesagt“ oder „verlegt“ → entsprechender Status.
- `isHome`: `clubShortMatch` trifft auf `home` → `true`, auf `away` → `false`, sonst `null`.
- Alle Texte nur per `textContent` ausgeben. `scoreComments` vorher von HTML befreien.

### 5.3 Regeln für den Ticker (T2)

```js
const RULES = [
  [/^Spielzeit gestartet/,                                            "clockStart"],
  [/^Spielzeit gestoppt/,                                             "clockStop"],
  [/^Erfolgreicher 7m-Wurf für die (\w+) durch die Nummer (\S+)/,     "penaltyGoal"],   // Seite, Nr.
  [/^7m-Wurf .*?(Heimmannschaft|Gastmannschaft).*?Nummer (\S+)/,      "penaltyMissed"], // Seite, Nr.
  [/^Tor für die (\w+) durch die Nummer (\S+)/,                       "goal"],          // Seite, Nr.
  [/^Verwarnung für die Nummer (\S+) der (\w+)/,                      "warning"],       // Nr., Seite
  [/^2-min Strafe für die Nummer (\S+) der (\w+)/,                    "suspension"],    // Nr., Seite
  [/^Disqualifikation.*?Nummer (\S+) der (\w+)/,                      "disqualification"],
  [/^Mannschafts-Auszeit der (\w+)/,                                  "timeout"],
  [/^Spielstand 1\. Halbzeit/,                                        "halftime"],
  [/^Spielstand 2\. Halbzeit/,                                      "fullTime"],  // bestätigt
];
// "Heimmannschaft" → home, "Gastmannschaft" → away. Kein Treffer → "other".
```

**Phase und Uhr:**
- Halbzeitlänge `H` aus `halfLengthByAge[league.ageGroup]` (D-Jugend 20 min = 1200 s).
- **pre:** keine Ereignisse. **first:** noch kein `halftime`. **halftime:** letztes Spielereignis ist `halftime`, oder `t ≥ H` und die Uhr steht. **second:** nach `halftime` wieder `clockStart`. **finished:** `fullTime` vorhanden, **oder** S1 meldet für das Spiel `live: false` und `points` gesetzt, **oder** `t ≥ 2H` und die Uhr steht seit mehr als 10 min.
- **Stand** = letztes Ereignis. **Halbzeitstand** = Stand des `halftime`-Ereignisses.
- **Uhr** = `t` des letzten Ereignisses. Läuft sie, kommt `jetzt − fetchedAt` hinzu, begrenzt auf `H` bzw. `2H`.
- **Plausibilität:** Weder `t` noch der Stand dürfen sinken. Bei einem Verstoß wird das Ereignis angezeigt, für Stand und Uhr gilt aber das letzte plausible Ereignis.

### 5.4 Zusammenspiel der Quellen

- **Ticker finden:** Die Wochenübersicht (S1) liefert `gToken`. Ein Spiel mit Token wird antippbar, und die Spielansicht ruft T1/T2 auf.
- **Stand während des Spiels:** Der Ticker (T2) ist führend, weil er alle 15 s statt alle 60 s abgefragt wird. Auf der Wochenübersicht wird der S1-Stand angezeigt. Ist für das Spiel ein Tickerstand gespeichert, der jünger ist, wird dieser angezeigt.
- **Endstand:** Sobald S1/S2 `points` liefern, gilt deren Ergebnis (offizielles Ergebnis). Weicht der Tickerstand ab, steht in der Spielansicht der Hinweis „Endstand laut Verband“.

---

## 6. Oberfläche

```
┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐
│ TSV Neckartenzlingen      ⚙   │ │ ‹ Woche      ☀ an     ⤴ Teilen │ │ ‹ Woche   gD Bezirksklasse 1  │
│ [Meine] [Jugend] [Alle]       │ │ TSV Neckar-      SG Hegens-   │ │ [Tabelle] [Spielplan]         │
│ ‹  16.11.–22.11.2026  ›       │ │ tenzlingen       berg-Liebers.│ │ 1 SG Hegensb.-Liebersb. 4 8:0 │
│                               │ │        20  :  18              │ │ 2 SG Lauterst./Treffelh.6 8:4 │
│ ● LIVE gD  Sa 14:00           │ │     ● 2. HZ  34:17            │ │ 3 SG Untere Fils 2      6 8:4 │
│ TSV Neckarten. – SG He-Li 20:18│ │     Halbzeit 12 : 12          │ │ 4 TSV Neckartenzlingen  6 8:4 │
│ Richard-Hirschmann-Halle      │ │  Aktualisiert vor 6 s         │ │ 5 Handball Team Staufen 5 6:4 │
│                               │ │ ───────────────────────────── │ │ …                             │
│ Sa 21.11.                     │ │ 34:17 ● Tor Nr. 18     20:18  │ │ Tabelle nach direktem         │
│ wD 12:30 TSV – HSG Owen 24:25 │ │ 33:40 ● Tor Nr. 99     20:17  │ │ Vergleich berechnet.          │
│ wA 18:15 TSV – SG O'/U'h      │ │ 23:56 ◎ 7m-Tor Nr. 19  15:13  │ │                               │
│ So 22.11.                     │ │ 22:05 ⏱ 2 Min. Nr. 27 (Gast)  │ │                               │
│ gF 12:30 TSV – SG O'/U'h 2    │ │ ── Halbzeit 12 : 12 ───────── │ │                               │
│ Aktualisiert vor 40 s         │ │ Original-Ticker ↗             │ │ Daten: Handball4All AG        │
└───────────────────────────────┘ └───────────────────────────────┘ └───────────────────────────────┘
        Wochenübersicht                   Spiel / Liveticker                   Staffel
```

- Hell- und Dunkelmodus nach Systemeinstellung, Schrift skaliert mit, Tippflächen ≥ 44 pt.
- Safe Areas berücksichtigt (`viewport-fit=cover`, `env(safe-area-inset-*)`).
- `manifest.webmanifest` mit `display: "standalone"`, dazu `apple-touch-icon` (180 × 180).

---

## 7. Nicht-funktionale Anforderungen

| ID | Anforderung |
|---|---|
| NF-01 | Safari ab iOS 17; funktioniert zusätzlich in aktuellen Desktop-Browsern. |
| NF-02 | Erste Anzeige aus dem Cache < 1 s. Seite < 100 KB. Keine externen Abhängigkeiten. |
| NF-03 | **Schonender Umgang mit der Quelle:** Takte laut 4.4, nur bei sichtbarer Seite, keine parallelen Doppelabfragen, keine Abrufe von `/misc/`. |
| NF-04 | **Sicherheit:** Quelltexte nur per `textContent` ausgeben. CSP: `default-src 'self'; connect-src https://spo.handball4all.de; img-src 'self' data:`. |
| NF-05 | **Datenschutz:** keine Cookies, kein Tracking. `localStorage` enthält nur Spieldaten und Einstellungen; nicht mehr benötigte Daten werden nach 60 Tagen gelöscht. |
| NF-06 | Fehler in einer Quelle dürfen die anderen Ansichten nicht beeinträchtigen. Unbekannte Daten werden roh angezeigt oder ausgelassen, die Seite stürzt nie ab. |

---

## 8. Tests

| Bereich | Maßnahme |
|---|---|
| `parse-club` | Fixture `club-260-week-2026-11-16.json`: 11 Staffeln mit Spielen. gD-Spiel 9611841 ist live, hat den Token `539bfbdd…` und steht 20 : 18. Leere Werte werden zu `null`. `isHome` stimmt. |
| `parse-league` | `league-165421-ca0.json` / `-ca1.json`: 8 Tabellenzeilen, TSV auf Platz 4 mit 8:4. S3 enthält 56 Spiele, davon 14 mit TSV. `scoreComments` ohne HTML. |
| `parse-ticker` / `clock` | `game-9611841-messages.json`: Halbzeit 12 : 12 bei 1200 s, Stand 20 : 18 bei 34:17, Phase *second*. Alle Ereignistypen werden erkannt. Mehrere Ereignisse in derselben Sekunde. Laufende und gestoppte Uhr. |
| Fehler | Ungültiger Token (`invalid-token-*.json`), `permission denied`, Netzwerkfehler, kaputtes JSON. |
| Demo-Modus | `?demo=1` spielt Woche und Ticker aus den Fixtures im Zeitraffer ab. |
| Oberfläche | Playwright mit WebKit, Gerät „iPhone 15“: Woche → Live-Spiel → Ticker → Staffel; Dunkelmodus. |
| Praxis | Nächster Spieltag (28.11.2026, VfL Kirchheim – TSV, 11:30) live auf dem iPhone mitverfolgen. |

---

## 9. Datenschutz und Rechtliches

1. **Minderjährige:** `getAllGameInfo` liefert volle Kindernamen. Diese Schnittstelle wird **nie** abgerufen; angezeigt werden nur Trikotnummern. Schiedsrichter (`gReferee`) werden nicht angezeigt. Die Testdaten im Repository sind entsprechend bereinigt.
2. **Nutzung der Schnittstellen:** Sie sind öffentlich, per CORS für alle Webseiten freigegeben und laut `robots.txt` nicht gesperrt. Eine ausdrückliche Nutzungserlaubnis liegt aber nicht vor. Für den **privaten Gebrauch** (Familie, Eltern der Mannschaft) ist das Risiko gering. Vor einer öffentlichen Verbreitung bei Handball4All bzw. beim BWHV nachfragen.
3. **Quellenangabe** „Daten: Handball4All AG“ mit Link auf jeder Ansicht.
4. **Keine Vereins- oder Verbandslogos** ohne Erlaubnis; neutrales App-Symbol.
5. Wird die Seite öffentlich, braucht sie ein Impressum und einen Datenschutzhinweis. Alternativ die Adresse nur im Elternkreis teilen.

---

## 10. Abnahmekriterien

1. Mit den Fixtures vom 21.11.2026 zeigt die Wochenübersicht das gD-Spiel **TSV Neckarten. – SG He-Li** als LIVE mit **20 : 18**. Antippen öffnet den Ticker mit Halbzeit **12 : 12**, Phase „2. HZ“ und Uhr 34:17.
2. Die Staffelansicht zeigt 8 Mannschaften, TSV Neckartenzlingen auf Platz 4 (8:4 Punkte), und den Spielplan mit dem nächsten Spiel am 28.11.26 um 11:30 in Kirchheim/Teck.
3. Live: Ein neues Tor erscheint im Ticker spätestens **20 s** nach dem Original-Ticker. Ein neu gestartetes Live-Spiel erscheint spätestens nach **60 s** in der Wochenübersicht.
4. Die Uhr läuft flüssig weiter und steht bei gestoppter Zeit.
5. Wochen lassen sich vor- und zurückblättern.
6. Die Seite startet vom Home-Bildschirm im Vollbild. Im Flugmodus erscheint der letzte Stand mit Offline-Hinweis.
7. Im Hintergrund und nach Spielende finden keine Abrufe statt. `getAllGameInfo` und `/misc/` werden nie aufgerufen (prüfbar im Web-Inspektor).

---

## 11. Umsetzungsplan

| Schritt | Inhalt | Aufwand |
|---|---|---|
| 1 | Parser (`parse-club`, `parse-league`, `parse-ticker`, `clock`) mit Tests gegen die Fixtures | 1 Tag |
| 2 | `h4a.js`, `store.js`, Polling-Steuerung nach 4.4 | ½ Tag |
| 3 | Ansichten Woche, Spiel/Ticker, Staffel; Dunkelmodus | 1–1½ Tage |
| 4 | Manifest, Symbole, Service Worker, Wake Lock, Teilen, Demo-Modus | ½ Tag |
| 5 | GitHub Pages, Praxistest am 28.11.2026 | ½ Tag |

**Voraussetzungen:** ein beliebiger Rechner mit Editor und Node.js für die Tests. Kein Mac, kein Apple-Account, kein Server.

---

## 12. Bedienung auf dem iPhone

1. Webseite in Safari öffnen (z. B. `https://<benutzer>.github.io/handball-/`).
2. **Teilen → „Zum Home-Bildschirm“**.
3. Am Spieltag die App öffnen. Läuft ein Spiel mit Ticker, steht es oben als **● LIVE** → antippen.

---

## 13. Offene Punkte

1. ~~Spielende-Text im Ticker~~ **Geklärt (21.11.2026):** „Spielstand 2. Halbzeit“ bei 40:00 (D-Jugend). Fixture `game-9611841-messages-final.json` (Endstand 24 : 20).
2. **`gToken` verschwindet nach Spielende** aus S1 (`live: false`, `gToken: ""`); der Ticker selbst bleibt über den Token abrufbar. Die Web-App speichert den Token daher lokal, sobald sie ihn einmal gesehen hat. Ebenfalls beobachtet: Der Halbzeitstand in S1 wird erst nach Spielende gefüllt. Offen: Ab wann ist `gToken` **vor** dem Spiel gefüllt? Am 28.11.2026 beobachten.
3. **Spielzeiten der anderen Altersklassen** in `halfLengthByAge` mit den Durchführungsbestimmungen des BWHV abgleichen (nur relevant, wenn andere Mannschaften verfolgt werden).
4. **Privat oder öffentlich?** Davon hängen Impressum und Erlaubnis ab (Kapitel 9).
5. Bedeutung von `liveTeam` (Tabelle) und `ticker_update` (Ticker) ist unklar. Beides wird nicht benötigt.
