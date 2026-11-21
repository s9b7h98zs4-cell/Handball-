// Staffelansicht: Tabelle und Saisonspielplan (S3).
import { h, mount } from "../dom.js";
import { config } from "../../config.js";
import { api } from "../h4a.js";
import { parseLeague } from "../parse-league.js";
import { getSetting, setSetting } from "../store.js";
import { fmtMonth } from "../util.js";
import { gameRow, freshness, errorBox, sourceFooter } from "./common.js";
import { rememberGames } from "../games.js";

export function createLeagueView(root, { id }) {
  let data = null;
  let error = null;
  let tab = getSetting("leagueTab", "table");
  let onlyMine = getSetting("leagueMine", true);
  let scrolled = false;
  const fresh = freshness();

  function table() {
    const rows = data.table.map((r, i) => {
      const prevRank = i > 0 ? data.table[i - 1].rank : null;
      const rank = r.rank ?? prevRank;
      const diff = r.goalsFor - r.goalsAgainst;
      return h("tr", { class: r.own ? "own" : "" },
        h("td", { class: "num rank" }, r.rank === null ? "" : String(rank)),
        h("td", { class: "team-cell" }, r.name),
        h("td", { class: "num" }, r.played),
        h("td", { class: "num hide-xs" }, `${r.won}-${r.drawn}-${r.lost}`),
        h("td", { class: "num hide-xs" }, `${r.goalsFor}:${r.goalsAgainst}`),
        h("td", { class: "num" }, diff > 0 ? `+${diff}` : String(diff)),
        h("td", { class: "num pts" }, `${r.pointsPlus}:${r.pointsMinus}`));
    });
    const live = data.games.some((g) => g.status === "live");
    return h("div", {},
      h("div", { class: "table-wrap" },
        h("table", { class: "standings" },
          h("thead", {}, h("tr", {},
            h("th", { class: "num", title: "Platz" }, "Pl."), h("th", {}, "Mannschaft"), h("th", { class: "num", title: "Spiele" }, "Sp"),
            h("th", { class: "num hide-xs" }, "S-U-N"), h("th", { class: "num hide-xs" }, "Tore"),
            h("th", { class: "num", title: "Tordifferenz" }, "Diff"), h("th", { class: "num" }, "Pkt"))),
          h("tbody", {}, rows))),
      live ? h("p", { class: "fineprint" }, "Laufende Spiele sind noch nicht eingerechnet.") : null,
      data.comments.map((c) => h("p", { class: "fineprint pre" }, c)));
  }

  function schedule() {
    const games = onlyMine ? data.games.filter((g) => g.isHome !== null) : data.games;
    const now = Date.now();
    const next = games.find((g) => g.kickoff && g.kickoff.getTime() + 2 * 3600_000 > now);
    const months = new Map();
    for (const g of games) {
      const k = g.kickoff ? fmtMonth(g.kickoff) : "ohne Termin";
      if (!months.has(k)) months.set(k, []);
      months.get(k).push(g);
    }
    return h("div", {},
      h("label", { class: "toggle" },
        h("input", { type: "checkbox", checked: onlyMine, onchange: (e) => { onlyMine = e.target.checked; setSetting("leagueMine", onlyMine); scrolled = false; render(); } }),
        ` Nur Spiele ${config.clubName}`),
      [...months].map(([label, list]) => h("section", {},
        h("h2", { class: "section-title" }, label),
        list.map((g) => {
          const row = gameRow(g, { showBadge: false, showDate: true });
          if (g === next) { row.classList.add("next"); row.id = "next-game"; }
          return row;
        }))),
      !games.length ? h("div", { class: "empty" }, "Keine Spiele gefunden.") : null);
  }

  function render() {
    const header = h("header", { class: "topbar slim" },
      h("a", { class: "back", href: "#/woche" }, "‹ Woche"),
      h("span", { class: "badge" }, data?.league?.short ?? ""),
      h("button", { class: "icon-btn", "aria-label": "Aktualisieren", onclick: () => window.app.refreshNow(true) }, "⟳"));
    if (!data) {
      mount(root, header, error ? errorBox(`Staffel konnte nicht geladen werden: ${error.message}`, () => window.app.refreshNow(true))
                                : h("div", { class: "loading" }, "Lade Staffel …"));
      return;
    }
    const t = (k, label) => h("button", {
      class: k === tab ? "active" : "", role: "tab", "aria-selected": k === tab ? "true" : "false",
      onclick: () => { tab = k; setSetting("leagueTab", k); scrolled = false; render(); },
    }, label);
    mount(root, header,
      h("div", { class: "league-head" }, h("h1", {}, data.league.long), data.region ? h("div", { class: "subtitle" }, data.region) : null),
      h("div", { class: "segmented", role: "tablist" }, t("table", "Tabelle"), t("schedule", "Spielplan")),
      fresh.el,
      h("main", {}, tab === "table" ? table() : schedule()),
      sourceFooter(data.updated || null));
    if (tab === "schedule" && !scrolled) {
      scrolled = true;
      requestAnimationFrame(() => document.getElementById("next-game")?.scrollIntoView({ block: "center" }));
    }
  }

  return {
    async refresh(force = false) {
      try {
        // Saisondaten ändern sich selten: höchstens stündlich laden, außer es läuft ein Spiel.
        const liveBefore = data?.games.some((g) => g.status === "live");
        const res = await api.league(id, force || liveBefore ? 0 : config.poll.leagueMaxAgeSec);
        data = parseLeague(res.data, config);
        rememberGames(data.games);
        error = null;
        const live = data.games.some((g) => g.status === "live");
        if (live && res.fromCache && !res.offline) {
          const fresh2 = await api.league(id, 0);
          data = parseLeague(fresh2.data, config);
          fresh.set(fresh2, config.poll.weekLiveSec * 2);
        } else {
          fresh.set(res, live ? config.poll.weekLiveSec * 2 : 0);
        }
        render();
        if (res.offline) throw res.error;
        return live ? config.poll.weekLiveSec : null;
      } catch (e) {
        error = e;
        render();
        fresh.markError(e);
        throw e;
      }
    },
    tick() { fresh.tick(); },
    destroy() {},
  };
}
