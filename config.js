// Zentrale Einstellungen der Web-App.
// Für einen anderen Verein: orgId und clubId aus dem Handball4All-Portal-Link übernehmen
// (…#/club?ogId=<orgId>&cId=<clubId>) und favoriteClassId auf die gewünschte Staffel setzen.
export const config = {
  orgId: 216,                       // Baden-Württembergischer Handball-Verband
  clubId: 260,                      // TSV Neckartenzlingen
  clubName: "TSV Neckartenzlingen",
  clubShortMatch: /Neckarten/i,     // erkennt die eigene Mannschaft in Kurznamen ("TSV Neckarten. 2")
  favoriteClassId: "165421",        // gemischte D-Jugend Bezirksklasse Staffel 1
  favoriteLabel: "gemischte D-Jugend",
  // Halbzeitlänge in Minuten je Altersklasse (D am 21.11.2026 bestätigt).
  halfLengthByAge: { A: 30, B: 25, C: 25, D: 20, E: 20, F: 15, M: 30, W: 30 },
  poll: {
    tickerSec: 15,       // Ticker, Spiel läuft
    tickerPreSec: 60,    // Ticker, vor dem Spiel
    weekLiveSec: 60,     // Wochenübersicht, mindestens ein Spiel live
    weekGameDaySec: 300, // Wochenübersicht, heute ist Spieltag
    leagueMaxAgeSec: 3600,
    maxBackoffSec: 120,
  },
  api: {
    g: "https://spo.handball4all.de/service/if_g_json.php",
    ticker: "https://spo.handball4all.de/service/if_ticker_data.php",
    tickerPage: "https://spo.handball4all.de/service/ticker/index.html",
    portal: "https://www.handball4all.de/home/portal/baden-wuerttembergischer-hv#/club",
  },
};
