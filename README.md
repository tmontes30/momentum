# FitBoda 💍💪

App web (pensada para el celular) con rutinas de gimnasio 3 días a la semana, perfiles con login de Google
y registro de pesos para ver el progreso semana a semana. Es HTML/CSS/JS puro, sin instalar nada.

- **Día A – Piernas y glúteos** · **Día B – Brazos y tren superior** · **Día C – Core + full body**
- Plan de 5 fases hasta la fecha del matrimonio (adaptación → hipertrofia → fuerza/tono → definición → afinado), con semanas de descarga.
- Calcula IMC, calorías (Mifflin-St Jeor), proteína y la carga inicial de cada ejercicio según sexo, peso, edad y experiencia.
- Progresión automática: si completas todas las series al tope del rango de repeticiones, te sugiere subir el peso.
- Si una máquina está ocupada, el botón ⇄ cambia el ejercicio por su alternativa.

## 1. Crear el proyecto en Firebase (una sola vez, ~10 min)

1. Entra a <https://console.firebase.google.com> → **Agregar proyecto** (por ejemplo `fitboda`). Google Analytics no es necesario.
2. **Authentication** → Comenzar → **Método de acceso** → activa **Google** → Guardar.
3. **Firestore Database** → Crear base de datos → modo **producción** → ubicación `southamerica-east1` (o la más cercana).
4. En Firestore → pestaña **Reglas** → pega el contenido de [`firestore.rules`](firestore.rules) → **Publicar**.
5. ⚙️ **Configuración del proyecto** → *Tus apps* → ícono web `</>` → registra la app (sin Hosting) → copia el objeto `firebaseConfig`
   y pégalo en [`js/firebase-config.js`](js/firebase-config.js).
6. **Authentication → Configuración → Dominios autorizados** → agrega `tmontes30.github.io`
   (`localhost` ya viene autorizado para probar en tu computador).

## 2. Probar en tu computador

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Abre <http://localhost:8080>. En Chrome o Edge puedes usar las DevTools (F12 → ícono de celular) para verla como en el teléfono.

## 3. Publicar en GitHub Pages

**Opción fácil (sin instalar nada):**
1. En <https://github.com/new> crea el repositorio `fitboda` (público) en tu cuenta `tmontes30`.
2. En el repo: **Add file → Upload files** → arrastra **todo el contenido** de esta carpeta (incluidas las carpetas `css`, `js` e `icons`) → *Commit changes*.
3. **Settings → Pages** → *Source: Deploy from a branch* → rama `main`, carpeta `/ (root)` → Save.
4. En 1–2 minutos queda en **https://tmontes30.github.io/fitboda/**.

**Con Git** (si lo instalas: <https://git-scm.com>):
```powershell
git init; git add .; git commit -m "FitBoda"
git branch -M main
git remote add origin https://github.com/tmontes30/fitboda.git
git push -u origin main
```

Para actualizar después, sube los archivos modificados (o `git push`). La app siempre carga la última versión cuando hay conexión.

## 4. Instalar en el celular

Abre la URL → inicia sesión con Google →
- **iPhone (Safari):** Compartir → *Agregar a pantalla de inicio*.
- **Android (Chrome):** menú ⋮ → *Instalar app*.

Comparte la URL con tus amigos: cada uno entra con su cuenta de Google y tiene su perfil y sus datos privados.

## Estructura

| Archivo | Qué hace |
|---|---|
| `js/program.js` | Ejercicios, días, fases y periodización (edita aquí para cambiar rutinas) |
| `js/calc.js` | IMC, calorías, macros, carga inicial y progresión |
| `js/views/*` | Pantallas: login, onboarding, inicio, entrenamiento, progreso, perfil |
| `js/db.js` | Lectura/escritura en Firestore (`users/{uid}`, `sessions`, `bodyweight`) |
| `firestore.rules` | Cada usuario solo accede a sus propios datos |

> Las calorías y cargas son estimaciones generales. Ante cualquier lesión o condición médica, consulta a un profesional.
