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
 * Formatea un valor para display con '~' y redondeo sin decimales.
 */
export function formatEstimado(valor: number, sufijo: string = ''): string {
  return `~${Math.round(valor)}${sufijo}`;
}
