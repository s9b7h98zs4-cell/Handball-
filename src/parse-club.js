// S1: Vereins-Wochenübersicht (cmd=pcu).
import { val, stripHtml } from "./util.js";
import { parseLeagueRef, parseGame, unwrap, byKickoff } from "./parse-games.js";

export function parseClubWeek(json, cfg) {
  const d = unwrap(json);
  const list = d?.menu?.dt?.list ?? {};
  const weeks = Array.isArray(list)
    ? []
    : Object.entries(list)
        .filter(([k]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && !k.startsWith("2999"))
        .map(([start, label]) => ({ start, label: String(label) }))
        .sort((a, b) => a.start.localeCompare(b.start));
  const weekStart = val(d?.menu?.dt?.selected);
  const repURL = val(d?.head?.repURL);
  const games = [];
  const leagues = [];
  for (const c of d?.content?.classes ?? []) {
    const league = parseLeagueRef(c);
    leagues.push(league);
    for (const g of c.games ?? []) games.push(parseGame(g, league, cfg, repURL));
  }
  games.sort(byKickoff);
  const range = /vom\s+(.+)$/.exec(val(d?.head?.headline1) ?? "");
  return {
    weekStart,
    label: range ? range[1].replace(/\s+-\s+/, " – ") : (weeks.find((w) => w.start === weekStart)?.label ?? ""),
    weeks,
    clubName: val(d?.head?.name) ?? cfg?.clubName ?? "",
    updated: stripHtml(val(d?.head?.actualized) ?? ""),
    leagues,
    games,
  };
}
