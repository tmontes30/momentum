# Momentum

**Entrenamiento con plan. Progreso que se nota.**

Aplicación web (pensada para el celular) con rutinas de gimnasio 3 días a la semana, perfiles individuales con login de Google
y registro de cargas para seguir el progreso semana a semana. HTML/CSS/JS puro, sin compilación.

Publicada en **https://cavedevz.com/momentum/**

- **Día A: Piernas y glúteos** · **Día B: Brazos y tren superior** · **Día C: Core + full body**
- Plan de 5 fases distribuido hasta la fecha objetivo de cada persona (adaptación → hipertrofia → fuerza/tono → definición → afinado), con semanas de descarga.
- Calcula IMC, gasto calórico (Mifflin-St Jeor), proteína y la carga inicial de cada ejercicio según sexo, peso, edad y experiencia.
- Progresión automática: si completas todas las series en el tope del rango de repeticiones, sugiere subir la carga.
- Si una máquina está ocupada, el botón de intercambio cambia el ejercicio por su alternativa.

## Configuración de Firebase

Proyecto: `gimnasio-3905f` (Firestore en `southamerica-west1`).

1. **Authentication → Método de acceso:** Google habilitado.
2. **Firestore → Reglas:** el contenido de [`firestore.rules`](firestore.rules) (cada usuario solo accede a sus propios datos).
3. **Authentication → Configuración → Dominios autorizados:** `cavedevz.com`, `tmontes30.github.io` y `localhost`.
4. La configuración web está en [`js/firebase-config.js`](js/firebase-config.js). Es pública por diseño; la seguridad la dan las reglas.

## Probar en local

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Abre <http://localhost:8080>.

## Publicación

El repositorio `tmontes30/momentum` se publica con GitHub Pages desde la rama `main` (carpeta raíz).
La cuenta usa el dominio propio `cavedevz.com`, por lo que la app queda en `https://cavedevz.com/momentum/`.

## Instalar en el celular

- **iPhone (Safari):** Compartir → *Agregar a pantalla de inicio*.
- **Android (Chrome):** menú → *Instalar app*.

## Estructura

| Archivo | Qué hace |
|---|---|
| `js/program.js` | Ejercicios, días, fases y periodización (aquí se editan las rutinas) |
| `js/calc.js` | IMC, calorías, macros, carga inicial y progresión |
| `js/views/*` | Pantallas: login, onboarding, inicio, entrenamiento, progreso, perfil |
| `js/db.js` | Lectura/escritura en Firestore (`users/{uid}`, `sessions`, `bodyweight`) |
| `firestore.rules` | Reglas de seguridad |

> Las calorías y cargas son estimaciones generales. Ante cualquier lesión o condición médica, consulta a un profesional.
