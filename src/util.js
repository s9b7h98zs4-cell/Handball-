// Kleine, DOM-freie Hilfsfunktionen (auch in Node-Tests nutzbar).

/** Trimmt Texte; leere Werte (H4A liefert " ") werden zu null. */
export function val(x) {
  if (x === undefined || x === null) return null;
  if (typeof x === "string") {
    const t = x.trim();
    return t === "" ? null : t;
  }
  return x;
}

/** Wandelt einen H4A-Wert in eine Zahl um, sonst null. */
export function num(x) {
  const v = val(x);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** "21.11.26" + "14:00" → Date (Ortszeit des Geräts, gedacht für Europe/Berlin). */
export function parseH4ADate(d, t) {
  const dm = /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/.exec(val(d) ?? "");
  if (!dm) return null;
  let year = Number(dm[3]);
  if (year < 100) year += 2000;
  const tm = /^(\d{1,2}):(\d{2})/.exec(val(t) ?? "");
  const h = tm ? Number(tm[1]) : 0;
  const m = tm ? Number(tm[2]) : 0;
  return new Date(year, Number(dm[2]) - 1, Number(dm[1]), h, m);
}

/** "2026-11-21 14:00:00" → Date (Ortszeit). */
export function parseIsoLocal(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(val(s) ?? "");
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
}

/** Sekunden → "mm:ss". */
export function fmtClock(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Entfernt HTML aus Quelltexten; <br> wird zum Zeilenumbruch. */
export function stripHtml(s) {
  return String(s ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

/** Datum als JJJJ-MM-TT (Ortszeit). */
export function isoDay(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function sameDay(a, b) {
  return isoDay(a) === isoDay(b);
}

const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August",
  "September", "Oktober", "November", "Dezember"];

export function fmtDay(date) {
  const d = new Date(date);
  return `${WD[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.`;
}

export function fmtTime(date) {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function fmtMonth(date) {
  const d = new Date(date);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "vor 8 s", "vor 3 min" … */
export function fmtAgo(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `vor ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `vor ${m} min`;
  const h = Math.round(m / 60);
  return `vor ${h} h`;
}

/** Liest Altersklasse und Geschlecht aus einem Staffelkürzel wie "gD-BK-1-NA". */
export function ageFromShort(short) {
  const m = /^([mwg])([A-F])-/.exec(val(short) ?? "");
  if (m) return { gender: m[1], ageGroup: m[2], youth: true };
  const a = /^([MF])-/.exec(val(short) ?? "");
  if (a) return { gender: a[1] === "M" ? "m" : "w", ageGroup: a[1] === "M" ? "M" : "W", youth: false };
  return { gender: null, ageGroup: null, youth: false };
}

/** Extrahiert einen Ticker-Token aus einem Link oder nimmt einen nackten Token. */
export function extractToken(input) {
  const s = String(input ?? "").trim();
  const m = /(?:[?&#]token=)?([0-9a-f]{32})(?![0-9a-f])/i.exec(s);
  return m ? m[1].toLowerCase() : null;
}
