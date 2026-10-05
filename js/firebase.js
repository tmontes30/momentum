import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, setDoc, increment, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

export const isConfigured = !firebaseConfig.apiKey.startsWith("PEGA_AQUI");

export const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app
  ? initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
  : null;

export function onUser(cb) {
  return onAuthStateChanged(auth, (user) => {
    if (user) trackUsage(user);
    return cb(user);
  });
}

// Registro de uso para el panel del owner (cavedevz.com/admin/).
// Una escritura por persona por día y pestaña; si falla no afecta la app.
function trackUsage(user) {
  const day = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Santiago" });
  const key = `usage:${user.uid}:${day}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch { /* sin sessionStorage: se registra igual */ }
  const info = { uid: user.uid, email: user.email || "", name: user.displayName || "", lastSeen: serverTimestamp() };
  Promise.all([
    setDoc(doc(db, "usage", user.uid), { ...info, visits: increment(1) }, { merge: true }),
    setDoc(doc(db, "usage_daily", `${day}_${user.uid}`), { ...info, date: day, count: increment(1) }, { merge: true }),
  ]).catch((err) => console.warn("usage:", err.code || err));
  window.gtag?.("event", "login", { method: "Google" });
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    // Algunos navegadores móviles bloquean el popup: probamos con redirect.
    if (err.code === "auth/popup-blocked" || err.code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, provider);
    } else if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
      throw err;
    }
  }
}

export function logout() {
  return signOut(auth);
}
