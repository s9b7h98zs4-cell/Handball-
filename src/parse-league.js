// S2/S3: Staffel mit Spielen und Tabelle (cmd=ps).
import { val, num, stripHtml } from "./util.js";
import { parseLeagueRef, parseGame, unwrap, byKickoff } from "./parse-games.js";

function gamesOf(block) {
  if (!block) return [];
  if (Array.isArray(block)) return block.flatMap((b) => b?.games ?? []);
  return block.games ?? [];
}

export function parseLeague(json, cfg) {
  const d = unwrap(json);
  const c = d?.content ?? {};
  const first = (!Array.isArray(c.actualGames) && c.actualGames) || (!Array.isArray(c.futureGames) && c.futureGames) || null;
  const league = parseLeagueRef(first, { sname: d?.head?.sname, name: d?.head?.name });
  const repURL = val(d?.head?.repURL);

  const seen = new Map();
  for (const g of [...gamesOf(c.actualGames), ...gamesOf(c.futureGames)]) {
    const game = parseGame(g, league, cfg, repURL);
    seen.set(game.id, game); // spätere Einträge (futureGames) ersetzen frühere
  }
  const games = [...seen.values()].sort(byKickoff);

  const table = (c.score ?? []).map((r) => {
    const name = val(r.tabTeamname) ?? "?";
    return {
      rank: num(r.tabScore),
      teamId: String(val(r.tabTeamID) ?? ""),
      name,
      own: cfg?.clubName ? name.toLowerCase().includes(cfg.clubName.toLowerCase()) : false,
      played: num(r.numPlayedGames) ?? 0,
      won: num(r.numWonGames) ?? 0,
      drawn: num(r.numEqualGames) ?? 0,
      lost: num(r.numLostGames) ?? 0,
      goalsFor: num(r.numGoalsShot) ?? 0,
      goalsAgainst: num(r.numGoalsGot) ?? 0,
      pointsPlus: num(r.pointsPlus) ?? 0,
      pointsMinus: num(r.pointsMinus) ?? 0,
    };
  });

  return {
    league,
    region: val(d?.head?.headline1),
    updated: stripHtml(val(d?.head?.actualized) ?? ""),
    table,
    comments: (c.scoreComments ?? []).map(stripHtml).filter(Boolean),
    games,
  };
}
