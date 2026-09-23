// Service worker: red primero y caché como respaldo, así siempre se ve la última versión publicada
// y la interfaz igual abre si no hay conexión en el gimnasio.
const CACHE = "fitboda-v1";
const SHELL = [
  "./", "./index.html", "./css/styles.css", "./manifest.webmanifest",
  "./js/app.js", "./js/firebase.js", "./js/firebase-config.js", "./js/db.js", "./js/state.js",
  "./js/ui.js", "./js/calc.js", "./js/program.js",
  "./js/views/login.js", "./js/views/onboarding.js", "./js/views/home.js",
  "./js/views/workout.js", "./js/views/progress.js", "./js/views/profile.js",
  "./icons/icon-192.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  const cacheable = req.method === "GET" && (
    url.origin === location.origin ||
    url.hostname === "www.gstatic.com" ||
    url.hostname === "cdn.jsdelivr.net" ||
    url.hostname.endsWith("fonts.googleapis.com") ||
    url.hostname.endsWith("fonts.gstatic.com")
  );
  if (!cacheable) return; // Firestore, Auth, etc. van directo a la red.

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});
