// Estadísticas para la pantalla de Progreso. Todo se calcula desde state.sessions y state.bodyweight.
import { EXERCISES, DAY_KEYS } from "./program.js";
import { exerciseHistory, workingWeight, sessionVolume } from "./calc.js";
import { state, program, sessionWeek } from "./state.js";

// Días (A/B/C) hechos en cada semana del programa: Map<semana, Set<dayKey>>.
export function daysByWeek() {
  const map = new Map();
  for (const s of state.sessions) {
    const w = sessionWeek(s);
    if (w < 1) continue;
    if (!map.has(w)) map.set(w, new Set());
    map.get(w).add(s.dayKey);
  }
  return map;
}

// Semanas completas (3 días) consecutivas hasta la semana actual.
// Si la semana actual aún no está completa, la racha se cuenta desde la anterior (no se "rompe" a mitad de semana).
export function streak() {
  const { week } = program();
  const byWeek = daysByWeek();
  const full = (w) => (byWeek.get(w)?.size || 0) >= DAY_KEYS.length;
  let w = full(week) ? week : week - 1;
  let n = 0;
  while (w >= 1 && full(w)) { n++; w--; }
  return n;
}

export function bestStreak() {
  const byWeek = daysByWeek();
  let best = 0, run = 0;
  const last = Math.max(0, ...byWeek.keys());
  for (let w = 1; w <= last; w++) {
    run = (byWeek.get(w)?.size || 0) >= DAY_KEYS.length ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

// Cumplimiento: días hechos / días esperados en las semanas ya terminadas (3 por semana).
export function adherence() {
  const { week } = program();
  const past = week - 1;
  if (past < 1) return null;
  const byWeek = daysByWeek();
  let done = 0;
  for (let w = 1; w <= past; w++) done += Math.min(DAY_KEYS.length, byWeek.get(w)?.size || 0);
  return Math.round((done / (past * DAY_KEYS.length)) * 100);
}

export function totalVolume() {
  return state.sessions.reduce((v, s) => v + sessionVolume(s), 0);
}

// Volumen total (kg × reps) por semana del programa, de la semana 1 a `upTo`.
export function weeklyVolume(upTo) {
  const vol = new Map();
  for (const s of state.sessions) {
    const w = sessionWeek(s);
    if (w >= 1) vol.set(w, (vol.get(w) || 0) + sessionVolume(s));
  }
  return Array.from({ length: Math.max(0, upTo) }, (_, i) => ({ week: i + 1, volume: Math.round(vol.get(i + 1) || 0) }));
}

// Avance de cada ejercicio entrenado: primera marca, mejor marca, % de mejora y serie para la mini-gráfica.
export function exerciseProgress() {
  const ids = [...new Set(state.sessions.flatMap((s) => (s.exercises || []).map((e) => e.exId)))].filter((id) => EXERCISES[id]);
  return ids.map((id) => {
    const ex = EXERCISES[id];
    const history = exerciseHistory(state.sessions, id);
    const metric = (h) => (ex.type === "weight" ? workingWeight(h.sets) : Math.max(...h.sets.map((s) => Number(s.reps) || 0)));
    const series = history.map(metric);
    const first = series[0] ?? 0;
    let best = -Infinity, bestDate = null;
    history.forEach((h, i) => { if (series[i] > best) { best = series[i]; bestDate = h.date; } });
    const gain = first > 0 ? Math.round(((best - first) / first) * 100) : 0;
    return {
      id, name: ex.name, unit: ex.type === "weight" ? "kg" : ex.type === "time" ? "s" : "reps",
      first, best, bestDate, gain, sessions: history.length, series,
    };
  }).sort((a, b) => b.gain - a.gain || b.sessions - a.sessions);
}

// Logros desbloqueables. `value` y `goal` permiten mostrar el avance de los que faltan.
export function achievements() {
  const { week, total } = program();
  const n = state.sessions.length;
  const byWeek = daysByWeek();
  const fullWeeks = [...byWeek.values()].filter((d) => d.size >= DAY_KEYS.length).length;
  const records = exerciseProgress().filter((e) => e.best > e.first).length;
  const vol = totalVolume();
  const bw = state.bodyweight;
  const lost = bw.length >= 2 ? bw[0].kg - Math.min(...bw.map((b) => b.kg)) : 0;
  const list = [
    { icon: "flag", name: "Primer paso", desc: "Completa tu primer entrenamiento", value: n, goal: 1 },
    { icon: "done", name: "Semana completa", desc: "Haz los 3 días en una semana", value: fullWeeks, goal: 1 },
    { icon: "target", name: "Constancia", desc: "10 entrenamientos", value: n, goal: 10 },
    { icon: "zap", name: "Racha de 4", desc: "4 semanas completas seguidas", value: bestStreak(), goal: 4 },
    { icon: "trophy", name: "Primer récord", desc: "Supera tu marca inicial en un ejercicio", value: records, goal: 1 },
    { icon: "trophy", name: "Coleccionista", desc: "Récords en 10 ejercicios", value: records, goal: 10 },
    { icon: "chart", name: "10 toneladas", desc: "10.000 kg levantados en total", value: Math.round(vol), goal: 10000 },
    { icon: "chart", name: "50 toneladas", desc: "50.000 kg levantados en total", value: Math.round(vol), goal: 50000 },
    { icon: "target", name: "Disciplina", desc: "25 entrenamientos", value: n, goal: 25 },
    { icon: "calendar", name: "Mitad del plan", desc: "Llega a la mitad de tu plan", value: Math.min(week, total), goal: Math.ceil(total / 2) },
  ];
  if (bw.length >= 2 && state.profile.goal !== "ganar músculo") list.push({ icon: "down", name: "Primeros 2 kg", desc: "Baja 2 kg desde tu primer registro de peso", value: Math.round(lost * 10) / 10, goal: 2, unit: " kg" });

  // Segunda tanda: metas de mediano y largo plazo.
  const progress = exerciseProgress();
  const best = (id) => progress.find((p) => p.id === id)?.best || 0;
  const adh = week >= 5 ? adherence() ?? 0 : 0;
  const bodyKg = Math.round(state.profile.weightKg || 0);
  list.push(
    { icon: "timer", name: "Madrugador", desc: "10 entrenamientos antes de las 8:00", value: earlySessions(), goal: 10 },
    { icon: "target", name: "Cumplidor", desc: "90% de los días planificados (desde la semana 5)", value: adh, goal: 90, unit: "%" },
    { icon: "trophy", name: "Día de récords", desc: "3 récords en un mismo entrenamiento", value: maxRecordsInOneSession(), goal: 3 },
    { icon: "timer", name: "Plancha de 1 minuto", desc: "Aguanta 60 s en plancha", value: best("plank"), goal: 60, unit: " s" },
    { icon: "up", name: "Tu propio peso", desc: `Mueve tu peso corporal (${bodyKg} kg) en la prensa`, value: best("leg_press"), goal: bodyKg || 1, unit: " kg" },
    { icon: "up", name: "+50%", desc: "Mejora un 50% tu marca inicial en cualquier ejercicio", value: Math.max(0, ...progress.map((p) => p.gain)), goal: 50, unit: "%" },
    { icon: "calendar", name: "Control de peso", desc: "Registra tu peso corporal 8 veces", value: bw.length, goal: 8 },
    { icon: "zap", name: "Racha de 8", desc: "8 semanas completas seguidas", value: bestStreak(), goal: 8 },
    { icon: "done", name: "Imparable", desc: "50 entrenamientos", value: n, goal: 50 },
    { icon: "chart", name: "100 toneladas", desc: "100.000 kg levantados en total", value: Math.round(vol), goal: 100000 },
    { icon: "flag", name: "Plan completo", desc: "Llega a la última semana de tu plan", value: Math.min(week, total), goal: total },
  );
  return list.map((a) => ({ ...a, unlocked: a.value >= a.goal }));
}

// Entrenamientos registrados en el momento (con duración) que empezaron antes de las 8:00.
function earlySessions() {
  return state.sessions.filter((s) => {
    if (!s.durationMin) return false;
    const start = new Date(new Date(s.date).getTime() - s.durationMin * 60000);
    return start.getHours() < 8;
  }).length;
}

// Mayor cantidad de ejercicios que superaron su mejor peso anterior en un mismo entrenamiento.
function maxRecordsInOneSession() {
  const bestSoFar = new Map();
  let max = 0;
  for (const s of state.sessions) {
    let n = 0;
    for (const e of s.exercises || []) {
      if (EXERCISES[e.exId]?.type !== "weight") continue;
      const done = (e.sets || []).filter((x) => x.done);
      if (!done.length) continue;
      const w = workingWeight(done);
      const prev = bestSoFar.get(e.exId);
      if (prev !== undefined && w > prev) n++;
      if (prev === undefined || w > prev) bestSoFar.set(e.exId, w);
    }
    max = Math.max(max, n);
  }
  return max;
}
