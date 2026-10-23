# Momentum: contexto completo del proyecto

App web de rutinas de gimnasio, pensada para usarse en el celular. La hizo Tomás (GitHub: tmontes30) para él y su pareja (Cata), que se casan en 2027. También la usan amigos y familia.
Cada persona entra con su cuenta de Google y tiene su propio perfil, plan, historial y plan de alimentación.

> **Para retomar:** lee este archivo completo. La sección "Cómo trabajar con Tomás" resume sus preferencias. Antes de publicar, sigue siempre "Publicar cambios".

---

## 1. Datos clave

| Qué | Valor |
|---|---|
| URL de la app | https://cavedevz.com/momentum/ |
| URL alternativa | https://tmontes30.github.io/momentum/ (redirige a la de arriba) |
| Repositorio | https://github.com/tmontes30/momentum (**público**, rama `main`) |
| Hosting | GitHub Pages (rama `main`, carpeta raíz). La cuenta tmontes30 usa el dominio propio `cavedevz.com`, que también sirve el sitio de la empresa CaveDevz desde el repo `tmontes30.github.io` (**no tocar ese repo**) |
| Proyecto Firebase | `gimnasio-3905f` (nombre visible "Gimnasio", nombre público "Momentum") |
| Consola Firebase | https://console.firebase.google.com/project/gimnasio-3905f |
| Consola Google Cloud | https://console.cloud.google.com/apis/credentials?project=gimnasio-3905f |
| Base de datos | Cloud Firestore `(default)`, ubicación `southamerica-west1` (Santiago), plan **Spark** (gratis) |
| Login | Firebase Authentication con proveedor Google |
| Carpeta local | `C:\Users\catal\OneDrive\Escritorio\TOM\GYM` |
| Herramientas del computador | Windows 11, PowerShell, **GitHub CLI** (`C:\Program Files\GitHub CLI\gh.exe`, con sesión de tmontes30) y **Edge**. **No hay git, node ni python** |

---

## 2. Cómo trabajar con Tomás (preferencias)

- **Idioma:** habla en español (Chile). La interfaz de la app va en español.
- **Estilo profesional:** nada de emojis en la app; íconos SVG de línea, paleta índigo/morado y tema claro/oscuro automático.
- **Publicar:** cuando pide un cambio, espera que quede **publicado**. Se prueba primero en local y después se publica (ver sección 9). Él lo usa desde el iPhone (Safari y la app instalada en la pantalla de inicio), así que hay que verificar el ancho de celular (390 px y 320 px).
- **Preguntas:** cuando escribe "esto es una pregunta", quiere solo la respuesta, **sin cambiar código**. Si algo es ambiguo, preguntar antes de hacerlo.
- **Firebase y Google:** prefiere soluciones dentro de Firebase/Google. No quiere que se toque el repo de cavedevz.com.
- **Costo y beneficio:** las cosas muy difíciles que aportan poco prefiere no hacerlas. Hay que explicarle la dificultad con honestidad.
- **Privacidad:** el repo es público. Nunca publicar datos personales ni de salud (ver sección 8, Alimentación).
- **Entrenan de a dos** (Tomás y Cata), en sesiones de **1 hora antes de la oficina**, y necesitan que ambas cuentas den la misma rutina cuando tienen los mismos ajustes.

---

## 3. Stack

- HTML + CSS + JavaScript con módulos ES. **Sin build ni bundler**: los archivos se sirven tal cual.
- Firebase JS SDK **10.12.2** desde `https://www.gstatic.com/firebasejs/10.12.2/...` (Auth + Firestore con caché offline persistente).
- Chart.js 4.4.1 desde jsDelivr; se carga solo en la pantalla Progreso.
- PWA: `manifest.webmanifest` + `sw.js` (red primero, caché de respaldo). Se puede instalar en la pantalla de inicio del iPhone.
- Router por hash (`#/home`, `#/workout/A`, etc.), así no hay errores 404 en GitHub Pages.
- Todas las rutas son relativas (`./`) porque la app vive en el subpath `/momentum/`.
- Fuente Inter (Google Fonts). Colores como variables CSS en `:root`, con modo oscuro en `@media (prefers-color-scheme: dark)`.
- `index.html` tiene un bloque de **Google Analytics** que agregó Tomás, con ID de ejemplo `G-XXXXXXXXXX` (no mide nada hasta que se ponga el ID real; no se carga en localhost).

---

## 4. Pantallas (barra inferior: Inicio · Entrenar · Alimentación · Progreso · Perfil)

| Pantalla | Ruta | Qué tiene |
|---|---|---|
| Login | (sin sesión) | Logo, beneficios y "Entrar con Google" |
| Onboarding | (sin perfil) | 3 pasos: datos personales → objetivo y plan → resumen con números y fases |
| **Inicio** | `#/home` · `#/home/N` | Cuenta regresiva a la fecha objetivo, avance del plan, **navegador de semanas** (‹ ›) con los días A/B/C (completado → editar; pendiente pasado → "Registrar"; futuro → "Ver" vista previa), fase de la semana e indicadores |
| **Entrenar** | `#/workout` | "Hoy toca" (o "En curso" si hay un borrador), los días de la semana, botón "Ver la rutina de las próximas semanas", **temporizador** (cuenta atrás / cronómetro), **barra y discos** y **biblioteca de ejercicios** |
| Entrenamiento | `#/workout/A` · `/w-N` · `/s-id` | Nuevo / registrar en una semana pasada / editar uno guardado. Campo Fecha, aviso de duración, código de rutina, tarjetas por ejercicio con sugerencia de carga, series (kg y reps editables escribiendo, con + y −), temporizador de descanso, finisher y **elongación de 5:00** |
| Vista previa | `#/workout/A/p-N` | Rutina de cualquier semana, de solo lectura, con selector de día, flechas de semana y **código de rutina** |
| **Alimentación** | `#/nutrition` | Aviso "Plan aproximado", requerimientos (kcal, proteína, carbohidratos, grasas, agua), **tu día** por comida con porciones y ejemplos, porciones al día, equivalencias y recomendaciones |
| **Progreso** | `#/progress` | Indicadores (entrenamientos, racha, % de cumplimiento, kg totales), avance del plan, mapa de constancia, volumen semanal, récords y avances con mini-gráficas, detalle por ejercicio, **20 logros** en 2 páginas, peso corporal e historial (editable) |
| **Perfil** | `#/profile` | "Tus números" (tocar abre Alimentación) y "Ver tu plan de alimentación ›", "Tu plan" (línea de tiempo de fases), formulario de datos, reiniciar programa, cerrar sesión y **versión** de la app |

---

## 5. Estructura de archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | Página única: `<main id="view">` (trae el cargador del logo desde el primer instante), barra inferior y toast. También el bloque de Google Analytics |
| `css/styles.css` | Todos los estilos |
| `js/firebase-config.js` | Configuración web de Firebase (pública por diseño) |
| `js/firebase.js` | `auth`, `db`, `loginWithGoogle()` (popup con redirect de respaldo), `logout()` y **registro de uso** (`usage` y `usage_daily`) para el panel del owner en cavedevz.com/admin/ (otro repo) |
| `js/db.js` | CRUD en Firestore: perfil, sesiones (agregar, actualizar, borrar) y peso corporal |
| `js/app.js` | Router, guardas (sin usuario → login; sin perfil → onboarding), cargador, service worker y **detección de versión nueva** |
| `js/state.js` | Estado en memoria (`user`, `profile`, `sessions`, `bodyweight`, `appVersion`), `program()`, `sessionWeek()` y helpers de fechas |
| `js/program.js` | **Rutinas**: `EXERCISES`, `DAYS` (A/B/C con `dropOrder` y `stretch`), `PHASES`, `INTENSITY`, `buildPlan`/`planOf`, `phaseFor`, `prescription`, **`sessionPlan`** (ajuste al tiempo), `routineCode` y funciones de semanas |
| `js/calc.js` | Edad, IMC, Mifflin-St Jeor, **`metrics()`** (calorías por masa libre de grasa, proteína, % de grasa estimado), carga inicial, progresión doble y formatos |
| `js/stats.js` | Racha, cumplimiento, volumen, avance por ejercicio y **20 logros** |
| `js/nutrition.js` | Plan de alimentación por porciones de intercambio (generador, ejemplos, equivalencias y recomendaciones) |
| `js/ui.js` | `icon()` (SVG), `logo()`, `esc()`, `toast()`, `go()`, `fmtDate()`, `storage` y `alertDone()` (vibración + beep) |
| `js/views/login.js` | Login |
| `js/views/onboarding.js` | Onboarding; también exporta `aboutFields`, `goalFields`, `readProfileForm`, `metricsHTML`, `planHTML` y `wireIntensityHint`, que usa Perfil |
| `js/views/home.js` | Inicio; exporta `dayCard` y `weekCards` |
| `js/views/workout.js` | Entrenamiento (nuevo, registrar o editar), borradores, temporizador y resumen al terminar |
| `js/views/train.js` | Pestaña Entrenar y **`renderPreview`** (vista previa) |
| `js/views/nutrition.js` | Pestaña Alimentación |
| `js/views/progress.js` | Progreso (gráficos con Chart.js) |
| `js/views/profile.js` | Perfil |
| `firestore.rules` | Reglas de seguridad (copia de las publicadas en la consola) |
| `icons/` | Íconos PWA (192, 512 y maskable): línea ascendente blanca sobre degradado índigo→morado. Se generan con System.Drawing en PowerShell |
| `version.json` | Lo escribe `publish.ps1` en cada publicación (fecha y hora) |
| `serve.ps1` | Servidor local de pruebas (http://localhost:8080) |
| `publish.ps1` | Publica en GitHub como un commit (sección 9) |
| `Pauta nutricional/` | **Solo local, nunca se publica**: PDFs de nutricionista de Tomás y Cata (datos de salud). Se usaron para calibrar Alimentación |

---

## 6. Firebase (ya configurado)

1. **Web app** registrada. Configuración en `js/firebase-config.js`:
   ```js
   apiKey: "AIzaSyA8NfPFUTv-zZt-Wk_hh1rqqWmk4P1KUXA",
   authDomain: "gimnasio-3905f.firebaseapp.com",
   projectId: "gimnasio-3905f",
   storageBucket: "gimnasio-3905f.firebasestorage.app",
   messagingSenderId: "684316008433",
   appId: "1:684316008433:web:5c42bfb36f9055bdb96e50",
   ```
   La clave es **pública por diseño**; la seguridad la dan las reglas. GitHub mandó una alerta "secret detected" por ella: se cierra como falso positivo. **No revocarla.**
2. **Authentication:** Google habilitado. **Dominios autorizados:** `localhost`, `gimnasio-3905f.firebaseapp.com`, `gimnasio-3905f.web.app`, **`cavedevz.com`** y `tmontes30.github.io`.
3. **Firestore → Reglas** (iguales a `firestore.rules`): cada persona lee y escribe solo `users/{uid}/**`. El registro de uso (`usage/{uid}` y `usage_daily/{fecha_uid}`) lo escribe cada uno para sí mismo, y solo lo lee el owner (`tmontes30@gmail.com`, verificado).
4. **Nombre público** "Momentum" configurado. Aun así, Google muestra "continuar a gimnasio-3905f.firebaseapp.com", porque esa es la dirección del `authDomain`.
5. **Recomendado (pendiente de confirmar):** restringir la API key en Google Cloud → Credenciales → "Browser key" → Sitios web: `https://cavedevz.com/*`, `https://tmontes30.github.io/*`, `https://gimnasio-3905f.firebaseapp.com/*`, `http://localhost:8080/*`. **Si se restringe, `gimnasio-3905f.firebaseapp.com/*` debe estar en la lista, o el login se rompe.**

---

## 7. Modelo de datos (Firestore)

```
users/{uid}                    perfil
  name, sex ('f'|'m'), birthDate 'YYYY-MM-DD', heightCm, weightKg,
  bodyFatPct (opcional, % medido; si falta se estima),
  level ('principiante'|'intermedio'), goal ('tonificar'|'bajar grasa'|'ganar músculo'),
  eventName (opcional, ej. "el matrimonio"), targetDate 'YYYY-MM-DD', startDate 'YYYY-MM-DD',
  planWeeks (6-24 o null = hasta targetDate), intensity ('moderada'|'alta'|'maxima'),
  sessionMinutes (45|60|75|90, por defecto 60), photoURL, createdAt, updatedAt
users/{uid}/sessions/{id}      un entrenamiento terminado
  date (ISO; si se registró otro día: 'YYYY-MM-DDT12:00:00'), dayKey 'A'|'B'|'C', week, phase,
  durationMin (null si se registró después), exercises: [{ exId, sets: [{ kg, reps, done: true }] }]
users/{uid}/bodyweight/{id}    registro de peso corporal: date 'YYYY-MM-DD', kg
usage/{uid}, usage_daily/{fecha_uid}   registro de uso para el panel del owner
```

- **Semanas de lunes a domingo.** La semana 1 es la que contiene `startDate`. La semana de una sesión **siempre se calcula desde su fecha** (`sessionWeek`), no desde el campo `week` guardado. Así, cambiar "Inicio del programa" reordena todo solo.
- **Los IDs de ejercicio (`exId`) no se renombran nunca**, porque el historial quedaría huérfano. Para cambiar el nombre visible, editar solo `name`.
- **Borradores** en localStorage: `momentum-draft-{uid}-{A|B|C}-{w-N | s-id}`, válidos por 12 h. Llevan una firma de la rutina (`planKey`). Si la rutina cambió y el borrador no tiene series marcadas, se reemplaza solo; si tiene, aparece el aviso "Usar rutina actual".
- Otras claves de localStorage: `momentum-barbell` (última barra cargada) y `momentum-progress-ex` (ejercicio elegido en Progreso).

---

## 8. Lógica

### Rutinas y plan
- **3 días por semana** (lunes a domingo, en cualquier orden):
  - **A · Piernas y glúteos:** prensa, sentadilla goblet, hip thrust, curl femoral, extensión de cuádriceps, abductores y pantorrillas.
  - **B · Brazos y tren superior:** jalón al pecho, press de pecho con mancuernas, remo en polea, press de hombros, elevaciones laterales, curl de bíceps, extensión de tríceps y curl martillo.
  - **C · Abdominales + full body:** peso muerto rumano, zancadas (accesorio), remo con mancuerna, **press inclinado con mancuernas**, crunch en polea, elevación de piernas, giro ruso, pallof press y plancha.
    - Las flexiones salieron el 2026-10-06. La rueda abdominal se reemplazó por el press inclinado el 2026-10-08.
    - Al editar una sesión antigua, los ejercicios que ya no están en el día aparecen al final.
- **Cada ejercicio tiene una alternativa** (`alt`) para cuando la máquina está ocupada (botón de intercambio).
- **Plan** (`planOf`/`buildPlan`). Lo definen dos campos:
  - **`planWeeks`** (plazo para ver cambios): si es `null`, el plan va hasta `targetDate` y termina con "Afinado final".
  - **`intensity`:**
    - **Moderada:** 3 semanas de adaptación, descarga cada 6 semanas.
    - **Alta:** 2 semanas de adaptación, descarga cada 8 semanas, +1 serie en los ejercicios principales y −15 s de descanso.
    - **Máxima:** 1 semana de adaptación, sin descargas, +1 serie en todo y circuito final diario.
    - Con nivel intermedio, la adaptación dura una semana menos.
- **Fases:** Adaptación (3×12-15) → Hipertrofia (4×10-12) → Fuerza y tono (4×8-10) → Definición (3×12-15 en superseries + finisher) → Afinado final (2×10-12).
  - Las semanas intermedias se reparten en tercios.
  - Al terminar el plan la fase es "Mantención".
  - Cambiar el plazo, la intensidad o el inicio **no borra datos**.
- **Tiempo por sesión** (`sessionPlan`): estima 3,5 s por repetición (el doble si es por lado) más los descansos, 60 s de cambio por ejercicio y 5 min de calentamiento, y **reserva 5 min de elongación al final**.
  - **Si no cabe, recorta en este orden:**
    1. accesorios no abdominales a 2 series;
    2. descansos −15 s (mínimo 45 s);
    3. sin circuito final;
    4. quitar accesorios de `dropOrder` que no son abdominales;
    5. abdominales a 2 series;
    6. quitar abdominales de `dropOrder`.

    Los ejercicios **principales nunca se recortan**.
  - **Pares:** los abdominales van en pares A1/A2 (15 s entre ellos). En la fase de definición, todo va en superseries.
  - Con 60 min, todas las combinaciones de día × fase × intensidad caben (verificado).
  - Con 45 min, Brazos en fase de fuerza (intensidad alta o máxima) queda en unos 48 min. Tomás lo sabe y no pidió cambiarlo.
- **Código de rutina** (`routineCode`): hash corto de los ejercicios, series, descansos, pares, fase, descarga y finisher. Dos cuentas con el mismo código para el mismo día y semana tienen la misma rutina (verificado en 36 combinaciones).

### Cargas y progresión
- **Carga inicial:** peso corporal × `coef` del ejercicio × factor por sexo (mujer: 0,7 piernas, 0,5 tren superior, 0,65 core) × nivel (intermedio ×1,3) × edad (≥50: ×0,85), redondeada al `inc` del equipo. La estatura no se usa para las cargas.
- **Progresión doble**, basada en la última sesión de cada ejercicio:
  - todas las series en el tope del rango → +`step` kg;
  - falló el mínimo dos veces seguidas con el mismo peso → −10%;
  - si no, mantiene el peso.
  - En ejercicios sin peso o por tiempo: +1 repetición o +5 s.
- **Kg y reps se pueden escribir** (aceptan coma o punto, por ejemplo mancuernas de 12,5). Al tocar un campo se selecciona todo su contenido. Cambiar el peso de una serie se arrastra a las series siguientes que no estén marcadas.

### Alimentación (`metrics` en `calc.js` + `nutrition.js`)
- **Calorías por masa libre de grasa:** bajar grasa 26 kcal/kg, tonificar 30, ganar músculo 42. Mínimos: 1100 kcal en mujeres y 1400 en hombres.
- **Proteína por kg de peso:** bajar grasa 2,1 (hombres) / 2,0 (mujeres); tonificar 2,0 / 1,9; ganar músculo 1,8.
- **Grasa:** 0,45 / 0,7 / 0,9 g/kg según el objetivo; los carbohidratos son el resto.
- **% de grasa:** el campo opcional del perfil o, si falta, la estimación de **Deurenberg** (IMC, edad y sexo).
- **Agua:** 30 ml/kg, entre 2 y 3 L.
- **Porciones de intercambio:** carbohidratos 140 kcal (30 g de carbohidratos y 3 g de proteína), verduras 25, fruta 65, lácteos 70 (7 g de proteína), proteínas 65 (11 g de proteína) y grasas 180.
  - Las porciones de carbohidratos y proteínas se resuelven para cumplir a la vez las calorías y la proteína.
  - Distribución: desayuno con proteína y lácteo; almuerzo y cena con el grueso de la comida y 2 verduras cada uno; colación con fruta y lácteo.
- **Calibración:** con dos pautas reales de una nutricionista deportiva (las de Tomás y Cata), usando solo peso, estatura, edad y sexo, el resultado coincide o difiere en ½ porción. Los PDFs están solo en local (`Pauta nutricional/`).
- **Decisión de Tomás:** **no** permitir cargar ni editar pautas externas. Solo existe el plan calculado, que se muestra con el aviso "Plan aproximado; no reemplaza a un nutricionista".

### Progreso y logros (`stats.js`)
- **Racha:** semanas completas (3 días) consecutivas. Una semana en curso no la rompe.
- **Cumplimiento:** días hechos / días planificados en las semanas ya terminadas.
- **Logros:** **exactamente 20**, iguales para todas las cuentas, en 2 páginas de 10. Las flechas mantienen la posición de la pantalla (`scrollBy`).
- **"Madrugador":** cuenta solo los entrenamientos anotados en el momento (con duración) que empezaron antes de las 8:00.

### Versión nueva y cargador
- `publish.ps1` escribe **`version.json`**. `app.js` lo compara al volver a la app y cada 30 min, y si cambió muestra la barra **"Hay una versión nueva · Actualizar"**. La versión cargada aparece al pie de Perfil.
- El service worker no guarda `version.json` en caché. Al agregar archivos nuevos, sumarlos a `SHELL` en `sw.js` y **subir la versión de `CACHE`** (va en `momentum-v6`).
- **Cargador:** el logo de Momentum "respirando" (`.loader`, animación `breathe` de 1,6 s). Con "reducir movimiento" activado, queda quieto.
- **GitHub Pages permite al navegador guardar los archivos hasta 10 min** (`max-age=600`). Justo después de publicar, un celular puede mezclar archivos nuevos y viejos por unos minutos; se resuelve solo.

---

## 9. Publicar cambios

1. **Revisar que GitHub no tenga cambios que no estén en local.** `publish.ps1` **reemplaza el árbol completo** del repo, así que todo lo que solo exista en GitHub se borra. Esta comparación lista lo que está solo en GitHub o es distinto (agregar a `$mine` los archivos modificados en la tarea actual):
   ```powershell
   $gh = "C:\Program Files\GitHub CLI\gh.exe"; $root = "C:\Users\catal\OneDrive\Escritorio\TOM\GYM"
   $remote = (& $gh api "repos/tmontes30/momentum/git/trees/main?recursive=1" | ConvertFrom-Json).tree | Where-Object { $_.type -eq "blob" }
   $local = Get-ChildItem $root -Recurse -File | Where-Object { $_.FullName -notmatch '\\\.|\\Pauta nutricional\\|\.pdf$' } | ForEach-Object { $_.FullName.Substring($root.Length + 1).Replace("\", "/") }
   $mine = @("version.json")   # + archivos tocados en esta tarea
   foreach ($f in $remote) {
     if ($local -notcontains $f.path) { "SOLO EN GITHUB: " + $f.path; continue }
     if ($mine -contains $f.path) { continue }
     $b = [IO.File]::ReadAllBytes((Join-Path $root $f.path)); $h = [Text.Encoding]::ASCII.GetBytes("blob $($b.Length)`0")
     $sha = -join ([Security.Cryptography.SHA1]::Create().ComputeHash([byte[]]($h + $b)) | ForEach-Object { $_.ToString("x2") })
     if ($sha -ne $f.sha) { "DISTINTO: " + $f.path }
   }
   ```
   Si aparece algo, **no publicar** sin entender por qué; puede haberlo publicado Tomás desde otra sesión.
2. **Publicar:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File publish.ps1 -Message "Descripción del cambio"
   ```
   - Hace un solo commit en `main` con la API de GitHub (blobs → tree → commit → ref) y escribe `version.json`.
   - **Excluye** los archivos y carpetas que empiezan con punto, la carpeta `Pauta nutricional/` y todos los `.pdf`.
3. **Verificar:**
   - que el despliegue haya terminado: `gh api repos/tmontes30/momentum/actions/runs?per_page=1` (`conclusion: success`);
   - que el sitio sirva la versión nueva: `https://cavedevz.com/momentum/version.json?t=<aleatorio>`;
   - que no haya PDFs ni pautas en el repo.

   El estado "errored" de un build de Pages en modo legacy puede ser solo un despliegue anterior cancelado; lo que vale es el workflow "pages build and deployment".
4. Si `gh` pide login: `gh auth login` (lo tiene que hacer Tomás en su terminal).

---

## 10. Probar en local

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1     # http://localhost:8080
```

- `localhost` está autorizado en Firebase, así que el login real funciona en local.
- **Edge headless** (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`):
  - **Comandos:** `--headless=new --dump-dom URL` o `--screenshot=archivo.png --window-size=390,1700`.
  - **Ancho de celular:** la ventana tiene un ancho mínimo de ~504 px. Para ver 390 px, cargar la página dentro de un `<iframe>` de 390 px.
  - **Páginas que dependen del login:** `--dump-dom` captura antes de que responda Firebase Auth. Para leer la página ya cargada, usar el protocolo DevTools (`--remote-debugging-port`, `Runtime.evaluate`) con un `ClientWebSocket` desde PowerShell. Al terminar, cerrar solo los procesos de Edge de ese perfil (filtrar por `--user-data-dir` en `CommandLine`), nunca el Edge de Tomás.
  - **Arnés de prueba:** una página HTML en el scratchpad que importe `http://localhost:8080/js/state.js`, rellene `state.user`, `state.profile`, `state.sessions` y `state.bodyweight` con datos falsos, y llame a `views/<vista>.js` → `render(el, ...params)`. El servidor local manda `Access-Control-Allow-Origin: *`, así que funciona desde `file://`.
  - **Pruebas de cálculos:** importar `program.js`, `calc.js`, `stats.js` y `nutrition.js` y comparar resultados (fases, prescripciones, `sessionPlan` ≤ 60 min, `routineCode` igual entre perfiles, plan de alimentación).
- **PowerShell 5.1:** `Get-Content`/`Set-Content` sin `-Encoding` rompen las tildes. Usar `[IO.File]::ReadAllText/WriteAllText` con UTF-8.

---

## 11. Solución de problemas

| Síntoma | Causa probable y solución |
|---|---|
| La página no carga / 404 | Revisar https://github.com/tmontes30/momentum/settings/pages (rama `main`, carpeta `/`) y el último despliegue. Si falla cavedevz.com, probar tmontes30.github.io/momentum |
| "Falta configurar Firebase" | `js/firebase-config.js` tiene la configuración de ejemplo: volver a pegar la de la sección 6 |
| Se queda en el cargador (logo animado) | Error de JS o CDN caído. Consola del navegador; verificar que carguen `gstatic.com/firebasejs/10.12.2/...` |
| Recién publicado se ve una mezcla de lo viejo y lo nuevo | Caché de GitHub Pages (hasta 10 min). Se resuelve solo; si no, cerrar la app y abrirla de nuevo |
| Dos cuentas ven rutinas distintas | Comparar en Perfil la **Versión** y **"Tu plan"** (inicio, plazo, intensidad, experiencia, tiempo por sesión) y el **código de rutina**. Puede ser una versión vieja en memoria (cerrar la app por completo) o un borrador viejo ("Usar rutina actual" o ↺) |
| `auth/unauthorized-domain` | Falta el dominio en Authentication → Dominios autorizados |
| `auth/api-key-not-valid` o `requests-from-referer-blocked` | La API key está restringida sin incluir el dominio (incluir `gimnasio-3905f.firebaseapp.com/*`) |
| Login en Safari "lleva a otra página" | Pasó una vez y se arregló solo. Causa probable: el `authDomain` (firebaseapp.com) es distinto de cavedevz.com y Safari bloquea el almacenamiento entre sitios. **Arreglo preferido por Tomás:** mover el hosting a **Firebase Hosting** (un sitio `*.web.app`) y usar ese mismo dominio como `authDomain`. Requiere la herramienta de línea de comandos de Firebase (hay un `.exe` standalone) y que Tomás inicie sesión. **No** usar el repo de cavedevz.com |
| "No pudimos cargar tus datos" / `permission-denied` | Las reglas de Firestore no están publicadas o cambiaron |
| Google muestra "continuar a gimnasio-3905f.firebaseapp.com" | Es el `authDomain`. Para cambiarlo de verdad haría falta un dominio propio como `authDomain` (Firebase Hosting) |
| Alerta de GitHub "Secrets detected" | Es la API key pública de Firebase: cerrarla como falso positivo |

---

## 12. Decisiones tomadas (no reabrir sin que Tomás lo pida)

- **Notificaciones del temporizador de descanso con el celular bloqueado:** descartadas. Una app web no puede programar notificaciones locales en iPhone. Haría falta push desde Cloud Functions (plan Blaze con tarjeta + Node/Firebase CLI), y un contador en la pantalla bloqueada (Live Activities) es exclusivo de apps nativas. Sería mucha complejidad para poco beneficio.
- **Mantener la pantalla encendida durante el entrenamiento (Wake Lock):** se ofreció dos veces y Tomás dijo que no.
- **Cargar o editar pautas de nutricionista:** descartado; solo existe el plan calculado.
- **Tocar el repo de cavedevz.com:** no.
- Pendientes que Tomás puede pedir:
  - (a) que el service worker revalide siempre los archivos (`cache: "no-cache"`) para evitar la mezcla de los 10 min tras publicar;
  - (b) un cargador más lento (por ejemplo 2,5 s).

  Se le ofrecieron y aún no respondió.
- **Pendiente de confirmar:** si restringió la API key en Google Cloud, y si el login de Google sigue mostrando la URL de firebaseapp.com.

---

## 13. Historial

- **2026-09-23:** creada como "FitBoda" y publicada en cavedevz.com/fitboda; el mismo día se renombró **Momentum** (repo `tmontes30/momentum`), con diseño profesional sin emojis.
- **2026-10-01:** semanas de lunes a domingo, navegación entre semanas, edición y registro de entrenamientos pasados con campo de fecha, e "Inicio del programa" editable.
- **2026-10-05:** plazo para ver cambios e intensidad separados de la fecha objetivo (antes había demasiadas semanas de adaptación); línea de tiempo del plan en Perfil; Progreso ampliado (indicadores, constancia, volumen, récords y logros).
- **2026-10-06 / 10-08:** Día C enfocado en abdominales y después con press inclinado; sesiones ajustadas a 60 min con 5 min de elongación; pestaña Entrenar útil (hoy toca, temporizador, discos, biblioteca); logros ampliados con paginación.
- **2026-10-09:** incidente "misma rutina, ejercicios distintos entre cuentas": la causa era estado guardado en un celular. Se agregó el aviso de versión nueva, los borradores con firma, la vista previa de semanas futuras con código de rutina, los kg editables con coma, los 20 logros fijos sin salto de pantalla, la barra y discos con dibujo, y **Alimentación** (pestaña propia, calibrada con pautas reales).
- **2026-10-20:** cargador con el logo de Momentum "respirando" en vez del círculo girando.
