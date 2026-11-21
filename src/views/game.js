// Spielansicht mit Liveticker (T1/T2), ergänzt um Spieldaten aus der Wochenübersicht (S1).
import { h, mount } from "../dom.js";
import { config } from "../../config.js";
import { api, tickerPageUrl } from "../h4a.js";
import { parseClubWeek } from "../parse-club.js";
import { parseInfo, parseMessages } from "../parse-ticker.js";
import { deriveState, displayClock, stats } from "../clock.js";
import { fmtClock, fmtDay, fmtTime, sameDay } from "../util.js";
import { getSetting, setSetting } from "../store.js";
import { knownGame, gameRef, rememberGames, mondayOf } from "../games.js";
import { setWake, wakeActive, wakeSupported } from "../wake.js";
import { freshness, errorBox, sourceFooter, leagueBadge } from "./common.js";

const PHASE = {
  pre: "vor dem Spiel",
  first: "1. Halbzeit",
  halftime: "Halbzeit",
  second: "2. Halbzeit",
  finished: "Spielende",
};

const LIVE_PHASES = new Set(["first", "halftime", "second"]);
const seenAt = new Map(); // token → Map(seq → Zeitpunkt, an dem das Ereignis neu war)

export function createGameView(root, params) {
  let game = params.id ? knownGame(params.id) : null;
  let token = params.token ?? game?.token ?? (params.id ? gameRef(params.id)?.token : null) ?? null;
  let info = null;
  let events = [];
  let state = null;
  let tickerRes = null;
  let s1At = 0;
  let error = null;
  let tab = getSetting("gameTab", "events");
  let showAll = false;
  const fresh = freshness();
  let clockEl = null;
  let listEl = null;

  const halfSec = () => {
    const ht = events.find((e) => e.type === "halftime");
    if (ht && ht.t > 0) return Math.round(ht.t / 60) * 60;
    const age = game?.league?.ageGroup;
    return (config.halfLengthByAge[age] ?? 30) * 60;
  };

  async function loadS1(weekStart) {
    const res = await api.clubWeek(weekStart);
    const week = parseClubWeek(res.data, config);
    rememberGames(week.games);
    return { week, res };
  }

  async function refreshGame() {
    // Spieldaten (Status, Token, offizieller Stand) höchstens jede Minute aus S1 holen.
    if (Date.now() - s1At < config.poll.weekLiveSec * 1000 && game) return;
    const id = params.id ?? info?.gameId;
    if (!id) return;
    const ref = gameRef(id);
    const kickoff = game?.kickoff ?? (ref?.kickoff ? new Date(ref.kickoff) : info?.kickoff ?? null);
    try {
      const { week } = await loadS1(kickoff ? mondayOf(kickoff) : undefined);
      const found = week.games.find((g) => g.id === id);
      if (found) game = found;
      s1At = Date.now();
    } catch (e) {
      if (!game && !token) throw e;
    }
    if (game?.token) token = game.token;
  }

  async function refreshTicker() {
    if (!token) return;
    if (!info) {
      const r = await api.tickerInfo(token);
      info = parseInfo(r.data);
    }
    tickerRes = await api.tickerMessages(token);
    const next = parseMessages(tickerRes.data);
    markNew(next);
    events = next;
    state = deriveState(events, halfSec());
  }

  function markNew(next) {
    let m = seenAt.get(token);
    const first = !m;
    if (!m) { m = new Map(); seenAt.set(token, m); }
    let ownGoal = false;
    for (const e of next) {
      if (m.has(e.seq)) continue;
      m.set(e.seq, first ? 0 : Date.now());
      if (!first && (e.type === "goal" || e.type === "penaltyGoal") && e.side === ownSide()) ownGoal = true;
    }
    if (ownGoal && getSetting("vibrate", true)) navigator.vibrate?.(120);
  }

  function ownSide() {
    if (game?.isHome === true) return "home";
    if (game?.isHome === false) return "away";
    const re = config.clubShortMatch;
    if (info && re.test(info.home)) return "home";
    if (info && re.test(info.away)) return "away";
    return null;
  }

  function phase() {
    if (game && !game.live && game.points) return "finished";
    if (state) return state.phase;
    if (game?.status === "finished") return "finished";
    return "pre";
  }

  function nextDelay() {
    const p = phase();
    if (p === "finished") return null;
    if (token && LIVE_PHASES.has(p)) return config.poll.tickerSec;
    const kick = game?.kickoff ?? info?.kickoff;
    if (!kick) return token ? config.poll.tickerPreSec : null;
    const diffMin = (kick - Date.now()) / 60000;
    if (diffMin <= 30 && diffMin > -180) return config.poll.tickerPreSec;
    if (sameDay(kick, new Date()) && diffMin > 0) return config.poll.weekGameDaySec;
    return null;
  }

  // ---------- Darstellung ----------

  function names() {
    return {
      home: info?.home ?? game?.home ?? "Heim",
      away: info?.away ?? game?.away ?? "Gast",
    };
  }

  function currentScore() {
    const p = phase();
    if (p === "finished" && game?.score) return game.score;
    if (state && events.length) return state.score;
    return game?.score ?? null;
  }

  function scoreboard() {
    const n = names();
    const own = ownSide();
    const sc = currentScore();
    const p = phase();
    const ht = state?.halftime ?? game?.halftime;
    let lead = "";
    if (sc && own) {
      const o = own === "home" ? sc.home - sc.away : sc.away - sc.home;
      lead = o > 0 ? "win" : o < 0 ? "loss" : "draw";
    }
    clockEl = h("span", { class: "clock" }, "");
    updateClock();
    const kick = game?.kickoff ?? info?.kickoff;
    const officialDiff = p === "finished" && game?.score && state && events.length &&
      (game.score.home !== state.score.home || game.score.away !== state.score.away);
    return h("section", { class: `scoreboard ${LIVE_PHASES.has(p) ? "is-live" : ""}` },
      h("div", { class: "sb-teams" },
        h("div", { class: "sb-team" + (own === "home" ? " own" : "") }, n.home),
        h("div", { class: "sb-team" + (own === "away" ? " own" : "") }, n.away)),
      h("div", { class: `sb-score ${lead}` },
        sc ? [h("span", {}, String(sc.home)), h("span", { class: "colon" }, ":"), h("span", {}, String(sc.away))]
           : h("span", { class: "sb-pending" }, kick ? fmtTime(kick) : "–")),
      h("div", { class: "sb-phase" },
        LIVE_PHASES.has(p) ? h("span", { class: "dot" }) : null,
        h("span", {}, PHASE[p]),
        token && state && p !== "pre" && p !== "finished" ? clockEl : null),
      ht ? h("div", { class: "sb-ht" }, `Halbzeit ${ht.home} : ${ht.away}`) : null,
      officialDiff ? h("div", { class: "sb-note" }, "Endstand laut Verband") : null,
      p === "pre" && kick ? h("div", { class: "sb-ht" }, `${fmtDay(kick)} ${fmtTime(kick)} Uhr`) : null,
      fresh.el,
    );
  }

  function updateClock() {
    if (!clockEl || !state) return;
    const live = !tickerRes?.offline && Date.now() - (tickerRes?.savedAt ?? 0) < 120_000;
    const sec = live ? displayClock(state, tickerRes?.savedAt, Date.now(), halfSec()) : state.clockSec;
    clockEl.textContent = (state.clockRunning && live ? "" : "⏸ ") + fmtClock(sec);
    clockEl.className = "clock" + (state.clockRunning && live ? "" : " stopped");
  }

  function controls() {
    const btns = [];
    if (wakeSupported) {
      btns.push(h("button", {
        class: "pill" + (wakeActive() ? " on" : ""),
        "aria-pressed": wakeActive() ? "true" : "false",
        onclick: async () => { await setWake(!wakeActive()); setSetting("wake", wakeActive()); render(); },
      }, "☀ Bildschirm an"));
    }
    btns.push(h("button", { class: "pill", onclick: share }, "⤴ Teilen"));
    return h("div", { class: "controls" }, btns);
  }

  async function share() {
    const n = names();
    const url = location.href;
    const title = `${n.home} – ${n.away}`;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); alert("Link kopiert"); }
    } catch { /* abgebrochen */ }
  }

  function tabs() {
    const t = (k, label) => h("button", {
      class: k === tab ? "active" : "", role: "tab", "aria-selected": k === tab ? "true" : "false",
      onclick: () => { tab = k; setSetting("gameTab", k); render(); },
    }, label);
    return h("div", { class: "segmented", role: "tablist" }, t("events", "Verlauf"), t("stats", "Statistik"));
  }

  function eventText(e) {
    const nr = e.number ? ` · Nr. ${e.number}` : "";
    switch (e.type) {
      case "goal": return "Tor" + nr;
      case "penaltyGoal": return "7m-Tor" + nr;
      case "penaltyMissed": return "7m verworfen" + nr;
      case "warning": return "Verwarnung" + nr;
      case "suspension": return "2 Minuten" + nr;
      case "disqualification": return "Disqualifikation" + nr;
      case "timeout": return "Auszeit";
      case "clockStart": return "Spielzeit läuft";
      case "clockStop": return "Spielzeit gestoppt";
      default: return e.raw;
    }
  }

  const ICON = { goal: "●", penaltyGoal: "◎", penaltyMissed: "⊘", warning: "▮", suspension: "⏱",
    disqualification: "▮", timeout: "T", clockStart: "▶", clockStop: "⏸", other: "•" };

  function eventList() {
    if (!token) {
      return h("div", { class: "empty" },
        phase() === "finished"
          ? "Kein Liveticker gespeichert. Handball4All nennt den Ticker nur während des Spiels – wer ihn live geöffnet hatte, findet ihn hier auch danach. Alternativ den Ticker-Link auf der Startseite einfügen."
          : "Sobald der Liveticker startet, erscheint er hier automatisch.");
    }
    if (!events.length) return h("div", { class: "empty" }, "Der Ticker hat noch keine Ereignisse.");
    const n = names();
    const own = ownSide();
    const m = seenAt.get(token);
    const now = Date.now();
    const rows = [];
    for (const e of [...events].reverse()) {
      if (e.type === "halftime" || e.type === "fullTime") {
        rows.push(h("li", { class: "ev-sep" }, `${e.type === "halftime" ? "Halbzeit" : "Spielende"} ${e.home} : ${e.away}`));
        continue;
      }
      if (!showAll && (e.type === "clockStart" || e.type === "clockStop")) continue;
      const isGoal = e.type === "goal" || e.type === "penaltyGoal";
      const fresh = m && m.get(e.seq) && now - m.get(e.seq) < 5000;
      rows.push(h("li", { class: `ev ev-${e.type} ${e.side ?? ""} ${e.side && e.side === own ? "own" : ""} ${fresh ? "new" : ""}` },
        h("span", { class: "ev-time" }, fmtClock(e.t)),
        h("span", { class: "ev-icon", "aria-hidden": "true" }, ICON[e.type] ?? "•"),
        h("span", { class: "ev-body" },
          h("span", { class: "ev-text" }, eventText(e)),
          e.side ? h("span", { class: "ev-team" }, e.side === "home" ? n.home : n.away) : null),
        h("span", { class: "ev-score" + (isGoal ? "" : " muted") }, `${e.home}:${e.away}`)));
    }
    return h("div", {},
      h("label", { class: "toggle" },
        h("input", { type: "checkbox", checked: showAll, onchange: (ev) => { showAll = ev.target.checked; render(); } }),
        " Spielzeit-Meldungen zeigen"),
      listEl = h("ol", { class: "events" }, rows));
  }

  function statsView() {
    if (!events.length) return h("div", { class: "empty" }, "Noch keine Statistik.");
    const s = stats(events);
    const n = names();
    const row = (label, a, b) => h("tr", {}, h("td", { class: "num" }, a), h("th", { scope: "row" }, label), h("td", { class: "num" }, b));
    const scorers = (side) => Object.entries(s[side].scorers)
      .sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))
      .map(([nr, c]) => h("li", {}, h("span", { class: "nr" }, `Nr. ${nr}`), h("span", {}, `${c} ${c === 1 ? "Tor" : "Tore"}`)));
    return h("div", { class: "stats" },
      h("table", { class: "stat-table" },
        h("thead", {}, h("tr", {}, h("th", {}, n.home), h("th", {}), h("th", {}, n.away))),
        h("tbody", {},
          row("Tore", s.home.goals, s.away.goals),
          row("7-Meter", `${s.home.penaltyGoals}/${s.home.penalties}`, `${s.away.penaltyGoals}/${s.away.penalties}`),
          row("Verwarnungen", s.home.warnings, s.away.warnings),
          row("2 Minuten", s.home.suspensions, s.away.suspensions),
          row("Disqualifikationen", s.home.disqualifications, s.away.disqualifications),
          row("Auszeiten", s.home.timeouts, s.away.timeouts))),
      h("div", { class: "scorers" },
        h("div", {}, h("h3", {}, n.home), h("ul", {}, scorers("home"))),
        h("div", {}, h("h3", {}, n.away), h("ul", {}, scorers("away")))),
      h("p", { class: "fineprint" }, "Aus Datenschutzgründen werden nur Trikotnummern angezeigt."));
  }

  function infoBox() {
    const v = game?.venue ?? info?.venue;
    const addr = [v?.street, [v?.postal, v?.town].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    const kick = game?.kickoff ?? info?.kickoff;
    const items = [];
    if (kick) items.push(h("li", {}, h("span", { class: "k" }, "Anwurf"), h("span", {}, `${fmtDay(kick)} ${fmtTime(kick)} Uhr`)));
    if (v?.name) {
      const q = encodeURIComponent([v.name, addr || v.town].filter(Boolean).join(", "));
      items.push(h("li", {}, h("span", { class: "k" }, "Halle"),
        h("a", { href: `https://maps.apple.com/?q=${q}`, target: "_blank", rel: "noopener" }, [v.name, v.town].filter(Boolean).join(", "))));
    }
    if (game?.league?.id) {
      items.push(h("li", {}, h("span", { class: "k" }, "Staffel"),
        h("a", { href: `#/staffel/${game.league.id}` }, game.league.long || leagueBadge(game.league))));
    }
    if (game?.no) items.push(h("li", {}, h("span", { class: "k" }, "Spiel-Nr."), h("span", {}, game.no)));
    if (game?.reportUrl) items.push(h("li", {}, h("span", { class: "k" }, "Bericht"), h("a", { href: game.reportUrl, target: "_blank", rel: "noopener" }, "Spielbericht (PDF)")));
    if (token) items.push(h("li", {}, h("span", { class: "k" }, "Quelle"), h("a", { href: tickerPageUrl(token), target: "_blank", rel: "noopener" }, "Original-Ticker")));
    return h("ul", { class: "info-list" }, items);
  }

  function render() {
    const back = h("header", { class: "topbar slim" },
      h("a", { class: "back", href: game?.kickoff ? `#/woche/${mondayOf(game.kickoff)}` : "#/woche" }, "‹ Woche"),
      game?.league ? h("span", { class: "badge" }, leagueBadge(game.league)) : null,
      h("button", { class: "icon-btn", "aria-label": "Aktualisieren", onclick: () => window.app.refreshNow() }, "⟳"));
    if (!game && !token) {
      mount(root, back, error
        ? errorBox(`Spiel nicht gefunden: ${error.message}`, () => window.app.refreshNow())
        : h("div", { class: "loading" }, "Lade Spiel …"));
      return;
    }
    if (token && !info && !events.length && error) {
      mount(root, back, scoreboard(), errorBox(`Ticker konnte nicht geladen werden: ${error.message}`, () => window.app.refreshNow()), infoBox());
      return;
    }
    mount(root, back, scoreboard(), controls(), tabs(),
      h("main", {}, tab === "stats" ? statsView() : eventList()),
      infoBox(), sourceFooter());
  }

  // gespeicherten Wunsch "Bildschirm an" übernehmen
  if (getSetting("wake", false) && !wakeActive()) setWake(true);

  return {
    async refresh() {
      error = null;
      try {
        await refreshGame();
        await refreshTicker();
        if (token && !info && !events.length && !game) throw new Error("Für diesen Link gibt es (noch) keine Tickerdaten");
        if (info && !game && !params.id) {
          // Direktlink mit Token: Spiel in der Vereinsübersicht suchen, um Staffel/Halle zu ergänzen.
          params = { ...params, id: info.gameId };
          await refreshGame().catch(() => {});
        }
        const delay = nextDelay();
        fresh.set(tickerRes ?? { savedAt: Date.now() }, delay ? delay * 2 : 0);
        render();
        if (tickerRes?.offline) throw tickerRes.error;
        return delay;
      } catch (e) {
        error = e;
        render();
        fresh.markError(e);
        throw e;
      }
    },
    tick() {
      updateClock();
      fresh.tick();
      if (listEl?.querySelector(".ev.new")) {
        const m = seenAt.get(token);
        if (m && [...m.values()].every((t) => Date.now() - t > 5000)) listEl.querySelectorAll(".ev.new").forEach((x) => x.classList.remove("new"));
      }
    },
    destroy() { setWake(false); },
  };
}
