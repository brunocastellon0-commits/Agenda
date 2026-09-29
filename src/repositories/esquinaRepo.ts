import { getDatabase } from '../database/db';
import { toISODate } from '../utils/semana';

export interface SesionEsquina {
  id: number;
  fecha: string;
  ganas: number;
  etapa_final: string | null;
  respuestas: string | null;
  intervenciones: string | null;
  creada_en: string;
}

export interface CierreSesion {
  etapaFinal: string;
  respuestas: Record<string, unknown>;
  intervenciones: string[];
}

/** INSERT al elegir las ganas (etapa ESTADO). Devuelve el id de la fila. */
export const iniciarSesion = async (ganas: number): Promise<number> => {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO esquina_sesion (fecha, ganas, etapa_final, respuestas, intervenciones, creada_en)
     VALUES (?, ?, NULL, NULL, NULL, ?)`,
    [toISODate(new Date()), ganas, new Date().toISOString()]
  );
  return result.lastInsertRowId;
};

/**
 * UPDATE al salir (X del header o CTA final). Guarda la etapa alcanzada,
 * la respuesta de CABEZA y los ids de intervenciones usadas, como JSON.
 */
export const cerrarSesion = async (id: number, cierre: CierreSesion): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE esquina_sesion
        SET etapa_final = ?, respuestas = ?, intervenciones = ?
      WHERE id = ?`,
    [
      cierre.etapaFinal,
      JSON.stringify(cierre.respuestas),
      JSON.stringify(cierre.intervenciones),
      id,
    ]
  );
};

/** Última sesión registrada (anti-repetición de intervenciones). */
export const getUltimaSesion = async (): Promise<SesionEsquina | null> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SesionEsquina>(
    `SELECT * FROM esquina_sesion ORDER BY id DESC LIMIT 1`
  );
  return row ?? null;
};
