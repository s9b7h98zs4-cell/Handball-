// Merkt sich gesehene Spiele, damit die Spielansicht sie (auch nach Neuladen) wiederfindet.
import { load, save } from "./store.js";

const memory = new Map();

export function rememberGames(games) {
  for (const g of games) {
    memory.set(g.id, g);
    // Nur die Verweise dauerhaft speichern; die Daten selbst kommen aus dem Cache der Quelle.
    const prev = load("ref:" + g.id)?.data;
    const ref = { leagueId: g.league.id, kickoff: g.kickoff?.toISOString() ?? null, token: g.token ?? prev?.token ?? null };
    if (!prev || prev.token !== ref.token || prev.leagueId !== ref.leagueId || prev.kickoff !== ref.kickoff) {
      save("ref:" + g.id, ref);
    }
  }
}

export function knownGame(id) {
  return memory.get(id) ?? null;
}

export function gameRef(id) {
  return load("ref:" + id)?.data ?? null;
}

/** Montag der Spielwoche als JJJJ-MM-TT. */
export function mondayOf(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
