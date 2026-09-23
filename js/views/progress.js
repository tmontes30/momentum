import { EXERCISES, DAYS } from "../program.js";
import { exerciseHistory, workingWeight, summarizeSets, fmtKg } from "../calc.js";
import { addBodyweight, deleteBodyweight, deleteSession } from "../db.js";
import { state, todayISO, sessionWeek } from "../state.js";
import { esc, toast, fmtDate, storage } from "../ui.js";

const CHART_URL = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
let chartLib = null;
function loadChart() {
  chartLib ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = CHART_URL;
    s.onload = () => resolve(window.Chart);
    s.onerror = () => { chartLib = null; reject(new Error("No se pudo cargar la librería de gráficos")); };
    document.head.appendChild(s);
  });
  return chartLib;
}

const SEL_KEY = "fitboda-progress-ex";

export async function render(el) {
  let charts = [];
  const destroyCharts = () => { charts.forEach((c) => c.destroy()); charts = []; };

  const paint = async () => {
    destroyCharts();
    const trained = [...new Set(state.sessions.flatMap((s) => (s.exercises || []).map((e) => e.exId)))]
      .filter((id) => EXERCISES[id]);
    let selected = storage.get(SEL_KEY);
    if (!trained.includes(selected)) selected = trained[0];

    // Agrupa cada ejercicio (o su alternativa) bajo el primer día donde aparece.
    const dayOf = (id) => Object.keys(DAYS).find((k) => DAYS[k].exercises.some((x) => x === id || EXERCISES[x].alt === id));
    const opt = (id) => `<option value="${id}" ${id === selected ? "selected" : ""}>${EXERCISES[id].name}</option>`;
    const options = Object.entries(DAYS).map(([k, d]) => {
      const ids = trained.filter((id) => dayOf(id) === k);
      return ids.length ? `<optgroup label="${d.name}">${ids.map(opt).join("")}</optgroup>` : "";
    }).join("");
    const orphanOpts = trained.filter((id) => !dayOf(id)).map(opt).join("");

    const bw = state.bodyweight;
    const recent = [...state.sessions].reverse().slice(0, 15);

    el.innerHTML = `
      <div class="screen">
        <h1>Tu progreso</h1>

        <section class="card">
          <div class="section-head"><h3>Por ejercicio</h3></div>
          ${trained.length ? `
            <select id="ex" class="select">${options}${orphanOpts ? `<optgroup label="Otros">${orphanOpts}</optgroup>` : ""}</select>
            <div id="ex-stats" class="tiles tiles-sm"></div>
            <h4 class="chart-title" id="t-max"></h4>
            <div class="chart"><canvas id="c-max" role="img"></canvas></div>
            <h4 class="chart-title">Volumen por semana (kg × reps)</h4>
            <div class="chart"><canvas id="c-vol" role="img" aria-label="Volumen semanal"></canvas></div>
            <details class="table-view"><summary>Ver como tabla</summary><div id="ex-table"></div></details>`
          : `<p class="muted">Aún no hay entrenamientos. Completa tu primer día y aquí verás cómo suben tus pesos semana a semana. 💪</p>`}
        </section>

        <section class="card">
          <div class="section-head"><h3>Peso corporal</h3>
            ${bw.length ? `<span class="muted small">${fmtKg(bw[bw.length - 1].kg)} kg</span>` : ""}</div>
          ${bw.length >= 2 ? `<div class="chart"><canvas id="c-bw" role="img" aria-label="Peso corporal en el tiempo"></canvas></div>` : ""}
          <form id="bw-form" class="inline-form">
            <input type="date" name="date" value="${todayISO()}" max="${todayISO()}" required>
            <input type="number" name="kg" inputmode="decimal" step="0.1" min="30" max="250" placeholder="kg" required>
            <button class="btn btn-primary">Agregar</button>
          </form>
          ${bw.length ? `<details class="table-view"><summary>Registros (${bw.length})</summary>
            <ul class="plain-list">${[...bw].reverse().map((b) => `<li><span>${fmtDate(b.date, { day: "numeric", month: "short", year: "numeric" })}</span><b>${fmtKg(b.kg)} kg</b>
              <button class="icon-btn sm" data-del-bw="${b.id}" aria-label="Borrar registro">✕</button></li>`).join("")}</ul></details>` : ""}
        </section>

        <section class="card">
          <h3>Historial</h3>
          ${recent.length ? `<ul class="plain-list">${recent.map((s) => `
            <li><span><b>${DAYS[s.dayKey]?.icon || ""} ${DAYS[s.dayKey]?.name || s.dayKey}</b><br>
              <small class="muted">${fmtDate(s.date, { weekday: "short", day: "numeric", month: "short" })}${sessionWeek(s) > 0 ? ` · semana ${sessionWeek(s)}` : ""} · ${s.exercises.length} ejercicios · ${s.durationMin} min</small></span>
              <button class="icon-btn sm" data-del-session="${s.id}" aria-label="Borrar entrenamiento">✕</button></li>`).join("")}</ul>`
          : `<p class="muted">Sin entrenamientos todavía.</p>`}
        </section>
      </div>`;

    el.querySelector("#ex")?.addEventListener("change", (e) => { storage.set(SEL_KEY, e.target.value); paint(); });

    el.querySelector("#bw-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const entry = { date: f.get("date"), kg: Number(f.get("kg")) };
      try {
        const saved = await addBodyweight(state.user.uid, entry);
        state.bodyweight.push(saved);
        state.bodyweight.sort((a, b) => a.date.localeCompare(b.date));
        toast("Peso registrado");
        paint();
      } catch (err) { console.error(err); toast("No se pudo guardar."); }
    });

    el.querySelectorAll("[data-del-bw]").forEach((b) => b.addEventListener("click", async () => {
      if (!confirm("¿Borrar este registro de peso?")) return;
      await deleteBodyweight(state.user.uid, b.dataset.delBw);
      state.bodyweight = state.bodyweight.filter((x) => x.id !== b.dataset.delBw);
      paint();
    }));

    el.querySelectorAll("[data-del-session]").forEach((b) => b.addEventListener("click", async () => {
      if (!confirm("¿Borrar este entrenamiento? No se puede deshacer.")) return;
      await deleteSession(state.user.uid, b.dataset.delSession);
      state.sessions = state.sessions.filter((x) => x.id !== b.dataset.delSession);
      toast("Entrenamiento borrado");
      paint();
    }));

    if (!selected && bw.length < 2) return;

    let Chart;
    try { Chart = await loadChart(); } catch (err) { toast(err.message); return; }
    if (!el.isConnected) return;

    if (selected) drawExercise(Chart, el, selected, charts);
    if (bw.length >= 2) {
      charts.push(lineChart(Chart, el.querySelector("#c-bw"), bw.map((b) => fmtDate(b.date)), bw.map((b) => b.kg), "kg"));
    }
  };

  await paint();
  return destroyCharts;
}

function drawExercise(Chart, el, exId, charts) {
  const ex = EXERCISES[exId];
  const history = exerciseHistory(state.sessions, exId);
  const byWeek = new Map();
  for (const h of history) {
    const key = mondayOf(h.date);
    const w = byWeek.get(key) || { best: 0, volume: 0 };
    const best = ex.type === "weight" ? workingWeight(h.sets) : Math.max(...h.sets.map((s) => Number(s.reps) || 0));
    w.best = Math.max(w.best, best);
    w.volume += h.sets.reduce((a, s) => a + (Number(s.kg) || 0) * (Number(s.reps) || 0), 0);
    byWeek.set(key, w);
  }
  const weeks = [...byWeek.keys()].sort();
  const labels = weeks.map((w) => fmtDate(w));
  const best = weeks.map((w) => byWeek.get(w).best);
  const unit = ex.type === "weight" ? "kg" : ex.type === "time" ? "s" : "reps";
  const titleMetric = ex.type === "weight" ? "Peso de trabajo" : ex.type === "time" ? "Mejor tiempo" : "Máximo de repeticiones";

  el.querySelector("#t-max").textContent = `${titleMetric} por semana (${unit})`;
  el.querySelector("#c-max").setAttribute("aria-label", `${titleMetric} de ${ex.name} por semana`);

  const first = best[0];
  const lastV = best[best.length - 1];
  const diff = lastV - first;
  el.querySelector("#ex-stats").innerHTML = `
    <div class="tile"><b>${fmtKg(first)} ${unit}</b><span>inicio</span></div>
    <div class="tile"><b>${fmtKg(lastV)} ${unit}</b><span>actual</span></div>
    <div class="tile ${diff > 0 ? "accent" : ""}"><b>${diff > 0 ? "+" : ""}${fmtKg(diff)}</b><span>${first ? `${diff >= 0 ? "+" : ""}${Math.round((diff / first) * 100)}%` : "mejora"}</span></div>`;

  el.querySelector("#ex-table").innerHTML = `<table><thead><tr><th>Fecha</th><th>Series</th></tr></thead><tbody>
    ${[...history].reverse().map((h) => `<tr><td>${fmtDate(h.date)}</td><td>${esc(summarizeSets(exId, h.sets))}</td></tr>`).join("")}</tbody></table>`;

  charts.push(lineChart(Chart, el.querySelector("#c-max"), labels, best, unit));
  if (ex.type === "weight") {
    charts.push(barChart(Chart, el.querySelector("#c-vol"), labels, weeks.map((w) => Math.round(byWeek.get(w).volume)), "kg"));
  } else {
    el.querySelector("#c-vol").closest(".chart").previousElementSibling.remove();
    el.querySelector("#c-vol").closest(".chart").remove();
  }
}

// Lunes de la semana de una fecha, como 'YYYY-MM-DD' (clave de agrupación semanal).
function mondayOf(iso) {
  const d = new Date(iso);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tokens() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  return { accent: v("--accent"), accentSoft: v("--accent-soft"), line: v("--line"), muted: v("--muted"), surface: v("--surface"), text: v("--text") };
}

function baseOptions(t, unit) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: t.surface, titleColor: t.text, bodyColor: t.text, borderColor: t.line, borderWidth: 1,
        displayColors: false, padding: 10,
        callbacks: { label: (c) => `${fmtKg(c.parsed.y)} ${unit}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: t.muted, maxRotation: 0, autoSkipPadding: 12 }, border: { color: t.line } },
      y: { grid: { color: t.line }, ticks: { color: t.muted, maxTicksLimit: 5 }, border: { display: false } },
    },
  };
}

function lineChart(Chart, canvas, labels, data, unit) {
  const t = tokens();
  return new Chart(canvas, {
    type: "line",
    data: { labels, datasets: [{ data, borderColor: t.accent, backgroundColor: t.accentSoft, fill: true, borderWidth: 2, tension: 0.3,
      pointRadius: 4, pointHoverRadius: 6, pointBackgroundColor: t.accent, pointBorderColor: t.surface, pointBorderWidth: 2 }] },
    options: baseOptions(t, unit),
  });
}

function barChart(Chart, canvas, labels, data, unit) {
  const t = tokens();
  const opts = baseOptions(t, unit);
  opts.scales.y.beginAtZero = true;
  return new Chart(canvas, {
    type: "bar",
    data: { labels, datasets: [{ data, backgroundColor: t.accent, borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: "bottom", maxBarThickness: 28 }] },
    options: opts,
  });
}
