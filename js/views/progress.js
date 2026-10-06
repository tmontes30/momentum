import { EXERCISES, DAYS, DAY_KEYS } from "../program.js";
import { exerciseHistory, workingWeight, summarizeSets, fmtKg } from "../calc.js";
import { addBodyweight, deleteBodyweight, deleteSession } from "../db.js";
import { state, program, todayISO, sessionWeek } from "../state.js";
import { streak, bestStreak, adherence, totalVolume, weeklyVolume, exerciseProgress, achievements, daysByWeek } from "../stats.js";
import { esc, toast, fmtDate, storage, icon } from "../ui.js";

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

const SEL_KEY = "momentum-progress-ex";
const RECORDS_SHOWN = 6;

export async function render(el) {
  let charts = [];
  const destroyCharts = () => { charts.forEach((c) => c.destroy()); charts = []; };

  const paint = async () => {
    destroyCharts();
    const { week, total, phase } = program();
    const sessions = state.sessions;
    const progress = exerciseProgress();
    const trained = progress.map((p) => p.id);
    let selected = storage.get(SEL_KEY);
    if (!trained.includes(selected)) selected = trained[0];

    const adh = adherence();
    const vol = totalVolume();
    const best = bestStreak();
    const achieved = achievements();
    const unlocked = achieved.filter((a) => a.unlocked).length;
    const planPct = Math.min(100, Math.round((Math.min(week, total) / total) * 100));
    const weeksLeft = Math.max(0, total - week);
    const bw = state.bodyweight;
    const recent = [...sessions].reverse().slice(0, 15);
    const wv = weeklyVolume(Math.max(1, Math.min(week, total)));
    const hasWeekly = wv.some((w) => w.volume > 0);

    // Selector de ejercicio agrupado por día (cada ejercicio o su alternativa bajo el primer día donde aparece).
    const dayOf = (id) => Object.keys(DAYS).find((k) => DAYS[k].exercises.some((x) => x === id || EXERCISES[x].alt === id));
    const opt = (id) => `<option value="${id}" ${id === selected ? "selected" : ""}>${EXERCISES[id].name}</option>`;
    const options = Object.entries(DAYS).map(([k, d]) => {
      const ids = trained.filter((id) => dayOf(id) === k);
      return ids.length ? `<optgroup label="${d.name}">${ids.map(opt).join("")}</optgroup>` : "";
    }).join("");
    const orphanOpts = trained.filter((id) => !dayOf(id)).map(opt).join("");

    el.innerHTML = `
      <div class="screen">
        <header>
          <h1>Tu progreso</h1>
          <p class="muted small">Semana ${week} de ${total} · ${phase.name}</p>
        </header>

        ${sessions.length ? "" : `<div class="notice">${icon("flag")}<p><b>Tu progreso empieza aquí.</b> Completa tu primer entrenamiento y esta pantalla se irá llenando con tus marcas, rachas y logros.</p></div>`}

        <section class="tiles tiles-2 kpis">
          <div class="tile"><span class="kpi-ico">${icon("done")}</span><b>${sessions.length}</b><span>entrenamientos</span></div>
          <div class="tile"><span class="kpi-ico">${icon("zap")}</span><b>${streak()} ${streak() === 1 ? "semana" : "semanas"}</b><span>racha completa${best > streak() ? ` · mejor: ${best}` : ""}</span></div>
          <div class="tile"><span class="kpi-ico">${icon("target")}</span><b>${adh === null ? "–" : `${adh}%`}</b><span>${adh === null ? "cumplimiento (desde la semana 2)" : "de los días planificados"}</span></div>
          <div class="tile"><span class="kpi-ico">${icon("chart")}</span><b>${Math.round(vol).toLocaleString("es")} kg</b><span>levantados en total</span></div>
        </section>

        <section class="card">
          <div class="section-head"><h3>Tu plan</h3><span class="muted small">${planPct}%</span></div>
          <div class="bar"><i style="width:${planPct}%"></i></div>
          <p class="small muted">${week > total ? "Plan completado. Define un nuevo plazo en Perfil para empezar otro bloque."
            : `${weeksLeft === 0 ? "Última semana del plan" : `Te ${weeksLeft === 1 ? "queda 1 semana" : `quedan ${weeksLeft} semanas`}`} · Fase ${phase.name}${phase.to !== Infinity ? ` hasta la semana ${phase.to}` : ""}`}</p>
        </section>

        <section class="card">
          <div class="section-head"><h3>Constancia</h3><span class="muted small">A · B · C por semana</span></div>
          ${consistencyHTML(week, total)}
          <p class="small muted">Toca una semana para verla o registrar un día que te faltó.</p>
        </section>

        ${sessions.length ? `
        <section class="card">
          <div class="section-head"><h3>Volumen semanal</h3><span class="muted small">kg × reps</span></div>
          ${hasWeekly ? `<div class="chart chart-sm"><canvas id="c-week" role="img" aria-label="Volumen total por semana"></canvas></div>`
            : `<p class="muted small">Aún no hay entrenamientos dentro de las semanas de tu plan.</p>`}
        </section>

        <section class="card">
          <div class="section-head"><h3>Récords y avances</h3><span class="muted small">${progress.filter((p) => p.best > p.first).length} con mejora</span></div>
          <ul class="records">${progress.slice(0, RECORDS_SHOWN).map(recordRow).join("")}</ul>
          ${progress.length > RECORDS_SHOWN ? `<details class="table-view"><summary>Ver los ${progress.length} ejercicios</summary>
            <ul class="records">${progress.slice(RECORDS_SHOWN).map(recordRow).join("")}</ul></details>` : ""}
        </section>` : ""}

        <section class="card" id="detail">
          <div class="section-head"><h3>Detalle por ejercicio</h3></div>
          ${trained.length ? `
            <select id="ex" class="select">${options}${orphanOpts ? `<optgroup label="Otros">${orphanOpts}</optgroup>` : ""}</select>
            <div id="ex-stats" class="tiles tiles-sm"></div>
            <h4 class="chart-title" id="t-max"></h4>
            <div class="chart"><canvas id="c-max" role="img"></canvas></div>
            <h4 class="chart-title" id="t-vol">Volumen por semana (kg × reps)</h4>
            <div class="chart" id="w-vol"><canvas id="c-vol" role="img" aria-label="Volumen semanal del ejercicio"></canvas></div>
            <details class="table-view"><summary>Ver como tabla</summary><div id="ex-table"></div></details>`
          : `<p class="muted">Cuando registres tus primeros entrenamientos verás aquí cómo sube cada peso semana a semana.</p>`}
        </section>

        <section class="card">
          <div class="section-head"><h3>Logros</h3><span class="muted small">${unlocked} de ${achieved.length}</span></div>
          <div class="badges">${achieved.map(badgeHTML).join("")}</div>
        </section>

        <section class="card">
          <div class="section-head"><h3>Peso corporal</h3>
            ${bw.length ? `<span class="muted small">${fmtKg(bw[bw.length - 1].kg)} kg${bw.length >= 2 ? ` · ${signed(bw[bw.length - 1].kg - bw[0].kg)} kg desde el inicio` : ""}</span>` : ""}</div>
          ${bw.length >= 2 ? `<div class="chart"><canvas id="c-bw" role="img" aria-label="Peso corporal en el tiempo"></canvas></div>` : ""}
          <form id="bw-form" class="inline-form">
            <input type="date" name="date" value="${todayISO()}" max="${todayISO()}" required>
            <input type="number" name="kg" inputmode="decimal" step="0.1" min="30" max="250" placeholder="kg" required>
            <button class="btn btn-primary">Agregar</button>
          </form>
          ${bw.length ? `<details class="table-view"><summary>Registros (${bw.length})</summary>
            <ul class="plain-list">${[...bw].reverse().map((b) => `<li><span>${fmtDate(b.date, { day: "numeric", month: "short", year: "numeric" })}</span><b>${fmtKg(b.kg)} kg</b>
              <button class="icon-btn sm" data-del-bw="${b.id}" aria-label="Borrar registro">${icon("close")}</button></li>`).join("")}</ul></details>` : ""}
        </section>

        <section class="card">
          <h3>Historial</h3>
          ${recent.length ? `<ul class="plain-list">${recent.map((s) => `
            <li><a class="history-link" href="#/workout/${s.dayKey}/s-${s.id}"><b>${DAYS[s.dayKey]?.name || s.dayKey}</b><br>
              <small class="muted">${fmtDate(s.date, { weekday: "short", day: "numeric", month: "short" })}${sessionWeek(s) > 0 ? ` · semana ${sessionWeek(s)}` : ""} · ${s.exercises.length} ejercicios${s.durationMin ? ` · ${s.durationMin} min` : ""}</small></a>
              <button class="icon-btn sm" data-del-session="${s.id}" aria-label="Borrar entrenamiento">${icon("close")}</button></li>`).join("")}</ul>`
          : `<p class="muted">Sin entrenamientos todavía.</p>`}
        </section>
      </div>`;

    el.querySelector("#ex")?.addEventListener("change", (e) => { storage.set(SEL_KEY, e.target.value); paint(); });

    // Tocar un récord abre su detalle.
    const openDetail = async (id) => {
      storage.set(SEL_KEY, id);
      await paint();
      el.querySelector("#detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    el.querySelectorAll("[data-ex]").forEach((row) => {
      row.addEventListener("click", () => openDetail(row.dataset.ex));
      row.addEventListener("keydown", (e) => { if (e.key === "Enter") openDetail(row.dataset.ex); });
    });

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

    if (!sessions.length && bw.length < 2) return;

    let Chart;
    try { Chart = await loadChart(); } catch (err) { toast(err.message); return; }
    if (!el.isConnected) return;

    if (hasWeekly) {
      charts.push(barChart(Chart, el.querySelector("#c-week"), wv.map((w) => `S${w.week}`), wv.map((w) => w.volume), "kg"));
    }
    if (selected) drawExercise(Chart, el, selected, charts);
    if (bw.length >= 2) {
      charts.push(lineChart(Chart, el.querySelector("#c-bw"), bw.map((b) => fmtDate(b.date)), bw.map((b) => b.kg), "kg"));
    }
  };

  await paint();
  return destroyCharts;
}

function signed(n) {
  return (n > 0 ? "+" : "") + fmtKg(Math.round(n * 10) / 10);
}

// Mapa de constancia: una columna por semana con los días A/B/C. Semana actual destacada; futuras atenuadas.
function consistencyHTML(current, total) {
  const byWeek = daysByWeek();
  const last = Math.max(total, current);
  const weeks = Array.from({ length: last }, (_, i) => i + 1);
  return `<div class="consistency">${weeks.map((w) => {
    const done = byWeek.get(w) || new Set();
    const cls = [w === current ? "now" : "", w > current ? "future" : "", done.size >= 3 ? "full" : ""].join(" ");
    const label = `Semana ${w}: ${done.size} de 3`;
    return `<a class="wk ${cls}" href="#/home/${w}" title="${label}" aria-label="${label}">
      ${DAY_KEYS.map((k) => `<i class="${done.has(k) ? "on" : ""}"></i>`).join("")}
      <small>${w}</small></a>`;
  }).join("")}</div>`;
}

function recordRow(p) {
  const up = p.best > p.first;
  return `<li data-ex="${p.id}" role="button" tabindex="0">
    <span class="grow"><b>${p.name}</b>
      <small class="muted">${fmtKg(p.first)} → <b class="${up ? "trend-up" : ""}">${fmtKg(p.best)} ${p.unit}</b>${p.bestDate ? ` · ${fmtDate(p.bestDate)}` : ""}</small></span>
    ${sparkline(p.series)}
    <span class="gain ${up ? "up" : ""}">${up ? `+${p.gain}%` : p.sessions === 1 ? "nuevo" : "="}</span>
  </li>`;
}

// Mini-gráfica (sin ejes) de la marca de cada sesión.
function sparkline(series) {
  const w = 64, h = 24, pad = 3;
  if (series.length < 2) return `<svg class="spark" width="${w}" height="${h}" aria-hidden="true"><circle cx="${w - pad}" cy="${h / 2}" r="2.5"/></svg>`;
  const min = Math.min(...series), max = Math.max(...series);
  const x = (i) => pad + (i * (w - pad * 2)) / (series.length - 1);
  const y = (v) => (max === min ? h / 2 : h - pad - ((v - min) * (h - pad * 2)) / (max - min));
  const pts = series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return `<svg class="spark" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts}"/><circle cx="${x(series.length - 1).toFixed(1)}" cy="${y(series[series.length - 1]).toFixed(1)}" r="2.5"/></svg>`;
}

function badgeHTML(a) {
  const pct = Math.min(100, Math.round((a.value / a.goal) * 100));
  return `<div class="badge ${a.unlocked ? "unlocked" : ""}">
    <span class="badge-ico">${icon(a.icon)}</span>
    <b>${a.name}</b>
    <small>${a.desc}</small>
    ${a.unlocked ? `<small class="badge-ok">Desbloqueado</small>`
      : `<div class="bar sm"><i style="width:${pct}%"></i></div><small class="muted">${fmtKg(Math.min(a.value, a.goal))} / ${a.goal.toLocaleString("es")}</small>`}
  </div>`;
}

function drawExercise(Chart, el, exId, charts) {
  const ex = EXERCISES[exId];
  const history = exerciseHistory(state.sessions, exId);
  const byWeek = new Map();
  for (const h of history) {
    const key = sessionWeek(h);
    const w = byWeek.get(key) || { best: 0, volume: 0 };
    const best = ex.type === "weight" ? workingWeight(h.sets) : Math.max(...h.sets.map((s) => Number(s.reps) || 0));
    w.best = Math.max(w.best, best);
    w.volume += h.sets.reduce((a, s) => a + (Number(s.kg) || 0) * (Number(s.reps) || 0), 0);
    byWeek.set(key, w);
  }
  const weeks = [...byWeek.keys()].sort((a, b) => a - b);
  const labels = weeks.map((w) => (w >= 1 ? `S${w}` : "Antes"));
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
    el.querySelector("#t-vol").remove();
    el.querySelector("#w-vol").remove();
  }
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
