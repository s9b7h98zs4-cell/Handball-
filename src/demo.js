// Demo-Modus (?demo=1): spielt die gespeicherten Daten vom 21.11.2026 im Zeitraffer ab.
// Der Ticker beginnt beim Anpfiff und läuft 30-mal schneller als in echt.
const SPEED = 30;
const DEMO_TOKEN = "539bfbddabe9671f0692bb3e87420e80";
const DEMO_GAME = "9611841";
const started = Date.now();
const base = new URL("../tests/fixtures/", import.meta.url);
const cache = new Map();

async function fixture(name) {
  if (!cache.has(name)) {
    cache.set(name, fetch(new URL(name, base)).then((r) => {
      if (!r.ok) throw new Error("Demo-Daten nicht gefunden");
      return r.json();
    }));
  }
  // Kopie, damit Änderungen den Cache nicht verfälschen.
  return structuredClone(await cache.get(name));
}

function simSeconds() {
  return ((Date.now() - started) / 1000) * SPEED;
}

async function messagesNow() {
  const all = await fixture("game-9611841-messages.json");
  const t = simSeconds();
  const shown = all.filter((m) => Number(m.game_time) <= t);
  const last = all[all.length - 1];
  // Nach dem Ende der Aufzeichnung ein Spielende anhängen, damit auch "beendet" sichtbar wird.
  if (t > 2400 && last) {
    shown.push({ ...last, game_time: "2400", message: "Spielzeit gestoppt", stops_time: true });
    shown.push({ ...last, game_time: "2400", message: "Spielstand 2. Halbzeit", stops_time: true });
  }
  return { shown, finished: t > 2400 };
}

function patchGame(json, apply) {
  const d = Array.isArray(json) ? json[0] : json;
  const blocks = [];
  for (const c of d?.content?.classes ?? []) blocks.push(c);
  if (d?.content?.actualGames && !Array.isArray(d.content.actualGames)) blocks.push(d.content.actualGames);
  if (d?.content?.futureGames && !Array.isArray(d.content.futureGames)) blocks.push(d.content.futureGames);
  for (const b of blocks) for (const g of b.games ?? []) if (g.gID === DEMO_GAME) apply(g);
  return json;
}

async function liveApply() {
  const { shown, finished } = await messagesNow();
  const last = shown[shown.length - 1];
  const ht = shown.find((m) => /^Spielstand 1\. Halbzeit/.test(m.message));
  return (g) => {
    g.live = !finished && shown.length > 0;
    g.gToken = shown.length > 0 || finished ? DEMO_TOKEN : "";
    g.gHomeGoals = last ? last.home_score : " ";
    g.gGuestGoals = last ? last.guest_score : " ";
    g.gHomeGoals_1 = ht ? ht.home_score : " ";
    g.gGuestGoals_1 = ht ? ht.guest_score : " ";
    if (finished && last) {
      const hs = Number(last.home_score), gs = Number(last.guest_score);
      g.gHomePoints = String(hs > gs ? 2 : hs === gs ? 1 : 0);
      g.gGuestPoints = String(gs > hs ? 2 : hs === gs ? 1 : 0);
    } else {
      g.gHomePoints = " ";
      g.gGuestPoints = " ";
    }
  };
}

export const demoSource = {
  async clubWeek(weekStart) {
    const file = weekStart === "2026-11-23" ? "club-260-week-2026-11-23.json" : "club-260-week-2026-11-16.json";
    if (weekStart && !["2026-11-16", "2026-11-23"].includes(weekStart)) {
      throw new Error("Im Demo-Modus gibt es nur die Wochen 16.11. und 23.11.2026");
    }
    const json = await fixture(file);
    return patchGame(json, await liveApply());
  },
  async league(classId) {
    if (classId !== "165421") throw new Error("Im Demo-Modus gibt es nur die gD-Staffel");
    const json = await fixture("league-165421-ca1.json");
    return patchGame(json, await liveApply());
  },
  async tickerInfo(token) {
    if (token !== DEMO_TOKEN) return fixture("invalid-token-info.json");
    return fixture("game-9611841-info.json");
  },
  async tickerMessages(token) {
    if (token !== DEMO_TOKEN) return [];
    return (await messagesNow()).shown;
  },
};
