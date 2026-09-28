import { getDatabase } from '../database/db';
import { ALIMENTOS_INICIALES, PLATOS_INICIALES, SeedAlimento } from '../database/seeds/alimentos';
import { UnidadMedida } from '../utils/nutricion';

export type TipoComida = 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'otro';

export interface Alimento {
  id?: number;
  nombre: string;
  categoria: string;
  tags: string[];
  // Anulables en SQLite (schema.ts) — NULL = "sin datos", nunca 0.
  kcal_100: number | null;
  prot_100: number | null;
  carb_100: number | null;
  grasa_100: number | null;
  fibra_100?: number | null;
  unidad_base: UnidadMedida;
  origen: 'sistema' | 'usuario';
  activo: number;
  es_receta: number;
  descripcion?: string;
}

export interface RegistroComidaItem {
  id?: number;
  registro_id?: number;
  alimento_id: number;
  alimento?: Alimento;
  // Cantidad opcional: null = "sin cantidad" (el alimento queda registrado y visible).
  cantidad: number | null;
  unidad: UnidadMedida | null;
  kcal_est: number | null;
  prot_est: number | null;
  carb_est: number | null;
  grasa_est: number | null;
}

export interface RegistroComida {
  id?: number;
  fecha: string;
  hora: string;
  tipo: TipoComida;
  nota?: string | null;
  items: RegistroComidaItem[];
}

export const asegurarAlimentosIniciales = async (): Promise<void> => {
  const db = await getDatabase();
  const todos = [...ALIMENTOS_INICIALES, ...PLATOS_INICIALES];

  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const al of todos) {
      const existe = await txn.getFirstAsync<{ id: number }>(
        `SELECT id FROM comida_alimento WHERE nombre = ?`,
        [al.nombre]
      );
      if (existe) {
        await txn.runAsync(
          `UPDATE comida_alimento SET 
            kcal_100 = ?, prot_100 = ?, carb_100 = ?, grasa_100 = ?, fibra_100 = ?,
            unidad_base = ?, origen = ?
           WHERE id = ?`,
          [al.kcal_100, al.prot_100, al.carb_100, al.grasa_100, al.fibra_100 ?? null, al.unidad_base, al.origen, existe.id]
        );
      } else {
        await txn.runAsync(
          `INSERT INTO comida_alimento 
            (nombre, categoria, tags, kcal_100, prot_100, carb_100, grasa_100, fibra_100, unidad_base, origen, activo, es_receta) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
          [al.nombre, al.categoria, JSON.stringify(al.tags), al.kcal_100, al.prot_100, al.carb_100, al.grasa_100, al.fibra_100 ?? null, al.unidad_base, al.origen]
        );
      }
    }

    // Saneo de filas legacy: solo se ocultan del buscador alimentos de origen
    // 'sistema' cuyo kcal_100 quedó NULL (semilla anterior que ya no existe).
    // NO borra filas ni toca comida_registro_item → el histórico se conserva
    // íntegro (los JOIN por alimento_id siguen resolviendo).
    await txn.runAsync(
      `UPDATE comida_alimento SET activo = 0
       WHERE origen = 'sistema' AND activo = 1 AND kcal_100 IS NULL`
    );
  });
};

export const buscarAlimentos = async (query: string = ''): Promise<Alimento[]> => {
  const db = await getDatabase();
  let rows;
  
  if (query.trim().length > 0) {
    rows = await db.getAllAsync<any>(
      `SELECT * FROM comida_alimento WHERE nombre LIKE ? AND activo = 1 ORDER BY nombre LIMIT 30`,
      [`%${query}%`]
    );
  } else {
    rows = await db.getAllAsync<any>(`SELECT * FROM comida_alimento WHERE activo = 1 ORDER BY nombre LIMIT 20`);
  }

  return rows.map(r => ({
    ...r,
    tags: JSON.parse(r.tags || '[]')
  }));
};

export const getRegistrosDia = async (fecha: string): Promise<RegistroComida[]> => {
  const db = await getDatabase();
  const registrosDb = await db.getAllAsync<any>(
    `SELECT * FROM comida_registro WHERE fecha = ? ORDER BY hora ASC`,
    [fecha]
  );

  const resultado: RegistroComida[] = [];

  for (const reg of registrosDb) {
    const itemsDb = await db.getAllAsync<any>(
      `SELECT i.*, a.nombre, a.categoria, a.tags, a.unidad_base, a.kcal_100, a.prot_100, a.carb_100, a.grasa_100, a.fibra_100, a.origen, a.activo, a.es_receta
       FROM comida_registro_item i
       JOIN comida_alimento a ON i.alimento_id = a.id
       WHERE i.registro_id = ?`,
      [reg.id]
    );

    resultado.push({
      id: reg.id,
      fecha: reg.fecha,
      hora: reg.hora,
      tipo: reg.tipo as TipoComida,
      nota: reg.nota,
      items: itemsDb.map(i => ({
        id: i.id,
        registro_id: i.registro_id,
        alimento_id: i.alimento_id,
        // NULL = sin cantidad / sin estimación (nunca se convierte en 0 ni en 1)
        cantidad: i.cantidad ?? null,
        unidad: i.unidad ?? null,
        kcal_est: i.kcal_est ?? null,
        prot_est: i.prot_est ?? null,
        carb_est: i.carb_est ?? null,
        grasa_est: i.grasa_est ?? null,
        alimento: {
          id: i.alimento_id,
          nombre: i.nombre,
          categoria: i.categoria,
          tags: JSON.parse(i.tags || '[]'),
          kcal_100: i.kcal_100 ?? null,
          prot_100: i.prot_100 ?? null,
          carb_100: i.carb_100 ?? null,
          grasa_100: i.grasa_100 ?? null,
          fibra_100: i.fibra_100 ?? null,
          unidad_base: i.unidad_base ?? 'g',
          origen: i.origen ?? 'sistema',
          activo: i.activo ?? 1,
          es_receta: i.es_receta ?? 0
        }
      }))
    });
  }

  return resultado;
};

export const registrarComida = async (data: { fecha: string; hora: string; tipo: TipoComida; nota?: string; items: Omit<RegistroComidaItem, 'id' | 'registro_id'>[] }): Promise<number> => {
  const db = await getDatabase();
  let registroId = 0;
  await db.withExclusiveTransactionAsync(async (txn) => {
    const res = await txn.runAsync(
      `INSERT INTO comida_registro (fecha, hora, tipo, nota) VALUES (?, ?, ?, ?)`,
      [data.fecha, data.hora, data.tipo, data.nota || null]
    );
    registroId = res.lastInsertRowId;

    for (const item of data.items) {
      await txn.runAsync(
        `INSERT INTO comida_registro_item (registro_id, alimento_id, cantidad, unidad, kcal_est, prot_est, carb_est, grasa_est) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [registroId, item.alimento_id, item.cantidad, item.unidad, item.kcal_est, item.prot_est, item.carb_est, item.grasa_est]
      );
    }
  });
  return registroId;
};

export const eliminarRegistroComida = async (id: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM comida_registro WHERE id = ?`, [id]);
};

// --- ANÁLISIS ---

export interface AnalisisAlimentacion {
  calidadGeneral: number;
  desglose: {
    proteina: number;
    vegetales: number;
    frutas: number;
    ultraprocesados: number;
  };
  tendencias: string[];
}

export const analizarRango = async (inicio: string, fin: string): Promise<AnalisisAlimentacion> => {
  const db = await getDatabase();
  const registros = await db.getAllAsync<any>(
    `SELECT * FROM comida_registro WHERE fecha BETWEEN ? AND ?`,
    [inicio, fin]
  );

  let comidasConProteina = 0;
  let comidasConVegetales = 0;
  let comidasConFruta = 0;
  let comidasConUltraprocesados = 0;

  for (const reg of registros) {
    const itemsDb = await db.getAllAsync<{ tags: string }>(
      `SELECT a.tags FROM comida_alimento a
       JOIN comida_registro_item i ON a.id = i.alimento_id
       WHERE i.registro_id = ?`,
      [reg.id]
    );

    let hasProtein = false, hasVeggie = false, hasFruit = false, hasUltra = false;

    itemsDb.forEach(item => {
      const tags: string[] = JSON.parse(item.tags || '[]');
      if (tags.includes('proteina')) hasProtein = true;
      if (tags.includes('vegetal')) hasVeggie = true;
      if (tags.includes('fruta')) hasFruit = true;
      if (tags.includes('ultraprocesado')) hasUltra = true;
    });

    if (hasProtein) comidasConProteina++;
    if (hasVeggie) comidasConVegetales++;
    if (hasFruit) comidasConFruta++;
    if (hasUltra) comidasConUltraprocesados++;
  }

  const totalComidas = registros.length || 1;
  const proteinaScore = comidasConProteina / totalComidas;
  const vegetalesScore = comidasConVegetales / totalComidas;
  const frutasScore = comidasConFruta / totalComidas;
  const ultraScore = comidasConUltraprocesados / totalComidas;

  let calidad = 5 + (proteinaScore * 2) + (vegetalesScore * 2) + (frutasScore * 1) - (ultraScore * 2);
  calidad = Math.max(0, Math.min(10, calidad));

  const tendencias: string[] = [];
  if (registros.length === 0) return { calidadGeneral: 0, desglose: { proteina: 0, vegetales: 0, frutas: 0, ultraprocesados: 0 }, tendencias: [] };

  if (proteinaScore > 0.6) tendencias.push("Incluiste proteína en la mayoría de tus comidas.");
  else if (proteinaScore < 0.3) tendencias.push("Tus comidas han sido bajas en proteína en general.");
  if (vegetalesScore > 0.5) tendencias.push("¡Buena presencia de vegetales en tus platos!");
  else if (vegetalesScore < 0.2) tendencias.push("Podrías intentar agregar vegetales a más comidas.");
  if (ultraScore > 0.4) tendencias.push("Registraste varios alimentos ultraprocesados.");

  const cenasTarde = registros.filter(r => r.tipo === 'cena' && r.hora >= '21:30').length;
  if (cenasTarde > 2) tendencias.push(`Cenaste después de las 21:30 en ${cenasTarde} ocasiones.`);

  return {
    calidadGeneral: Math.round(calidad * 10) / 10,
    desglose: { proteina: proteinaScore, vegetales: vegetalesScore, frutas: frutasScore, ultraprocesados: ultraScore },
    tendencias
  };
};

export interface ResumenNutricional {
  kcal: number;
  prot: number;
  carb: number;
  grasa: number;
  /** Cantidad de comidas registradas en la fecha (0 = sin datos). */
  comidas: number;
  /** Ítems que sí tienen estimación calórica (0 = nada calculable). */
  itemsEstimados: number;
}

/** Estado inicial "sin datos" — no confundir con 0 kcal. */
export const RESUMEN_VACIO: ResumenNutricional = {
  kcal: 0, prot: 0, carb: 0, grasa: 0, comidas: 0, itemsEstimados: 0
};

export const getResumenDia = async (fecha: string): Promise<ResumenNutricional> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ kcal_est: number | null, prot_est: number | null, carb_est: number | null, grasa_est: number | null }>(
    `SELECT i.kcal_est, i.prot_est, i.carb_est, i.grasa_est
     FROM comida_registro_item i
     JOIN comida_registro r ON i.registro_id = r.id
     WHERE r.fecha = ?`,
    [fecha]
  );

  const conteo = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM comida_registro WHERE fecha = ?`,
    [fecha]
  );

  // Los NULL se suman como aporte cero (no hay dato que sumar), pero se cuentan
  // aparte en `itemsEstimados` para poder distinguir "0 kcal" de "sin datos".
  const acumulado = rows.reduce((acc, curr) => ({
    kcal: acc.kcal + (curr.kcal_est ?? 0),
    prot: acc.prot + (curr.prot_est ?? 0),
    carb: acc.carb + (curr.carb_est ?? 0),
    grasa: acc.grasa + (curr.grasa_est ?? 0)
  }), { kcal: 0, prot: 0, carb: 0, grasa: 0 });

  return {
    ...acumulado,
    comidas: conteo?.total ?? 0,
    itemsEstimados: rows.filter(r => r.kcal_est !== null && r.kcal_est !== undefined).length
  };
};
