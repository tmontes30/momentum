// Íconos de línea (24×24, trazo currentColor).
const ICONS = {
  back: "M15 18l-6-6 6-6",
  reset: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5",
  swap: "M4 8h15l-4-4M20 16H5l4 4",
  check: "M5 12.5l4.5 4.5L19 7.5",
  close: "M6 6l12 12M18 6L6 18",
  up: "M12 19V5M5.5 11.5L12 5l6.5 6.5",
  flat: "M5 12h14M13 6l6 6-6 6",
  down: "M12 5v14M18.5 12.5L12 19l-6.5-6.5",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16v-4.5M12 8h.01",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
  chart: "M4 19h16M5 15l4.5-4.5 3.5 3.5L19 7M15 7h4v4",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c.8-3.5 3.6-6 7-6s6.2 2.5 7 6M16 3.5a4 4 0 0 1 0 7.5M18.5 15c1.8.9 3 2.9 3.5 6",
  timer: "M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 2.5M9 2h6",
  zap: "M13 2L4 14h8l-1 8 9-12h-8z",
  flag: "M5 21V4M5 4h12l-2.5 4L17 12H5",
  trophy: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3",
  pause: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM10 9v6M14 9v6",
  done: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.5l2.8 2.8L16.5 9.5",
};

export function icon(name, cls = "") {
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;
}

// Marca de Momentum: línea ascendente sobre un cuadrado con degradado.
export function logo(size = 56) {
  return `<svg class="logo" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
    <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f46e5"/><stop offset="1" stop-color="#9333ea"/></linearGradient></defs>
    <rect width="64" height="64" rx="16" fill="url(#lg)"/>
    <path d="M14 44l11-14 8 8 15-18M38 20h10v10" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function toast(msg, ms = 2600) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), ms);
}

export function go(hash) {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent("hashchange"));
  else location.hash = hash;
}

export function fmtDate(iso, opts = { day: "numeric", month: "short" }) {
  return new Date(iso.length <= 10 ? iso + "T00:00:00" : iso).toLocaleDateString("es", opts);
}

export const storage = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin almacenamiento */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* sin almacenamiento */ }
  },
};

// Pequeño "beep" + vibración para el fin del descanso.
export function alertDone() {
  try { navigator.vibrate?.([250, 120, 250]); } catch { /* no soportado */ }
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.6);
  } catch { /* sin audio */ }
}
