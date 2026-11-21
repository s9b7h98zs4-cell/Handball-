import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { config } from "../config.js";
import { parseClubWeek } from "../src/parse-club.js";
import { parseLeague } from "../src/parse-league.js";
import { parseMessages, parseInfo, classify } from "../src/parse-ticker.js";
import { deriveState, displayClock, stats } from "../src/clock.js";
import { val, extractToken, parseH4ADate, stripHtml, fmtClock } from "../src/util.js";
import { unwrap, outcome } from "../src/parse-games.js";

const fx = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
const TOKEN = "539bfbddabe9671f0692bb3e87420e80";
const HALF = 20 * 60;

test("Hilfsfunktionen", () => {
  assert.equal(val(" "), null);
  assert.equal(val(" 20 "), "20");
  assert.equal(extractToken(`https://spo.handball4all.de/service/ticker/index.html?token=${TOKEN}`), TOKEN);
  assert.equal(extractToken(TOKEN.toUpperCase()), TOKEN);
  assert.equal(extractToken("kein token"), null);
  const d = parseH4ADate("21.11.26", "14:00");
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 10);
  assert.equal(d.getHours(), 14);
  assert.equal(stripHtml("a<br>b <b>c</b>"), "a\nb c");
  assert.equal(fmtClock(2057), "34:17");
});

test("S1 Wochenübersicht", () => {
  const w = parseClubWeek(fx("club-260-week-2026-11-16.json"), config);
  assert.equal(w.clubName, "TSV Neckartenzlingen");
  assert.equal(w.weekStart, "2026-11-16");
  assert.ok(w.weeks.length > 20);
  assert.ok(w.weeks.every((x) => !x.start.startsWith("2999")));
  assert.equal(w.label, "16.11.2026 – 22.11.2026");
  const leaguesWithGames = new Set(w.games.map((g) => g.league.id));
  assert.equal(leaguesWithGames.size, 11);

  const gd = w.games.find((g) => g.id === "9611841");
  assert.ok(gd);
  assert.equal(gd.live, true);
  assert.equal(gd.status, "live");
  assert.equal(gd.token, TOKEN);
  assert.deepEqual(gd.score, { home: 20, away: 18 });
  assert.equal(gd.halftime, null);
  assert.equal(gd.isHome, true);
  assert.equal(gd.league.id, "165421");
  assert.equal(gd.league.ageGroup, "D");
  assert.equal(gd.league.gender, "g");
  assert.equal(gd.league.youth, true);
  assert.equal(gd.venue.town, "Neckartenzlingen");

  const wd = w.games.find((g) => g.id === "9619451");
  assert.equal(wd.status, "finished");
  assert.deepEqual(wd.halftime, { home: 9, away: 13 });
  assert.equal(outcome(wd), "loss");

  const men = w.games.find((g) => g.id === "9516366");
  assert.equal(men.isHome, false);
  assert.equal(men.league.youth, false);
  assert.equal(men.score, null);
  assert.equal(men.status, "scheduled");

  const fem = w.leagues.find((l) => l.short === "F-OL-1-BW");
  assert.equal(fem.youth, false);
  const gf = w.leagues.find((l) => l.short === "gF-3c-NA");
  assert.equal(gf.youth, true);
  assert.equal(gf.ageGroup, "F");
});

test("S1 Folgewoche", () => {
  const w = parseClubWeek(fx("club-260-week-2026-11-23.json"), config);
  assert.equal(w.weekStart, "2026-11-23");
  const gd = w.games.find((g) => g.league.id === "165421");
  assert.equal(gd.home, "VfL Kirchh/T");
  assert.equal(gd.isHome, false);
  assert.equal(gd.kickoff.getDate(), 28);
});

test("S2 Staffel aktuelle Woche + Tabelle", () => {
  const l = parseLeague(fx("league-165421-ca0.json"), config);
  assert.equal(l.league.id, "165421");
  assert.equal(l.league.short, "gD-BK-1-NA");
  assert.equal(l.table.length, 8);
  const tsv = l.table.find((r) => r.own);
  assert.equal(tsv.name, "TSV Neckartenzlingen");
  assert.equal(tsv.rank, 4);
  assert.equal(tsv.pointsPlus, 8);
  assert.equal(tsv.pointsMinus, 4);
  assert.equal(l.comments.length, 1);
  assert.ok(!l.comments[0].includes("<br>"));
});

test("S3 ganze Saison", () => {
  const l = parseLeague(fx("league-165421-ca1.json"), config);
  assert.equal(l.games.length, 56);
  const own = l.games.filter((g) => g.isHome !== null);
  assert.equal(own.length, 14);
  const next = own.find((g) => g.kickoff > new Date(2026, 10, 22));
  assert.equal(next.home, "VfL Kirchh/T");
  assert.equal(next.venue.town, "Kirchheim/Teck");
  assert.equal(next.kickoff.getHours(), 11);
});

test("unwrap meldet Zugriffsfehler", () => {
  assert.throws(() => unwrap({ status: -1, statusText: "permission denied" }), /permission denied/);
});

test("T1 Spielkopf", () => {
  const i = parseInfo(fx("game-9611841-info.json"));
  assert.equal(i.gameId, "9611841");
  assert.equal(i.home, "TSV Neckartenzlingen");
  assert.equal(i.away, "SG Hegensberg-Liebersbronn");
  assert.equal(i.kickoff.getHours(), 14);
  assert.equal(parseInfo(fx("invalid-token-info.json")), null);
});

test("T2 Ereignistexte", () => {
  assert.deepEqual(classify("Tor für die Heimmannschaft durch die Nummer 11"), { type: "goal", side: "home", number: "11" });
  assert.deepEqual(classify("Erfolgreicher 7m-Wurf für die Heimmannschaft durch die Nummer 19"), { type: "penaltyGoal", side: "home", number: "19" });
  assert.deepEqual(classify("Verwarnung für die Nummer 29 der Gastmannschaft"), { type: "warning", side: "away", number: "29" });
  assert.deepEqual(classify("2-min Strafe für die Nummer 27 der Gastmannschaft"), { type: "suspension", side: "away", number: "27" });
  assert.deepEqual(classify("Mannschafts-Auszeit der Heimmannschaft"), { type: "timeout", side: "home", number: null });
  assert.equal(classify("Spielstand 1. Halbzeit").type, "halftime");
  assert.equal(classify("Spielstand 2. Halbzeit").type, "fullTime");
  assert.equal(classify("Etwas Neues").type, "other");
});

test("T2 Ticker-Momentaufnahme", () => {
  const ev = parseMessages(fx("game-9611841-messages.json"));
  assert.ok(ev.length > 50);
  assert.ok(ev.every((e) => e.type !== "other"), "alle Ereignisse erkannt");
  const s = deriveState(ev, HALF);
  assert.equal(s.phase, "second");
  assert.deepEqual(s.score, { home: 20, away: 18 });
  assert.deepEqual(s.halftime, { home: 12, away: 12 });
  assert.equal(fmtClock(s.clockSec), "34:17");
  assert.equal(s.clockRunning, true);

  const st = stats(ev);
  assert.equal(st.home.goals, 20);
  assert.equal(st.away.goals, 18);
  assert.equal(st.home.penaltyGoals, 1);
  assert.equal(st.away.suspensions, 1);
  assert.equal(st.home.timeouts, 1);
  assert.equal(parseMessages(fx("invalid-token-messages.json")).length, 0);
});

test("Phasen und Uhr", () => {
  const all = parseMessages(fx("game-9611841-messages.json"));
  assert.equal(deriveState([], HALF).phase, "pre");

  // bis einschließlich "Spielstand 1. Halbzeit" → Halbzeit, Uhr steht
  const htIdx = all.findIndex((e) => e.type === "halftime");
  const ht = deriveState(all.slice(0, htIdx + 1), HALF);
  assert.equal(ht.phase, "halftime");
  assert.equal(ht.clockRunning, false);
  assert.deepEqual(ht.score, { home: 12, away: 12 });

  // Auszeit (stops_time) → Uhr steht
  const toIdx = all.findIndex((e) => e.type === "timeout");
  const to = deriveState(all.slice(0, toIdx + 1), HALF);
  assert.equal(to.phase, "first");
  assert.equal(to.clockRunning, false);

  // laufende Uhr wird fortgeschrieben und an der Halbzeit gedeckelt
  const first = deriveState(all.slice(0, 3), HALF);
  assert.equal(first.clockRunning, true);
  assert.equal(displayClock(first, 1000, 1000 + 10_000, HALF), first.clockSec + 10);
  assert.equal(displayClock(first, 1000, 1000 + 99_999_000, HALF), HALF);

  // künstliches Spielende
  const end = [...all, { seq: 999, t: 2400, type: "fullTime", side: null, number: null, home: 25, away: 22, stopsTime: true, raw: "" }];
  const fin = deriveState(end, HALF);
  assert.equal(fin.phase, "finished");
  assert.equal(fin.clockRunning, false);

  // unplausibles Ereignis (Stand sinkt) wird für den Stand ignoriert
  const bad = [...all.slice(0, 5), { ...all[4], seq: 5, home: 0, away: 0, t: all[4].t + 1 }];
  assert.deepEqual(deriveState(bad, HALF).score, { home: all[4].home, away: all[4].away });
});

test("T2 Endstand (echte Spielende-Meldung)", () => {
  const ev = parseMessages(fx("game-9611841-messages-final.json"));
  assert.ok(ev.every((e) => e.type !== "other"));
  assert.equal(ev[ev.length - 1].raw, "Spielstand 2. Halbzeit");
  const s = deriveState(ev, HALF);
  assert.equal(s.phase, "finished");
  assert.equal(s.clockRunning, false);
  assert.deepEqual(s.score, { home: 24, away: 20 });
  assert.deepEqual(s.halftime, { home: 12, away: 12 });
  assert.equal(fmtClock(s.clockSec), "40:00");
  assert.equal(stats(ev).home.goals, 24);
});
