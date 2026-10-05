import { weekNumber, weekOf, planOf, phaseFor, DAY_KEYS } from "./program.js";

export const state = {
  user: null,
  profile: null,
  sessions: [],
  bodyweight: [],
};

export function program(today = new Date()) {
  const p = state.profile;
  const week = weekNumber(p.startDate, today);
  const plan = planOf(p);
  return { week, total: plan.total, plan, phase: phaseFor(week, plan) };
}

// Semana del programa a la que pertenece una sesión, según su fecha (≤ 0 si es anterior al inicio del programa).
export function sessionWeek(s) {
  return weekOf(state.profile.startDate, new Date(s.date));
}

export function sortSessions() {
  state.sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Fecha local 'YYYY-MM-DD' de un Date.
export function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function sessionsInWeek(week) {
  return state.sessions.filter((s) => sessionWeek(s) === week);
}

export function nextDay() {
  const { week } = program();
  const done = new Set(sessionsInWeek(week).map((s) => s.dayKey));
  return DAY_KEYS.find((k) => !done.has(k)) || null;
}

export function daysUntil(dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

export function todayISO() {
  return isoDate(new Date());
}

export function addMonthsISO(iso, months) {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Semanas completas (3 entrenamientos) hasta la semana actual.
export function completeWeeks() {
  const byWeek = new Map();
  for (const s of state.sessions) {
    const w = sessionWeek(s);
    if (!byWeek.has(w)) byWeek.set(w, new Set());
    byWeek.get(w).add(s.dayKey);
  }
  let n = 0;
  for (const days of byWeek.values()) if (days.size >= 3) n++;
  return n;
}
