// Pantalla "Alimentación" (#/nutrition): plan aproximado calculado con el perfil.
// Requerimientos, día por comidas con porciones y ejemplos, equivalencias y recomendaciones.
import { metrics, fmtKg } from "../calc.js";
import { GROUPS, EQUIVALENTS, RECOMMENDATIONS, planFor, totals, exampleFor, fmtPortion } from "../nutrition.js";
import { state } from "../state.js";
import { icon } from "../ui.js";

export function render(el) {
  const p = state.profile;
  const plan = planFor(p);
  const m = metrics(p);
  const t = totals(plan.meals);

  el.innerHTML = `
    <div class="screen">
      <header class="top">
        <a class="icon-btn" href="#/profile" aria-label="Volver">${icon("back")}</a>
        <div class="grow"><p class="eyebrow">Plan aproximado</p><h1 class="h-sm">Alimentación</h1></div>
      </header>

      <div class="notice">${icon("info")}<p>Calculado con tu peso, estatura, edad, sexo y objetivo, siguiendo cómo arma las pautas
        una nutricionista deportiva (régimen por porciones, alto en proteína). Si cambias tus datos en Perfil, se recalcula.</p></div>

      <section class="tiles tiles-2">
        <div class="tile"><b>${plan.kcal.toLocaleString("es")}</b><span>kcal al día</span></div>
        <div class="tile"><b>${plan.protein} g</b><span>proteína (${fmtKg(Math.round((plan.protein / p.weightKg) * 10) / 10)} g/kg)</span></div>
        <div class="tile"><b>${plan.cho} g</b><span>carbohidratos</span></div>
        <div class="tile"><b>${plan.fat} g</b><span>grasas</span></div>
      </section>
      <p class="small muted">Agua: ${fmtKg(plan.water)} L al día (más los días de entrenamiento).
        Grasa corporal ${m.bodyFatMeasured ? "" : "estimada "}${fmtKg(m.bodyFat)}% · masa libre de grasa ${fmtKg(m.ffm)} kg.</p>

      <section>
        <div class="section-head"><h2>Tu día</h2><span class="muted small">porciones por comida</span></div>
        <div class="meals">${plan.meals.map(mealHTML).join("")}</div>
      </section>

      <section class="card">
        <h3>Porciones al día</h3>
        <div class="portion-row">${GROUPS.map((g) => `<div><b>${fmtPortion(t[g.key])}</b><span>${g.name}</span></div>`).join("")}</div>
      </section>

      <section class="card">
        <h3>Equivalencias</h3>
        <p class="small muted">Qué cuenta como 1 porción de cada grupo, para cambiar alimentos manteniendo el plan.</p>
        ${GROUPS.map((g) => `<details class="lib-item"><summary><span class="grow"><b>${g.name}</b></span></summary>
          <table><tbody>${EQUIVALENTS[g.key].map(([food, size]) => `<tr><td>${food}</td><td class="muted">${size}</td></tr>`).join("")}</tbody></table>
          ${g.key === "f" ? `<p class="small muted">* Frutas con más azúcar: prefiérelas en menor cantidad.</p>` : ""}</details>`).join("")}
      </section>

      <section class="card">
        <h3>Recomendaciones</h3>
        <ul class="steps-list">${RECOMMENDATIONS.map((r) => `<li>${r}</li>`).join("")}</ul>
      </section>

      <p class="small muted center">Orientación general: no reemplaza la indicación de un nutricionista.</p>
    </div>`;
}

function mealHTML(meal) {
  const items = GROUPS.filter((g) => Number(meal[g.key]) > 0);
  return `<article class="card meal">
    <div class="section-head"><h3>${meal.name}</h3><span class="muted small">${meal.time}</span></div>
    <ul class="meal-list">${items.map((g) => `<li>
      <span class="portion">${fmtPortion(meal[g.key])}</span>
      <span class="grow"><b>${g.name}</b><br><small class="muted">${exampleFor(meal.name, g.key)}</small></span></li>`).join("")}</ul>
  </article>`;
}
