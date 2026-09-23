import { EXERCISES, DAYS, DAY_KEYS, prescription, supersetLabel } from "../program.js";
import { exerciseHistory, suggestion, summarizeSets, workingWeight, fmtKg } from "../calc.js";
import { addSession } from "../db.js";
import { state, program, sessionsInWeek, nextDay } from "../state.js";
import { esc, go, toast, fmtDate, storage, alertDone, icon } from "../ui.js";
import { dayCard } from "./home.js";

const DRAFT_MAX_AGE = 12 * 3600 * 1000;
const TREND_ICON = { up: "up", keep: "flat", down: "down", start: "info" };

let teardown = null;

export function render(el, dayKey) {
  teardown?.();
  teardown = null;
  if (!dayKey || !DAYS[dayKey]) return renderPicker(el);
  const ac = new AbortController();
  const on = { signal: ac.signal };

  const day = DAYS[dayKey];
  const { week, phase } = program();
  const draftKey = `momentum-draft-${state.user.uid}-${dayKey}`;

  let draft = storage.get(draftKey);
  if (!draft || draft.week !== week || Date.now() - draft.startedAt > DRAFT_MAX_AGE) {
    draft = { startedAt: Date.now(), week, items: day.exercises.map((exId) => ({ exId, sets: freshSets(exId, phase) })) };
  }
  const save = () => storage.set(draftKey, draft);

  const finisher = day.finisher || (phase.superset ? "Circuito final: 4 rondas de 30 s intensos + 30 s suaves en bicicleta, remo o escaladora." : null);

  el.innerHTML = `
    <div class="screen workout">
      <header class="top sticky">
        <a class="icon-btn" href="#/home" aria-label="Volver">${icon("back")}</a>
        <div class="grow"><h1 class="h-sm">${day.name}</h1>
          <p class="muted small">Día ${dayKey} · Semana ${week} · ${phase.name}${phase.deload ? " · Descarga" : ""}</p></div>
        <button class="icon-btn" id="reset" aria-label="Reiniciar entrenamiento" title="Reiniciar">${icon("reset")}</button>
      </header>
      <details class="card warmup"><summary>${icon("timer")} Calentamiento · 5–8 min</summary><p>${day.warmup}</p></details>
      ${phase.superset ? `<div class="notice">${icon("zap")}<p><b>Superseries.</b> Haz A1 y A2 seguidos, descansa y repite. Luego B1/B2, etc.</p></div>` : ""}
      <div id="list">${draft.items.map((it, i) => cardHTML(it, i, phase)).join("")}</div>
      ${finisher ? `<div class="card"><h3 class="h-ico">${icon("flag")} Finisher</h3><p class="muted">${finisher}</p></div>` : ""}
      <p class="small muted center">Marca cada serie al terminarla para iniciar el descanso.</p>
    </div>
    <div class="rest-bar" id="rest" hidden>
      <span>Descanso</span><b id="rest-time">0:00</b>
      <button class="btn btn-sm" data-rest="15">+15 s</button>
      <button class="btn btn-sm" data-rest="skip">Saltar</button>
    </div>
    <div class="finish-bar"><button class="btn btn-primary btn-lg btn-block" id="finish">Terminar entrenamiento</button></div>`;

  const list = el.querySelector("#list");
  const replaceCard = (i) => {
    list.querySelector(`[data-i="${i}"]`).outerHTML = cardHTML(draft.items[i], i, phase);
  };

  // Al cambiar el peso de una serie, las siguientes aún sin marcar toman el mismo peso.
  const carryKg = (i, s, val) => {
    const card = list.querySelector(`[data-i="${i}"]`);
    draft.items[i].sets.forEach((set, j) => {
      if (j <= s || set.done) return;
      set.kg = val;
      card.querySelector(`[data-s="${j}"] input[data-f="kg"]`).value = val;
    });
  };

  // ── Temporizador de descanso ──
  const restBar = el.querySelector("#rest");
  const restTime = el.querySelector("#rest-time");
  let restEnd = 0;
  let timer = null;
  const stopRest = () => { clearInterval(timer); timer = null; restBar.hidden = true; };
  const tick = () => {
    const left = Math.max(0, Math.ceil((restEnd - Date.now()) / 1000));
    restTime.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    if (left <= 0) { stopRest(); alertDone(); toast("Descanso terminado. Siguiente serie."); }
  };
  const startRest = (secs) => {
    restEnd = Date.now() + secs * 1000;
    restBar.hidden = false;
    tick();
    clearInterval(timer);
    timer = setInterval(tick, 250);
  };

  // ── Eventos ──
  el.addEventListener("input", (e) => {
    const input = e.target.closest("input[data-f]");
    if (!input) return;
    const { i, s } = pos(input);
    const val = input.value === "" ? "" : Number(input.value);
    draft.items[i].sets[s][input.dataset.f] = val;
    if (input.dataset.f === "kg") carryKg(i, s, val);
    save();
  }, on);

  el.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    if (btn.dataset.rest) {
      if (btn.dataset.rest === "skip") stopRest(); else restEnd += 15000;
      return;
    }
    if (btn.id === "reset") {
      if (!confirm("¿Reiniciar este entrenamiento? Se borrará lo anotado.")) return;
      storage.remove(draftKey);
      stopRest();
      return render(el, dayKey);
    }
    if (btn.id === "finish") return finish(btn);

    const act = btn.dataset.act;
    if (!act) return;
    const { i, s } = pos(btn);
    const item = draft.items[i];
    const ex = EXERCISES[item.exId];

    if (act === "inc" || act === "dec") {
      const f = btn.dataset.f;
      const stepSize = f === "kg" ? ex.inc : ex.type === "time" ? 5 : 1;
      const cur = Number(item.sets[s][f]) || 0;
      const val = Math.max(0, Math.round((cur + (act === "inc" ? stepSize : -stepSize)) * 100) / 100);
      item.sets[s][f] = val;
      btn.parentElement.querySelector("input").value = val;
      if (f === "kg") carryKg(i, s, val);
    } else if (act === "done") {
      const set = item.sets[s];
      set.done = !set.done;
      btn.closest(".set-row").classList.toggle("done", set.done);
      if (set.done) {
        // En superseries se descansa después del segundo ejercicio del par.
        const pairFirst = phase.superset && i % 2 === 0 && i + 1 < draft.items.length;
        if (!pairFirst) startRest(prescription(item.exId, phase).rest);
      }
    } else if (act === "add") {
      const last = item.sets[item.sets.length - 1] || { kg: "", reps: "" };
      item.sets.push({ kg: last.kg, reps: last.reps, done: false });
      replaceCard(i);
    } else if (act === "remove") {
      if (item.sets.length > 1) item.sets.pop();
      replaceCard(i);
    } else if (act === "swap") {
      if (item.sets.some((x) => x.done) && !confirm("Ya anotaste series en este ejercicio. ¿Cambiarlo igual?")) return;
      item.exId = ex.alt;
      item.sets = freshSets(item.exId, phase);
      replaceCard(i);
      toast(`Cambiado a ${EXERCISES[item.exId].name}`);
    }
    save();
  }, on);

  async function finish(btn) {
    const exercises = draft.items
      .map((it) => ({
        exId: it.exId,
        sets: it.sets.filter((x) => x.done).map((x) => ({ kg: Number(x.kg) || 0, reps: Number(x.reps) || 0, done: true })),
      }))
      .filter((it) => it.sets.length);
    if (!exercises.length) return toast("Marca al menos una serie como completada antes de terminar.");
    const pending = draft.items.reduce((n, it) => n + it.sets.filter((x) => !x.done).length, 0);
    if (pending && !confirm(`Quedan ${pending} series sin marcar. ¿Terminar igual?`)) return;

    btn.disabled = true;
    const session = {
      date: new Date().toISOString(),
      dayKey, week, phase: phase.n,
      durationMin: Math.max(1, Math.round((Date.now() - draft.startedAt) / 60000)),
      exercises,
    };
    try {
      const prs = personalRecords(exercises);
      const saved = await addSession(state.user.uid, session);
      state.sessions.push(saved);
      storage.remove(draftKey);
      stopRest();
      renderSummary(el, saved, prs);
    } catch (err) {
      console.error(err);
      toast("No se pudo guardar. Tus datos siguen aquí; intenta de nuevo.");
      btn.disabled = false;
    }
  }

  teardown = () => { clearInterval(timer); ac.abort(); };
  // Siempre desmonta la instancia vigente (el botón de reinicio vuelve a llamar a render).
  return () => { teardown?.(); teardown = null; };
}

function pos(node) {
  const card = node.closest("[data-i]");
  const row = node.closest("[data-s]");
  return { i: Number(card.dataset.i), s: row ? Number(row.dataset.s) : -1 };
}

function freshSets(exId, phase) {
  const rx = prescription(exId, phase);
  const sug = suggestion(exId, exerciseHistory(state.sessions, exId), state.profile, rx);
  return Array.from({ length: rx.sets }, () => ({ kg: sug.kg ?? "", reps: sug.reps, done: false }));
}

function cardHTML(item, i, phase) {
  const ex = EXERCISES[item.exId];
  const rx = prescription(item.exId, phase);
  const history = exerciseHistory(state.sessions, item.exId);
  const sug = suggestion(item.exId, history, state.profile, rx);
  const last = history[history.length - 1];
  const unit = ex.type === "time" ? "s" : "reps";
  const hasKg = ex.type === "weight";
  const ss = supersetLabel(i, phase);

  const rows = item.sets.map((set, s) => `
    <div class="set-row ${set.done ? "done" : ""}" data-s="${s}">
      <span class="set-n">${s + 1}</span>
      ${hasKg ? numField("kg", set.kg, "kg") : `<span class="muted small center">${ex.type === "time" ? "tiempo" : "peso corporal"}</span>`}
      ${numField("reps", set.reps, unit)}
      <button class="check" data-act="done" aria-label="Serie ${s + 1} lista">${icon("check")}</button>
    </div>`).join("");

  return `
    <article class="card ex-card" data-i="${i}">
      <div class="ex-head">
        ${ss ? `<span class="ss">${ss}</span>` : ""}
        <div class="grow"><h3>${ex.name}</h3><small class="muted">${ex.muscle} · ${ex.equip}</small></div>
        ${ex.alt ? `<button class="icon-btn" data-act="swap" aria-label="Cambiar por ${EXERCISES[ex.alt].name}" title="Máquina ocupada: cambiar ejercicio">${icon("swap")}</button>` : ""}
      </div>
      <div class="ex-rx"><b>${rx.sets} × ${rx.min}–${rx.max} ${unit}</b> · descanso ${rx.rest} s${ex.perSide ? " · kg por mancuerna/lado" : ""}</div>
      <div class="ex-sug trend-${sug.trend}">${icon(TREND_ICON[sug.trend])}<span>${sug.kg != null ? `<b>${fmtKg(sug.kg)} kg</b> · ` : ""}${sug.note}</span></div>
      ${last ? `<div class="ex-last">Última vez (${fmtDate(last.date)}): ${summarizeSets(item.exId, last.sets)}</div>` : ""}
      <details class="tip"><summary>Técnica</summary><p>${ex.tip}</p></details>
      <div class="sets ${hasKg ? "" : "no-kg"}">${rows}</div>
      <div class="ex-actions">
        <button class="link" data-act="add">+ Serie</button>
        ${item.sets.length > 1 ? `<button class="link muted" data-act="remove">− Quitar serie</button>` : ""}
      </div>
    </article>`;
}

function numField(field, value, label) {
  return `<div class="num">
    <button data-act="dec" data-f="${field}" aria-label="Menos ${label}">−</button>
    <label><input data-f="${field}" type="number" inputmode="decimal" step="any" min="0" value="${esc(value)}"><small>${label}</small></label>
    <button data-act="inc" data-f="${field}" aria-label="Más ${label}">+</button>
  </div>`;
}

function personalRecords(exercises) {
  const prs = [];
  for (const e of exercises) {
    if (EXERCISES[e.exId].type !== "weight") continue;
    const prev = exerciseHistory(state.sessions, e.exId);
    if (!prev.length) continue;
    const best = Math.max(...prev.map((h) => workingWeight(h.sets)));
    const now = workingWeight(e.sets);
    if (now > best) prs.push({ name: EXERCISES[e.exId].name, kg: now, diff: now - best });
  }
  return prs;
}

function renderSummary(el, session, prs) {
  const sets = session.exercises.reduce((n, e) => n + e.sets.length, 0);
  const volume = session.exercises.reduce((v, e) => v + e.sets.reduce((a, s) => a + s.kg * s.reps, 0), 0);
  const left = 3 - new Set(sessionsInWeek(session.week).map((s) => s.dayKey)).size;
  el.innerHTML = `
    <div class="screen center summary">
      <div class="summary-mark">${icon("done")}</div>
      <h1>Entrenamiento completado</h1>
      <p class="muted">${DAYS[session.dayKey].name} · ${fmtDate(session.date, { weekday: "long", day: "numeric", month: "long" })}</p>
      <div class="tiles">
        <div class="tile"><b>${session.durationMin}</b><span>minutos</span></div>
        <div class="tile"><b>${sets}</b><span>series</span></div>
        <div class="tile"><b>${Math.round(volume).toLocaleString("es")}</b><span>kg levantados</span></div>
      </div>
      ${prs.length ? `<div class="card left"><h3 class="h-ico">${icon("trophy")} Nuevos récords</h3>${prs.map((p) => `<p>${p.name}: <b>${fmtKg(p.kg)} kg</b> <span class="trend-up">(+${fmtKg(p.diff)})</span></p>`).join("")}</div>` : ""}
      <p class="muted">${left > 0 ? `Te ${left === 1 ? "queda 1 entrenamiento" : `quedan ${left} entrenamientos`} esta semana.` : "Semana completa."}</p>
      <button class="btn btn-primary btn-lg btn-block" id="home">Volver al inicio</button>
    </div>`;
  el.querySelector("#home").addEventListener("click", () => go("#/home"));
}

function renderPicker(el) {
  const { week } = program();
  const done = new Set(sessionsInWeek(week).map((s) => s.dayKey));
  const next = nextDay();
  el.innerHTML = `
    <div class="screen">
      <h1>Elige tu entrenamiento</h1>
      <p class="muted">Haz los 3 días en la semana, en el orden que te acomode. Deja al menos un día de descanso entre Piernas y Core.</p>
      <div class="day-list">${DAY_KEYS.map((k) => dayCard(k, done.has(k), k === next,
        DAYS[k].exercises.map((id) => EXERCISES[id].name).slice(0, 3).join(", ") + "…")).join("")}</div>
    </div>`;
}
