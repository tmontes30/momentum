// Pestaña "Entrenar": entrenamiento de hoy, herramientas para el gimnasio y biblioteca de ejercicios.
import { EXERCISES, DAYS, DAY_KEYS, prescription, sessionPlan, phaseFor } from "../program.js";
import { fmtKg } from "../calc.js";
import { exerciseProgress } from "../stats.js";
import { state, program, sessionsInWeek, nextDay } from "../state.js";
import { esc, icon, storage, alertDone, toast } from "../ui.js";
import { weekCards } from "./home.js";

const DRAFT_MAX_AGE = 12 * 3600 * 1000;
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

// Borrador en curso de un día de esta semana (si existe y tiene algo anotado).
function draftOf(dayKey, week) {
  const d = storage.get(`momentum-draft-${state.user.uid}-${dayKey}-w-${week}`);
  if (!d || Date.now() - d.startedAt > DRAFT_MAX_AGE) return null;
  const sets = d.items.flatMap((it) => it.sets);
  const done = sets.filter((s) => s.done).length;
  return done ? { done, total: sets.length } : null;
}

export function render(el) {
  const p = state.profile;
  const { week, plan } = program();
  const phase = phaseFor(week, plan);
  const minutes = Number(p.sessionMinutes) || 60;
  const doneKeys = new Set(sessionsInWeek(week).map((s) => s.dayKey));

  // Prioridad: un entrenamiento a medio hacer; si no, el siguiente pendiente de la semana.
  const inProgress = DAY_KEYS.map((k) => ({ k, d: draftOf(k, week) })).find((x) => x.d && !doneKeys.has(x.k));
  const todayKey = inProgress?.k || nextDay();

  el.innerHTML = `
    <div class="screen">
      <header>
        <h1>Entrenar</h1>
        <p class="muted small">Semana ${week} · ${phase.name}${phase.deload ? " · Descarga" : ""}</p>
      </header>

      ${todayKey ? todayHTML(todayKey, phase, minutes, inProgress?.d) : `
        <section class="card today done">
          <p class="eyebrow">Semana completa</p>
          <h2>Hiciste los 3 días</h2>
          <p class="muted">Buen trabajo. Descansa, o revisa y corrige la semana desde Inicio.</p>
          <a class="btn btn-block" href="#/home">Ver la semana</a>
        </section>`}

      <section>
        <div class="section-head"><h3>Esta semana</h3><span class="muted small">${doneKeys.size} de 3</span></div>
        <div class="day-list">${weekCards(week, (k) => `Día ${k} · ~${sessionPlan(k, phase, minutes).total} min`)}</div>
        <p class="small muted">Hazlos en el orden que te acomode, dejando un día de descanso entre Piernas y Abdominales + full body (ambos trabajan piernas). Para semanas anteriores, usa las flechas en Inicio.</p>
      </section>

      <section class="card">
        <h3 class="h-ico">${icon("timer")} Temporizador</h3>
        <div class="seg seg-sm" role="radiogroup">
          <label><input type="radio" name="tmode" value="down" checked><span>Cuenta atrás</span></label>
          <label><input type="radio" name="tmode" value="up"><span>Cronómetro</span></label>
        </div>
        <div class="timer-face" id="t-face" aria-live="polite">1:00</div>
        <div class="chips" id="t-presets">${[30, 45, 60, 90, 120].map((s) => `<button class="chip ${s === 60 ? "on" : ""}" data-sec="${s}">${s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`}</button>`).join("")}</div>
        <div class="row2">
          <button class="btn btn-primary" id="t-start">Iniciar</button>
          <button class="btn" id="t-reset">Reiniciar</button>
        </div>
      </section>

      <section class="card">
        <h3 class="h-ico">${icon("target")} Calculadora de discos</h3>
        <div class="row2">
          <label class="field"><span>Peso total</span>
            <input type="number" id="pl-total" inputmode="decimal" step="0.5" min="0" placeholder="Ej: 60"></label>
          <label class="field"><span>Barra</span>
            <select id="pl-bar" class="select">
              <option value="20">Olímpica 20 kg</option><option value="15">Olímpica 15 kg</option>
              <option value="10">Barra corta 10 kg</option><option value="0">Sin barra / máquina</option>
            </select></label>
        </div>
        <div id="pl-out" class="plates muted small">Escribe el peso total para ver qué discos poner en cada lado.</div>
      </section>

      <section class="card">
        <h3 class="h-ico">${icon("info")} Biblioteca de ejercicios</h3>
        <input type="search" id="lib-q" placeholder="Buscar ejercicio o músculo" autocomplete="off">
        <div class="chips" id="lib-f">
          <button class="chip on" data-f="all">Todos</button>
          ${DAY_KEYS.map((k) => `<button class="chip" data-f="${k}">Día ${k}</button>`).join("")}
        </div>
        <div id="lib-list"></div>
      </section>
    </div>`;

  // ── Temporizador ──
  const face = el.querySelector("#t-face");
  const startBtn = el.querySelector("#t-start");
  let mode = "down", preset = 60, elapsed = 0, startedAt = 0, running = false, int = null;
  const value = () => elapsed + (running ? (Date.now() - startedAt) / 1000 : 0);
  const paintTimer = () => {
    const v = value();
    const secs = mode === "down" ? Math.max(0, Math.ceil(preset - v)) : Math.floor(v);
    face.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
    if (mode === "down" && running && v >= preset) {
      stop(); elapsed = preset; alertDone(); toast("Tiempo cumplido");
    }
  };
  const stop = () => { if (running) elapsed = value(); running = false; clearInterval(int); startBtn.textContent = elapsed ? "Continuar" : "Iniciar"; };
  const reset = () => { running = false; clearInterval(int); elapsed = 0; startBtn.textContent = "Iniciar"; paintTimer(); };
  startBtn.addEventListener("click", () => {
    if (running) return stop();
    if (mode === "down" && elapsed >= preset) elapsed = 0;
    running = true; startedAt = Date.now(); startBtn.textContent = "Pausar";
    clearInterval(int); int = setInterval(paintTimer, 200); paintTimer();
  });
  el.querySelector("#t-reset").addEventListener("click", reset);
  el.querySelector("#t-presets").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sec]");
    if (!b) return;
    preset = Number(b.dataset.sec);
    el.querySelectorAll("#t-presets .chip").forEach((c) => c.classList.toggle("on", c === b));
    reset();
  });
  el.querySelectorAll('input[name="tmode"]').forEach((r) => r.addEventListener("change", () => {
    mode = r.value;
    el.querySelector("#t-presets").hidden = mode === "up";
    reset();
  }));
  paintTimer();

  // ── Calculadora de discos ──
  const plTotal = el.querySelector("#pl-total");
  const plBar = el.querySelector("#pl-bar");
  const plOut = el.querySelector("#pl-out");
  const calcPlates = () => {
    const total = Number(plTotal.value);
    const bar = Number(plBar.value);
    if (!total) { plOut.textContent = "Escribe el peso total para ver qué discos poner en cada lado."; return; }
    if (total < bar) { plOut.textContent = `El peso total no puede ser menor que la barra (${bar} kg).`; return; }
    let side = (total - bar) / 2;
    const used = [];
    for (const pl of PLATES) while (side >= pl - 1e-9) { used.push(pl); side = Math.round((side - pl) * 100) / 100; }
    const exact = side < 0.01;
    plOut.classList.toggle("muted", false);
    plOut.innerHTML = used.length
      ? `<p class="small muted">Por cada lado${bar ? ` (barra de ${bar} kg)` : ""}:</p>
         <div class="chips">${used.map((pl) => `<span class="plate p${String(pl).replace(".", "_")}">${fmtKg(pl)}</span>`).join("")}</div>
         ${exact ? "" : `<p class="small muted">Faltan ${fmtKg(side * 2)} kg para llegar exacto: usa el peso más cercano.</p>`}`
      : `<p class="small muted">Solo la barra (${bar} kg).</p>`;
  };
  plTotal.addEventListener("input", calcPlates);
  plBar.addEventListener("change", calcPlates);

  // ── Biblioteca ──
  const records = new Map(exerciseProgress().map((r) => [r.id, r]));
  const list = el.querySelector("#lib-list");
  let filter = "all";
  const inDay = (id, k) => DAYS[k].exercises.some((x) => x === id || EXERCISES[x].alt === id);
  const paintLib = () => {
    const q = el.querySelector("#lib-q").value.trim().toLowerCase();
    const ids = Object.keys(EXERCISES).filter((id) => {
      const ex = EXERCISES[id];
      if (filter !== "all" && !inDay(id, filter)) return false;
      return !q || `${ex.name} ${ex.muscle} ${ex.equip}`.toLowerCase().includes(q);
    });
    list.innerHTML = ids.length ? ids.map((id) => {
      const ex = EXERCISES[id];
      const r = records.get(id);
      const days = DAY_KEYS.filter((k) => inDay(id, k));
      return `<details class="lib-item">
        <summary><span class="grow"><b>${ex.name}</b><small class="muted">${ex.muscle}</small></span>
          ${days.map((k) => `<span class="tag">${k}</span>`).join("")}</summary>
        <div class="lib-body">
          <p class="small"><b>Equipo:</b> ${ex.equip}${ex.perSide ? " · peso por mancuerna/lado" : ""}</p>
          <p class="small">${ex.tip}</p>
          ${ex.alt ? `<p class="small muted">Alternativa: ${EXERCISES[ex.alt].name}</p>` : ""}
          ${r ? `<p class="small"><b>Tu mejor marca:</b> ${fmtKg(r.best)} ${r.unit}${r.best > r.first ? ` <span class="trend-up">(+${r.gain}% desde ${fmtKg(r.first)})</span>` : ""}</p>`
            : `<p class="small muted">Aún no lo registras.</p>`}
        </div></details>`;
    }).join("") : `<p class="muted small">No hay ejercicios con "${esc(q)}".</p>`;
  };
  el.querySelector("#lib-q").addEventListener("input", paintLib);
  el.querySelector("#lib-f").addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]");
    if (!b) return;
    filter = b.dataset.f;
    el.querySelectorAll("#lib-f .chip").forEach((c) => c.classList.toggle("on", c === b));
    paintLib();
  });
  paintLib();

  return () => clearInterval(int);
}

// Tarjeta del entrenamiento de hoy con la lista de ejercicios (para saber qué máquinas se usarán).
function todayHTML(k, phase, minutes, draft) {
  const day = DAYS[k];
  const sp = sessionPlan(k, phase, minutes);
  const rows = sp.slots.map((s) => {
    const ex = EXERCISES[s.exId];
    const rx = prescription(s.exId, phase);
    const unit = ex.type === "time" ? "s" : "";
    return `<li>${s.label ? `<span class="ss">${s.label}</span>` : ""}<span class="grow">${ex.name}</span>
      <small class="muted">${Math.min(rx.sets, s.sets)} × ${rx.min}–${rx.max}${unit}</small></li>`;
  }).join("");
  return `
    <section class="card today">
      <p class="eyebrow">${draft ? "En curso" : "Hoy toca"}</p>
      <h2>${day.name}</h2>
      <p class="muted small">Día ${k} · ${sp.slots.length} ejercicios · ~${sp.minutes} min + 5 min de elongación</p>
      ${draft ? `<div class="bar"><i style="width:${Math.round((draft.done / draft.total) * 100)}%"></i></div>
        <p class="small">${draft.done} de ${draft.total} series anotadas</p>` : ""}
      <ol class="today-list">${rows}</ol>
      ${sp.finisher ? `<p class="small muted">+ circuito final de 4 min</p>` : ""}
      <a class="btn btn-primary btn-lg btn-block" href="#/workout/${k}">${draft ? "Continuar entrenamiento" : "Empezar entrenamiento"}</a>
    </section>`;
}
