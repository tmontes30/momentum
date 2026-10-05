import { saveProfile, addBodyweight } from "../db.js";
import { metrics, fmtKg } from "../calc.js";
import { planOf, INTENSITY, PLAN_OPTIONS } from "../program.js";
import { state, todayISO, addMonthsISO } from "../state.js";
import { esc, go, toast } from "../ui.js";

// ── Piezas reutilizadas por la pantalla de perfil ───────────────────────────
function seg(name, options, value) {
  return `<div class="seg" role="radiogroup">${options
    .map(([v, label]) => `<label><input type="radio" name="${name}" value="${v}" ${v === value ? "checked" : ""} required><span>${label}</span></label>`)
    .join("")}</div>`;
}

export function aboutFields(p = {}) {
  return `
    <label class="field"><span>¿Cómo te llamas?</span>
      <input name="name" value="${esc(p.name)}" required maxlength="40" autocomplete="given-name"></label>
    <div class="field"><span>Sexo</span>${seg("sex", [["f", "Mujer"], ["m", "Hombre"]], p.sex)}</div>
    <label class="field"><span>Fecha de nacimiento</span>
      <input type="date" name="birthDate" value="${esc(p.birthDate)}" required max="${todayISO()}"></label>
    <div class="row2">
      <label class="field"><span>Estatura (cm)</span>
        <input type="number" name="heightCm" inputmode="numeric" min="120" max="230" value="${p.heightCm ?? ""}" required></label>
      <label class="field"><span>Peso (kg)</span>
        <input type="number" name="weightKg" inputmode="decimal" step="0.1" min="30" max="250" value="${p.weightKg ?? ""}" required></label>
    </div>`;
}

export function goalFields(p = {}) {
  return `
    <div class="field"><span>Experiencia en el gimnasio</span>${seg("level", [["principiante", "Principiante"], ["intermedio", "Intermedio"]], p.level || "principiante")}
      <small class="muted">Principiante: menos de 6 meses entrenando de forma constante.</small></div>
    <div class="field"><span>Objetivo principal</span>${seg("goal", [["tonificar", "Tonificar"], ["bajar grasa", "Bajar grasa"], ["ganar músculo", "Ganar músculo"]], p.goal || "tonificar")}</div>
    <label class="field"><span>¿Para qué entrenas? <small class="muted">(opcional)</small></span>
      <input name="eventName" value="${esc(p.eventName)}" maxlength="30" placeholder="Ej: mi matrimonio, un viaje, una maratón"></label>
    <label class="field"><span>Inicio del programa</span>
      <input type="date" name="startDate" value="${esc(p.startDate || todayISO())}" required>
      <small class="muted">Las semanas van de lunes a domingo. La semana 1 es la que contiene esta fecha: pon el día en que empezaste (o empiezas) a entrenar.</small></label>
    <label class="field"><span>Fecha objetivo</span>
      <input type="date" name="targetDate" value="${esc(p.targetDate || addMonthsISO(todayISO(), 7))}" required>
      <small class="muted">La cuenta regresiva de Inicio apunta a esta fecha.</small></label>
    <label class="field"><span>¿En cuánto tiempo quieres ver cambios?</span>
      <select name="planWeeks" class="select">
        <option value="" ${p.planWeeks ? "" : "selected"}>Hasta la fecha objetivo</option>
        ${PLAN_OPTIONS.map((w) => `<option value="${w}" ${Number(p.planWeeks) === w ? "selected" : ""}>${w} semanas${w % 4 === 0 ? ` (${w / 4} ${w === 4 ? "mes" : "meses"})` : ""}</option>`).join("")}
      </select>
      <small class="muted">Todo el plan (adaptación, hipertrofia, fuerza y definición) se comprime en este plazo. Un plazo corto = un plan más exigente.</small></label>
    <div class="field"><span>Intensidad</span>${seg("intensity", Object.entries(INTENSITY).map(([k, v]) => [k, v.label]), p.intensity || "moderada")}
      <small class="muted" id="intensity-hint">${INTENSITY[p.intensity || "moderada"].hint}</small></div>`;
}

// Línea de tiempo del plan: qué semanas abarca cada fase. Marca la fase de `currentWeek`.
export function planHTML(profile, currentWeek = 0) {
  const plan = planOf(profile);
  const deloads = [...plan.deloads];
  return `
    <ol class="plan-line">${plan.phases.map((ph) => `
      <li class="${currentWeek >= ph.from && currentWeek <= ph.to ? "on" : ""} ${currentWeek > ph.to ? "past" : ""}">
        <span class="plan-weeks">${ph.from === ph.to ? `Sem ${ph.from}` : `Sem ${ph.from}–${ph.to}`}</span>
        <b>${ph.name}</b>
      </li>`).join("")}
    </ol>
    <p class="small muted">${plan.total} semanas · intensidad ${INTENSITY[plan.intensity].label.toLowerCase()}${deloads.length ? ` · descarga en semana ${deloads.join(", ")}` : " · sin semanas de descarga"}.</p>`;
}

// Actualiza el texto de ayuda de intensidad al cambiar la opción.
export function wireIntensityHint(root) {
  root.querySelectorAll('input[name="intensity"]').forEach((r) => r.addEventListener("change", () => {
    const hint = root.querySelector("#intensity-hint");
    if (hint) hint.textContent = INTENSITY[r.value].hint;
  }));
}

export function readProfileForm(form) {
  const f = new FormData(form);
  const out = {};
  for (const [k, v] of f.entries()) out[k] = typeof v === "string" ? v.trim() : v;
  if (out.heightCm) out.heightCm = Number(out.heightCm);
  if (out.weightKg) out.weightKg = Number(out.weightKg);
  if ("planWeeks" in out) out.planWeeks = out.planWeeks ? Number(out.planWeeks) : null;
  return out;
}

export function metricsHTML(p) {
  const m = metrics(p);
  return `
    <div class="tiles tiles-2">
      <div class="tile"><b>${m.bmi.toFixed(1).replace(".", ",")}</b><span>IMC · ${m.bmiCategory}</span></div>
      <div class="tile"><b>${m.tdee.toLocaleString("es")}</b><span>kcal que gastas al día</span></div>
      <div class="tile accent"><b>${m.kcal.toLocaleString("es")}</b><span>kcal objetivo diarias</span></div>
      <div class="tile"><b>${m.protein} g</b><span>proteína al día</span></div>
    </div>
    <p class="small muted">Metabolismo basal ${m.bmr.toLocaleString("es")} kcal (Mifflin-St Jeor) × actividad 1,45.
      Macros sugeridos: ${m.protein} g proteína · ${m.fat} g grasa · ${m.carbs} g carbohidratos · ${fmtKg(m.water)} L de agua.
      Son estimaciones: si tienes alguna condición médica, consulta a un profesional.</p>`;
}

// ── Pantalla de onboarding ──────────────────────────────────────────────────
export function render(el) {
  const draft = { name: state.user.displayName?.split(" ")[0] || "" };
  let step = 1;

  const paint = () => {
    const steps = [1, 2, 3].map((n) => `<i class="${n <= step ? "on" : ""}"></i>`).join("");
    let body = "";
    if (step === 1) {
      body = `<p class="eyebrow">Paso 1 de 3</p><h1>Sobre ti</h1><p class="muted">Con estos datos calculamos tu plan y tus cargas iniciales.</p>
        <form id="f" class="form">${aboutFields(draft)}
          <button class="btn btn-primary btn-lg btn-block">Siguiente</button></form>`;
    } else if (step === 2) {
      body = `<p class="eyebrow">Paso 2 de 3</p><h1>Tu objetivo</h1><p class="muted">Con esto ajustamos series, repeticiones y cargas.</p>
        <form id="f" class="form">${goalFields(draft)}
          <div class="row2"><button type="button" class="btn" id="back">Atrás</button>
          <button class="btn btn-primary">Ver mi plan</button></div></form>`;
    } else {
      const planned = { ...draft, startDate: draft.startDate || todayISO() };
      body = `<p class="eyebrow">Paso 3 de 3</p><h1>Tu plan, ${esc(draft.name)}</h1>
        <p class="muted">${planOf(planned).total} semanas · 3 entrenamientos por semana</p>
        ${metricsHTML(draft)}
        <div class="card"><h3>Fases</h3>${planHTML(planned)}</div>
        <div class="card">
          <h3>Cómo funciona</h3>
          <ol class="steps-list">
            <li>Entrena los días <b>Piernas</b>, <b>Brazos</b> y <b>Core</b> en cualquier orden durante la semana.</li>
            <li>Te sugerimos una carga inicial para cada ejercicio: ajústala para que las últimas repeticiones cuesten.</li>
            <li>Anota tus kilos y repeticiones. Cuando completes todas las series al tope, la app te dirá que subas el peso.</li>
          </ol>
        </div>
        <div class="row2"><button type="button" class="btn" id="back">Atrás</button>
          <button class="btn btn-primary" id="start">Comenzar</button></div>`;
    }
    el.innerHTML = `<div class="screen"><div class="stepper-dots">${steps}</div>${body}</div>`;
    wireIntensityHint(el);

    el.querySelector("#back")?.addEventListener("click", () => {
      const form = el.querySelector("#f");
      if (form) Object.assign(draft, readProfileForm(form));
      step--; paint();
    });
    el.querySelector("#f")?.addEventListener("submit", (e) => {
      e.preventDefault();
      Object.assign(draft, readProfileForm(e.target));
      step++; paint();
      window.scrollTo(0, 0);
    });
    el.querySelector("#start")?.addEventListener("click", async (e) => {
      e.target.disabled = true;
      const today = todayISO();
      const profile = { ...draft, photoURL: state.user.photoURL || "", startDate: draft.startDate || today, createdAt: today };
      try {
        await saveProfile(state.user.uid, profile);
        const bw = await addBodyweight(state.user.uid, { date: today, kg: profile.weightKg });
        state.profile = profile;
        state.bodyweight = [bw];
        go("#/home");
      } catch (err) {
        console.error(err);
        toast("No se pudo guardar. Revisa tu conexión.");
        e.target.disabled = false;
      }
    });
  };
  paint();
}
