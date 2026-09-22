import { getDatabase } from '../database/db';
import { PALETTE } from '../theme/theme';

export interface TipoActividad {
  id?: number;
  nombre: string;
  color: string;
  emoji?: string | null;
  orden: number;
}

export interface Actividad {
  id?: number;
  fecha: string;
  tipo_actividad_id: number;
  titulo: string;
  descripcion?: string | null;
  hora?: string | null;
  completado: number; // 0 | 1
  proyecto_id?: number | null;
}

export const TIPOS_INICIALES: { nombre: string; color: string; emoji: string }[] = [
  { nombre: 'Trabajo', color: PALETTE.categorias.trabajo, emoji: '💼' },
  { nombre: 'Universidad', color: PALETTE.categorias.objetivos, emoji: '🎓' },
  { nombre: 'Ocio', color: PALETTE.categorias.ocio, emoji: '🎮' },
];

export const COLORES_TIPO_ACTIVIDAD: { nombre: string; color: string }[] = [
  { nombre: 'Trabajo', color: PALETTE.categorias.trabajo },
  { nombre: 'Objetivos', color: PALETTE.categorias.objetivos },
  { nombre: 'Ocio', color: PALETTE.categorias.ocio },
  { nombre: 'Finanzas', color: PALETTE.categorias.finanzas },
  { nombre: 'Eventos', color: PALETTE.categorias.eventos },
  { nombre: 'Importante', color: PALETTE.categorias.importante },
  { nombre: 'Crítico', color: PALETTE.categorias.critico },
];

export const asegurarTiposIniciales = async (): Promise<void> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM tipo_actividad`
  );
  if (row && row.total > 0) return;
  for (let i = 0; i < TIPOS_INICIALES.length; i++) {
    const tipo = TIPOS_INICIALES[i];
    await db.runAsync(
      `INSERT OR IGNORE INTO tipo_actividad (nombre, color, emoji, orden) VALUES (?, ?, ?, ?)`,
      [tipo.nombre, tipo.color, tipo.emoji, i]
    );
  }
};

export const getTiposActividad = async (): Promise<TipoActividad[]> => {
  const db = await getDatabase();
  return db.getAllAsync<TipoActividad>(
    `SELECT * FROM tipo_actividad ORDER BY orden, id`
  );
};

export const crearTipoActividad = async (data: {
  nombre: string;
  color: string;
  emoji?: string;
}): Promise<number> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ maxOrden: number | null }>(
    `SELECT MAX(orden) AS maxOrden FROM tipo_actividad`
  );
  const orden = (row?.maxOrden ?? -1) + 1;
  const result = await db.runAsync(
    `INSERT INTO tipo_actividad (nombre, color, emoji, orden) VALUES (?, ?, ?, ?)`,
    [data.nombre.trim(), data.color, data.emoji?.trim() || null, orden]
  );
  return result.lastInsertRowId;
};

export const getActividades = async (
  fecha: string,
  tipoId?: number
): Promise<Actividad[]> => {
  const db = await getDatabase();
  if (tipoId !== undefined) {
    return db.getAllAsync<Actividad>(
      `SELECT * FROM actividad WHERE fecha = ? AND tipo_actividad_id = ? ORDER BY completado, id DESC`,
      [fecha, tipoId]
    );
  }
  return db.getAllAsync<Actividad>(
    `SELECT * FROM actividad WHERE fecha = ? ORDER BY completado, id DESC`,
    [fecha]
  );
};

export const crearActividad = async (data: {
  fecha: string;
  tipo_actividad_id: number;
  titulo: string;
  descripcion?: string | null;
  hora?: string | null;
  proyecto_id?: number | null;
}): Promise<number> => {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO actividad (fecha, tipo_actividad_id, titulo, descripcion, hora, completado, proyecto_id)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [
      data.fecha,
      data.tipo_actividad_id,
      data.titulo.trim(),
      data.descripcion?.trim() || null,
      data.hora?.trim() || null,
      data.proyecto_id ?? null,
    ]
  );
  return result.lastInsertRowId;
};

export const toggleActividad = async (id: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE actividad SET completado = 1 - completado WHERE id = ?`,
    [id]
  );
};