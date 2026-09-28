export type UnidadMedida = 
  | 'g' 
  | 'ml' 
  | 'unidad' 
  | 'taza' 
  | 'cucharada' 
  | 'cucharadita' 
  | 'rebanada' 
  | 'vaso' 
  | 'pieza' 
  | 'porcion'
  | 'plato_pequeño'
  | 'plato_normal'
  | 'plato_grande';

export interface ValoresNutricionales {
  kcal: number;
  prot: number;
  carb: number;
  grasa: number;
  fibra?: number;
}

// Factores de conversión estándar (estimados generales en gramos/ml si no hay uno específico)
const CONVERSIONES_BASE: Record<UnidadMedida, number> = {
  g: 1,
  ml: 1,
  unidad: 100, // asume 100g por defecto si no hay info
  taza: 240,
  cucharada: 15,
  cucharadita: 5,
  rebanada: 30,
  vaso: 250,
  pieza: 100,
  porcion: 150, // porción genérica media
  plato_pequeño: 250,
  plato_normal: 400,
  plato_grande: 600,
};

/**
 * Convierte cualquier cantidad + unidad a la unidad base (g o ml)
 * permitiendo un peso por unidad específico para el alimento.
 */
export function cantidadAUnidadBase(
  cantidad: number,
  unidad: UnidadMedida,
  gramosPorUnidad?: number // ej: si el alimento dice que 1 'unidad' (huevo) pesa 50g
): number {
  if (unidad === 'g' || unidad === 'ml') {
    return cantidad;
  }
  
  if (gramosPorUnidad !== undefined && unidad === 'unidad') {
    return cantidad * gramosPorUnidad;
  }
  
  // Platos (modificadores sobre un plato normal de ~400g)
  if (unidad === 'plato_pequeño') return cantidad * CONVERSIONES_BASE.plato_pequeño;
  if (unidad === 'plato_normal') return cantidad * CONVERSIONES_BASE.plato_normal;
  if (unidad === 'plato_grande') return cantidad * CONVERSIONES_BASE.plato_grande;

  // Conversiones volumétricas/estándar
  return cantidad * CONVERSIONES_BASE[unidad];
}

/**
 * Calcula los macros para una cantidad dada de un alimento.
 */
export function calcularNutricion(
  cantidad: number,
  unidad: UnidadMedida,
  valoresPor100: ValoresNutricionales,
  gramosPorUnidad?: number
): ValoresNutricionales {
  const cantidadBase = cantidadAUnidadBase(cantidad, unidad, gramosPorUnidad);
  const factor = cantidadBase / 100;

  return {
    kcal: Math.round(valoresPor100.kcal * factor),
    prot: Math.round((valoresPor100.prot * factor) * 10) / 10,
    carb: Math.round((valoresPor100.carb * factor) * 10) / 10,
    grasa: Math.round((valoresPor100.grasa * factor) * 10) / 10,
    fibra: valoresPor100.fibra ? Math.round((valoresPor100.fibra * factor) * 10) / 10 : undefined,
  };
}

/**
 * Suma múltiples valores nutricionales en uno solo.
 */
export function sumarNutricion(lista: ValoresNutricionales[]): ValoresNutricionales {
  return lista.reduce(
    (acc, curr) => ({
      kcal: acc.kcal + curr.kcal,
      prot: acc.prot + curr.prot,
      carb: acc.carb + curr.carb,
      grasa: acc.grasa + curr.grasa,
      fibra: (acc.fibra || 0) + (curr.fibra || 0),
    }),
    { kcal: 0, prot: 0, carb: 0, grasa: 0, fibra: 0 }
  );
}

/**
 * Etiquetas legibles para cada unidad de medida.
 */
export const UNIDADES_LABEL: Record<UnidadMedida, string> = {
  g: 'g',
  ml: 'ml',
  unidad: 'unidad',
  taza: 'taza',
  cucharada: 'cucharada',
  cucharadita: 'cucharadita',
  rebanada: 'rebanada',
  vaso: 'vaso',
  pieza: 'pieza',
  porcion: 'porción',
  plato_pequeño: 'plato pequeño',
  plato_normal: 'plato normal',
  plato_grande: 'plato grande',
};

const UNIDAD_SIN_DATOS = 'Sin datos nutricionales';

/**
 * Formatea un valor para display con '~' y redondeo sin decimales.
 * `null`/`undefined` = sin dato real → '—' (nunca se convierte en 0).
 * `0` = dato real que vale cero → se muestra sin '~'.
 */
export function formatEstimado(valor: number | null | undefined, sufijo: string = ''): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—';
  const redondeado = Math.round(valor);
  if (redondeado === 0) return `0${sufijo}`;
  return `~${redondeado}${sufijo}`;
}

/**
 * Presenta la referencia nutricional de un alimento a partir de SU `kcal_100`
 * y su `unidad_base`. No genera ni inventa valores: solo formatea el dato existente.
 *
 * - `kcal_100 = null` → 'Sin datos nutricionales'
 * - `g`  → '~165 kcal por 100 g'
 * - `ml` → '~61 kcal por 100 ml'
 * - otra unidad → '~165 kcal por 100 g (1 pieza ≈ 100 g)' usando
 *   la conversión definida en CONVERSIONES_BASE (si no existe, sin equivalencia).
 *
 * Nota: `kcal_100` es siempre kcal por 100 g/ml de la unidad base
 * (ver `calcularNutricion` → `cantidadAUnidadBase`).
 */
export function formatNutritionReference(
  kcal_100: number | null | undefined,
  unidadBase: UnidadMedida | null | undefined
): string {
  if (kcal_100 === null || kcal_100 === undefined || Number.isNaN(kcal_100)) {
    return UNIDAD_SIN_DATOS;
  }

  const kcal = Math.round(kcal_100);
  const unidad = unidadBase ?? 'g';
  const tilde = kcal === 0 ? '' : '~';

  if (unidad === 'g' || unidad === 'ml') {
    return `${tilde}${kcal} kcal por 100 ${unidad}`;
  }

  const base = `${tilde}${kcal} kcal por 100 g`;
  const factor = CONVERSIONES_BASE[unidad];
  if (factor === undefined) return base;

  const label = UNIDADES_LABEL[unidad] ?? unidad;
  return `${base} (1 ${label} ≈ ${factor} g)`;
}

/**
 * Formatea "cantidad + unidad" para mostrar un registro de comida.
 * Si no hay cantidad → cadena vacía (el alimento sigue visible, "sin cantidad").
 */
export function formatCantidadUnidad(
  cantidad: number | null | undefined,
  unidad: UnidadMedida | null | undefined
): string {
  if (cantidad === null || cantidad === undefined || Number.isNaN(cantidad)) return '';
  const label = unidad ? (UNIDADES_LABEL[unidad] ?? unidad) : '';
  if (!label) return String(cantidad);
  const cant = Number.isInteger(cantidad) ? String(cantidad) : String(cantidad);
  return `${cant} ${label}`;
}
