// Service Worker: hält nur die App-Dateien offline bereit.
// Anfragen an Handball4All werden nicht angefasst (die App speichert Daten selbst).
const VERSION = "v2";
const CACHE = `tsv-live-${VERSION}`;
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./config.js",
  "./styles/app.css",
  "./icons/icon.svg",
  "./icons/apple-touch-icon.png",
  "./src/main.js",
  "./src/util.js",
  "./src/dom.js",
  "./src/store.js",
  "./src/h4a.js",
  "./src/demo.js",
  "./src/games.js",
  "./src/wake.js",
  "./src/clock.js",
  "./src/parse-games.js",
  "./src/parse-club.js",
  "./src/parse-league.js",
  "./src/parse-ticker.js",
  "./src/views/common.js",
  "./src/views/week.js",
  "./src/views/game.js",
  "./src/views/league.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("tsv-live-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Eigene Dateien: erst Netz (damit Updates sofort ankommen), offline aus dem Cache.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r ?? caches.match("./index.html"))),
  );
});
