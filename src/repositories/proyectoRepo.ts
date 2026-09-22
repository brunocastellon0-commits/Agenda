import { getDatabase } from '../database/db';

// ─── Interfaces ─────────────────────────────────────────────

export interface Proyecto {
  id?: number;
  titulo: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  descripcion?: string | null;
  completado: number; // 0 | 1
}

export interface ProyectoConProgreso extends Proyecto {
  total_actividades: number;
  actividades_completadas: number;
}

// ─── CRUD ───────────────────────────────────────────────────

export const getProyectos = async (): Promise<Proyecto[]> => {
  const db = await getDatabase();
  return db.getAllAsync<Proyecto>(
    `SELECT * FROM proyecto ORDER BY completado, id DESC`
  );
};

export const getProyectosActivos = async (): Promise<Proyecto[]> => {
  const db = await getDatabase();
  return db.getAllAsync<Proyecto>(
    `SELECT * FROM proyecto WHERE completado = 0 ORDER BY id DESC`
  );
};

export const getProyectoById = async (id: number): Promise<Proyecto | null> => {
  const db = await getDatabase();
  return db.getFirstAsync<Proyecto>(
    `SELECT * FROM proyecto WHERE id = ?`,
    [id]
  );
};

export const crearProyecto = async (data: {
  titulo: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  descripcion?: string | null;
}): Promise<number> => {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO proyecto (titulo, fecha_inicio, fecha_fin, descripcion, completado)
     VALUES (?, ?, ?, ?, 0)`,
    [
      data.titulo.trim(),
      data.fecha_inicio ?? null,
      data.fecha_fin ?? null,
      data.descripcion?.trim() || null,
    ]
  );
  return result.lastInsertRowId;
};

export const toggleProyecto = async (id: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE proyecto SET completado = 1 - completado WHERE id = ?`,
    [id]
  );
};

// ─── Consultas con Actividades Vinculadas ───────────────────

export const getProyectosConProgreso = async (): Promise<ProyectoConProgreso[]> => {
  const db = await getDatabase();
  return db.getAllAsync<ProyectoConProgreso>(
    `SELECT
       p.*,
       COALESCE(c.total, 0) AS total_actividades,
       COALESCE(c.completadas, 0) AS actividades_completadas
     FROM proyecto p
     LEFT JOIN (
       SELECT proyecto_id,
              COUNT(*) AS total,
              SUM(CASE WHEN completado = 1 THEN 1 ELSE 0 END) AS completadas
       FROM actividad
       WHERE proyecto_id IS NOT NULL
       GROUP BY proyecto_id
     ) c ON c.proyecto_id = p.id
     ORDER BY p.completado, p.id DESC`
  );
};
