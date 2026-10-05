import { DAYS, DAY_KEYS, phaseFor, weekStart, mainSets, INTENSITY } from "../program.js";
import { fmtKg } from "../calc.js";
import { state, program, sessionsInWeek, nextDay, daysUntil, completeWeeks, isoDate as isoOf } from "../state.js";
import { esc, icon, fmtDate } from "../ui.js";

// Tarjeta de un día. Sin href se muestra deshabilitada (semanas futuras).
export function dayCard(k, { done = false, next = false, subtitle = "", href = null, label = "" } = {}) {
  const d = DAYS[k];
  const tag = href ? "a" : "div";
  return `<${tag} class="day-card ${done ? "done" : ""} ${next ? "next" : ""} ${href ? "" : "disabled"}" ${href ? `href="${href}"` : ""}>
    <span class="day-icon">${done ? icon("check") : k}</span>
    <span class="day-body"><b>${d.name}</b><small>${subtitle}</small></span>
    <span class="day-state">${label || (done ? "Completado" : next ? "Siguiente" : "")}</span>
  </${tag}>`;
}

// Tarjetas A/B/C de una semana: completado → editar ese entrenamiento; pendiente → registrarlo en esa semana.
export function weekCards(week, subtitleFor) {
  const { week: current } = program();
  const latest = {};
  for (const s of sessionsInWeek(week)) latest[s.dayKey] = s;
  const next = week === current ? nextDay() : null;
  const opensOn = fmtDate(isoOf(weekStart(state.profile.startDate, week)), { day: "numeric", month: "short" });

  return DAY_KEYS.map((k) => {
    const s = latest[k];
    if (s) {
      return dayCard(k, { done: true, href: `#/workout/${k}/s-${s.id}`,
        subtitle: `${fmtDate(s.date, { weekday: "short", day: "numeric", month: "short" })} · toca para editar` });
    }
    if (week > current) return dayCard(k, { subtitle: `Disponible desde el ${opensOn}` });
    return dayCard(k, { next: k === next, subtitle: subtitleFor(k),
      href: week === current ? `#/workout/${k}` : `#/workout/${k}/w-${week}`,
      label: week < current ? "Registrar" : "" });
  }).join("");
}

export function render(el, weekParam) {
  const p = state.profile;
  const { week: current, total, plan, phase: currentPhase } = program();
  const lastWeek = Math.max(total, current);
  const week = Math.min(lastWeek, Math.max(1, parseInt(weekParam, 10) || current));
  const phase = phaseFor(week, plan);
  const isCurrent = week === current;

  const days = daysUntil(p.targetDate);
  const doneCount = new Set(sessionsInWeek(week).map((s) => s.dayKey)).size;
  const pct = Math.min(100, Math.round((Math.min(current, total) / total) * 100));
  const eventName = p.eventName ? esc(p.eventName) : "tu fecha objetivo";

  const start = weekStart(p.startDate, week);
  const end = new Date(start); end.setDate(end.getDate() + 6);
  const range = `${fmtDate(isoOf(start), { day: "numeric", month: "short" })} – ${fmtDate(isoOf(end), { day: "numeric", month: "short" })}`;

  const bw = state.bodyweight;
  const delta = bw.length >= 2 ? bw[bw.length - 1].kg - bw[0].kg : null;

  const countdown = days > 0
    ? `<div class="big">${days}</div><div class="hero-sub">días para ${eventName}</div>`
    : days === 0 ? `<div class="big">Hoy</div><div class="hero-sub">Es el día de ${eventName}. Mucho éxito.</div>`
    : `<div class="big">Meta alcanzada</div><div class="hero-sub">Sigue entrenando en modo mantención.</div>`;

  const cards = weekCards(week, (k) => `Día ${k} · ${DAYS[k].exercises.length} ejercicios · ~50 min`);

  el.innerHTML = `
    <div class="screen">
      <header class="top">
        <div><p class="muted small">Hola,</p><h1>${esc(p.name)}</h1></div>
        ${p.photoURL ? `<img class="avatar" src="${esc(p.photoURL)}" alt="" referrerpolicy="no-referrer">` : ""}
      </header>

      <section class="hero">
        ${countdown}
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="hero-foot"><span>Semana ${current} de ${total}</span><span>Fase ${currentPhase.n} · ${currentPhase.name}</span></div>
      </section>

      <section>
        <div class="week-nav">
          ${week > 1 ? `<a class="icon-btn" href="#/home/${week - 1}" aria-label="Semana anterior">${icon("back")}</a>`
            : `<span class="icon-btn" aria-hidden="true" style="visibility:hidden"></span>`}
          <div class="week-label">
            <b>${isCurrent ? "Esta semana" : `Semana ${week}`}</b>
            <small>${isCurrent ? `Semana ${week} · ` : ""}${range} · ${doneCount} de 3</small>
          </div>
          ${week < lastWeek ? `<a class="icon-btn" href="#/home/${week + 1}" aria-label="Semana siguiente">${icon("next")}</a>`
            : `<span class="icon-btn" aria-hidden="true" style="visibility:hidden"></span>`}
        </div>
        ${!isCurrent ? `<p class="center"><a class="link" href="#/home">Volver a esta semana</a></p>` : ""}
        ${phase.deload ? `<div class="notice">${icon("pause")}<p><b>Semana de descarga.</b> Menos series para que el cuerpo se recupere. Mantén los pesos.</p></div>` : ""}
        <div class="day-list">${cards}</div>
        ${isCurrent && doneCount >= 3 ? `<p class="center muted small">Semana completa. Buen trabajo.</p>` : ""}
      </section>

      <section class="card">
        <p class="eyebrow">${isCurrent ? "Fase actual" : `Fase de la semana ${week}`}</p>
        <h3>${phase.name}</h3>
        <p class="muted">${phase.goal}</p>
        <p class="small">${mainSets(phase)} series en ejercicios principales · ${phase.reps[0]}–${phase.reps[1]} reps · descanso ${phase.rest} s</p>
        <p class="small muted">${phase.to === Infinity ? `Desde la semana ${phase.from}` : `Semanas ${phase.from}–${phase.to}`} · Intensidad ${INTENSITY[plan.intensity].label.toLowerCase()}</p>
      </section>

      <section class="tiles">
        <div class="tile"><b>${state.sessions.length}</b><span>entrenamientos</span></div>
        <div class="tile"><b>${completeWeeks()}</b><span>semanas completas</span></div>
        <div class="tile"><b>${delta === null ? "–" : (delta > 0 ? "+" : "") + fmtKg(delta) + " kg"}</b><span>cambio de peso</span></div>
      </section>
    </div>`;
}
