import { getDatabase } from '../database/db';

export type TipoComida = 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'otro';

export interface Alimento {
  id?: number;
  nombre: string;
  categoria: string;
  tags: string[]; // Parcheado desde/hacia JSON
}

export interface RegistroComida {
  id?: number;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:MM
  tipo: TipoComida;
  nota?: string | null;
  items: Alimento[];
}

const ALIMENTOS_INICIALES = [
  { nombre: 'Huevos', categoria: 'proteina', tags: ['proteina'] },
  { nombre: 'Pollo', categoria: 'proteina', tags: ['proteina'] },
  { nombre: 'Carne de res', categoria: 'proteina', tags: ['proteina'] },
  { nombre: 'Pescado', categoria: 'proteina', tags: ['proteina'] },
  { nombre: 'Lentejas', categoria: 'proteina', tags: ['proteina', 'fibra'] },
  { nombre: 'Arroz', categoria: 'cereal', tags: ['carbohidrato'] },
  { nombre: 'Pan', categoria: 'cereal', tags: ['carbohidrato'] },
  { nombre: 'Avena', categoria: 'cereal', tags: ['carbohidrato', 'fibra'] },
  { nombre: 'Brócoli', categoria: 'vegetal', tags: ['vegetal', 'fibra'] },
  { nombre: 'Ensalada', categoria: 'vegetal', tags: ['vegetal', 'fibra'] },
  { nombre: 'Tomate', categoria: 'vegetal', tags: ['vegetal'] },
  { nombre: 'Banana', categoria: 'fruta', tags: ['fruta'] },
  { nombre: 'Manzana', categoria: 'fruta', tags: ['fruta', 'fibra'] },
  { nombre: 'Yogurt', categoria: 'lacteo', tags: ['proteina', 'lacteo'] },
  { nombre: 'Queso', categoria: 'lacteo', tags: ['grasa', 'lacteo'] },
  { nombre: 'Nueces', categoria: 'grasa', tags: ['grasa', 'fibra'] },
  { nombre: 'Gaseosa', categoria: 'bebida', tags: ['azucar', 'ultraprocesado'] },
  { nombre: 'Pizza', categoria: 'mixto', tags: ['ultraprocesado', 'carbohidrato', 'grasa'] },
  { nombre: 'Hamburguesa', categoria: 'mixto', tags: ['ultraprocesado', 'proteina', 'grasa'] },
  { nombre: 'Café', categoria: 'bebida', tags: ['bebida'] },
  { nombre: 'Agua', categoria: 'bebida', tags: ['bebida'] },
];

export const asegurarAlimentosIniciales = async (): Promise<void> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(`SELECT COUNT(*) AS total FROM comida_alimento`);
  if (row && row.total > 0) return;

  for (const al of ALIMENTOS_INICIALES) {
    await db.runAsync(
      `INSERT INTO comida_alimento (nombre, categoria, tags) VALUES (?, ?, ?)`,
      [al.nombre, al.categoria, JSON.stringify(al.tags)]
    );
  }
};

export const buscarAlimentos = async (query: string = ''): Promise<Alimento[]> => {
  const db = await getDatabase();
  let rows: { id: number; nombre: string; categoria: string; tags: string }[];
  
  if (query.trim().length > 0) {
    rows = await db.getAllAsync(
      `SELECT * FROM comida_alimento WHERE nombre LIKE ? ORDER BY nombre`,
      [`%${query}%`]
    );
  } else {
    // Si no hay query, devolvemos algunos aleatorios o recientes (acá limitamos a 20)
    rows = await db.getAllAsync(`SELECT * FROM comida_alimento ORDER BY nombre LIMIT 20`);
  }

  return rows.map(r => ({
    id: r.id,
    nombre: r.nombre,
    categoria: r.categoria,
    tags: JSON.parse(r.tags)
  }));
};

export const crearAlimento = async (nombre: string, categoria: string = 'otro', tags: string[] = []): Promise<number> => {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO comida_alimento (nombre, categoria, tags) VALUES (?, ?, ?)`,
    [nombre.trim(), categoria, JSON.stringify(tags)]
  );
  return result.lastInsertRowId;
};

export const getRegistrosDia = async (fecha: string): Promise<RegistroComida[]> => {
  const db = await getDatabase();
  const registrosDb = await db.getAllAsync<{ id: number; fecha: string; hora: string; tipo: string; nota: string | null }>(
    `SELECT * FROM comida_registro WHERE fecha = ? ORDER BY hora ASC`,
    [fecha]
  );

  const resultado: RegistroComida[] = [];

  for (const reg of registrosDb) {
    const itemsDb = await db.getAllAsync<{ id: number; nombre: string; categoria: string; tags: string }>(
      `SELECT a.* FROM comida_alimento a
       JOIN comida_registro_item i ON a.id = i.alimento_id
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
        nombre: i.nombre,
        categoria: i.categoria,
        tags: JSON.parse(i.tags)
      }))
    });
  }

  return resultado;
};

export const registrarComida = async (data: { fecha: string; hora: string; tipo: TipoComida; nota?: string; alimentoIds: number[] }): Promise<number> => {
  const db = await getDatabase();
  let registroId = 0;
  await db.withExclusiveTransactionAsync(async (txn) => {
    const res = await txn.runAsync(
      `INSERT INTO comida_registro (fecha, hora, tipo, nota) VALUES (?, ?, ?, ?)`,
      [data.fecha, data.hora, data.tipo, data.nota || null]
    );
    registroId = res.lastInsertRowId;

    for (const alId of data.alimentoIds) {
      await txn.runAsync(
        `INSERT INTO comida_registro_item (registro_id, alimento_id) VALUES (?, ?)`,
        [registroId, alId]
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
  calidadGeneral: number; // 0 a 10
  desglose: {
    proteina: number; // 0 a 1
    vegetales: number; // 0 a 1
    frutas: number; // 0 a 1
    ultraprocesados: number; // 0 a 1 (1 = muchos ultraprocesados -> impacta negativamente)
  };
  tendencias: string[];
}

export const analizarRango = async (inicio: string, fin: string): Promise<AnalisisAlimentacion> => {
  const db = await getDatabase();
  // Obtener todas las comidas en el rango
  const registros = await db.getAllAsync<{ id: number; fecha: string; hora: string; tipo: string }>(
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

    let hasProtein = false;
    let hasVeggie = false;
    let hasFruit = false;
    let hasUltra = false;

    itemsDb.forEach(item => {
      const tags: string[] = JSON.parse(item.tags);
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

  const totalComidas = registros.length || 1; // evitar division por 0

  const proteinaScore = comidasConProteina / totalComidas;
  const vegetalesScore = comidasConVegetales / totalComidas;
  const frutasScore = comidasConFruta / totalComidas;
  const ultraScore = comidasConUltraprocesados / totalComidas;

  // Indice super simple: 
  // Base 5. Suma hasta 2 por proteina, 2 por vegetales, 1 por frutas.
  // Resta hasta 2 por ultraprocesados.
  let calidad = 5 + (proteinaScore * 2) + (vegetalesScore * 2) + (frutasScore * 1) - (ultraScore * 2);
  calidad = Math.max(0, Math.min(10, calidad));

  // Generar feedback
  const tendencias: string[] = [];
  
  if (registros.length === 0) {
    // Sin datos
    return {
      calidadGeneral: 0,
      desglose: { proteina: 0, vegetales: 0, frutas: 0, ultraprocesados: 0 },
      tendencias: []
    };
  }

  if (proteinaScore > 0.6) {
    tendencias.push("Has incluido proteína en la mayoría de tus comidas.");
  } else if (proteinaScore < 0.3) {
    tendencias.push("Tus comidas han sido bajas en proteína en general.");
  }

  if (vegetalesScore > 0.5) {
    tendencias.push("¡Buena presencia de vegetales en tus platos!");
  } else if (vegetalesScore < 0.2) {
    tendencias.push("Podrías intentar agregar vegetales a más comidas.");
  }

  if (ultraScore > 0.4) {
    tendencias.push("Has registrado varios alimentos ultraprocesados.");
  }

  // Patrón de horarios (Cenas tarde)
  const cenas = registros.filter(r => r.tipo === 'cena');
  let cenasTarde = 0;
  cenas.forEach(c => {
    if (c.hora >= '21:30') cenasTarde++;
  });
  if (cenasTarde > 2) {
    tendencias.push(`Has cenado después de las 21:30 en ${cenasTarde} ocasiones.`);
  }

  return {
    calidadGeneral: Math.round(calidad * 10) / 10,
    desglose: {
      proteina: proteinaScore,
      vegetales: vegetalesScore,
      frutas: frutasScore,
      ultraprocesados: ultraScore
    },
    tendencias
  };
};
