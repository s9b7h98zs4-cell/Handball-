// "Bildschirm an lassen" über die Screen Wake Lock API (Safari ab iOS 16.4).
let sentinel = null;
let wanted = false;

export const wakeSupported = "wakeLock" in navigator;

async function acquire() {
  if (!wanted || !wakeSupported || document.visibilityState !== "visible") return;
  try {
    sentinel = await navigator.wakeLock.request("screen");
    sentinel.addEventListener("release", () => { sentinel = null; });
  } catch {
    sentinel = null;
  }
}

export async function setWake(on) {
  wanted = on;
  if (on) await acquire();
  else if (sentinel) { try { await sentinel.release(); } catch { /* egal */ } sentinel = null; }
}

export function wakeActive() {
  return wanted;
}

// Safari gibt die Sperre beim Verlassen der Seite frei → beim Zurückkehren neu anfordern.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && wanted && !sentinel) acquire();
});
