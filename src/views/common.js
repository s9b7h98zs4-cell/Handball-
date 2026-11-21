// Gemeinsame Bausteine der Ansichten.
import { h } from "../dom.js";
import { fmtAgo, fmtTime, fmtClock, sameDay } from "../util.js";
import { outcome } from "../parse-games.js";

/** Kurzbezeichnung einer Staffel für Plaketten: "gD-BK-1-NA" → "gD". */
export function leagueBadge(league) {
  const s = league?.short ?? "";
  const first = s.split("-")[0];
  if (/^[mwg][A-F]$/.test(first)) return first;
  if (first === "M") return "Männer";
  if (first === "F") return "Frauen";
  return first || "?";
}

export function statusChip(game, now = new Date()) {
  switch (game.status) {
    case "live": return h("span", { class: "chip live" }, h("span", { class: "dot" }), "LIVE");
    case "finished": return null;
    case "cancelled": return h("span", { class: "chip warn" }, "abgesagt");
    case "postponed": return h("span", { class: "chip warn" }, "verlegt");
    case "open": return h("span", { class: "chip muted" }, "Ergebnis offen");
    default:
      return game.kickoff && sameDay(game.kickoff, now) ? h("span", { class: "chip today" }, "heute") : null;
  }
}

function team(name, own) {
  return h("span", { class: "team" + (own ? " own" : "") }, name);
}

/** Spielzeile für Wochenübersicht und Spielplan. */
export function gameRow(game, { showBadge = true, showDate = false, href } = {}) {
  const res = outcome(game);
  const score = game.score
    ? h("span", { class: `score ${game.status === "live" ? "is-live" : res ?? ""}` },
        `${game.score.home}:${game.score.away}`)
    : h("span", { class: "score pending" }, "–:–");
  const venue = [game.venue?.name, game.venue?.town].filter(Boolean).join(", ");
  return h("a", { class: "game-row" + (game.status === "live" ? " live" : ""), href: href ?? `#/spiel/${game.id}` },
    h("div", { class: "meta" },
      showBadge ? h("span", { class: "badge" }, leagueBadge(game.league)) : null,
      h("span", { class: "time" }, showDate && game.kickoff ? `${dayShort(game.kickoff)} ${fmtTime(game.kickoff)}` : game.kickoff ? fmtTime(game.kickoff) : ""),
      statusChip(game),
      game.halftime ? h("span", { class: "ht" }, `HZ ${game.halftime.home}:${game.halftime.away}`) : null,
    ),
    h("div", { class: "teams" },
      h("div", { class: "names" }, team(game.home, game.isHome === true), h("span", { class: "sep" }, "–"), team(game.away, game.isHome === false)),
      score,
    ),
    venue ? h("div", { class: "venue" }, venue) : null,
    game.comment ? h("div", { class: "comment" }, game.comment) : null,
  );
}

function dayShort(d) {
  const wd = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d.getDay()];
  return `${wd} ${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.`;
}

/** Zeile „Aktualisiert vor …“ mit Offline-/Warnhinweis. Wird jede Sekunde neu beschriftet. */
export function freshness() {
  const el = h("div", { class: "freshness", "aria-live": "polite" });
  let savedAt = 0, offline = false, warnAfter = 0, error = null;
  const render = () => {
    if (!savedAt) { el.textContent = ""; el.className = "freshness"; return; }
    const age = Date.now() - savedAt;
    if (offline) {
      el.className = "freshness bad";
      el.textContent = `Offline – Stand ${fmtTime(new Date(savedAt))} Uhr${error ? ` (${error})` : ""}`;
    } else if (warnAfter && age > warnAfter * 1000) {
      el.className = "freshness warn";
      el.textContent = `Aktualisiert ${fmtAgo(age)} – Verbindung prüfen`;
    } else {
      el.className = "freshness";
      el.textContent = `Aktualisiert ${fmtAgo(age)}`;
    }
  };
  return {
    el,
    set(result, warnSec) {
      savedAt = result?.savedAt ?? 0;
      offline = !!result?.offline;
      error = result?.error?.message ?? null;
      warnAfter = warnSec ?? 0;
      render();
    },
    markError(e) {
      offline = true;
      error = e?.message ?? null;
      render();
    },
    tick: render,
  };
}

export function errorBox(message, retry) {
  return h("div", { class: "error-box" },
    h("p", {}, message),
    retry ? h("button", { class: "btn", onclick: retry }, "Erneut versuchen") : null,
  );
}

export function sourceFooter(extra) {
  return h("footer", { class: "source" },
    "Daten: ", h("a", { href: "https://www.handball4all.de/", target: "_blank", rel: "noopener" }, "Handball4All AG"),
    extra ? [" · ", extra] : null,
  );
}

export { fmtClock };
