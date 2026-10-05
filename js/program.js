// Biblioteca de ejercicios, días de entrenamiento y periodización.
//
// Campos de cada ejercicio:
//   region: 'lower' | 'upper' | 'core'  (afecta la carga inicial y el incremento)
//   type:   'weight' (kg + reps) | 'bodyweight' (solo reps) | 'time' (segundos)
//   coef:   carga inicial ≈ peso corporal × coef (hombre, principiante)
//   inc:    salto real del equipo (para redondear); step: cuánto subir al progresar
//   perSide: el peso es por mancuerna / por lado
//   main:   ejercicio principal (recibe todas las series de la fase)
//   reps:   rango propio que reemplaza al de la fase
//   alt:    id del ejercicio alternativo (si la máquina está ocupada)

export const EXERCISES = {
  // ── Piernas y glúteos ────────────────────────────────
  leg_press: { name: "Prensa de piernas", muscle: "Cuádriceps y glúteos", equip: "Máquina", region: "lower", type: "weight", coef: 1.0, inc: 5, step: 10, main: true, alt: "smith_squat",
    tip: "Pies al ancho de hombros en la mitad de la plataforma. Baja hasta 90° sin despegar la zona lumbar del respaldo." },
  goblet_squat: { name: "Sentadilla goblet", muscle: "Cuádriceps y glúteos", equip: "Mancuerna", region: "lower", type: "weight", coef: 0.2, inc: 2, step: 2, main: true, alt: "smith_squat",
    tip: "Mancuerna pegada al pecho, espalda recta, rodillas siguiendo la punta de los pies. Baja controlado 2-3 segundos." },
  smith_squat: { name: "Sentadilla en máquina Smith", muscle: "Cuádriceps y glúteos", equip: "Smith (peso en discos)", region: "lower", type: "weight", coef: 0.35, inc: 5, step: 5, main: true, alt: "goblet_squat",
    tip: "Pies un poco adelantados respecto a la barra. Baja hasta que los muslos queden paralelos al suelo." },
  hip_thrust: { name: "Hip thrust", muscle: "Glúteos", equip: "Barra o máquina", region: "lower", type: "weight", coef: 0.6, inc: 5, step: 5, main: true, alt: "cable_kickback",
    tip: "Espalda alta apoyada en el banco, mentón al pecho. Empuja con los talones y aprieta glúteos 1 segundo arriba." },
  cable_kickback: { name: "Patada de glúteo en polea", muscle: "Glúteos", equip: "Polea baja", region: "lower", type: "weight", coef: 0.08, inc: 2.5, step: 2.5, perSide: true, alt: "hip_thrust",
    tip: "Tobillera en la polea baja, torso levemente inclinado. Lleva la pierna atrás sin arquear la espalda." },
  leg_curl: { name: "Curl femoral", muscle: "Isquiotibiales", equip: "Máquina", region: "lower", type: "weight", coef: 0.35, inc: 5, step: 5, alt: "db_rdl",
    tip: "Ajusta el rodillo sobre los tobillos. Sube rápido y baja lento (3 segundos)." },
  db_rdl: { name: "Peso muerto rumano con mancuernas", muscle: "Isquiotibiales y glúteos", equip: "Mancuernas", region: "lower", type: "weight", coef: 0.15, inc: 2, step: 2, perSide: true, alt: "leg_curl",
    tip: "Rodillas levemente flectadas, lleva la cadera atrás con la espalda recta hasta sentir el estiramiento." },
  leg_ext: { name: "Extensión de cuádriceps", muscle: "Cuádriceps", equip: "Máquina", region: "lower", type: "weight", coef: 0.35, inc: 5, step: 5, alt: "bulgarian",
    tip: "Rodilla alineada con el eje de la máquina. Pausa de 1 segundo arriba apretando el muslo." },
  bulgarian: { name: "Sentadilla búlgara", muscle: "Cuádriceps y glúteos", equip: "Mancuernas + banco", region: "lower", type: "weight", coef: 0.08, inc: 2, step: 2, perSide: true, alt: "leg_ext",
    tip: "Pie de atrás apoyado en el banco. Baja vertical; el peso va en la pierna de adelante." },
  abductor: { name: "Abductores en máquina", muscle: "Glúteo medio", equip: "Máquina", region: "lower", type: "weight", coef: 0.4, inc: 5, step: 5, alt: "band_walk",
    tip: "Inclínate un poco hacia adelante para enfocar el glúteo. Abre controlado y cierra lento." },
  band_walk: { name: "Caminata lateral con banda", muscle: "Glúteo medio", equip: "Banda elástica", region: "lower", type: "bodyweight", reps: [15, 20], alt: "abductor",
    tip: "Banda sobre las rodillas, media sentadilla. Pasos laterales cortos sin juntar los pies. Reps por lado." },
  calf_raise: { name: "Pantorrillas en máquina", muscle: "Pantorrillas", equip: "Máquina o prensa", region: "lower", type: "weight", coef: 0.6, inc: 5, step: 5, reps: [15, 20], alt: "calf_smith",
    tip: "Recorrido completo: estira abajo 1 segundo y sube en punta de pies." },
  calf_smith: { name: "Pantorrillas en Smith", muscle: "Pantorrillas", equip: "Smith + step", region: "lower", type: "weight", coef: 0.3, inc: 5, step: 5, reps: [15, 20], alt: "calf_raise",
    tip: "Punta de los pies sobre un step. Baja el talón todo lo posible y sube." },

  // ── Brazos y tren superior ───────────────────────────
  lat_pulldown: { name: "Jalón al pecho", muscle: "Espalda", equip: "Polea alta", region: "upper", type: "weight", coef: 0.5, inc: 5, step: 5, main: true, alt: "lat_pulldown_neutral",
    tip: "Agarre un poco más ancho que los hombros. Lleva la barra a la parte alta del pecho juntando las escápulas." },
  lat_pulldown_neutral: { name: "Jalón agarre neutro", muscle: "Espalda", equip: "Polea alta (triángulo)", region: "upper", type: "weight", coef: 0.5, inc: 5, step: 5, main: true, alt: "lat_pulldown",
    tip: "Pecho arriba, codos hacia las costillas. No tires con el cuerpo." },
  db_press: { name: "Press de pecho con mancuernas", muscle: "Pecho y tríceps", equip: "Mancuernas + banco", region: "upper", type: "weight", coef: 0.18, inc: 2, step: 2, perSide: true, main: true, alt: "chest_press_machine",
    tip: "Escápulas juntas y apoyadas. Baja hasta el nivel del pecho con los codos a 45°." },
  chest_press_machine: { name: "Press de pecho en máquina", muscle: "Pecho y tríceps", equip: "Máquina", region: "upper", type: "weight", coef: 0.45, inc: 5, step: 5, main: true, alt: "db_press",
    tip: "Asiento con las manijas a la altura del pecho. Empuja sin despegar la espalda." },
  cable_row: { name: "Remo sentado en polea", muscle: "Espalda media", equip: "Polea baja", region: "upper", type: "weight", coef: 0.5, inc: 5, step: 5, main: true, alt: "machine_row",
    tip: "Torso firme, lleva el agarre al ombligo y junta las escápulas. Estira controlado." },
  machine_row: { name: "Remo en máquina", muscle: "Espalda media", equip: "Máquina", region: "upper", type: "weight", coef: 0.45, inc: 5, step: 5, main: true, alt: "cable_row",
    tip: "Pecho apoyado en el respaldo. Tira con los codos, no con las manos." },
  shoulder_press: { name: "Press de hombros con mancuernas", muscle: "Hombros", equip: "Mancuernas + banco", region: "upper", type: "weight", coef: 0.12, inc: 2, step: 2, perSide: true, alt: "shoulder_press_machine",
    tip: "Sentado con respaldo vertical. Sube sin chocar las mancuernas ni arquear la espalda." },
  shoulder_press_machine: { name: "Press de hombros en máquina", muscle: "Hombros", equip: "Máquina", region: "upper", type: "weight", coef: 0.3, inc: 5, step: 5, alt: "shoulder_press",
    tip: "Manijas a la altura de los hombros al empezar. Empuja hasta casi estirar los codos." },
  lateral_raise: { name: "Elevaciones laterales", muscle: "Hombros", equip: "Mancuernas", region: "upper", type: "weight", coef: 0.05, inc: 1, step: 1, perSide: true, reps: [12, 15], alt: "cable_lateral",
    tip: "Codos levemente flectados. Sube hasta la altura de los hombros, como vertiendo agua." },
  cable_lateral: { name: "Elevación lateral en polea", muscle: "Hombros", equip: "Polea baja", region: "upper", type: "weight", coef: 0.03, inc: 1.25, step: 1.25, perSide: true, reps: [12, 15], alt: "lateral_raise",
    tip: "Polea al lado contrario del brazo que trabaja. Movimiento lento y controlado." },
  biceps_curl: { name: "Curl de bíceps con mancuernas", muscle: "Bíceps", equip: "Mancuernas", region: "upper", type: "weight", coef: 0.1, inc: 1, step: 1, perSide: true, alt: "cable_curl",
    tip: "Codos pegados al cuerpo. Gira la palma hacia arriba al subir y baja en 3 segundos." },
  cable_curl: { name: "Curl de bíceps en polea", muscle: "Bíceps", equip: "Polea baja", region: "upper", type: "weight", coef: 0.2, inc: 2.5, step: 2.5, alt: "biceps_curl",
    tip: "Barra recta o cuerda. Sin balancear el torso." },
  triceps_pushdown: { name: "Extensión de tríceps en polea", muscle: "Tríceps", equip: "Polea alta (cuerda)", region: "upper", type: "weight", coef: 0.2, inc: 2.5, step: 2.5, alt: "overhead_ext",
    tip: "Codos fijos al costado. Abre la cuerda abajo y aprieta el tríceps." },
  overhead_ext: { name: "Extensión de tríceps sobre la cabeza", muscle: "Tríceps", equip: "Mancuerna", region: "upper", type: "weight", coef: 0.12, inc: 2, step: 2, alt: "triceps_pushdown",
    tip: "Mancuerna con ambas manos detrás de la cabeza, codos apuntando al techo." },
  hammer_curl: { name: "Curl martillo", muscle: "Bíceps y antebrazo", equip: "Mancuernas", region: "upper", type: "weight", coef: 0.1, inc: 1, step: 1, perSide: true, alt: "cable_curl",
    tip: "Palmas mirándose entre sí todo el recorrido." },

  // ── Core + full body ─────────────────────────────────
  rdl: { name: "Peso muerto rumano con barra", muscle: "Isquiotibiales, glúteos y espalda baja", equip: "Barra", region: "lower", type: "weight", coef: 0.6, inc: 5, step: 5, main: true, alt: "db_rdl",
    tip: "Barra pegada a las piernas, cadera atrás y espalda neutra. Sube apretando glúteos." },
  lunges: { name: "Zancadas con mancuernas", muscle: "Piernas y glúteos", equip: "Mancuernas", region: "lower", type: "weight", coef: 0.1, inc: 2, step: 2, perSide: true, main: true, alt: "step_up",
    tip: "Paso largo; la rodilla de atrás casi toca el suelo. Reps por pierna." },
  step_up: { name: "Subida al cajón", muscle: "Piernas y glúteos", equip: "Cajón + mancuernas", region: "lower", type: "weight", coef: 0.08, inc: 2, step: 2, perSide: true, main: true, alt: "lunges",
    tip: "Sube empujando con la pierna de arriba, sin impulsarte con la de abajo. Reps por pierna." },
  db_row: { name: "Remo con mancuerna a una mano", muscle: "Espalda", equip: "Mancuerna + banco", region: "upper", type: "weight", coef: 0.2, inc: 2, step: 2, perSide: true, alt: "cable_row",
    tip: "Rodilla y mano apoyadas en el banco. Lleva el codo hacia la cadera." },
  pushup: { name: "Flexiones de brazos", muscle: "Pecho, hombros y tríceps", equip: "Peso corporal", region: "upper", type: "bodyweight", reps: [6, 15], alt: "chest_press_machine",
    tip: "Cuerpo en línea recta. Si cuesta mucho, apoya las rodillas o las manos en un banco." },
  plank: { name: "Plancha", muscle: "Core", equip: "Colchoneta", region: "core", type: "time", alt: "dead_bug",
    tip: "Codos bajo los hombros, glúteos apretados y abdomen firme. No dejes caer la cadera." },
  dead_bug: { name: "Dead bug", muscle: "Core", equip: "Colchoneta", region: "core", type: "bodyweight", reps: [10, 16], alt: "plank",
    tip: "Espalda baja pegada al suelo. Estira brazo y pierna contrarios lentamente." },
  cable_crunch: { name: "Crunch en polea alta", muscle: "Abdominales", equip: "Polea alta (cuerda)", region: "core", type: "weight", coef: 0.3, inc: 2.5, step: 2.5, reps: [12, 20], alt: "machine_crunch",
    tip: "De rodillas, cuerda junto a la cabeza. Enrolla el torso llevando los codos a los muslos." },
  machine_crunch: { name: "Abdominales en máquina", muscle: "Abdominales", equip: "Máquina", region: "core", type: "weight", coef: 0.3, inc: 5, step: 5, reps: [12, 20], alt: "cable_crunch",
    tip: "Exhala al contraer. Movimiento corto y controlado." },
  leg_raise: { name: "Elevación de piernas", muscle: "Abdomen bajo", equip: "Paralelas o barra", region: "core", type: "bodyweight", reps: [8, 15], alt: "reverse_crunch",
    tip: "Sin balanceo. Si cuesta, flecta las rodillas." },
  reverse_crunch: { name: "Crunch invertido", muscle: "Abdomen bajo", equip: "Banco o colchoneta", region: "core", type: "bodyweight", reps: [10, 15], alt: "leg_raise",
    tip: "Lleva las rodillas al pecho despegando levemente la cadera." },
  pallof: { name: "Pallof press", muscle: "Oblicuos (antirrotación)", equip: "Polea media", region: "core", type: "weight", coef: 0.1, inc: 2.5, step: 2.5, reps: [10, 12], alt: "side_plank",
    tip: "De lado a la polea, empuja el agarre al frente sin dejar que el torso gire. Reps por lado." },
  side_plank: { name: "Plancha lateral", muscle: "Oblicuos", equip: "Colchoneta", region: "core", type: "time", alt: "pallof",
    tip: "Codo bajo el hombro, cuerpo en línea recta. Segundos por lado." },
};

export const DAYS = {
  A: {
    name: "Piernas y glúteos", short: "Piernas",
    warmup: "5 min de bicicleta o elíptica + 10 sentadillas sin peso + 10 puentes de glúteo.",
    exercises: ["leg_press", "goblet_squat", "hip_thrust", "leg_curl", "leg_ext", "abductor", "calf_raise"],
  },
  B: {
    name: "Brazos y tren superior", short: "Brazos",
    warmup: "5 min de remo o elíptica + círculos de brazos + 1 serie liviana de jalón y de press.",
    exercises: ["lat_pulldown", "db_press", "cable_row", "shoulder_press", "lateral_raise", "biceps_curl", "triceps_pushdown", "hammer_curl"],
  },
  C: {
    name: "Core + full body", short: "Core",
    warmup: "5 min de caminadora inclinada + 10 bisagras de cadera + 20 s de plancha.",
    exercises: ["rdl", "lunges", "db_row", "pushup", "plank", "cable_crunch", "leg_raise", "pallof"],
    finisher: "Circuito final: 4 rondas de 30 s intensos + 30 s suaves en bicicleta, remo o escaladora.",
  },
};

export const DAY_KEYS = ["A", "B", "C"];

// Fases del plan. Su duración se calcula en buildPlan() según el plazo y la intensidad.
export const PHASES = [
  { n: 1, name: "Adaptación", sets: 3, reps: [12, 15], time: [20, 30], rest: 60,
    goal: "Aprender la técnica y acostumbrar el cuerpo. Deberías terminar cada serie sintiendo que podrías hacer 3 o 4 repeticiones más." },
  { n: 2, name: "Hipertrofia", sets: 4, reps: [10, 12], time: [30, 45], rest: 75,
    goal: "Construir músculo. Las últimas 2 repeticiones de cada serie deben costar." },
  { n: 3, name: "Fuerza y tono", sets: 4, reps: [8, 10], time: [40, 60], rest: 90,
    goal: "Subir las cargas. Menos repeticiones, más peso y buena técnica." },
  { n: 4, name: "Definición", sets: 3, reps: [12, 15], time: [45, 60], rest: 45, superset: true,
    goal: "Quemar más. Ejercicios en superseries (A1 y A2 sin descanso entre ellos) y circuito final." },
  { n: 5, name: "Afinado final", sets: 2, reps: [10, 12], time: [30, 45], rest: 60,
    goal: "Mantener lo ganado con menos volumen para llegar en tu mejor forma a la fecha objetivo." },
];

// Intensidad del plan: cuánto dura la adaptación, cada cuánto hay descarga y cuánto volumen extra se agrega.
//   adapt: semanas de adaptación (principiante; intermedio usa una menos)
//   deloadEvery: semana de descarga cada N semanas (0 = sin descargas)
//   extraMain / extraAll: series extra en ejercicios principales / en todos
//   restDelta: segundos que se restan al descanso
export const INTENSITY = {
  moderada: { label: "Moderada", adapt: 3, deloadEvery: 6, extraMain: 0, extraAll: 0, restDelta: 0,
    hint: "Progreso sostenido, con más tiempo para aprender la técnica." },
  alta: { label: "Alta", adapt: 2, deloadEvery: 8, extraMain: 1, extraAll: 0, restDelta: -15,
    hint: "Más series en los ejercicios principales y descansos más cortos." },
  maxima: { label: "Máxima", adapt: 1, deloadEvery: 0, extraMain: 1, extraAll: 1, restDelta: -15, finisher: true,
    hint: "Para ver cambios rápido: más volumen en todo, sin semanas de descarga y circuito final todos los días." },
};

export const PLAN_OPTIONS = [6, 8, 10, 12, 16, 20, 24];

// Las semanas van de lunes a domingo. Semana 1 = la semana (lunes a domingo) que contiene startDate.
export function toDate(value) {
  if (value instanceof Date) return value;
  return new Date(value.length <= 10 ? value + "T00:00:00" : value);
}

export function mondayOf(value) {
  const d = stripTime(toDate(value));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

const dayDiff = (a, b) => Math.round((stripTime(a) - stripTime(b)) / 86400000);

// Semana del programa para una fecha cualquiera (≤ 0 si es anterior al inicio).
export function weekOf(startDate, date) {
  return Math.floor(dayDiff(toDate(date), mondayOf(startDate)) / 7) + 1;
}

export function weekNumber(startDate, today = new Date()) {
  return Math.max(1, weekOf(startDate, today));
}

// Lunes de la semana `week` del programa.
export function weekStart(startDate, week) {
  const d = mondayOf(startDate);
  d.setDate(d.getDate() + (week - 1) * 7);
  return d;
}

export function totalWeeks(startDate, targetDate) {
  const weeks = Math.ceil(dayDiff(toDate(targetDate), mondayOf(startDate)) / 7);
  return Math.min(52, Math.max(8, weeks));
}

// Plan de un perfil. Si tiene planWeeks, el plan dura eso (puede ser más corto que la fecha objetivo);
// si no, dura hasta targetDate y termina con "Afinado final".
export function planOf(profile) {
  const custom = Number(profile.planWeeks) > 0;
  const total = custom ? Math.min(52, Math.max(4, Number(profile.planWeeks))) : totalWeeks(profile.startDate, profile.targetDate);
  return buildPlan(total, profile.intensity, profile.level, !custom);
}

// Reparte las semanas: adaptación (según intensidad y nivel) → hipertrofia, fuerza y definición en partes iguales
// → afinado final (solo si el plan termina en la fecha objetivo).
export function buildPlan(total, intensityKey = "moderada", level = "principiante", taper = true) {
  const intensity = INTENSITY[intensityKey] || INTENSITY.moderada;
  let adapt = Math.max(1, intensity.adapt - (level === "intermedio" ? 1 : 0));
  adapt = Math.min(adapt, Math.max(1, Math.round(total * 0.25)));
  const taperWeeks = taper ? (total >= 16 ? 2 : 1) : 0;
  const middle = Math.max(3, total - adapt - taperWeeks);
  const hyp = Math.round(middle / 3);
  const str = Math.round(middle / 3);
  const lengths = [adapt, hyp, str, middle - hyp - str, taperWeeks];

  let from = 1;
  const phases = PHASES.map((p, i) => {
    const seg = { ...p, from, to: from + lengths[i] - 1 };
    from += lengths[i];
    return seg;
  }).filter((p) => p.to >= p.from);

  const deloads = new Set();
  if (intensity.deloadEvery) {
    for (let w = intensity.deloadEvery; w < total - taperWeeks; w += intensity.deloadEvery) if (w > adapt) deloads.add(w);
  }
  return { total, intensity: intensityKey in INTENSITY ? intensityKey : "moderada", custom: !taper, phases, deloads };
}

export function phaseFor(week, plan) {
  const intensity = INTENSITY[plan.intensity];
  const base = week > plan.total
    ? { ...PHASES[2], from: plan.total + 1, to: Infinity, name: "Mantención",
        goal: plan.custom
          ? "Completaste tu plazo. Define un nuevo plazo en Perfil para empezar otro bloque; tu historial se mantiene."
          : "Meta alcanzada. Sigue entrenando para mantener lo ganado." }
    : plan.phases.find((p) => week <= p.to) || plan.phases[plan.phases.length - 1];
  return {
    ...base,
    deload: plan.deloads.has(week),
    rest: base.n === 1 ? base.rest : Math.max(30, base.rest + intensity.restDelta),
    extraMain: base.n === 1 ? 0 : intensity.extraMain,
    extraAll: base.n === 1 ? 0 : intensity.extraAll,
    finisher: Boolean(intensity.finisher && base.n > 1),
  };
}

// Prescripción de un ejercicio en la fase dada.
export function prescription(exId, phase) {
  const ex = EXERCISES[exId];
  let sets = (ex.main ? phase.sets + (phase.extraMain || 0) : Math.min(phase.sets, 3)) + (phase.extraAll || 0);
  sets = Math.min(5, sets);
  if (phase.deload) sets = Math.max(2, Math.round(sets * 0.6));
  const range = ex.type === "time" ? phase.time : ex.reps || phase.reps;
  return { sets, min: range[0], max: range[1], rest: phase.rest };
}

// Series de los ejercicios principales en una fase (para mostrar en resúmenes).
export function mainSets(phase) {
  return Math.min(5, phase.sets + (phase.extraMain || 0) + (phase.extraAll || 0));
}

// Etiquetas de superserie (A1/A2, B1/B2…) para la fase de definición.
export function supersetLabel(index, phase) {
  if (!phase.superset) return null;
  return String.fromCharCode(65 + Math.floor(index / 2)) + ((index % 2) + 1);
}

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
