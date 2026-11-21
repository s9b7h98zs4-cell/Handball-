// Start, Routing und Aktualisierungs-Takt.
import { config } from "../config.js";
import { prune } from "./store.js";
import { extractToken } from "./util.js";
import { isDemo } from "./h4a.js";
import { createWeekView } from "./views/week.js";
import { createGameView } from "./views/game.js";
import { createLeagueView } from "./views/league.js";

const root = document.getElementById("app");
let view = null;
let timer = null;
let failures = 0;
let lastDelay = config.poll.tickerSec;
let running = false;

function route() {
  const hash = location.hash.replace(/^#\/?/, "");
  const [name, arg] = hash.split("/");
  switch (name) {
    case "spiel": return arg ? createGameView(root, { id: arg }) : null;
    case "ticker": return arg ? createGameView(root, { token: extractToken(arg) }) : null;
    case "staffel": return createLeagueView(root, { id: arg || config.favoriteClassId });
    case "woche": return createWeekView(root, { weekStart: /^\d{4}-\d{2}-\d{2}$/.test(arg ?? "") ? arg : undefined });
    default: return null;
  }
}

function show() {
  clearTimeout(timer);
  view?.destroy?.();
  view = route();
  if (!view) {
    location.replace("#/woche");
    return;
  }
  failures = 0;
  window.scrollTo(0, 0);
  run();
}

async function run(force = false) {
  clearTimeout(timer);
  if (!view || document.visibilityState !== "visible" || running) return;
  running = true;
  const current = view;
  let delay = null;
  try {
    delay = await current.refresh(force);
    failures = 0;
    if (delay) lastDelay = delay;
  } catch {
    failures++;
    // Nach Fehlern immer wieder versuchen, aber zunehmend seltener.
    delay = Math.min((lastDelay || 15) * 2 ** failures, config.poll.maxBackoffSec);
  } finally {
    running = false;
  }
  if (current !== view) return; // inzwischen Ansicht gewechselt
  if (delay) timer = setTimeout(run, delay * 1000);
}

window.app = { refreshNow: (force) => run(force) };

// Nur abrufen, solange die Seite sichtbar ist; beim Zurückkehren sofort aktualisieren.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") run();
  else clearTimeout(timer);
});
window.addEventListener("online", () => run());
window.addEventListener("hashchange", show);
setInterval(() => view?.tick?.(), 1000);

// Direktaufruf mit ?token=… (z. B. abgewandelter Original-Ticker-Link)
const params = new URLSearchParams(location.search);
const tokenParam = extractToken(params.get("token") ?? "");
if (tokenParam && !location.hash.startsWith("#/ticker/")) {
  history.replaceState(null, "", `${location.pathname}${isDemo ? "?demo=1" : ""}#/ticker/${tokenParam}`);
}
if (isDemo) document.body.classList.add("demo");

prune();
show();

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
