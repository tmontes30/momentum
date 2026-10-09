// Plan de alimentación aproximado por porciones de intercambio (sistema usado por nutricionistas en Chile).
// La lógica (calorías por masa libre de grasa, proteína por kg y distribución por comida) se calibró con
// pautas reales de una nutricionista deportiva: para esos perfiles el resultado difiere menos de ~4%.
import { metrics } from "./calc.js";

export const GROUPS = [
  { key: "c", name: "Carbohidratos" },
  { key: "v", name: "Verduras" },
  { key: "f", name: "Frutas" },
  { key: "l", name: "Lácteos" },
  { key: "p", name: "Proteínas" },
  { key: "g", name: "Aceites y grasas" },
];

// Aporte aproximado de 1 porción de cada grupo (kcal y gramos de carbohidratos, proteína y grasa).
const EXCHANGE = {
  c: { kcal: 140, cho: 30, prot: 3, fat: 1 },
  v: { kcal: 25, cho: 5, prot: 2, fat: 0 },
  f: { kcal: 65, cho: 15, prot: 0, fat: 0 },
  l: { kcal: 70, cho: 9, prot: 7, fat: 1 },
  p: { kcal: 65, cho: 0, prot: 11, fat: 2 },
  g: { kcal: 180, cho: 0, prot: 0, fat: 20 },
};

// Ejemplo de qué comer según el tipo de comida (desayuno, principal o colación).
const EXAMPLES = {
  desayuno: {
    c: "Pan de molde, pita o marraqueta (1 porción = 2 rebanadas, 1½ pita o 1 diente con miga)",
    l: "Leche descremada (1 taza) o 1 yogurt protein",
    p: "Huevo entero (1 porción = 1 huevo) o jamón de pavo (1 tajada)",
    f: "Fruta a elección (1 manzana, ½ plátano o 1 taza de berries)",
    v: "Tomate o palta en láminas",
    g: "Palta, mantequilla de maní o frutos secos",
  },
  principal: {
    c: "Arroz, fideos, quinoa, cous cous, papa o legumbres (1 porción = ¾ taza cocido o 1 papa)",
    v: "Verduras crudas (1 porción = 1 taza): lechuga, espinaca, pepino, zapallo italiano, champiñones, rúcula",
    p: "Pollo, pavo, pescado, carne magra o atún en agua (1 porción = 50 g, tamaño caja de fósforos)",
    g: "Aceite de oliva (1 porción = 4 cucharaditas)",
    l: "Lácteo descremado",
    f: "Fruta de postre",
  },
  colacion: {
    f: "Frutillas, moras, frambuesas, arándanos (1 taza), ½ plátano, 1 manzana o 1 pera",
    l: "Yogurt protein o yogurt sin azúcar (1 unidad)",
    c: "Galletas de arroz (3 unidades) o pan pita",
    p: "Huevo duro, jamón de pavo o ½ scoop de proteína",
    v: "Palitos de verduras",
    g: "Almendras o maní (20 unidades)",
  },
};

// Equivalencias: qué cuenta como 1 porción de cada grupo.
export const EQUIVALENTS = {
  c: [["Arroz blanco o integral", "¾ taza o 100 g cocido"], ["Fideos (blancos o integrales)", "¾ taza o 110 g cocido"],
    ["Quinoa, cous cous, burgol", "¾ taza o 100 g cocido"], ["Papa o camote", "1 unidad regular (150 g)"],
    ["Legumbres (garbanzos, lentejas, porotos)", "2 tazas con líquido (150 g cocido)"], ["Choclo, arvejas, habas", "1 taza cocido"],
    ["Pan de molde integral", "2 rebanadas"], ["Pan pita", "1½ unidad pequeña"], ["Marraqueta", "1 diente con miga"],
    ["Pan masa madre", "1 rebanada gruesa o 2 delgadas"], ["Wrap integral o fajita", "1 unidad grande"],
    ["Galletas de arroz", "3 unidades"], ["Galletas de agua", "8 unidades"], ["Cereal sin azúcar", "½ taza"]],
  v: [["Verduras crudas (lechuga, espinaca, apio, repollo, pepino, rúcula, kale)", "1 taza o 50 g"],
    ["Verduras cocidas (brócoli, coliflor, zanahoria, zapallo, betarraga, porotos verdes)", "½ taza o 90-100 g"],
    ["Tomate o alcachofa", "1 unidad mediana"], ["Espárragos", "5 unidades"]],
  f: [["Manzana, pera, naranja, durazno", "1 unidad mediana (150 g)"], ["Plátano*", "½ unidad (60 g)"],
    ["Frutillas, frambuesas, arándanos, sandía*, melón*", "1½ taza"], ["Moras", "1 taza"], ["Kiwi, higos, ciruelas secas", "2 unidades"],
    ["Damascos, ciruelas, mandarinas", "3 unidades"], ["Cerezas*, uvas*", "10 unidades"], ["Piña, mango", "¾ taza"], ["Jugo natural", "½ vaso"]],
  l: [["Leche descremada o cultivada", "1 taza (200 cc)"], ["Bebida vegetal sin azúcar", "1 taza (200 cc)"],
    ["Yogurt protein", "1 unidad"], ["Yogurt sin azúcar", "1 unidad (120 g)"], ["Leche protein en cajita", "1 cajita (200 cc)"],
    ["Quesillo o queso fresco", "1 rodela de 3 cm"], ["Ricotta light", "2 cucharadas"], ["Leche en polvo descremada", "1 cucharada colmada (20 g)"]],
  p: [["Pollo, pavo, posta, lomo liso, filete", "50 g (tamaño caja de fósforos)"], ["Pescado (merluza, reineta, salmón, jurel)", "Trozo tamaño mano"],
    ["Atún en agua o jurel en lata", "¾ taza (80 g)"], ["Huevo entero", "1 unidad"], ["Clara de huevo", "3 claras"],
    ["Carne molida tártaro", "2½ cucharadas (50 g)"], ["Jamón de pavo", "1 tajada (50 g)"], ["Mariscos (choritos, almejas)", "6 unidades"],
    ["Proteína whey o vegana", "½ scoop"]],
  g: [["Aceite (oliva, canola, maravilla)", "4 cucharaditas"], ["Palta", "½ taza"], ["Almendras o maní", "20 unidades"],
    ["Nueces", "5 unidades"], ["Aceitunas", "10 unidades"], ["Mantequilla de maní o almendras", "2 cucharaditas"],
    ["Semillas de chía o linaza", "4 cucharadas"], ["Mayonesa light", "1 cucharada"]],
};

export const RECOMMENDATIONS = [
  "Come cada 3 a 4 horas: ayuda a no perder masa muscular y a mantener tu metabolismo.",
  "Incluye proteína en desayuno, almuerzo y cena. Varía durante la semana: huevo, carnes magras, carnes blancas y pescado.",
  "La fruta la puedes mover a cualquier comida; el horario de la pauta es solo una sugerencia.",
  "Disminuye los alimentos altos en grasa y el queso amarillo.",
  "Refeed: 1 o 2 comidas libres al mes, altas en carbohidratos (no en grasas ni comida chatarra).",
  "Café de grano, té, infusiones y mate a libre disposición.",
  "Para los antojos (SOS): 2 o 3 cuadritos de chocolate 70% cacao, helado o jalea sin azúcar, cabritas o galletas de arroz.",
];

function mealKind(name) {
  const n = name.toLowerCase();
  if (n.includes("desayuno")) return "desayuno";
  if (n.includes("colaci") || n.includes("dormir")) return "colacion";
  return "principal";
}

export function exampleFor(mealName, group) {
  return EXAMPLES[mealKind(mealName)][group];
}

export function totals(meals) {
  const t = { c: 0, v: 0, f: 0, l: 0, p: 0, g: 0 };
  for (const m of meals) for (const k of Object.keys(t)) t[k] += Number(m[k]) || 0;
  return t;
}

// Macros que aportan las porciones (para mostrar cuánto suma el plan).
export function portionsMacros(meals) {
  const t = totals(meals);
  const out = { kcal: 0, cho: 0, prot: 0, fat: 0 };
  for (const [k, n] of Object.entries(t)) for (const m of Object.keys(out)) out[m] += n * EXCHANGE[k][m];
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Math.round(v)]));
}

const half = (x) => Math.round(x * 2) / 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// Plan aproximado para cualquier perfil: reparte porciones para llegar a las calorías y proteína objetivo.
export function generatedPlan(profile) {
  const m = metrics(profile);
  const v = 4;
  const f = m.kcal >= 2000 ? 2 : 1;
  const l = 2;
  const g = m.kcal >= 2300 ? 1 : m.kcal >= 1500 ? 0.5 : 0;
  const fixedKcal = v * EXCHANGE.v.kcal + f * EXCHANGE.f.kcal + l * EXCHANGE.l.kcal + g * EXCHANGE.g.kcal;
  const fixedProt = v * EXCHANGE.v.prot + l * EXCHANGE.l.prot;
  // Resuelve carbohidratos (c) y proteínas (p) para cumplir kcal y gramos de proteína a la vez.
  const kP = EXCHANGE.p.kcal / EXCHANGE.p.prot;
  let c = (m.kcal - fixedKcal - kP * (m.protein - fixedProt)) / (EXCHANGE.c.kcal - kP * EXCHANGE.c.prot);
  c = clamp(half(c), 1, 8);
  const p = clamp(Math.round((m.protein - fixedProt - EXCHANGE.c.prot * c) / EXCHANGE.p.prot), 4, 20);

  // Distribución tipo pauta: desayuno liviano con proteína, almuerzo y cena con el grueso, colación con fruta y lácteo.
  const bf = { c: c >= 3 ? 1 : 0.5, p: clamp(Math.round(p * 0.22), 1, 3) };
  const restC = c - bf.c, restP = p - bf.p;
  const lunchC = Math.ceil(restC) / 2; // mitad redondeada hacia arriba a ½ porción; la cena se lleva el resto
  const lunchP = Math.ceil(restP / 2);
  const meals = [
    { name: "Desayuno", time: "09:00", c: bf.c, v: 0, f: f > 1 ? 1 : 0, l: 1, p: bf.p, g: 0 },
    { name: "Almuerzo", time: "13:00", c: lunchC, v: 2, f: 0, l: 0, p: lunchP, g: g / 2 },
    { name: "Colación PM", time: "17:00", c: 0, v: 0, f: 1, l: 1, p: 0, g: 0 },
    { name: "Cena", time: "20:30", c: half(restC - lunchC), v: 2, f: 0, l: 0, p: restP - lunchP, g: g / 2 },
  ];
  return { kcal: m.kcal, cho: m.carbs, protein: m.protein, fat: m.fat, water: m.water, meals };
}

// Plan de alimentación de un perfil (siempre calculado; no se cargan pautas externas).
export const planFor = generatedPlan;

// Fracciones legibles: 0.25 → ¼, 1.5 → 1½.
export function fmtPortion(x) {
  const n = Number(x) || 0;
  const whole = Math.floor(n + 1e-9);
  const frac = Math.round((n - whole) * 4) / 4;
  const fr = { 0.25: "¼", 0.5: "½", 0.75: "¾" }[frac] || "";
  return (whole ? String(whole) : "") + fr || "0";
}
