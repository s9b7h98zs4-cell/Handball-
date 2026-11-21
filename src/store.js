// Lokale Speicherung im Browser. Alle Zugriffe sind abgesichert (privater Modus, voller Speicher).
const PREFIX = "nl:";
const MAX_AGE_MS = 60 * 24 * 3600 * 1000;

export function load(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && typeof v === "object" && "savedAt" in v ? v : null;
  } catch {
    return null;
  }
}

export function save(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Speicher voll oder gesperrt: alte Einträge entfernen und einmal erneut versuchen.
    prune(7 * 24 * 3600 * 1000);
    try { localStorage.setItem(PREFIX + key, JSON.stringify({ savedAt: Date.now(), data })); } catch { /* egal */ }
  }
}

export function getSetting(name, fallback) {
  const v = load("set:" + name);
  return v ? v.data : fallback;
}

export function setSetting(name, value) {
  save("set:" + name, value);
}

/** Entfernt zwischengespeicherte Daten, die älter als maxAge sind (Einstellungen bleiben). */
export function prune(maxAge = MAX_AGE_MS) {
  try {
    const now = Date.now();
    const remove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(PREFIX) || k.startsWith(PREFIX + "set:")) continue;
      try {
        const v = JSON.parse(localStorage.getItem(k));
        if (!v?.savedAt || now - v.savedAt > maxAge) remove.push(k);
      } catch {
        remove.push(k);
      }
    }
    remove.forEach((k) => localStorage.removeItem(k));
  } catch { /* egal */ }
}
