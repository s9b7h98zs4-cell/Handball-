# Spezifikation: Handball-Liveticker-App für iOS

| | |
|---|---|
| **Arbeitstitel** | HandballLive (Name noch offen) |
| **Plattform** | iOS (iPhone), ab iOS 17 |
| **Version des Dokuments** | 1.0 – Entwurf |
| **Stand** | 21.11.2026 |

---

## 1. Ziel und Zusammenfassung

Die App zeigt Handball-Spiele einer **frei wählbaren Jugend** (z. B. „männliche B-Jugend“) in einer **frei wählbaren Spielklasse** (z. B. „Bezirksoberliga“, „Oberliga“) live auf dem iPhone an.

Dafür kombiniert sie zwei Datenquellen:

1. **Quelle A – Liveticker:** Eine Webseite, die den Spielverlauf live anzeigt (Tore, Zeitstrafen, Auszeiten, Spielzeit). Die App liest diese Ereignisse aus.
2. **Quelle B – Spielstand und Ergebnisse:** Eine andere Webseite, die Spielplan, aktuellen bzw. Endstand und die Tabelle liefert (typischerweise das offizielle Ergebnisportal des Verbands).

Die App führt beide Quellen zusammen und zeigt sie in einer einheitlichen, schnellen und gut lesbaren Oberfläche an, inklusive Live Activity auf dem Sperrbildschirm und in der Dynamic Island.

> **Hinweis zu den Quellen:** Welche Webseiten konkret verwendet werden, legt der Auftraggeber fest (siehe Kapitel 13, offene Punkte). Für deutsche Ligen kommen in der Regel **handball.net** (offizielles DHB-Portal mit Spielplänen, Ergebnissen und Ticker) sowie die Ergebnisdienste der Landesverbände (z. B. **Handball4All / H4A**, **SIS-Handball**, **nuLiga**) in Frage. Die Architektur ist so ausgelegt, dass Quellen über austauschbare *Adapter* angebunden werden.

---

## 2. Begriffe

| Begriff | Bedeutung |
|---|---|
| **Jugend / Altersklasse** | A- bis E-Jugend, jeweils männlich, weiblich oder gemischt; zusätzlich Minis. |
| **Spielklasse / Liga / Staffel** | Konkrete Liga innerhalb eines Verbands, z. B. „Bezirksoberliga Staffel 2“. Eine Staffel hat eine eindeutige ID in der Quelle. |
| **Spiel** | Eine Begegnung mit Heim, Gast, Anwurfzeit, Halle und Status. |
| **Tickerereignis** | Einzelnes Ereignis im Spiel: Tor, 7-Meter, Zeitstrafe, Gelbe/Rote/Blaue Karte, Auszeit, Halbzeit, Spielende. |
| **Adapter** | Ein Modul, das eine bestimmte Webseite ausliest und in das interne Datenmodell übersetzt. |
| **Live Activity** | iOS-Funktion, die einen laufenden Vorgang auf dem Sperrbildschirm und in der Dynamic Island anzeigt. |

---

## 3. Zielgruppe und Nutzungsszenarien

**Zielgruppe:** Eltern, Spieler, Trainer und Fans von Jugendmannschaften, die nicht in der Halle sind oder in der Halle den Überblick über parallel laufende Spiele der Liga behalten wollen.

**Szenarien:**

1. *Elternteil im Auto:* Will sehen, wie das Spiel des Kindes steht, ohne eine Webseite mit Werbung und kleiner Schrift zu öffnen. Nutzt die Live Activity auf dem Sperrbildschirm.
2. *Trainer am Spieltag:* Will wissen, wie die Konkurrenz in der Tabelle parallel spielt.
3. *Spieler nach dem Spiel:* Will den Spielverlauf und die Torschützen nachlesen.

---

## 4. Funktionale Anforderungen

Die Prioritäten: **MUSS** gehört zur ersten Version (MVP), **SOLL** ist für Version 1.x geplant, **KANN** ist optional.

### 4.1 Einrichtung und Auswahl

| ID | Anforderung | Prio |
|---|---|---|
| F-01 | Beim ersten Start führt ein Assistent durch die Auswahl: **Verband → Saison → Altersklasse (Jugend + Geschlecht) → Spielklasse/Staffel**. | MUSS |
| F-02 | Die Auswahllisten werden aus Quelle B geladen, nicht fest einprogrammiert. | MUSS |
| F-03 | Optional kann zusätzlich ein **Lieblingsverein bzw. eine Lieblingsmannschaft** gewählt werden, deren Spiele hervorgehoben werden. | MUSS |
| F-04 | Mehrere Staffeln können gespeichert werden (z. B. B-Jugend und D-Jugend). Zwischen ihnen wird per Tab oder Liste gewechselt. | SOLL |
| F-05 | Alternativ kann der Nutzer direkt die **URL** einer Staffel oder eines Tickers einfügen; die App erkennt Quelle und ID daraus. | SOLL |
| F-06 | Die Auswahl lässt sich jederzeit in den Einstellungen ändern. | MUSS |

### 4.2 Spielübersicht (Spieltag)

| ID | Anforderung | Prio |
|---|---|---|
| F-10 | Liste der Spiele der gewählten Staffel, gruppiert nach Spieltag/Datum, mit Heim, Gast, Anwurfzeit, Halle und Status. | MUSS |
| F-11 | Mögliche Status: *geplant*, *läuft* (mit Halbzeit bzw. Spielminute), *Halbzeit*, *beendet*, *abgesagt/verlegt*, *Wertung*. | MUSS |
| F-12 | Laufende Spiele stehen oben und sind deutlich markiert (z. B. roter „LIVE“-Punkt). | MUSS |
| F-13 | Spielstand wird bei laufenden Spielen automatisch aktualisiert (siehe 4.6). | MUSS |
| F-14 | Ziehen zum Aktualisieren (Pull-to-Refresh). | MUSS |
| F-15 | Spiele der Lieblingsmannschaft sind hervorgehoben. | MUSS |

### 4.3 Spieldetail / Liveticker

| ID | Anforderung | Prio |
|---|---|---|
| F-20 | Kopfbereich: Vereinslogos (falls verfügbar), Mannschaftsnamen, großer Spielstand, Halbzeitstand, Spielminute, Status. | MUSS |
| F-21 | Chronologische Liste der Tickerereignisse, das neueste oben. Je Ereignis: Spielminute, Art (Icon), Mannschaft, Spieler (Name/Nummer, falls vorhanden), Spielstand nach dem Ereignis. | MUSS |
| F-22 | Neue Ereignisse werden animiert eingeblendet. | SOLL |
| F-23 | Spielverlaufsgrafik (Torabstand über die Zeit). | KANN |
| F-24 | Statistik je Mannschaft: Tore, 7-Meter (verwandelt/gesamt), Zeitstrafen, Auszeiten. | SOLL |
| F-25 | Torschützenliste des Spiels. | SOLL |
| F-26 | Gibt es keinen Ticker für ein Spiel, zeigt die App nur den Spielstand aus Quelle B und einen Hinweis „Für dieses Spiel ist kein Liveticker verfügbar“. | MUSS |
| F-27 | Link „Im Browser öffnen“ zur Originalseite (Quellenangabe). | MUSS |

### 4.4 Tabelle

| ID | Anforderung | Prio |
|---|---|---|
| F-30 | Tabelle der Staffel: Platz, Mannschaft, Spiele, S/U/N, Tore, Tordifferenz, Punkte. | MUSS |
| F-31 | **Live-Tabelle:** Während laufender Spiele wird eine vorläufige Tabelle mit den aktuellen Spielständen berechnet und als „vorläufig“ gekennzeichnet. | KANN |

### 4.5 Benachrichtigungen und Live Activity

| ID | Anforderung | Prio |
|---|---|---|
| F-40 | **Live Activity** für ein ausgewähltes Spiel: Spielstand, Spielminute, letztes Ereignis; in der Dynamic Island kompakt „HEIM 12 : 10 GAST“. | MUSS |
| F-41 | Live Activity startet automatisch zum Anwurf von Spielen der Lieblingsmannschaft (abschaltbar). | SOLL |
| F-42 | Push-Mitteilungen für die Lieblingsmannschaft: Anpfiff, Halbzeit, Endstand. Optional jedes Tor. | SOLL |
| F-43 | Home-Screen-Widget (klein/mittel) mit nächstem bzw. laufendem Spiel der Lieblingsmannschaft. | SOLL |

### 4.6 Aktualisierung

| ID | Anforderung | Prio |
|---|---|---|
| F-50 | Laufendes Spiel, App im Vordergrund: Aktualisierung alle **15 s** (konfigurierbar 10–60 s). | MUSS |
| F-51 | Spieltag ohne laufendes Spiel: alle **5 min**. Sonst nur beim Öffnen und manuell. | MUSS |
| F-52 | Die App zeigt an, wann zuletzt aktualisiert wurde („vor 12 s“). Sind die Daten älter als 2 min, erscheint ein Warnhinweis. | MUSS |
| F-53 | Bei Fehlern wird schrittweise länger gewartet (exponentielles Backoff bis max. 2 min), damit die Quellseiten nicht überlastet werden. | MUSS |

### 4.7 Offline und Fehler

| ID | Anforderung | Prio |
|---|---|---|
| F-60 | Zuletzt geladene Daten werden lokal gespeichert und ohne Netz angezeigt (mit Hinweis „Offline“). | MUSS |
| F-61 | Lässt sich eine Quelle nicht mehr auslesen (z. B. weil sich die Webseite geändert hat), zeigt die App eine verständliche Meldung und nutzt, wenn möglich, die andere Quelle weiter. | MUSS |

---

## 5. Nicht-funktionale Anforderungen

| ID | Anforderung |
|---|---|
| NF-01 | **Plattform:** iOS 17 oder neuer, iPhone. iPad als skalierte iPhone-App ist ausreichend. |
| NF-02 | **Sprache:** Deutsch; Texte so angelegt (String Catalog), dass später Englisch ergänzt werden kann. |
| NF-03 | **Leistung:** Kaltstart bis zur angezeigten Spielliste (aus dem Cache) < 1,5 s. Ein Ticker-Update ist spätestens 2 s nach dem Laden sichtbar. |
| NF-04 | **Akku/Datenvolumen:** Kein Polling, wenn kein Spiel läuft und die App im Hintergrund ist. Bedingte HTTP-Anfragen (`ETag`/`If-Modified-Since`), wo die Quelle das unterstützt. |
| NF-05 | **Barrierefreiheit:** Dynamic Type, VoiceOver-Beschriftungen für Spielstand und Ereignisse, ausreichende Kontraste, Dark Mode. |
| NF-06 | **Datenschutz:** Keine Nutzerkonten, kein Tracking, keine Weitergabe von Daten. Gespeichert werden nur die Auswahl und ein Cache. Für Push wird nur das Geräte-Token an das eigene Backend übermittelt. Datenschutzerklärung und App-Store-„Privacy Nutrition Label“ entsprechend. |
| NF-07 | **Wartbarkeit:** Jede Quelle ist ein eigener Adapter. Ändert sich eine Webseite, muss nur dieser Adapter angepasst werden (siehe 6.3). |
| NF-08 | **Rücksicht auf Quellen:** Eindeutiger User-Agent mit Kontaktadresse, Ratenbegrenzung pro Quelle, Beachtung von `robots.txt` und Nutzungsbedingungen. |

---

## 6. Architektur

### 6.1 Variantenentscheidung

Es gibt zwei mögliche Varianten:

| | **Variante A: nur App** | **Variante B: App + kleiner Server (empfohlen)** |
|---|---|---|
| Wer liest die Webseiten aus? | Jedes iPhone selbst | Ein Server, einmal für alle Nutzer |
| Live Activity im Hintergrund aktualisieren | Kaum möglich: iOS lässt Apps im Hintergrund nicht zuverlässig im 15-s-Takt laufen | Ja, über **ActivityKit-Push** (APNs) |
| Push-Mitteilungen bei Toren | Nicht zuverlässig | Ja |
| Last auf den Quellseiten | Steigt mit jedem Nutzer | Konstant (ein Abruf pro Spiel) |
| Anpassung, wenn sich eine Webseite ändert | Neue App-Version und App-Store-Prüfung nötig | Nur der Server wird aktualisiert, sofort wirksam |
| Kosten/Aufwand | Kein Betrieb nötig | Kleiner Server bzw. Serverless (einige Euro im Monat) |

**Empfehlung:** Variante B. Das MVP kann mit Variante A beginnen (nur Vordergrund-Aktualisierung, ohne Hintergrund-Live-Activity). Dazu werden die Adapter so gebaut, dass sie später unverändert auf den Server wandern können (gleiches Datenmodell, gleiches JSON).

### 6.2 Komponentenübersicht (Variante B)

```
┌──────────────────────┐        ┌───────────────────────────────┐
│  Quelle A            │        │  Backend „Aggregator“         │
│  (Liveticker-Seite)  │◄───────┤  - Adapter Quelle A           │
└──────────────────────┘ HTTPS  │  - Adapter Quelle B           │
┌──────────────────────┐        │  - Merger (Zusammenführung)   │
│  Quelle B            │◄───────┤  - Scheduler (Polling-Takt)   │
│  (Ergebnisportal)    │        │  - Cache (z. B. Redis/SQLite) │
└──────────────────────┘        │  - REST-API (JSON)            │
                                │  - APNs-Sender (Push + LA)    │
                                └──────────────┬────────────────┘
                                               │ HTTPS / JSON, APNs
                                ┌──────────────▼────────────────┐
                                │  iOS-App (SwiftUI)            │
                                │  - API-Client                 │
                                │  - Lokaler Cache (SwiftData)  │
                                │  - Live Activity (ActivityKit)│
                                │  - Widget (WidgetKit)         │
                                └───────────────────────────────┘
```

### 6.3 Adapter-Konzept

Jede Quelle wird über eine einheitliche Schnittstelle angebunden. Beispiel in Swift (gleiches gilt sinngemäß für das Backend, z. B. in TypeScript oder Swift/Vapor):

```swift
protocol ResultsSource {           // Quelle B
    var id: String { get }         // z. B. "handballnet"
    func associations() async throws -> [Association]
    func leagues(association: Association.ID, season: Season,
                 ageGroup: AgeGroup) async throws -> [League]
    func games(league: League.ID) async throws -> [Game]
    func standings(league: League.ID) async throws -> [StandingRow]
}

protocol TickerSource {            // Quelle A
    var id: String { get }
    /// Ordnet ein Spiel aus Quelle B einem Ticker zu (falls vorhanden).
    func findTicker(for game: Game) async throws -> TickerRef?
    func events(ticker: TickerRef, since: TickerEvent.ID?) async throws -> TickerSnapshot
}
```

**Vorgehen beim Auslesen, in dieser Reihenfolge:**

1. **Strukturierte Daten bevorzugen:** Viele Portale laden ihre Daten per JSON-Schnittstelle nach (im Browser unter *Entwicklertools → Netzwerk* erkennbar). Lässt sich diese Schnittstelle nutzen, ist das stabiler und schneller als HTML. Ihre Nutzung muss mit den Nutzungsbedingungen vereinbar sein (siehe Kapitel 9).
2. **HTML parsen:** Statisches HTML wird mit einem Parser ausgelesen (iOS: **SwiftSoup**, Backend: z. B. *cheerio* oder *BeautifulSoup*). Selektoren werden zentral je Adapter als Konstanten abgelegt.
3. **JavaScript-gerenderte Seiten:** Wird der Inhalt erst durch JavaScript erzeugt, auf dem Server mit einem Headless-Browser (z. B. Playwright) rendern. In der App nur notfalls mit einem unsichtbaren `WKWebView`; das ist langsamer und fehleranfälliger.

**Robustheit:**
- Jeder Adapter prüft die Plausibilität seiner Ergebnisse (z. B. Spielstand ≥ 0, Minute 0–60 bzw. passend zur Spielzeit der Altersklasse, Mannschaftsnamen nicht leer).
- Schlägt die Prüfung fehl, wird der Fehler protokolliert (Backend: Alarm per E-Mail) und der letzte gültige Stand bleibt sichtbar.
- Zu jedem Adapter gibt es **gespeicherte Beispielseiten (Fixtures)** für automatische Tests (siehe Kapitel 10).

### 6.4 Zusammenführung der Quellen (Merger)

1. **Spiel-Zuordnung:** Quelle B ist führend für Spielplan und Spiel-IDs. Ein Tickerspiel wird zugeordnet:
   1. über eine gemeinsame Spielnummer, falls beide Quellen sie anzeigen (bevorzugt),
   2. sonst über **Datum + Anwurfzeit (±30 min) + normalisierte Mannschaftsnamen**. Die Normalisierung umfasst Kleinschreibung, das Entfernen von Präfixen wie „HSG“, „TV“, „SG“, „JSG“, Umlaute → ae/oe/ue, Mannschaftsnummern („2“, „II“) und einen Ähnlichkeitsvergleich (z. B. Levenshtein, Schwelle konfigurierbar).
   3. Unsichere Zuordnungen werden nicht automatisch übernommen, sondern protokolliert. Optional gibt es eine manuelle Zuordnungstabelle im Backend.
2. **Spielstand während des Spiels:** Der **Ticker (Quelle A)** ist führend, weil er aktueller ist.
3. **Spielstand nach dem Spiel:** **Quelle B** ist führend (offizielles Ergebnis, z. B. nach Korrekturen im Spielbericht).
4. **Widerspruch:** Weichen die Stände nach Spielende ab, zeigt die App den Wert aus Quelle B und einen kleinen Hinweis „Ergebnis laut Verband“.
5. Jeder angezeigte Wert führt intern seine Herkunft (`source`) und seinen Abrufzeitpunkt (`fetchedAt`) mit.

### 6.5 Technologie iOS-App

| Bereich | Technologie |
|---|---|
| Sprache | Swift 6 (strikte Concurrency) |
| UI | SwiftUI, Architektur MVVM mit `@Observable` |
| Netzwerk | `URLSession` mit async/await |
| HTML-Parsing (nur Variante A) | SwiftSoup (Swift Package Manager) |
| Persistenz | SwiftData (Cache und Auswahl), `UserDefaults` (App Group) für Widget-Daten |
| Live Activity | ActivityKit + WidgetKit-Extension |
| Widgets | WidgetKit |
| Push | APNs (User Notifications), Push-Token für Live Activities |
| Hintergrund | `BGAppRefreshTask` nur für gelegentliche Cache-Aktualisierung (nicht für Live-Daten) |
| Tests | Swift Testing / XCTest, XCUITest |
| Abhängigkeiten | so wenige wie möglich; nur über Swift Package Manager |

### 6.6 Technologie Backend (Variante B, Vorschlag)

- Laufzeit: Node.js (TypeScript) **oder** Swift (Vapor), damit Datenmodell und ggf. Adapter-Code geteilt werden können.
- Scheduler: Pollt aktive Spiele im 10–15-s-Takt, an Spieltagen die Spielpläne alle 5 min, sonst stündlich.
- Speicherung: SQLite oder Postgres plus In-Memory-Cache.
- APNs: Token-basierte Authentifizierung (`.p8`-Schlüssel), Live-Activity-Updates über `apns-push-type: liveactivity`.
- Hosting: z. B. Hetzner, Fly.io oder ein ähnlicher Anbieter. Möglichst Serverstandort in der EU (DSGVO).
- Monitoring: Health-Check-Endpunkt und Alarm, wenn ein Adapter wiederholt fehlschlägt.

---

## 7. Datenmodell

```swift
enum Gender: String, Codable { case male, female, mixed }
enum Youth: String, Codable { case a, b, c, d, e, minis }

struct AgeGroup: Codable, Hashable {
    let youth: Youth
    let gender: Gender
    var displayName: String   // z. B. "männliche B-Jugend"
}

struct Association: Identifiable, Codable { let id: String; let name: String }   // Verband/Bezirk
struct Season: Codable, Hashable { let id: String; let label: String }          // "2026/27"

struct League: Identifiable, Codable {
    let id: String            // ID der Staffel in Quelle B
    let name: String          // "Bezirksoberliga Staffel 2"
    let ageGroup: AgeGroup
    let season: Season
    let sourceURL: URL
}

struct Team: Identifiable, Codable, Hashable {
    let id: String
    let name: String          // "HSG Musterstadt"
    let shortName: String?    // "Musterstadt"
    let logoURL: URL?
}

enum GameStatus: Codable {
    case scheduled
    case live(minute: Int?, half: Int)   // half: 1 oder 2
    case halftime
    case finished
    case cancelled(reason: String?)
    case awarded                          // Spielwertung
}

struct Score: Codable, Hashable { let home: Int; let away: Int }

struct Game: Identifiable, Codable {
    let id: String            // ID in Quelle B
    let gameNumber: String?   // offizielle Spielnummer
    let leagueID: League.ID
    let home: Team
    let away: Team
    let kickoff: Date         // in UTC speichern, in Europe/Berlin anzeigen
    let venue: String?
    var status: GameStatus
    var score: Score?
    var halftimeScore: Score?
    var tickerRef: TickerRef?
    var scoreSource: String   // "ticker" | "results"
    var fetchedAt: Date
}

enum TickerEventType: String, Codable {
    case goal, penaltyGoal, penaltyMissed
    case suspension          // 2 Minuten
    case yellowCard, redCard, blueCard
    case timeout
    case halftime, gameStart, gameEnd
    case other
}

struct TickerEvent: Identifiable, Codable, Hashable {
    let id: String           // stabil! aus Quelle oder Hash(Minute+Typ+Team+Spieler+Stand)
    let gameClock: String    // "23:41"
    let type: TickerEventType
    let team: TeamSide?      // .home / .away
    let playerName: String?
    let playerNumber: Int?
    let scoreAfter: Score?
    let text: String?        // Originaltext als Fallback
}

enum TeamSide: String, Codable { case home, away }

struct TickerRef: Codable, Hashable { let sourceID: String; let tickerID: String; let url: URL }

struct TickerSnapshot: Codable {
    let events: [TickerEvent]
    let status: GameStatus
    let score: Score?
    let fetchedAt: Date
}

struct StandingRow: Codable, Identifiable {
    var id: Team.ID { team.id }
    let rank: Int
    let team: Team
    let played, won, drawn, lost: Int
    let goalsFor, goalsAgainst: Int
    let pointsFor, pointsAgainst: Int   // Handball: z. B. 14:4
}
```

**Hinweise:**
- Spielzeiten unterscheiden sich je Altersklasse (A-Jugend 2 × 30 min, B/C-Jugend 2 × 25 min, D/E-Jugend oft 2 × 20 min, je nach Verband). Die Spielzeit ist daher pro Staffel konfigurierbar und wird für Plausibilitätsprüfungen und die Live Activity genutzt.
- Event-IDs müssen **stabil** sein, damit beim erneuten Abruf keine doppelten Einträge entstehen und Animationen korrekt laufen.

---

## 8. Backend-API (Variante B)

Alle Antworten im JSON-Format, UTF-8, Datumswerte nach ISO 8601 in UTC. Versionierung im Pfad.

| Methode & Pfad | Beschreibung | Cache |
|---|---|---|
| `GET /v1/associations` | Verbände/Bezirke | 24 h |
| `GET /v1/associations/{id}/leagues?season=&youth=&gender=` | Staffeln für die Auswahl | 6 h |
| `GET /v1/leagues/{id}/games` | Spielplan inkl. Spielstände | 15 s bei Live-Spielen, sonst 5 min |
| `GET /v1/leagues/{id}/standings` | Tabelle | 5 min |
| `GET /v1/games/{id}` | Spieldetail inkl. Tickerereignissen | 10 s |
| `GET /v1/games/{id}/events?since={eventId}` | Nur neue Ereignisse | 10 s |
| `POST /v1/devices` | Registriert ein Push-Token mit abonnierten Mannschaften/Spielen | – |
| `POST /v1/live-activities` | Registriert das Push-Token einer Live Activity für ein Spiel | – |
| `DELETE /v1/live-activities/{token}` | Beendet Updates | – |
| `GET /v1/health` | Status aller Adapter | – |

Bei den Abrufen werden `ETag` und `Cache-Control` unterstützt.

**Live-Activity-Payload (Beispiel):**

```json
{
  "aps": {
    "timestamp": 1795275000,
    "event": "update",
    "content-state": {
      "homeScore": 14,
      "awayScore": 12,
      "clock": "38:12",
      "status": "live",
      "lastEvent": "Tor Musterstadt (#7 L. Beispiel)"
    },
    "stale-date": 1795275300
  }
}
```

---

## 9. Rechtliches und Richtlinien (vor Entwicklungsbeginn klären!)

1. **Nutzungsbedingungen der Quellseiten:** Viele Portale verbieten das automatisierte Auslesen oder die Weiterverwendung ihrer Daten. **Vor dem Bau eines Adapters die Nutzungsbedingungen prüfen und idealerweise eine schriftliche Erlaubnis einholen** (Verband, Portalbetreiber, Ticker-Anbieter). Manche Anbieter stellen auf Anfrage offizielle Schnittstellen oder Widgets für Vereine bereit; das ist die stabilste Lösung.
2. **Datenbankrecht/Urheberrecht:** Spielpläne und Ergebnisse als Datensammlung können geschützt sein (§§ 87a ff. UrhG). Vereinslogos sind urheberrechtlich bzw. markenrechtlich geschützt und dürfen nur mit Erlaubnis angezeigt werden (andernfalls Platzhalter mit Initialen verwenden).
3. **Personenbezogene Daten:** Spielernamen im Ticker sind bei **Jugendspielern (Minderjährigen)** besonders sensibel. Empfehlung: Spielernamen standardmäßig **nicht** anzeigen oder nur die Trikotnummer, außer die Quelle veröffentlicht sie ausdrücklich und die Weiterverwendung ist erlaubt. Keine dauerhafte Speicherung von Spielernamen im Backend über die Saison hinaus.
4. **Quellenangabe:** In jeder Ansicht die Datenquelle nennen und verlinken.
5. **App Store Review Guidelines:** Insbesondere 5.2 (geistiges Eigentum) beachten. Die App darf nicht den Eindruck erwecken, eine offizielle App des Verbands zu sein, außer das ist vereinbart. Kein Verbandslogo im App-Icon.
6. **Impressum und Datenschutzerklärung** sind für eine App in Deutschland Pflicht und müssen in der App erreichbar sein.

---

## 10. Qualitätssicherung

| Bereich | Maßnahme |
|---|---|
| Adapter | Unit-Tests gegen gespeicherte HTML/JSON-Beispiele (Fixtures): vor dem Spiel, laufend, Halbzeit, beendet, abgesagt, Ticker ohne Spielernamen, Sonderzeichen in Vereinsnamen. |
| Merger | Tests für Zuordnung (eindeutig, ähnlich benannt, zwei Mannschaften desselben Vereins, Spielverlegung) und Konfliktauflösung. |
| Live-Überwachung | Täglicher automatischer „Smoke-Test“ gegen die echten Quellen (Backend). Bei geänderter Seitenstruktur folgt ein Alarm. |
| UI | Snapshot-Tests der wichtigsten Ansichten (Hell/Dunkel, große Schrift), XCUITest für den Einrichtungsassistenten. |
| Simulator | Ein **Demo-Modus** spielt ein aufgezeichnetes Spiel im Zeitraffer ab, damit Live-Funktionen ohne echtes Spiel getestet werden können (auch hilfreich für die App-Store-Prüfung). |
| Beta | TestFlight mit einigen Eltern/Trainern über mindestens zwei Spieltage. |

---

## 11. Abnahmekriterien (MVP)

1. Ein Nutzer kann ohne Anleitung in unter 1 Minute Verband, Altersklasse und Staffel wählen.
2. Für ein laufendes Spiel mit Ticker erscheint ein neues Tor spätestens **30 s** nach Erscheinen auf der Quellseite in der App (App im Vordergrund).
3. Spielplan und Tabelle stimmen mit Quelle B überein (Stichprobe von 3 Staffeln).
4. Nach Spielende zeigt die App das Ergebnis aus Quelle B.
5. Ohne Internetverbindung werden die zuletzt geladenen Daten mit Hinweis angezeigt; die App stürzt nicht ab.
6. Eine Live Activity lässt sich für ein laufendes Spiel starten und zeigt den Spielstand im Vordergrund aktuell an (Variante A) bzw. auch im Hintergrund (Variante B).
7. Fällt eine Quelle aus, bleibt die App bedienbar und zeigt eine verständliche Meldung.

---

## 12. Umsetzungsplan (Vorschlag)

| Phase | Inhalt | Ergebnis |
|---|---|---|
| **0 – Klärung** (1 Woche) | Quellen festlegen, Nutzungsbedingungen prüfen bzw. Erlaubnis anfragen, Netzwerkanalyse der Seiten (JSON-Schnittstelle vorhanden?), Fixtures sammeln | Entscheidung zu Quellen und Variante |
| **1 – Adapter** (1–2 Wochen) | Adapter Quelle B (Auswahl, Spielplan, Tabelle), Adapter Quelle A (Ticker), Merger, Tests | Getestete Datenschicht |
| **2 – App-MVP** (2–3 Wochen) | Einrichtungsassistent, Spielliste, Spieldetail mit Ticker, Tabelle, Cache, Vordergrund-Polling, Demo-Modus | TestFlight-Build |
| **3 – Backend & Live** (2 Wochen) | Aggregator-Server, API, APNs, Live Activity mit Push, Mitteilungen | Live Activity im Hintergrund |
| **4 – Feinschliff** (1–2 Wochen) | Widget, Barrierefreiheit, Datenschutzerklärung, App-Store-Texte und Screenshots | App-Store-Einreichung |

**Voraussetzungen für die Entwicklung:** ein Mac mit aktuellem Xcode, ein Apple-Developer-Account (99 €/Jahr, nötig für TestFlight, Push und den App Store) und ein iPhone zum Testen (Live Activities und Push lassen sich nur eingeschränkt im Simulator testen).

---

## 13. Offene Punkte (vom Auftraggeber zu beantworten)

1. **Welche Webseite ist Quelle A (Liveticker)?** URL eines Beispiel-Tickers.
2. **Welche Webseite ist Quelle B (Spielstand/Ergebnisse)?** URL der gewünschten Staffel.
3. **Welche Jugend und welche Klasse** sind der Startfall (z. B. „männliche C-Jugend, Bezirksliga XY, Saison 2026/27“)? Soll die App später beliebige Staffeln unterstützen oder nur diese eine?
4. Gibt es eine **Lieblingsmannschaft** oder einen Verein, für den die App primär gedacht ist? Besteht Kontakt zum Verein/Verband wegen einer Erlaubnis?
5. **Variante A oder B?** Soll ein Server betrieben werden (für Push und Live Activity im Hintergrund)?
6. Ist die App **privat** (nur für Familie/Verein, Verteilung per TestFlight) oder für den **öffentlichen App Store** gedacht? Davon hängt ab, wie streng Kapitel 9 umgesetzt werden muss.
7. Sollen **Spielernamen** angezeigt werden?

---

## Anhang A: Checkliste zur Analyse einer Quellseite

Für jede Quelle vor dem Bau des Adapters ausfüllen:

- [ ] URL-Schema für Verband / Staffel / Spiel / Ticker (welche Teile sind IDs?)
- [ ] Sind Inhalte im HTML enthalten oder werden sie per JavaScript nachgeladen?
- [ ] Gibt es JSON-Anfragen im Netzwerk-Tab? Endpunkt, Parameter, Antwortformat
- [ ] Wie werden Status (geplant/live/beendet) dargestellt?
- [ ] Wie oft aktualisiert sich die Seite selbst (Polling-Intervall der Seite)?
- [ ] Zeitzone der angezeigten Zeiten
- [ ] Zeichenkodierung (UTF-8 / ISO-8859-1)
- [ ] `robots.txt` und Nutzungsbedingungen geprüft, Ergebnis dokumentiert
- [ ] Mindestens 5 Fixtures gespeichert (vor, während, Halbzeit, nach dem Spiel, ohne Ticker)

## Anhang B: Bildschirmübersicht

```
┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│ mB-Jugend · BOL St. 2 ▾ │   │ ‹ Zurück          ↗ Web │   │ Tabelle                 │
│ [Spiele] [Tabelle]      │   │  HSG Muster   TV Beisp. │   │ 1 HSG Muster   9  16:2  │
│ ● LIVE                  │   │     14   :   12         │   │ 2 TV Beispiel  9  14:4  │
│ HSG Muster  14:12  38'  │   │  2. HZ · 38:12 (HZ 7:6) │   │ 3 SG Nord      8  10:6  │
│ SG Nord      9:11  31'  │   │ ─────────────────────── │   │ …                       │
│ Sa, 22.11.              │   │ 38' ⚽ Tor Muster  14:12 │   │                         │
│ JSG Süd – TV Ost  16:00 │   │ 37' ⏱ 2 Min. Beispiel   │   │ (vorläufig, live)       │
│ So, 23.11.              │   │ 36' ⚽ Tor Beisp.  13:12 │   │                         │
│ …                       │   │ …                       │   │                         │
└─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘
     Spielübersicht                 Spieldetail / Ticker              Tabelle
```
