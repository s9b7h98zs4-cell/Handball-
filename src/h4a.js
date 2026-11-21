// Abrufe der Handball4All-Schnittstellen (S1–S3, T1–T2) mit lokalem Zwischenspeicher.
import { config } from "../config.js";
import { load, save } from "./store.js";
import { demoSource } from "./demo.js";

const DEMO = new URLSearchParams(location.search).has("demo");
export const isDemo = DEMO;

const inflight = new Map();

async function fetchJSON(url, method = "GET") {
  // Gleiche Anfrage nicht doppelt parallel stellen.
  const key = method + " " + url;
  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10_000);
    try {
      const res = await fetch(url, { method, signal: ctrl.signal, cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error("Ungültige Antwort der Quelle");
      }
    } catch (e) {
      if (e.name === "AbortError") throw new Error("Zeitüberschreitung");
      throw e;
    } finally {
      clearTimeout(timer);
    }
  })();
  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

const g = (params) => `${config.api.g}?${new URLSearchParams(params)}`;
const t = (token, cmd) => `${config.api.ticker}?${new URLSearchParams({ token, cmd })}`;

/**
 * Holt Daten und speichert sie. Bei Fehlern wird der letzte Stand geliefert (offline: true).
 * maxAgeSec > 0: ein frischer Cache-Eintrag wird ohne Netzabruf verwendet.
 */
async function cached(key, fetcher, maxAgeSec = 0) {
  if (DEMO) key = "demo:" + key; // Demo-Daten nie mit echten Daten mischen
  const c = load(key);
  if (c && maxAgeSec > 0 && Date.now() - c.savedAt < maxAgeSec * 1000) {
    return { data: c.data, savedAt: c.savedAt, offline: false, fromCache: true };
  }
  try {
    const data = await fetcher();
    save(key, data);
    return { data, savedAt: Date.now(), offline: false, fromCache: false };
  } catch (error) {
    if (c) return { data: c.data, savedAt: c.savedAt, offline: true, error, fromCache: true };
    throw error;
  }
}

export function cachedOnly(key) {
  return load(key);
}

const real = {
  clubWeek: (weekStart) =>
    fetchJSON(g({ ca: 0, cmd: "pcu", og: config.orgId, c: config.clubId, ...(weekStart ? { do: weekStart } : {}) })),
  league: (classId) => fetchJSON(g({ ca: 1, cmd: "ps", og: config.orgId, cl: classId })),
  tickerInfo: (token) => fetchJSON(t(token, "getGameInfo"), "POST"),
  tickerMessages: (token) => fetchJSON(t(token, "getAllTickerMessages"), "POST"),
};

const src = DEMO ? demoSource : real;

export const api = {
  clubWeek: (weekStart, maxAgeSec = 0) => cached(`s1:${weekStart || "current"}`, () => src.clubWeek(weekStart), maxAgeSec),
  league: (classId, maxAgeSec = 0) => cached(`s3:${classId}`, () => src.league(classId), maxAgeSec),
  tickerInfo: (token) => cached(`t1:${token}`, () => src.tickerInfo(token), 365 * 24 * 3600),
  tickerMessages: (token) => cached(`t2:${token}`, () => src.tickerMessages(token)),
};

export function tickerPageUrl(token) {
  return `${config.api.tickerPage}?token=${encodeURIComponent(token)}`;
}
