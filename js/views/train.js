// Pestaña "Entrenar": entrenamiento de hoy, herramientas para el gimnasio y biblioteca de ejercicios.
import { EXERCISES, DAYS, DAY_KEYS, prescription, sessionPlan, phaseFor, weekStart, routineCode, STRETCH_MIN } from "../program.js";
import { fmtKg } from "../calc.js";
import { exerciseProgress } from "../stats.js";
import { state, program, sessionsInWeek, nextDay } from "../state.js";
import { esc, icon, storage, alertDone, toast } from "../ui.js";
import { weekCards } from "./home.js";

const DRAFT_MAX_AGE = 12 * 3600 * 1000;
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const PRESET_BARS = [20, 15, 10, 0];
const BARBELL_KEY = "momentum-barbell";

// Color por peso (estándar de discos olímpicos); los de otro peso usan el gris.
function plateClass(pl) {
  return { 25: "p25", 20: "p20", 15: "p15", 10: "p10", 5: "p5", 2.5: "p2_5", 1.25: "p1_25" }[pl] || "pother";
}

// Alto del disco en el dibujo según su peso (los de 20-25 kg son los más grandes).
function discHeight(pl) {
  return Math.round(40 + 70 * Math.min(1, pl / 20));
}

// Acepta "12,5" o "12.5". Devuelve "" si está vacío y null si no es un número válido.
function parseKg(text) {
  const t = String(text).trim().replace(",", ".");
  if (t === "") return "";
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

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
        <a class="btn btn-block" href="#/workout/A/p-${week + 1}">Ver la rutina de las próximas semanas</a>
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
        <h3 class="h-ico">${icon("target")} Barra y discos</h3>
        <div class="bb-total"><b id="bb-total">0 kg</b><span id="bb-side" class="muted small"></span></div>
        <div class="barbell" id="bb-visual" role="img" aria-label="Barra cargada"></div>
        <p class="small muted center" id="bb-hint">Toca un disco de la barra para sacarlo.</p>

        <p class="mini-label">Barra</p>
        <div class="chips" id="bb-bars">
          ${[20, 15, 10, 0].map((b) => `<button class="chip" data-bar="${b}">${b ? `${b} kg` : "Sin barra"}</button>`).join("")}
          <span class="chip-input"><input id="bb-bar" type="text" inputmode="decimal" autocomplete="off" placeholder="Otra" aria-label="Peso de la barra"> kg</span>
        </div>

        <p class="mini-label">Agregar disco <span class="muted">(se pone uno en cada lado)</span></p>
        <div class="chips" id="bb-plates">
          ${PLATES.map((pl) => `<button class="plate ${plateClass(pl)}" data-add="${pl}" aria-label="Agregar ${fmtKg(pl)} kg por lado">${fmtKg(pl)}</button>`).join("")}
          <span class="chip-input"><input id="bb-other" type="text" inputmode="decimal" autocomplete="off" placeholder="Otro" aria-label="Disco de otro peso"> kg
            <button class="btn btn-sm" id="bb-other-add">+</button></span>
        </div>

        <div class="row2">
          <button class="btn" id="bb-undo">Quitar último</button>
          <button class="btn" id="bb-clear">Vaciar barra</button>
        </div>

        <p class="mini-label">Armar para un total</p>
        <div class="inline-form two">
          <input id="bb-target" type="text" inputmode="decimal" autocomplete="off" placeholder="Ej: 62,5 kg">
          <button class="btn btn-primary" id="bb-fill">Cargar</button>
        </div>
        <p class="small muted" id="bb-msg"></p>
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

  // ── Barra y discos ──
  // Los discos se cargan iguales en ambos lados; `plates` es un lado, del centro hacia afuera.
  const saved = storage.get(BARBELL_KEY) || {};
  let bar = Number.isFinite(saved.bar) ? saved.bar : 20;
  let plates = Array.isArray(saved.plates) ? saved.plates.filter((p) => p > 0) : [];
  const bbVisual = el.querySelector("#bb-visual");
  const bbMsg = el.querySelector("#bb-msg");
  const barInput = el.querySelector("#bb-bar");
  const sum = (arr) => Math.round(arr.reduce((a, b) => a + b, 0) * 100) / 100;

  const paintBar = () => {
    const side = sum(plates);
    const total = Math.round((bar + side * 2) * 100) / 100;
    el.querySelector("#bb-total").textContent = `${fmtKg(total)} kg`;
    el.querySelector("#bb-side").textContent = `${bar ? `Barra ${fmtKg(bar)} kg` : "Sin barra"} · ${fmtKg(side)} kg por lado`;
    const disc = (pl, i) => `<button class="disc ${plateClass(pl)}" style="height:${discHeight(pl)}px" data-remove="${i}"
      aria-label="Sacar disco de ${fmtKg(pl)} kg">${fmtKg(pl)}</button>`;
    // Lado izquierdo de afuera hacia adentro; lado derecho de adentro hacia afuera (los grandes quedan al centro).
    const left = plates.map(disc).reverse().join("");
    const right = plates.map(disc).join("");
    bbVisual.innerHTML = `<div class="bb-end">${left}</div><span class="bb-collar"></span>
      <span class="bb-shaft">${bar ? `${fmtKg(bar)} kg` : "máquina"}</span><span class="bb-collar"></span><div class="bb-end">${right}</div>`;
    el.querySelector("#bb-hint").hidden = !plates.length;
    el.querySelectorAll("#bb-bars [data-bar]").forEach((c) => c.classList.toggle("on", Number(c.dataset.bar) === bar && barInput.value === ""));
    storage.set(BARBELL_KEY, { bar, plates });
  };

  // Lleva los discos a orden real: los más pesados más cerca del centro.
  const addPlate = (pl) => {
    if (!(pl > 0)) return;
    plates.push(Math.round(pl * 100) / 100);
    plates.sort((a, b) => b - a);
    bbMsg.textContent = "";
    paintBar();
  };

  el.querySelector("#bb-bars").addEventListener("click", (e) => {
    const b = e.target.closest("[data-bar]");
    if (!b) return;
    bar = Number(b.dataset.bar);
    barInput.value = "";
    paintBar();
  });
  barInput.addEventListener("input", () => {
    const v = parseKg(barInput.value);
    if (v === null) return;
    bar = v === "" ? 20 : v;
    paintBar();
  });
  el.querySelector("#bb-plates").addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (b) addPlate(Number(b.dataset.add));
  });
  const other = el.querySelector("#bb-other");
  const addOther = () => {
    const v = parseKg(other.value);
    if (!v) { toast("Escribe el peso del disco, por ejemplo 7,5"); return; }
    addPlate(v);
    other.value = "";
  };
  el.querySelector("#bb-other-add").addEventListener("click", addOther);
  other.addEventListener("keydown", (e) => { if (e.key === "Enter") addOther(); });
  bbVisual.addEventListener("click", (e) => {
    const d = e.target.closest("[data-remove]");
    if (!d) return;
    plates.splice(Number(d.dataset.remove), 1);
    bbMsg.textContent = "";
    paintBar();
  });
  el.querySelector("#bb-undo").addEventListener("click", () => { plates.pop(); bbMsg.textContent = ""; paintBar(); });
  el.querySelector("#bb-clear").addEventListener("click", () => { plates = []; bbMsg.textContent = ""; paintBar(); });

  const fill = () => {
    const target = parseKg(el.querySelector("#bb-target").value);
    if (!target) { bbMsg.textContent = "Escribe el total que quieres levantar."; return; }
    if (target < bar) { bbMsg.textContent = `El total no puede ser menor que la barra (${fmtKg(bar)} kg).`; return; }
    let side = Math.round(((target - bar) / 2) * 100) / 100;
    plates = [];
    for (const pl of PLATES) while (side >= pl - 1e-9) { plates.push(pl); side = Math.round((side - pl) * 100) / 100; }
    const missing = Math.round(side * 2 * 100) / 100;
    bbMsg.textContent = side > 0.009
      ? `Con discos estándar ${missing === 1 ? "falta 1 kg" : `faltan ${fmtKg(missing)} kg`} para llegar exacto; puedes agregar un disco con "Otro".` : "";
    paintBar();
  };
  el.querySelector("#bb-fill").addEventListener("click", fill);
  el.querySelector("#bb-target").addEventListener("keydown", (e) => { if (e.key === "Enter") fill(); });
  if (!PRESET_BARS.includes(bar)) barInput.value = fmtKg(bar);
  paintBar();

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

// Vista previa (solo lectura) de un día en cualquier semana del plan: para revisar lo que viene y comparar entre cuentas.
export function renderPreview(el, k, weekParam) {
  const p = state.profile;
  const { week: current, total, plan } = program();
  const last = Math.max(total, current);
  const week = Math.min(last, Math.max(1, weekParam || current));
  const phase = phaseFor(week, plan);
  const day = DAYS[k];
  const sp = sessionPlan(k, phase, Number(p.sessionMinutes) || 60);
  const start = weekStart(p.startDate, week);
  const opens = start.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
  const nav = (w) => (w >= 1 && w <= last ? `#/workout/${k}/p-${w}` : null);

  el.innerHTML = `
    <div class="screen">
      <header class="top">
        <a class="icon-btn" href="#/home/${week}" aria-label="Volver">${icon("back")}</a>
        <div class="grow"><p class="eyebrow">Vista previa · semana ${week}</p><h1 class="h-sm">${day.name}</h1></div>
      </header>

      <div class="chips">${DAY_KEYS.map((d) => `<a class="chip ${d === k ? "on" : ""}" href="#/workout/${d}/p-${week}">Día ${d}</a>`).join("")}</div>

      <section class="card">
        <div class="section-head"><h3>${phase.name}${phase.deload ? " · Descarga" : ""}</h3><span class="code-tag">Código ${routineCode(sp, phase)}</span></div>
        <p class="muted small">~${sp.minutes} min + ${STRETCH_MIN} min de elongación${sp.trims.length ? ` · ajustado a ${sp.budget} min: ${sp.trims.join(", ")}` : ""}.</p>
        ${week > current ? `<p class="small">Se podrá registrar desde el ${opens}.</p>` : ""}
        <ol class="today-list">${sp.slots.map((s) => {
          const ex = EXERCISES[s.exId];
          const rx = prescription(s.exId, phase);
          const unit = ex.type === "time" ? " s" : " reps";
          return `<li>${s.label ? `<span class="ss">${s.label}</span>` : ""}
            <span class="grow"><b>${ex.name}</b><br><small class="muted">${ex.muscle} · ${ex.equip}</small></span>
            <small class="muted right">${Math.min(rx.sets, s.sets)} × ${rx.min}–${rx.max}${unit}<br>${s.pairFirst ? "sin descanso" : `desc. ${s.rest} s`}</small></li>`;
        }).join("")}</ol>
        ${sp.finisher ? `<p class="small muted">+ ${day.finisher || "Circuito final: 4 rondas de 30 s intensos + 30 s suaves."}</p>` : ""}
        ${day.stretch ? `<p class="small muted"><b>Elongación:</b> ${day.stretch.join(" · ")}</p>` : ""}
      </section>

      <div class="pager">
        ${nav(week - 1) ? `<a class="icon-btn" href="${nav(week - 1)}" aria-label="Semana anterior">${icon("back")}</a>` : `<span class="icon-btn" style="visibility:hidden"></span>`}
        <span class="small muted">Semana ${week} de ${total}</span>
        ${nav(week + 1) ? `<a class="icon-btn" href="${nav(week + 1)}" aria-label="Semana siguiente">${icon("next")}</a>` : `<span class="icon-btn" style="visibility:hidden"></span>`}
      </div>
      <p class="small muted center">Si dos cuentas ven el mismo código en el mismo día y semana, tienen exactamente la misma rutina.</p>
    </div>`;
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
