import { DAYS, DAY_KEYS } from "../program.js";
import { fmtKg } from "../calc.js";
import { state, program, sessionsInWeek, nextDay, daysUntil, completeWeeks } from "../state.js";
import { esc, icon } from "../ui.js";

export function dayCard(k, done, isNext, subtitle) {
  const d = DAYS[k];
  return `<a class="day-card ${done ? "done" : ""} ${isNext ? "next" : ""}" href="#/workout/${k}">
    <span class="day-icon">${done ? icon("check") : k}</span>
    <span class="day-body"><b>${d.name}</b><small>${subtitle}</small></span>
    <span class="day-state">${done ? "Completado" : isNext ? "Siguiente" : ""}</span>
  </a>`;
}

export function render(el) {
  const p = state.profile;
  const { week, total, phase } = program();
  const days = daysUntil(p.targetDate);
  const doneKeys = new Set(sessionsInWeek(week).map((s) => s.dayKey));
  const next = nextDay();
  const pct = Math.min(100, Math.round((Math.min(week, total) / total) * 100));
  const eventName = p.eventName ? esc(p.eventName) : "tu fecha objetivo";

  const bw = state.bodyweight;
  const delta = bw.length >= 2 ? bw[bw.length - 1].kg - bw[0].kg : null;

  const countdown = days > 0
    ? `<div class="big">${days}</div><div class="hero-sub">días para ${eventName}</div>`
    : days === 0 ? `<div class="big">Hoy</div><div class="hero-sub">Es el día de ${eventName}. Mucho éxito.</div>`
    : `<div class="big">Meta alcanzada</div><div class="hero-sub">Sigue entrenando en modo mantención.</div>`;

  const cards = DAY_KEYS.map((k) =>
    dayCard(k, doneKeys.has(k), k === next, `Día ${k} · ${DAYS[k].exercises.length} ejercicios · ~50 min`)).join("");

  el.innerHTML = `
    <div class="screen">
      <header class="top">
        <div><p class="muted small">Hola,</p><h1>${esc(p.name)}</h1></div>
        ${p.photoURL ? `<img class="avatar" src="${esc(p.photoURL)}" alt="" referrerpolicy="no-referrer">` : ""}
      </header>

      <section class="hero">
        ${countdown}
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="hero-foot"><span>Semana ${week} de ${total}</span><span>Fase ${phase.n} · ${phase.name}</span></div>
      </section>

      ${phase.deload ? `<div class="notice">${icon("pause")}<p><b>Semana de descarga.</b> Menos series para que el cuerpo se recupere. Mantén los pesos.</p></div>` : ""}

      <section>
        <div class="section-head"><h2>Esta semana</h2><span class="muted small">${doneKeys.size} de 3</span></div>
        <div class="day-list">${cards}</div>
        ${!next ? `<p class="center muted small">Semana completa. Descansa o repite el día que prefieras.</p>` : ""}
      </section>

      <section class="card">
        <p class="eyebrow">Fase actual</p>
        <h3>${phase.name}</h3>
        <p class="muted">${phase.goal}</p>
        <p class="small">${phase.sets} series · ${phase.reps[0]}–${phase.reps[1]} reps · descanso ${phase.rest} s</p>
      </section>

      <section class="tiles">
        <div class="tile"><b>${state.sessions.length}</b><span>entrenamientos</span></div>
        <div class="tile"><b>${completeWeeks()}</b><span>semanas completas</span></div>
        <div class="tile"><b>${delta === null ? "–" : (delta > 0 ? "+" : "") + fmtKg(delta) + " kg"}</b><span>cambio de peso</span></div>
      </section>
    </div>`;
}
