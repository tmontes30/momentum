# Momentum: documentación del proyecto

App web de rutinas de gimnasio (pensada para el celular). La hizo Tomás (GitHub: tmontes30) para él y su pareja
antes del matrimonio; también la usan amigos. Cada persona entra con Google y tiene su perfil, su plan y su historial.

## Datos clave (guardar)

| Qué | Valor |
|---|---|
| URL de la app | https://cavedevz.com/momentum/ |
| URL alternativa | https://tmontes30.github.io/momentum/ (redirige a la de arriba) |
| Repositorio | https://github.com/tmontes30/momentum (público, rama `main`) |
| Hosting | GitHub Pages, rama `main`, carpeta raíz. La cuenta tmontes30 tiene el dominio propio `cavedevz.com` |
| Proyecto Firebase | `gimnasio-3905f`. Nombre visible: "Gimnasio". Nombre público: "Momentum" |
| Consola Firebase | https://console.firebase.google.com/project/gimnasio-3905f |
| Consola Google Cloud | https://console.cloud.google.com/apis/credentials?project=gimnasio-3905f |
| Base de datos | Cloud Firestore `(default)`, ubicación `southamerica-west1` (Santiago), plan Spark (gratis) |
| Login | Firebase Authentication, proveedor Google |
| Carpeta local | `C:\Users\catal\OneDrive\Escritorio\TOM\GYM` |

## Stack

- HTML + CSS + JavaScript con módulos ES. **Sin build ni bundler**: los archivos se sirven tal cual.
- Firebase JS SDK **10.12.2** cargado desde `https://www.gstatic.com/firebasejs/10.12.2/...` (Auth + Firestore con caché offline).
- Chart.js 4.4.1 desde jsDelivr (se carga solo en la pantalla Progreso).
- PWA: `manifest.webmanifest` + `sw.js`. El service worker usa red primero y caché de respaldo, así que no deja versiones viejas pegadas.
- Router por hash (`#/home`, `#/workout/A`, `#/progress`, `#/profile`), lo que evita errores 404 en GitHub Pages.
- Todas las rutas son relativas (`./`) porque la app vive en el subpath `/momentum/`.
- Idioma de la interfaz: español. Estilo profesional: **sin emojis**, íconos SVG de línea (`icon()` en `js/ui.js`), paleta índigo/morado y tema claro/oscuro automático.

## Estructura

| Archivo | Qué hace |
|---|---|
| `index.html` | Página única: `<main id="view">`, barra de navegación inferior y toast |
| `css/styles.css` | Todos los estilos. Colores como variables en `:root` y modo oscuro en `@media (prefers-color-scheme: dark)` |
| `js/firebase-config.js` | Configuración web de Firebase (ver abajo) |
| `js/firebase.js` | Inicializa Firebase: `auth`, `db`, `loginWithGoogle()` (popup, con redirect de respaldo) y `logout()` |
| `js/db.js` | CRUD en Firestore: perfil, sesiones y peso corporal |
| `js/app.js` | Router, guardas (sin usuario → login; sin perfil → onboarding) y registro del service worker |
| `js/state.js` | Estado en memoria (usuario, perfil, sesiones, peso) y helpers de semana, fase y cuenta regresiva |
| `js/program.js` | **Rutinas**: biblioteca de ejercicios, días A/B/C, 5 fases y periodización. Aquí se editan los ejercicios |
| `js/calc.js` | IMC, metabolismo basal (Mifflin-St Jeor), calorías, macros, carga inicial y progresión doble |
| `js/ui.js` | `icon()`, `logo()`, `esc()`, `toast()`, `storage` (localStorage con try/catch) y alerta de fin de descanso |
| `js/views/*.js` | Pantallas: `login`, `onboarding` (también exporta los campos del perfil), `home` (exporta `dayCard`), `workout`, `progress`, `profile` |
| `firestore.rules` | Reglas de seguridad (copia de lo publicado en la consola) |
| `icons/` | Íconos PWA (192, 512 y maskable). Se generan con System.Drawing en PowerShell |
| `serve.ps1` | Servidor local para pruebas (http://localhost:8080) |
| `publish.ps1` | Publica esta carpeta en GitHub como un commit (ver "Publicar cambios") |

## Configuración de Firebase (lo que ya está hecho)

1. **Web app** registrada. Configuración pegada en `js/firebase-config.js`:
   ```js
   apiKey: "AIzaSyA8NfPFUTv-zZt-Wk_hh1rqqWmk4P1KUXA",
   authDomain: "gimnasio-3905f.firebaseapp.com",
   projectId: "gimnasio-3905f",
   storageBucket: "gimnasio-3905f.firebasestorage.app",
   messagingSenderId: "684316008433",
   appId: "1:684316008433:web:5c42bfb36f9055bdb96e50",
   ```
   Esta clave **es pública por diseño**: toda app web de Firebase la expone. La seguridad la dan las reglas de Firestore.
   GitHub envió una alerta de "secret detected" por esta clave: se cierra como falso positivo. **No hay que revocarla**, porque la app dejaría de funcionar.
2. **Authentication → Método de acceso:** Google habilitado.
3. **Authentication → Configuración → Dominios autorizados:** deben estar `localhost`, `gimnasio-3905f.firebaseapp.com`, **`cavedevz.com`** y `tmontes30.github.io`.
4. **Firestore → Reglas** (publicadas):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
5. **Recomendado:** restringir la API key en Google Cloud → Credenciales → "Browser key (auto created by Firebase)" → Restricciones de aplicaciones → Sitios web:
   `https://cavedevz.com/*`, `https://tmontes30.github.io/*`, `https://gimnasio-3905f.firebaseapp.com/*`, `http://localhost:8080/*`.
   **Si se restringe, `gimnasio-3905f.firebaseapp.com/*` tiene que estar en la lista, o el login se rompe.**

## Modelo de datos (Firestore)

```
users/{uid}                    perfil
  name, sex ('f'|'m'), birthDate 'YYYY-MM-DD', heightCm, weightKg,
  level ('principiante'|'intermedio'), goal ('tonificar'|'bajar grasa'|'ganar músculo'),
  eventName (opcional, ej. "el matrimonio"), targetDate 'YYYY-MM-DD', startDate 'YYYY-MM-DD',
  photoURL, createdAt, updatedAt
users/{uid}/sessions/{id}      un entrenamiento terminado
  date (ISO), dayKey 'A'|'B'|'C', week, phase, durationMin,
  exercises: [{ exId, sets: [{ kg, reps, done: true }] }]
users/{uid}/bodyweight/{id}    registro de peso corporal
  date 'YYYY-MM-DD', kg
```

- La **semana** de una sesión se calcula desde su `date` y el `startDate` del perfil (`sessionWeek` en `state.js`), no desde el campo `week` guardado. Así "Reiniciar programa" funciona bien.
- El borrador del entrenamiento en curso vive en localStorage (`momentum-draft-{uid}-{A|B|C}`) y se sube a Firestore al tocar "Terminar".
- Los IDs de ejercicio (`exId`) son las llaves de `EXERCISES` en `program.js`. **No renombrar un id existente**: el historial de las personas quedaría huérfano. Para cambiar el nombre visible, editar solo `name`.

## Lógica de entrenamiento

- **3 días:** A = Piernas y glúteos, B = Brazos y tren superior, C = Core + full body. Cada ejercicio tiene `alt` (alternativa si la máquina está ocupada).
- **5 fases** sobre una referencia de 30 semanas, escaladas a las semanas reales entre `startDate` y `targetDate` (mínimo 8, máximo 52):
  Adaptación (3×12-15) → Hipertrofia (4×10-12) → Fuerza y tono (4×8-10) → Definición (3×12-15, superseries + finisher) → Afinado final (2×10-12).
  Semanas de descarga en las semanas proporcionales a la 8, 16 y 24. Después de la fecha objetivo queda en "Mantención".
- **Carga inicial** = peso corporal × `coef` del ejercicio × factor por sexo (mujer: 0,7 piernas / 0,5 tren superior / 0,65 core) × nivel (intermedio ×1,3) × edad (≥50: ×0,85), redondeada al `inc` del equipo.
- **Progresión doble:** si en la última sesión se completaron todas las series en el tope del rango, sugiere +`step` kg. Si falló el mínimo dos sesiones seguidas con el mismo peso, sugiere −10 %. Si no, mantiene la carga.
- **Calorías:** TMB (Mifflin-St Jeor) × 1,45. Tonificar −10 %, bajar grasa −20 %, ganar músculo +10 %. Mínimo 1200 kcal (mujer) o 1500 kcal (hombre). Proteína 1,8-2,0 g/kg.

## Publicar cambios

Este computador **no tiene git, node ni python**. Sí tiene **GitHub CLI** (`C:\Program Files\GitHub CLI\gh.exe`) con sesión de tmontes30.

```powershell
powershell -ExecutionPolicy Bypass -File publish.ps1 -Message "Descripción del cambio"
```

- Sube toda la carpeta como un solo commit a `main` usando la API de GitHub (blobs → tree → commit → ref). Ignora archivos y carpetas que empiezan con punto.
- Reemplaza el árbol completo del repo: lo que se borre acá también se borra allá.
- GitHub Pages recompila en 1-5 minutos. Para ver el estado: `gh api repos/tmontes30/momentum/pages/builds/latest`.
- Si `gh` pide login: `gh auth login` (lo tiene que hacer el usuario en su terminal).
- Alternativa manual: en github.com/tmontes30/momentum → Add file → Upload files.

## Probar en local

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1     # http://localhost:8080
```

`localhost` está autorizado en Firebase, así que el login real funciona en local.
Para verificaciones automáticas sin navegador visible se usa **Edge headless**
(`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`):
- `--headless=new --dump-dom URL` o `--screenshot=archivo.png --window-size=390,1700`.
- La ventana headless tiene un ancho mínimo de ~504 px. Para ver el ancho de celular (390 px) hay que cargar la página dentro de un `<iframe>` de 390 px.
- `--dump-dom` captura antes de que Firebase Auth responda (se ve solo el spinner). Para leer la página ya cargada hay que usar el protocolo DevTools (`--remote-debugging-port`) y evaluar `document.getElementById('view').innerText` después de unos segundos.
- Para probar pantallas sin login: una página que importe `js/state.js`, rellene `state.user/profile/sessions` con datos falsos y llame a `views/<vista>.js` → `render(el)`.

## Solución de problemas

| Síntoma | Causa probable y solución |
|---|---|
| La página no carga / 404 | Revisar https://github.com/tmontes30/momentum/settings/pages (debe decir rama `main`, carpeta `/`). Ver el último build con `gh api repos/tmontes30/momentum/pages/builds/latest`. Revisar que `index.html` esté en la raíz del repo. Si falla cavedevz.com, probar tmontes30.github.io/momentum y revisar el DNS del dominio. |
| Pantalla "Falta configurar Firebase" | `js/firebase-config.js` tiene la configuración de ejemplo. Volver a pegar la configuración de arriba. |
| Se queda en el spinner | Error de JS o CDN caído. Abrir la consola del navegador (F12). Verificar que carguen `gstatic.com/firebasejs/10.12.2/...`. |
| Error `auth/unauthorized-domain` | Falta el dominio en Authentication → Configuración → Dominios autorizados (`cavedevz.com`). |
| Error `auth/api-key-not-valid` o `requests-from-referer-blocked` | La API key está restringida sin incluir el dominio. Agregarlo en Google Cloud → Credenciales (incluir `gimnasio-3905f.firebaseapp.com/*`). |
| Popup de Google bloqueado | La app intenta redirect automáticamente. En iPhone, permitir popups para el sitio o abrir en Safari (no en el navegador interno de WhatsApp o Instagram). |
| "No pudimos cargar tus datos" / `permission-denied` | Las reglas de Firestore no están publicadas o cambiaron. Volver a publicar las reglas de arriba. |
| Firestore `quota exceeded` | Plan Spark: 50k lecturas y 20k escrituras al día. Muy difícil de alcanzar con pocos usuarios; revisar en Firebase → Uso. |
| Se ve una versión vieja | Recargar. Si sigue, borrar los datos del sitio. `sw.js` es red primero; al cambiar la lista de archivos, subir la versión de `CACHE` (`momentum-v1` → `v2`). |
| Google muestra "continuar a gimnasio-3905f.firebaseapp.com" | Es el `authDomain`. Ya se configuró el Nombre público "Momentum" en Firebase. También se puede poner el nombre en Google Cloud → Google Auth Platform → Branding (sin logo, para evitar la verificación). Para cambiar la URL de verdad habría que usar un dominio propio como authDomain (Firebase Hosting + subdominio de cavedevz.com como `login.cavedevz.com` + DNS). |
| Alerta de GitHub "Secrets detected" | Es la API key pública de Firebase. Cerrarla como falso positivo y restringir la key (punto 5). |

## Si hay que recrear todo desde cero

1. Crear un proyecto nuevo en Firebase → registrar una app web → pegar su configuración en `js/firebase-config.js`.
2. Activar Google en Authentication, crear Firestore (modo producción) y publicar `firestore.rules`.
3. Agregar los dominios autorizados (`cavedevz.com`, `tmontes30.github.io`).
4. Crear el repo (`gh repo create tmontes30/momentum --public --add-readme`), correr `publish.ps1` y activar Pages:
   `gh api -X POST repos/tmontes30/momentum/pages -f "source[branch]=main" -f "source[path]=/"`.
5. Los datos de las personas viven solo en Firestore. Si se borra el proyecto de Firebase, se pierden.

## Historial

- 2026-09-23: creada como "FitBoda" y publicada en cavedevz.com/fitboda. Ese mismo día se renombró a **Momentum** (repo `tmontes30/momentum`), con diseño profesional sin emojis, íconos SVG y paleta índigo.
- Pendiente de confirmar con el usuario: restricción de la API key en Google Cloud y si el login de Google ya muestra "Momentum" en vez de la URL (si no, evaluar la opción del dominio propio).
