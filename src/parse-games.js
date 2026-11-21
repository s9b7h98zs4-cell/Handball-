// Gemeinsame Auswertung von Spielen und Staffeln aus if_g_json.php (S1–S3).
import { val, num, parseH4ADate, ageFromShort } from "./util.js";

/** Staffel-Kopf aus einem H4A-Klassenobjekt. */
export function parseLeagueRef(c, fallback = {}) {
  const short = val(c?.gClassSname) ?? val(fallback.sname) ?? "";
  const long = val(c?.gClassLname) ?? val(fallback.name) ?? short;
  // Das Kürzel ist eindeutiger als gClassAGsDesc ("F" = Frauen und F-Jugend).
  const fromShort = ageFromShort(short);
  return {
    id: String(val(c?.gClassID) ?? fallback.id ?? ""),
    short,
    long,
    ageGroup: fromShort.ageGroup ?? val(c?.gClassAGsDesc),
    gender: val(c?.gClassGender) ?? fromShort.gender,
    youth: fromShort.youth,
  };
}

/** Ein Spiel aus S1/S2/S3 ins interne Modell übersetzen. */
export function parseGame(g, league, cfg, repURL = null) {
  const home = val(g.gHomeTeam) ?? "?";
  const away = val(g.gGuestTeam) ?? "?";
  const hg = num(g.gHomeGoals), ag = num(g.gGuestGoals);
  const hh = num(g.gHomeGoals_1), ah = num(g.gGuestGoals_1);
  const hp = num(g.gHomePoints), ap = num(g.gGuestPoints);
  const match = cfg?.clubShortMatch;
  let isHome = null;
  if (match) {
    if (match.test(home)) isHome = true;
    else if (match.test(away)) isHome = false;
  }
  const sgid = val(g.sGID);
  const reportId = sgid && String(sgid) !== "0" ? String(sgid) : null;
  const comment = val(g.gComment);
  const game = {
    id: String(val(g.gID) ?? ""),
    no: val(g.gNo),
    league,
    kickoff: parseH4ADate(g.gDate, g.gTime),
    home,
    away,
    isHome,
    venue: {
      name: val(g.gGymnasiumName),
      street: val(g.gGymnasiumStreet),
      postal: val(g.gGymnasiumPostal),
      town: val(g.gGymnasiumTown),
    },
    score: hg !== null && ag !== null ? { home: hg, away: ag } : null,
    halftime: hh !== null && ah !== null ? { home: hh, away: ah } : null,
    points: hp !== null && ap !== null ? { home: hp, away: ap } : null,
    live: g.live === true || g.live === "true" || g.live === 1,
    token: val(g.gToken),
    reportId,
    reportUrl: reportId && repURL ? repURL + reportId : null,
    comment,
  };
  game.status = gameStatus(game);
  return game;
}

/** live | finished | open | cancelled | postponed | scheduled */
export function gameStatus(game, now = new Date()) {
  const c = (game.comment ?? "").toLowerCase();
  if (game.live) return "live";
  if (game.points) return "finished";
  if (/abgesagt|ausgefallen|zurückgezogen/.test(c)) return "cancelled";
  if (/verlegt|verschoben/.test(c)) return "postponed";
  if (game.score && game.kickoff && game.kickoff <= now) return "open";
  return "scheduled";
}

/** Ergebnis aus Vereinssicht: "win" | "draw" | "loss" | null */
export function outcome(game) {
  if (!game.score || game.isHome === null) return null;
  const own = game.isHome ? game.score.home : game.score.away;
  const opp = game.isHome ? game.score.away : game.score.home;
  if (own > opp) return "win";
  if (own < opp) return "loss";
  return "draw";
}

/** Gemeinsame Hülle von if_g_json.php: Array mit einem Objekt oder Fehlerobjekt. */
export function unwrap(json) {
  if (Array.isArray(json) && json.length && typeof json[0] === "object") return json[0];
  if (json && typeof json === "object" && json.status === -1) {
    throw new Error(`Handball4All: ${json.statusText ?? "Zugriff verweigert"}`);
  }
  throw new Error("Handball4All: unerwartetes Antwortformat");
}

export function byKickoff(a, b) {
  return (a.kickoff?.getTime() ?? 0) - (b.kickoff?.getTime() ?? 0);
}
