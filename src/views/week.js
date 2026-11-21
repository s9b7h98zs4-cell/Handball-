// Startseite: Vereins-Wochenübersicht (S1).
import { h, mount } from "../dom.js";
import { config } from "../../config.js";
import { api } from "../h4a.js";
import { parseClubWeek } from "../parse-club.js";
import { getSetting, setSetting } from "../store.js";
import { fmtDay, sameDay, extractToken } from "../util.js";
import { gameRow, freshness, errorBox, sourceFooter } from "./common.js";
import { rememberGames } from "../games.js";

const FILTERS = [
  ["mine", "Meine"],
  ["youth", "Jugend"],
  ["all", "Alle"],
];

export function createWeekView(root, { weekStart } = {}) {
  let week = null;
  let filter = getSetting("filter", "mine");
  const fresh = freshness();
  let lastDelay = null;
  let firstError = null;

  function applyFilter(games) {
    if (filter === "mine") return games.filter((g) => g.league.id === config.favoriteClassId);
    if (filter === "youth") return games.filter((g) => g.league.youth);
    return games;
  }

  function render() {
    const header = h("header", { class: "topbar" },
      h("div", { class: "title" },
        h("h1", {}, week?.clubName || config.clubName),
        h("div", { class: "subtitle" }, filter === "mine" ? config.favoriteLabel : filter === "youth" ? "alle Jugendmannschaften" : "alle Mannschaften"),
      ),
      h("div", { class: "actions" },
        h("a", { class: "icon-btn", href: `#/staffel/${config.favoriteClassId}`, "aria-label": "Tabelle und Spielplan" }, "▤"),
        h("button", { class: "icon-btn", "aria-label": "Aktualisieren", onclick: () => window.app.refreshNow() }, "⟳"),
      ),
    );

    const seg = h("div", { class: "segmented", role: "tablist" },
      FILTERS.map(([k, label]) => h("button", {
        class: k === filter ? "active" : "",
        role: "tab",
        "aria-selected": k === filter ? "true" : "false",
        onclick: () => { filter = k; setSetting("filter", k); render(); },
      }, label)));

    const nav = weekNav();

    if (!week) {
      mount(root, header, seg, nav,
        firstError ? errorBox(`Daten konnten nicht geladen werden: ${firstError.message}`, () => window.app.refreshNow())
                   : h("div", { class: "loading" }, "Lade Spiele …"),
        pasteBox(), sourceFooter());
      return;
    }

    const games = applyFilter(week.games);
    const live = games.filter((g) => g.status === "live");
    const rest = games.filter((g) => g.status !== "live");
    const otherLive = week.games.filter((g) => g.status === "live" && !live.includes(g));

    const sections = [];
    if (live.length) {
      sections.push(h("section", { class: "live-section" },
        h("h2", { class: "section-title live" }, h("span", { class: "dot" }), live.length === 1 ? "Läuft gerade" : `${live.length} Spiele laufen`),
        live.map((g) => gameRow(g))));
    }
    if (otherLive.length) {
      sections.push(h("button", { class: "hint-btn", onclick: () => { filter = "all"; setSetting("filter", "all"); render(); } },
        `● ${otherLive.length} weitere${otherLive.length === 1 ? "s" : ""} Live-Spiel${otherLive.length === 1 ? "" : "e"} im Verein`));
    }
    const byDay = new Map();
    for (const g of rest) {
      const key = g.kickoff ? fmtDay(g.kickoff) : "ohne Termin";
      if (!byDay.has(key)) byDay.set(key, { date: g.kickoff, games: [] });
      byDay.get(key).games.push(g);
    }
    for (const [label, { date, games: list }] of byDay) {
      sections.push(h("section", {},
        h("h2", { class: "section-title" + (date && sameDay(date, new Date()) ? " today" : "") }, label),
        list.map((g) => gameRow(g, { showBadge: filter !== "mine" }))));
    }
    if (!games.length) {
      sections.push(h("div", { class: "empty" },
        filter === "all" ? "Keine Spiele in dieser Woche." : "Keine Spiele in dieser Woche für diesen Filter.",
        filter !== "all" ? h("button", { class: "link-btn", onclick: () => { filter = "all"; setSetting("filter", "all"); render(); } }, "Alle Mannschaften zeigen") : null));
    }

    mount(root, header, seg, nav, fresh.el, h("main", { class: "list" }, sections), pasteBox(),
      sourceFooter(week.updated || null));
  }

  function weekNav() {
    const weeks = week?.weeks ?? [];
    const cur = week?.weekStart;
    const idx = weeks.findIndex((w) => w.start === cur);
    const prev = idx > 0 ? weeks[idx - 1] : null;
    const next = idx >= 0 && idx < weeks.length - 1 ? weeks[idx + 1] : null;
    return h("nav", { class: "week-nav" },
      prev ? h("a", { class: "icon-btn", href: `#/woche/${prev.start}`, "aria-label": "Vorige Woche" }, "‹") : h("span", { class: "icon-btn disabled" }, "‹"),
      h("div", { class: "week-label" }, week?.label ? `Woche ${week.label}` : "Spielwoche",
        weekStart ? h("a", { class: "today-link", href: "#/woche" }, "heute") : null),
      next ? h("a", { class: "icon-btn", href: `#/woche/${next.start}`, "aria-label": "Nächste Woche" }, "›") : h("span", { class: "icon-btn disabled" }, "›"),
    );
  }

  function pasteBox() {
    const input = h("input", { type: "url", inputmode: "url", placeholder: "Ticker-Link einfügen …", "aria-label": "Ticker-Link", autocomplete: "off" });
    const go = () => {
      const token = extractToken(input.value);
      if (token) location.hash = `#/ticker/${token}`;
      else { input.setCustomValidity("Kein gültiger Ticker-Link"); input.reportValidity(); }
    };
    input.addEventListener("input", () => input.setCustomValidity(""));
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    return h("details", { class: "paste" },
      h("summary", {}, "Ticker eines anderen Spiels öffnen"),
      h("div", { class: "paste-row" }, input, h("button", { class: "btn", onclick: go }, "Öffnen")),
      navigator.clipboard?.readText ? h("button", { class: "link-btn", onclick: async () => {
        try { input.value = await navigator.clipboard.readText(); go(); } catch { /* abgelehnt */ }
      } }, "Link aus Zwischenablage") : null);
  }

  function nextDelay() {
    if (!week) return null;
    if (week.games.some((g) => g.status === "live")) return config.poll.weekLiveSec;
    if (week.games.some((g) => g.kickoff && sameDay(g.kickoff, new Date()))) return config.poll.weekGameDaySec;
    return null;
  }

  return {
    async refresh() {
      try {
        const res = await api.clubWeek(weekStart);
        week = parseClubWeek(res.data, config);
        rememberGames(week.games);
        lastDelay = nextDelay();
        fresh.set(res, lastDelay ? lastDelay * 2 : 0);
        render();
        if (res.offline) throw res.error;
        return lastDelay;
      } catch (e) {
        if (!week) firstError = e;
        render();
        fresh.markError(e);
        throw e;
      }
    },
    tick() { fresh.tick(); },
    render,
    destroy() {},
  };
}
