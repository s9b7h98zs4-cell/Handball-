// Spielphase, Spielstand und Spieluhr aus Tickerereignissen.

const CLOCK_TYPES = new Set(["clockStart", "clockStop"]);

/**
 * @param {Array} events  Ergebnis von parseMessages
 * @param {number} halfSec Halbzeitlänge in Sekunden
 */
export function deriveState(events, halfSec) {
  const state = {
    phase: "pre",
    clockSec: 0,
    clockRunning: false,
    score: { home: 0, away: 0 },
    halftime: null,
    lastPlausible: null,
  };
  if (!events?.length) return state;

  // Plausibler Verlauf: Zeit und Stände dürfen nicht sinken.
  let last = null;
  for (const e of events) {
    if (!last || (e.t >= last.t && e.home >= last.home && e.away >= last.away)) last = e;
  }
  state.lastPlausible = last;
  state.score = { home: last.home, away: last.away };
  state.clockSec = last.t;

  const htIdx = events.findIndex((e) => e.type === "halftime");
  if (htIdx >= 0) state.halftime = { home: events[htIdx].home, away: events[htIdx].away };
  const hasFullTime = events.some((e) => e.type === "fullTime");

  // Uhr läuft, wenn das letzte Uhr-Ereignis "gestartet" ist und danach nichts die Zeit anhält.
  let running = false;
  for (const e of events) {
    if (e.type === "clockStart") running = true;
    else if (e.type === "clockStop" || e.type === "halftime" || e.type === "fullTime") running = false;
    else if (e.stopsTime) running = false;
  }
  // Ein Ereignis mit stops_time nach dem letzten Start hält die Uhr an.
  const lastEvent = events[events.length - 1];
  if (lastEvent.stopsTime && !CLOCK_TYPES.has(lastEvent.type)) running = false;
  state.clockRunning = running;

  if (hasFullTime) {
    state.phase = "finished";
    state.clockRunning = false;
  } else if (htIdx >= 0) {
    const restarted = events.slice(htIdx + 1).some((e) => e.type === "clockStart");
    state.phase = restarted ? "second" : "halftime";
    if (state.phase === "second" && last.t >= 2 * halfSec && !running) state.phase = "finished";
  } else if (last.t >= halfSec && !running) {
    state.phase = "halftime";
  } else {
    state.phase = "first";
  }
  if (state.phase === "halftime") state.clockRunning = false;
  return state;
}

/** Anzuzeigende Spielzeit: läuft die Uhr, wird die Zeit seit dem Abruf addiert. */
export function displayClock(state, fetchedAt, now, halfSec) {
  if (!state) return 0;
  let sec = state.clockSec;
  if (state.clockRunning && fetchedAt) {
    sec += Math.max(0, (now - fetchedAt) / 1000);
    const cap = state.phase === "second" || state.clockSec >= halfSec ? 2 * halfSec : halfSec;
    sec = Math.min(sec, cap);
  }
  return sec;
}

/** Statistik je Seite. */
export function stats(events) {
  const mk = () => ({ goals: 0, penaltyGoals: 0, penalties: 0, warnings: 0, suspensions: 0,
    disqualifications: 0, timeouts: 0, scorers: {} });
  const s = { home: mk(), away: mk() };
  for (const e of events ?? []) {
    const t = e.side && s[e.side];
    if (!t) continue;
    switch (e.type) {
      case "goal":
        t.goals++;
        if (e.number) t.scorers[e.number] = (t.scorers[e.number] ?? 0) + 1;
        break;
      case "penaltyGoal":
        t.goals++; t.penaltyGoals++; t.penalties++;
        if (e.number) t.scorers[e.number] = (t.scorers[e.number] ?? 0) + 1;
        break;
      case "penaltyMissed": t.penalties++; break;
      case "warning": t.warnings++; break;
      case "suspension": t.suspensions++; break;
      case "disqualification": t.disqualifications++; break;
      case "timeout": t.timeouts++; break;
    }
  }
  return s;
}
