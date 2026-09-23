import { loginWithGoogle } from "../firebase.js";
import { toast, icon, logo } from "../ui.js";

export function render(el) {
  el.innerHTML = `
    <div class="screen login">
      <div class="login-hero">
        ${logo(64)}
        <h1>Momentum</h1>
        <p class="lead">Entrenamiento con plan. Progreso que se nota.</p>
      </div>
      <ul class="login-points">
        <li><span>${icon("target")}</span><div><b>Rutinas a tu medida</b><small>Series, repeticiones y cargas calculadas según tu perfil.</small></div></li>
        <li><span>${icon("chart")}</span><div><b>Progreso medible</b><small>Registra cada serie y sigue tu evolución semana a semana.</small></div></li>
        <li><span>${icon("users")}</span><div><b>Perfil individual</b><small>Cada persona con su plan y sus datos privados.</small></div></li>
      </ul>
      <button class="btn btn-primary btn-lg btn-block" id="google">
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        Entrar con Google
      </button>
    </div>`;

  const btn = el.querySelector("#google");
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      toast("No se pudo iniciar sesión. Intenta de nuevo.");
    } finally {
      btn.disabled = false;
    }
  });
}
