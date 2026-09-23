import { saveProfile, addBodyweight } from "../db.js";
import { logout } from "../firebase.js";
import { state, program, todayISO } from "../state.js";
import { esc, toast, fmtDate } from "../ui.js";
import { aboutFields, goalFields, readProfileForm, metricsHTML } from "./onboarding.js";

export function render(el) {
  const p = state.profile;
  const { week, total } = program();

  el.innerHTML = `
    <div class="screen">
      <header class="top">
        <div><h1>Perfil</h1><p class="muted small">${esc(state.user.email || "")}</p></div>
        ${p.photoURL ? `<img class="avatar" src="${esc(p.photoURL)}" alt="" referrerpolicy="no-referrer">` : ""}
      </header>

      <section class="card"><h3>Tus números</h3>${metricsHTML(p)}</section>

      <form id="f" class="card form">
        <h3>Tus datos</h3>
        ${aboutFields(p)}
        ${goalFields(p)}
        <button class="btn btn-primary btn-block">Guardar cambios</button>
      </form>

      <section class="card">
        <h3>Programa</h3>
        <p class="muted">Empezaste el ${fmtDate(p.startDate, { day: "numeric", month: "long", year: "numeric" })}. Vas en la semana ${week} de ${total}.</p>
        <button class="btn btn-block" id="restart">Reiniciar el programa desde hoy</button>
        <p class="small muted">Tu historial de pesos se mantiene; solo vuelve a la semana 1.</p>
      </section>

      <button class="btn btn-block btn-ghost" id="logout">Cerrar sesión</button>
      <p class="small muted center">Comparte la página con tus amigos: cada uno entra con su Google y tiene su propio perfil.</p>
    </div>`;

  el.querySelector("#f").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = readProfileForm(e.target);
    const btn = e.target.querySelector("button");
    btn.disabled = true;
    try {
      await saveProfile(state.user.uid, data);
      if (data.weightKg !== p.weightKg) {
        const bw = await addBodyweight(state.user.uid, { date: todayISO(), kg: data.weightKg });
        state.bodyweight.push(bw);
      }
      state.profile = { ...p, ...data };
      toast("Perfil actualizado");
      render(el);
    } catch (err) {
      console.error(err);
      toast("No se pudo guardar.");
      btn.disabled = false;
    }
  });

  el.querySelector("#restart").addEventListener("click", async () => {
    if (!confirm("¿Volver a la semana 1 desde hoy?")) return;
    await saveProfile(state.user.uid, { startDate: todayISO() });
    state.profile = { ...p, startDate: todayISO() };
    toast("Programa reiniciado");
    render(el);
  });

  el.querySelector("#logout").addEventListener("click", () => logout());
}
