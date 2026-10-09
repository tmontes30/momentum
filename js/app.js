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

let lastView = null;

// #/vista/param1/param2 → { name, params }
function parseHash() {
  const [name = "home", ...params] = location.hash.replace(/^#\/?/, "").split("/");
  return { name: name || "home", params: params.filter(Boolean) };
}

async function route() {
  if (!ready) return;
  let { name, params } = parseHash();
  const param = params[0] ?? null;

  if (!state.user) name = "login";
  else if (!state.profile) name = "onboarding";
  else if (name === "login" || name === "onboarding" || !views[name]) name = "home";

  if (typeof cleanup === "function") cleanup();
  cleanup = null;
  // Al moverse entre semanas en Inicio no se pierde la posición de scroll.
  if (name !== lastView || name !== "home") window.scrollTo(0, 0);
  lastView = name;

  const showNav = NAV_VIEWS.includes(name) && !(name === "workout" && param);
  nav.hidden = !showNav;
  document.body.classList.toggle("has-nav", showNav);
  nav.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.dataset.view === name));

  try {
    cleanup = await views[name].render(main, ...params);
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

// ── Detección de versión nueva ───────────────────────────────────────────────
// El iPhone mantiene la app "dormida" sin recargarla: al volver a ella (y cada 30 min) se compara
// version.json con el de esta copia y, si cambió, se ofrece actualizar.
async function fetchVersion() {
  try {
    const r = await fetch(`./version.json?t=${Date.now()}`, { cache: "no-store" });
    return r.ok ? (await r.json()).version : null;
  } catch { return null; }
}

async function checkForUpdate() {
  const latest = await fetchVersion();
  if (!latest) return;
  if (!state.appVersion) { state.appVersion = latest; return; }
  if (latest !== state.appVersion && !document.getElementById("update-bar")) {
    const bar = document.createElement("div");
    bar.id = "update-bar";
    bar.className = "update-bar";
    bar.innerHTML = `<span>Hay una versión nueva de Momentum</span><button class="btn btn-sm">Actualizar</button>`;
    // Lo anotado en un entrenamiento queda guardado en el teléfono, así que recargar no pierde nada.
    bar.querySelector("button").addEventListener("click", () => location.reload());
    document.body.appendChild(bar);
  }
}

checkForUpdate();
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkForUpdate(); });
setInterval(checkForUpdate, 30 * 60 * 1000);
