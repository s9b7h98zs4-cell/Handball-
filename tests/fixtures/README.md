# Testdaten (Fixtures)

Echte Antworten der öffentlichen Handball4All-Schnittstellen vom 21.11.2026 (ca. 14:45 Uhr, gD-Spiel läuft in der 2. Halbzeit).
Bereinigt: Schiedsrichternamen (`gReferee`) geleert, `debug`-Blöcke entfernt.

| Datei | Schnittstelle | Inhalt |
|---|---|---|
| `club-260-week-2026-11-16.json` | `if_g_json.php?ca=0&cmd=pcu&og=216&c=260` | Wochenübersicht TSV Neckartenzlingen 16.–22.11.2026 (gD-Spiel live, mit Token) |
| `club-260-week-2026-11-23.json` | `…&do=2026-11-23` | Folgewoche 23.–29.11.2026 |
| `league-165421-ca0.json` | `if_g_json.php?ca=0&cmd=ps&og=216&cl=165421` | gD Bezirksklasse Staffel 1: aktuelle Woche, Tabelle |
| `league-165421-ca1.json` | `if_g_json.php?ca=1&cmd=ps&og=216&cl=165421` | gD Bezirksklasse Staffel 1: ganze Saison, Tabelle |
| `game-9611841-info.json` | `if_ticker_data.php?token=…&cmd=getGameInfo` | TSV Neckartenzlingen – SG Hegensberg-Liebersbronn |
| `game-9611841-messages.json` | `if_ticker_data.php?token=…&cmd=getAllTickerMessages` | Ticker-Momentaufnahme bei 34:17 (20:18) |
| `game-9611841-messages-final.json` | dto., nach Spielende | Endstand 24:20 mit Meldung „Spielstand 2. Halbzeit“ |
| `invalid-token-info.json` | `getGameInfo` mit unbekanntem Token | Fehlerantwort |
| `invalid-token-messages.json` | `getAllTickerMessages` mit unbekanntem Token | `[]` |

Bewusst **nicht** enthalten: `cmd=getAllGameInfo`, weil diese Antwort die vollen Namen der (minderjährigen) Spielerinnen und Spieler enthält.
