// T1/T2: Liveticker (if_ticker_data.php).
import { val, num, parseIsoLocal } from "./util.js";

const SIDE = { heimmannschaft: "home", gastmannschaft: "away" };
const side = (s) => SIDE[String(s ?? "").toLowerCase()] ?? null;

// [Muster, Typ, Index Seite, Index Nummer]
const RULES = [
  [/^Spielzeit gestartet/i, "clockStart"],
  [/^Spielzeit gestoppt/i, "clockStop"],
  [/^Erfolgreicher 7m-Wurf für die (\S+) durch die Nummer (\S+)/i, "penaltyGoal", 1, 2],
  [/^7m-Wurf .*?(Heimmannschaft|Gastmannschaft).*?Nummer (\S+)/i, "penaltyMissed", 1, 2],
  [/^Tor für die (\S+) durch die Nummer (\S+)/i, "goal", 1, 2],
  [/^Verwarnung für die Nummer (\S+) der (\S+)/i, "warning", 2, 1],
  [/^2-min Strafe für die Nummer (\S+) der (\S+)/i, "suspension", 2, 1],
  [/^Disqualifikation.*?Nummer (\S+) der (\S+)/i, "disqualification", 2, 1],
  [/^Mannschafts-Auszeit der (\S+)/i, "timeout", 1],
  [/^Spielstand 1\. Halbzeit/i, "halftime"],
  [/^Spielstand 2\. Halbzeit|^Spielende|^Spiel beendet/i, "fullTime"],
];

export function classify(message) {
  const text = String(message ?? "").trim();
  for (const [re, type, si, ni] of RULES) {
    const m = re.exec(text);
    if (m) {
      return {
        type,
        side: si ? side(m[si]) : null,
        number: ni ? m[ni].replace(/[.,;]$/, "") : null,
      };
    }
  }
  // Rückfall: Seite trotzdem erkennen, falls genannt.
  const s = /(Heimmannschaft|Gastmannschaft)/i.exec(text);
  return { type: "other", side: s ? side(s[1]) : null, number: null };
}

/** T2 → TickerEvent[] (chronologisch, älteste zuerst). */
export function parseMessages(json) {
  if (!Array.isArray(json)) return [];
  return json.map((m, seq) => {
    const c = classify(m?.message);
    return {
      seq,
      t: num(m?.game_time) ?? 0,
      type: c.type,
      side: c.side,
      number: c.number,
      home: num(m?.home_score) ?? 0,
      away: num(m?.guest_score) ?? 0,
      stopsTime: m?.stops_time === true || m?.stops_time === "true",
      raw: String(m?.message ?? ""),
    };
  });
}

/** T1 → Spielkopf oder null, wenn kein Ticker existiert. */
export function parseInfo(json) {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  if (Number(json.status) !== 0) return null;
  return {
    gameId: String(val(json.id) ?? ""),
    home: val(json.home_lname) ?? "Heim",
    away: val(json.guest_lname) ?? "Gast",
    kickoff: parseIsoLocal(json.datetime),
    venue: { name: val(json.gym_name), town: val(json.gym_town) },
  };
}
