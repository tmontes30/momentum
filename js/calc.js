import { EXERCISES } from "./program.js";

export function ageFrom(birthDate, today = new Date()) {
  const b = new Date(birthDate + "T00:00:00");
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

export function bmi(weightKg, heightCm) {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

export function bmiCategory(value) {
  if (value < 18.5) return "Bajo peso";
  if (value < 25) return "Normal";
  if (value < 30) return "Sobrepeso";
  return "Obesidad";
}

// Mifflin-St Jeor
export function bmr({ sex, weightKg, heightCm, age }) {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "m" ? 5 : -161);
}

const ACTIVITY = 1.45; // 3 días de gimnasio + actividad diaria ligera

const GOAL_ADJUST = { tonificar: -0.1, "bajar grasa": -0.2, "ganar músculo": 0.1 };
const PROTEIN_PER_KG = { tonificar: 1.8, "bajar grasa": 2.0, "ganar músculo": 1.8 };

export function metrics(profile) {
  const age = ageFrom(profile.birthDate);
  const base = bmr({ ...profile, age });
  const tdee = base * ACTIVITY;
  const minKcal = profile.sex === "m" ? 1500 : 1200;
  const target = Math.max(minKcal, tdee * (1 + (GOAL_ADJUST[profile.goal] ?? -0.1)));
  const protein = profile.weightKg * (PROTEIN_PER_KG[profile.goal] ?? 1.8);
  const fat = profile.weightKg * 0.9;
  const carbs = Math.max(0, (target - protein * 4 - fat * 9) / 4);
  const imc = bmi(profile.weightKg, profile.heightCm);
  return {
    age,
    bmi: imc,
    bmiCategory: bmiCategory(imc),
    bmr: Math.round(base),
    tdee: Math.round(tdee),
    kcal: Math.round(target / 10) * 10,
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
    water: Math.round(profile.weightKg * 0.035 * 10) / 10,
  };
}

export function roundTo(value, inc) {
  return Math.round(value / inc) * inc;
}

const FEMALE_FACTOR = { lower: 0.7, upper: 0.5, core: 0.65 };
const LEVEL_FACTOR = { principiante: 1, intermedio: 1.3 };

export function startingLoad(exId, profile) {
  const ex = EXERCISES[exId];
  if (ex.type !== "weight") return null;
  let kg = profile.weightKg * ex.coef;
  if (profile.sex === "f") kg *= FEMALE_FACTOR[ex.region];
  kg *= LEVEL_FACTOR[profile.level] ?? 1;
  const age = ageFrom(profile.birthDate);
  if (age >= 50) kg *= 0.85;
  return Math.max(ex.inc, roundTo(kg, ex.inc));
}

// Entradas previas de un ejercicio: [{ date, week, sets:[{kg,reps,done}] }], de la más antigua a la más reciente.
export function exerciseHistory(sessions, exId) {
  const out = [];
  for (const s of sessions) {
    for (const e of s.exercises || []) {
      if (e.exId === exId) {
        const sets = (e.sets || []).filter((x) => x.done);
        if (sets.length) out.push({ date: s.date, week: s.week, sets });
      }
    }
  }
  return out;
}

export function workingWeight(sets) {
  return Math.max(0, ...sets.map((s) => Number(s.kg) || 0));
}

// Progresión doble: se sube la carga (o las reps / segundos) cuando todas las series llegan al tope del rango.
export function suggestion(exId, history, profile, rx) {
  const ex = EXERCISES[exId];
  const last = history[history.length - 1];

  if (ex.type !== "weight") {
    if (!last) return { kg: null, reps: rx.min, trend: "start", note: `Apunta a ${rx.min}–${rx.max}${ex.type === "time" ? " s" : " reps"}` };
    const best = Math.max(...last.sets.map((s) => Number(s.reps) || 0));
    const target = Math.min(rx.max, best + (ex.type === "time" ? 5 : 1));
    return { kg: null, reps: Math.max(rx.min, target), trend: best >= rx.max ? "up" : "keep",
      note: best >= rx.max ? "¡Tope del rango! Prueba una variante más difícil." : "Supera tu marca anterior" };
  }

  if (!last) {
    return { kg: startingLoad(exId, profile), reps: rx.max, trend: "start",
      note: "Carga inicial estimada: ajústala para que las últimas reps cuesten" };
  }

  const kg = workingWeight(last.sets);
  const hitTop = last.sets.length >= rx.sets && last.sets.every((s) => Number(s.reps) >= rx.max);
  const missed = (h) => h.sets.some((s) => Number(s.reps) < rx.min);

  if (hitTop) {
    return { kg: kg + ex.step, reps: rx.min, trend: "up", note: `¡Subes ${ex.step} kg! Completaste todo al tope la vez pasada` };
  }
  const prev = history[history.length - 2];
  if (missed(last) && prev && missed(prev) && workingWeight(prev.sets) === kg) {
    return { kg: Math.max(ex.inc, roundTo(kg * 0.9, ex.inc)), reps: rx.max, trend: "down",
      note: "Bajamos un poco para consolidar la técnica" };
  }
  return { kg, reps: rx.max, trend: "keep", note: `Mantén ${fmtKg(kg)} kg y busca ${rx.max} reps en todas las series` };
}

export function fmtKg(n) {
  return String(Math.round(n * 100) / 100).replace(".", ",");
}

export function summarizeSets(exId, sets) {
  const ex = EXERCISES[exId];
  if (ex.type === "time") return sets.map((s) => `${s.reps}s`).join(" · ");
  if (ex.type === "bodyweight") return sets.map((s) => `${s.reps}`).join(" · ") + " reps";
  return sets.map((s) => `${fmtKg(Number(s.kg))}×${s.reps}`).join(" · ");
}

export function sessionVolume(session) {
  let v = 0;
  for (const e of session.exercises || []) {
    for (const s of e.sets || []) if (s.done) v += (Number(s.kg) || 0) * (Number(s.reps) || 0);
  }
  return v;
}
