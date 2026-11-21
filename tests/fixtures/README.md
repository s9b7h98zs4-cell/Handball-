# Testdaten (Fixtures)

Echte Antworten der Handball4All-Ticker-Schnittstelle
`https://spo.handball4all.de/service/if_ticker_data.php?token=<TOKEN>&cmd=<BEFEHL>`.

| Datei | Befehl | Inhalt |
|---|---|---|
| `game-9611841-info.json` | `getGameInfo` | TSV Neckartenzlingen – SG Hegensberg-Liebersbronn, gem. D-Jugend, 21.11.2026 |
| `game-9611841-messages.json` | `getAllTickerMessages` | Momentaufnahme während der 2. Halbzeit (34:17, 20:18) |
| `invalid-token-info.json` | `getGameInfo` | Antwort bei unbekanntem Token |
| `invalid-token-messages.json` | `getAllTickerMessages` | Antwort bei unbekanntem Token |

Bewusst **nicht** enthalten: `getAllGameInfo`, weil diese Antwort die vollen Namen der (minderjährigen) Spielerinnen und Spieler enthält.
