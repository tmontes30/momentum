import { isConfigured, onUser } from "./firebase.js";
import { state } from "./state.js";
import { esc, logo } from "./ui.js";
import * as login from "./views/login.js";
import * as onboarding from "./views/onboarding.js";
import * as home from "./views/home.js";
import * as workout from "./views/workout.js";
import * as progress from "./views/progress.js";
import * as profile from "./views/profile.js";

const views = { login, onboarding, home, workout, progress, profile };
const NAV_VIEWS = ["home", "workout", "progress", "profile"];

const main = document.getElementById("view");
const nav = document.getElementById("nav");
let cleanup = null;
let ready = false;

function parseHash() {
  const [name = "home", param = null] = location.hash.replace(/^#\/?/, "").split("/");
  return { name: name || "home", param };
}

async function route() {
  if (!ready) return;
  let { name, param } = parseHash();

  if (!state.user) name = "login";
  else if (!state.profile) name = "onboarding";
  else if (name === "login" || name === "onboarding" || !views[name]) name = "home";

  if (typeof cleanup === "function") cleanup();
  cleanup = null;
  window.scrollTo(0, 0);

  const showNav = NAV_VIEWS.includes(name) && !(name === "workout" && param);
  nav.hidden = !showNav;
  document.body.classList.toggle("has-nav", showNav);
  nav.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.dataset.view === name));

  try {
    cleanup = await views[name].render(main, param);
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="screen center"><p class="muted">Algo salió mal: ${esc(err.message)}</p>
      <button class="btn" onclick="location.reload()">Reintentar</button></div>`;
  }
}

function renderSetup() {
  main.innerHTML = `
    <div class="screen center">
      ${logo(56)}
      <h1>Falta configurar Firebase</h1>
      <p class="muted">Abre <code>js/firebase-config.js</code> y pega la configuración de tu proyecto Firebase.
      Los pasos están en el archivo <code>README.md</code>.</p>
    </div>`;
}

function renderLoading() {
  main.innerHTML = `<div class="screen center"><div class="spinner" aria-label="Cargando"></div></div>`;
}

if (!isConfigured) {
  renderSetup();
} else {
  renderLoading();
  onUser(async (user) => {
    state.user = user;
    state.profile = null;
    state.sessions = [];
    state.bodyweight = [];
    if (user) {
      renderLoading();
      try {
        const { getProfile, listSessions, listBodyweight } = await import("./db.js");
        state.profile = await getProfile(user.uid);
        if (state.profile) {
          [state.sessions, state.bodyweight] = await Promise.all([listSessions(user.uid), listBodyweight(user.uid)]);
        }
      } catch (err) {
        console.error(err);
        main.innerHTML = `<div class="screen center"><p class="muted">No pudimos cargar tus datos. Revisa tu conexión.</p>
          <p class="small muted">${esc(err.message)}</p>
          <button class="btn" onclick="location.reload()">Reintentar</button></div>`;
        return;
      }
    }
    ready = true;
    route();
  });
  window.addEventListener("hashchange", route);
}

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
