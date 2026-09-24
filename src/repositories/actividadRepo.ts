import { getDatabase } from '../database/db';
import { scheduleActividadNotification, cancelActividadNotification } from '../services/notificaciones';
import { PALETTE } from '../theme/theme';

// ─── Tipos de estado ────────────────────────────────────────

export type EstadoPlanificacion = 'planificada' | 'reprogramada' | 'cancelada';
export type EstadoEjecucion = 'pendiente' | 'en_progreso' | 'completada' | 'no_realizada';
export type Prioridad = 'critica' | 'alta' | 'normal' | 'baja';
export type PatronRecurrencia = 'diario' | 'dias_semana' | 'semanal' | 'mensual';
export type UnidadRepeticion = 'dias' | 'semanas' | 'meses' | 'indefinido';

// ─── Interfaces ─────────────────────────────────────────────

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
  completado: number; // 0 | 1  — retrocompatible
  proyecto_id?: number | null;
  // Campos del sistema avanzado
  duracion_estimada_min?: number | null;
  duracion_real_min?: number | null;
  estado_planificacion?: EstadoPlanificacion | null;
  estado_ejecucion?: EstadoEjecucion | null;
  prioridad?: Prioridad | null;
  contexto?: string | null;
  resultado?: string | null;
  notas?: string | null;
  regla_recurrencia_id?: number | null;
  instancia_origen_id?: number | null;
  /** 1 = soft-delete (no se muestra ni se regenera por recurrencia) */
  eliminada?: number | null;
}

export interface ActividadSesion {
  id?: number;
  actividad_id: number;
  fecha_hora_inicio: string;
  fecha_hora_fin?: string | null;
  duracion_efectiva_min?: number | null;
  duracion_pausa_min: number;
  notas?: string | null;
}

export interface ActividadSubtarea {
  id?: number;
  actividad_id: number;
  titulo: string;
  completado: number; // 0 | 1
  orden: number;
}

export interface ReglaRecurrencia {
  id?: number;
  titulo: string;
  tipo_actividad_id: number;
  proyecto_id?: number | null;
  patron: PatronRecurrencia;
  dias_semana?: string | null; // '1,3,5' — legacy
  /** 0 = la repetición terminó / fue desactivada */
  activa?: number | null;
  /** Rango de días de la semana (lunes=1 ... domingo=7, con wraparound) */
  dia_inicio?: number | null;
  dia_fin?: number | null;
  /** Fecha base del período (YYYY-MM-DD) */
  fecha_inicio?: string | null;
  repeticion_numero?: number | null;
  repeticion_unidad?: UnidadRepeticion | null;
  hora?: string | null;
  duracion_estimada_min?: number | null;
  prioridad: Prioridad;
}

export interface HistorialEstado {
  id?: number;
  actividad_id: number;
  estado_planificacion_anterior?: string | null;
  estado_planificacion_nuevo?: string | null;
  estado_ejecucion_anterior?: string | null;
  estado_ejecucion_nuevo?: string | null;
  fecha_hora_cambio: string;
  motivo?: string | null;
}

// ─── Constantes ─────────────────────────────────────────────

export const TIPOS_INICIALES: { nombre: string; color: string; emoji: string }[] = [
  { nombre: 'Trabajo', color: PALETTE.categorias.trabajo, emoji: 'work' },
  { nombre: 'Universidad', color: PALETTE.categorias.objetivos, emoji: 'school' },
  { nombre: 'Ocio', color: PALETTE.categorias.ocio, emoji: 'sports_esports' },
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

export const PRIORIDADES: { valor: Prioridad; label: string; color: string }[] = [
  { valor: 'critica', label: 'Crítica', color: PALETTE.categorias.critico },
  { valor: 'alta', label: 'Alta', color: PALETTE.categorias.importante },
  { valor: 'normal', label: 'Normal', color: PALETTE.onSurfaceVariant },
  { valor: 'baja', label: 'Baja', color: PALETTE.outline },
];

export const CONTEXTOS = [
  'Casa', 'Universidad', 'Trabajo', 'Exterior', 'Computadora', 'Teléfono',
] as const;

// ─── Tipos de Actividad (Áreas) ─────────────────────────────

export const asegurarTiposIniciales = async (): Promise<void> => {
  const db = await getDatabase();
  // Migración automática de emojis heredados a nombres de MaterialIcons
  await db.runAsync(`UPDATE tipo_actividad SET emoji = 'work' WHERE emoji = '💼'`);
  await db.runAsync(`UPDATE tipo_actividad SET emoji = 'school' WHERE emoji = '🎓'`);
  await db.runAsync(`UPDATE tipo_actividad SET emoji = 'sports_esports' WHERE emoji = '🎮'`);

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

// ─── Actividades (CRUD base) ────────────────────────────────

export interface IndicadorDiaMes {
  total: number;
  pendientes: number;
  colores: string[];
  /** Total de áreas distintas (puede ser >3, colores solo guarda las 3 primeras) */
  totalAreas: number;
  tieneCritica: boolean;
}

export const getIndicadoresMes = async (
  anoMes: string,
  tipoId?: number
): Promise<Record<string, IndicadorDiaMes>> => {
  const db = await getDatabase();
  const patronFecha = `${anoMes}-%`;

  let rows: {
    fecha: string;
    completado: number;
    prioridad: string | null;
    color: string;
  }[];

  if (tipoId !== undefined) {
    rows = await db.getAllAsync(
      `SELECT a.fecha, a.completado, a.prioridad, t.color
       FROM actividad a
       JOIN tipo_actividad t ON a.tipo_actividad_id = t.id
       WHERE a.fecha LIKE ? AND a.tipo_actividad_id = ?
         AND (a.eliminada IS NULL OR a.eliminada = 0)`,
      [patronFecha, tipoId]
    );
  } else {
    rows = await db.getAllAsync(
      `SELECT a.fecha, a.completado, a.prioridad, t.color
       FROM actividad a
       JOIN tipo_actividad t ON a.tipo_actividad_id = t.id
       WHERE a.fecha LIKE ?
         AND (a.eliminada IS NULL OR a.eliminada = 0)`,
      [patronFecha]
    );
  }

  const mapa: Record<string, IndicadorDiaMes & { _seenColores: Set<string> }> = {};
  for (const row of rows) {
    if (!mapa[row.fecha]) {
      mapa[row.fecha] = {
        total: 0,
        pendientes: 0,
        colores: [],
        totalAreas: 0,
        tieneCritica: false,
        _seenColores: new Set(),
      };
    }
    const item = mapa[row.fecha];
    item.total++;
    if (row.completado === 0) {
      item.pendientes++;
      if (row.prioridad === 'critica' || row.prioridad === 'alta') {
        item.tieneCritica = true;
      }
    }
    if (row.color && !item._seenColores.has(row.color)) {
      item._seenColores.add(row.color);
      item.totalAreas++;
      if (item.colores.length < 3) {
        item.colores.push(row.color);
      }
    }
  }

  // Limpiar campo auxiliar antes de devolver
  const resultado: Record<string, IndicadorDiaMes> = {};
  for (const [fecha, item] of Object.entries(mapa)) {
    const { _seenColores, ...indicador } = item;
    resultado[fecha] = indicador;
  }

  return resultado;
};

/**
 * Eliminación dura (solo para borrar la serie completa u undo de posponer).
 * Para eliminar UNA instancia usar `eliminarInstancia` (soft-delete).
 */
export const eliminarActividad = async (id: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM actividad WHERE id = ?`, [id]);
  await cancelActividadNotification(id);
};

/**
 * Elimina solo una instancia (soft-delete). La fila se conserva con eliminada=1
 * para que `generarInstanciasRecurrentes` no la vuelva a crear.
 */
export const eliminarInstancia = async (id: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(`UPDATE actividad SET eliminada = 1 WHERE id = ?`, [id]);
  await cancelActividadNotification(id);
};

/** Deshace un soft-delete (Undo de "Eliminar solo este día"). */
export const restaurarInstancia = async (id: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(`UPDATE actividad SET eliminada = 0 WHERE id = ?`, [id]);
};

/**
 * Elimina la serie completa: todas las instancias de la regla + la propia regla.
 */
export const eliminarSerie = async (reglaId: number): Promise<void> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: number }>(`SELECT id FROM actividad WHERE regla_recurrencia_id = ?`, [reglaId]);
  
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(`DELETE FROM actividad WHERE regla_recurrencia_id = ?`, [reglaId]);
    await txn.runAsync(`DELETE FROM regla_recurrencia WHERE id = ?`, [reglaId]);
  });

  for (const row of rows) {
    await cancelActividadNotification(row.id);
  }
};

/**
 * Termina la repetición sin borrar nada: marca la regla como inactiva.
 * Las instancias ya generadas permanecen; no se generarán nuevas.
 */
export const desactivarRegla = async (reglaId: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(`UPDATE regla_recurrencia SET activa = 0 WHERE id = ?`, [reglaId]);
};

/** Re-activa una regla (Undo de "Terminar repetición"). */
export const activarRegla = async (reglaId: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(`UPDATE regla_recurrencia SET activa = 1 WHERE id = ?`, [reglaId]);
};

export const marcarEnProgreso = async (id: number): Promise<void> => {
  const db = await getDatabase();
  const act = await db.getFirstAsync<{ estado_ejecucion: string }>(
    `SELECT estado_ejecucion FROM actividad WHERE id = ?`,
    [id]
  );
  if (!act) return;
  const nuevo: EstadoEjecucion = act.estado_ejecucion === 'en_progreso' ? 'pendiente' : 'en_progreso';
  await db.runAsync(
    `UPDATE actividad SET estado_ejecucion = ?, completado = 0 WHERE id = ?`,
    [nuevo, id]
  );
};

export const getActividades = async (
  fecha: string,
  tipoId?: number
): Promise<Actividad[]> => {
  const db = await getDatabase();
  if (tipoId !== undefined) {
    return db.getAllAsync<Actividad>(
      `SELECT * FROM actividad WHERE fecha = ? AND tipo_actividad_id = ?
         AND (eliminada IS NULL OR eliminada = 0)
       ORDER BY completado, id DESC`,
      [fecha, tipoId]
    );
  }
  return db.getAllAsync<Actividad>(
    `SELECT * FROM actividad WHERE fecha = ?
       AND (eliminada IS NULL OR eliminada = 0)
     ORDER BY completado, id DESC`,
    [fecha]
  );
};

export const getActividadById = async (id: number): Promise<Actividad | null> => {
  const db = await getDatabase();
  return db.getFirstAsync<Actividad>(
    `SELECT * FROM actividad WHERE id = ?`,
    [id]
  );
};

export const crearActividad = async (data: {
  fecha: string;
  tipo_actividad_id: number;
  titulo: string;
  descripcion?: string | null;
  hora?: string | null;
  proyecto_id?: number | null;
  duracion_estimada_min?: number | null;
  prioridad?: Prioridad;
  contexto?: string | null;
  regla_recurrencia_id?: number | null;
  instancia_origen_id?: number | null;
}): Promise<number> => {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO actividad (fecha, tipo_actividad_id, titulo, descripcion, hora, completado,
     proyecto_id, duracion_estimada_min, estado_planificacion, estado_ejecucion, prioridad,
     contexto, regla_recurrencia_id, instancia_origen_id)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, 'planificada', 'pendiente', ?, ?, ?, ?)`,
    [
      data.fecha,
      data.tipo_actividad_id,
      data.titulo.trim(),
      data.descripcion?.trim() || null,
      data.hora?.trim() || null,
      data.proyecto_id ?? null,
      data.duracion_estimada_min ?? null,
      data.prioridad ?? 'normal',
      data.contexto?.trim() || null,
      data.regla_recurrencia_id ?? null,
      data.instancia_origen_id ?? null,
    ]
  );
  const nuevoId = result.lastInsertRowId;

  if (data.fecha && data.hora) {
    const isoDate = `${data.fecha}T${data.hora}:00`;
    await scheduleActividadNotification(nuevoId, data.titulo.trim(), isoDate);
  }

  return nuevoId;
};

export const toggleActividad = async (id: number): Promise<void> => {
  const db = await getDatabase();
  const act = await db.getFirstAsync<{ completado: number; estado_planificacion: string; estado_ejecucion: string }>(
    `SELECT completado, estado_planificacion, estado_ejecucion FROM actividad WHERE id = ?`,
    [id]
  );
  if (!act) return;

  const nuevoCompletado = act.completado === 1 ? 0 : 1;
  const nuevoEjecucion: EstadoEjecucion = nuevoCompletado === 1 ? 'completada' : 'pendiente';

  await db.runAsync(
    `UPDATE actividad SET completado = ?, estado_ejecucion = ? WHERE id = ?`,
    [nuevoCompletado, nuevoEjecucion, id]
  );

  // Registrar en historial
  await db.runAsync(
    `INSERT INTO actividad_historial_estado
     (actividad_id, estado_planificacion_anterior, estado_planificacion_nuevo,
      estado_ejecucion_anterior, estado_ejecucion_nuevo, fecha_hora_cambio)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      act.estado_planificacion ?? 'planificada',
      act.estado_planificacion ?? 'planificada',
      act.estado_ejecucion ?? (act.completado === 1 ? 'completada' : 'pendiente'),
      nuevoEjecucion,
      new Date().toISOString(),
    ]
  );

  if (nuevoCompletado === 1) {
    await cancelActividadNotification(id);
  }
};

// ─── Atrasadas y Reprogramación en Lote ─────────────────────

/**
 * Obtiene actividades de días anteriores que siguen pendientes o en progreso.
 * Útil para la sección "Atrasadas" de la vista "Todas las áreas".
 */
export const getActividadesAtrasadas = async (): Promise<Actividad[]> => {
  const db = await getDatabase();
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  const d = String(hoy.getDate()).padStart(2, '0');
  const hoyISO = `${y}-${m}-${d}`;

  return db.getAllAsync<Actividad>(
    `SELECT * FROM actividad
     WHERE fecha < ?
       AND (eliminada IS NULL OR eliminada = 0)
       AND estado_ejecucion IN ('pendiente', 'en_progreso')
       AND (estado_planificacion IS NULL OR estado_planificacion = 'planificada')
     ORDER BY fecha DESC, hora ASC`,
    [hoyISO]
  );
};

export interface UndoLoteInfo {
  /** id → { fechaOriginal, horaOriginal } */
  originales: Record<number, { fecha: string; hora: string | null }>;
}

/**
 * Reprograma un lote de actividades a una nueva fecha.
 * A diferencia de reprogramarActividad (que crea instancia nueva y marca la original),
 * esto simplemente mueve la actividad (UPDATE) para evitar duplicados masivos.
 * Devuelve la info necesaria para Deshacer (Undo).
 */
export const reprogramarLote = async (
  ids: number[],
  nuevaFecha: string
): Promise<UndoLoteInfo> => {
  const db = await getDatabase();
  const originales: Record<number, { fecha: string; hora: string | null }> = {};

  for (const id of ids) {
    const act = await db.getFirstAsync<{ fecha: string; hora: string | null }>(
      `SELECT fecha, hora FROM actividad WHERE id = ?`,
      [id]
    );
    if (act) {
      originales[id] = { fecha: act.fecha, hora: act.hora };
    }
  }

  // Mover todas en una transacción
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const id of ids) {
      await txn.runAsync(
        `UPDATE actividad SET fecha = ? WHERE id = ?`,
        [nuevaFecha, id]
      );
    }
  });

  return { originales };
};

/**
 * Deshace una reprogramación en lote: restaura cada actividad a su fecha y hora originales.
 */
export const deshacerReprogramarLote = async (
  undo: UndoLoteInfo
): Promise<void> => {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const [idStr, orig] of Object.entries(undo.originales)) {
      const id = Number(idStr);
      await txn.runAsync(
        `UPDATE actividad SET fecha = ?, hora = ? WHERE id = ?`,
        [orig.fecha, orig.hora, id]
      );
    }
  });
};

// ─── Transiciones de Estado ─────────────────────────────────

/**
 * Matriz de transiciones válidas.
 * Clave: `${planif_actual}/${ejec_actual}` → valores posibles de `${planif_nueva}/${ejec_nueva}`
 */
const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  'planificada/pendiente': [
    'planificada/en_progreso',   // iniciar
    'planificada/completada',    // completar rápido
    'planificada/no_realizada',  // vencimiento
    'reprogramada/pendiente',    // reprogramar
    'cancelada/no_realizada',    // cancelar
  ],
  'planificada/en_progreso': [
    'planificada/pendiente',     // sesión parcial finalizada
    'planificada/completada',    // sesión completada
  ],
  'reprogramada/pendiente': [
    'planificada/en_progreso',   // iniciar actividad reprogramada
    'planificada/completada',    // completar actividad reprogramada
    'planificada/no_realizada',  // vencimiento
    'cancelada/no_realizada',    // cancelar
  ],
};

export const transicionarEstado = async (
  id: number,
  nuevoPlanificacion: EstadoPlanificacion,
  nuevoEjecucion: EstadoEjecucion,
  motivo?: string | null
): Promise<boolean> => {
  const db = await getDatabase();
  const act = await db.getFirstAsync<{
    estado_planificacion: string;
    estado_ejecucion: string;
  }>(`SELECT estado_planificacion, estado_ejecucion FROM actividad WHERE id = ?`, [id]);

  if (!act) return false;

  const planifActual = act.estado_planificacion ?? 'planificada';
  const ejecActual = act.estado_ejecucion ?? 'pendiente';
  const claveOrigen = `${planifActual}/${ejecActual}`;
  const claveDestino = `${nuevoPlanificacion}/${nuevoEjecucion}`;

  const permitidos = TRANSICIONES_VALIDAS[claveOrigen];
  if (!permitidos || !permitidos.includes(claveDestino)) {
    console.error(`Transición inválida: ${claveOrigen} → ${claveDestino}`);
    return false;
  }

  const nuevoCompletado = nuevoEjecucion === 'completada' ? 1 : 0;

  await db.runAsync(
    `UPDATE actividad SET estado_planificacion = ?, estado_ejecucion = ?, completado = ? WHERE id = ?`,
    [nuevoPlanificacion, nuevoEjecucion, nuevoCompletado, id]
  );

  await db.runAsync(
    `INSERT INTO actividad_historial_estado
     (actividad_id, estado_planificacion_anterior, estado_planificacion_nuevo,
      estado_ejecucion_anterior, estado_ejecucion_nuevo, fecha_hora_cambio, motivo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, planifActual, nuevoPlanificacion, ejecActual, nuevoEjecucion, new Date().toISOString(), motivo ?? null]
  );

  return true;
};

/**
 * Reprogramar una actividad: marca la original como reprogramada y crea una instancia nueva
 * en la nueva fecha con `instancia_origen_id` apuntando a la original.
 */
export const reprogramarActividad = async (
  id: number,
  nuevaFecha: string,
  motivo?: string
): Promise<number | null> => {
  const db = await getDatabase();
  const original = await getActividadById(id);
  if (!original || !original.id) return null;

  // Marcar la original como reprogramada
  const ok = await transicionarEstado(id, 'reprogramada', 'pendiente', motivo);
  if (!ok) return null;

  // Crear nueva instancia vinculada
  const nuevoId = await crearActividad({
    fecha: nuevaFecha,
    tipo_actividad_id: original.tipo_actividad_id,
    titulo: original.titulo,
    descripcion: original.descripcion,
    hora: original.hora,
    proyecto_id: original.proyecto_id,
    duracion_estimada_min: original.duracion_estimada_min,
    prioridad: (original.prioridad as Prioridad) ?? 'normal',
    contexto: original.contexto,
    regla_recurrencia_id: original.regla_recurrencia_id,
    instancia_origen_id: original.id,
  });

  return nuevoId;
};

/**
 * Guardar resultado / notas de una actividad.
 */
export const guardarResultado = async (
  id: number,
  resultado?: string | null,
  notas?: string | null
): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE actividad SET resultado = ?, notas = ? WHERE id = ?`,
    [resultado?.trim() || null, notas?.trim() || null, id]
  );
};

// ─── Sesiones ───────────────────────────────────────────────

export const iniciarSesion = async (actividadId: number): Promise<number> => {
  const db = await getDatabase();
  const ahora = new Date().toISOString();

  // Transicionar a en_progreso si está pendiente
  const act = await db.getFirstAsync<{ estado_ejecucion: string }>(
    `SELECT estado_ejecucion FROM actividad WHERE id = ?`,
    [actividadId]
  );
  if (act && (act.estado_ejecucion === 'pendiente')) {
    await transicionarEstado(actividadId, 'planificada', 'en_progreso');
  }

  const result = await db.runAsync(
    `INSERT INTO actividad_sesion (actividad_id, fecha_hora_inicio, duracion_pausa_min)
     VALUES (?, ?, 0)`,
    [actividadId, ahora]
  );
  return result.lastInsertRowId;
};

export const finalizarSesion = async (
  sesionId: number,
  duracionPausaMin: number,
  notas?: string | null
): Promise<void> => {
  const db = await getDatabase();
  const ahora = new Date().toISOString();

  // Obtener la sesión para calcular duración
  const sesion = await db.getFirstAsync<{ actividad_id: number; fecha_hora_inicio: string }>(
    `SELECT actividad_id, fecha_hora_inicio FROM actividad_sesion WHERE id = ?`,
    [sesionId]
  );
  if (!sesion) return;

  const inicio = new Date(sesion.fecha_hora_inicio).getTime();
  const fin = new Date(ahora).getTime();
  const totalMin = Math.round((fin - inicio) / 60000);
  const efectivaMin = Math.max(0, totalMin - duracionPausaMin);

  await db.runAsync(
    `UPDATE actividad_sesion
     SET fecha_hora_fin = ?, duracion_efectiva_min = ?, duracion_pausa_min = ?, notas = ?
     WHERE id = ?`,
    [ahora, efectivaMin, duracionPausaMin, notas?.trim() || null, sesionId]
  );

  // Recalcular duracion_real_min en la actividad (valor cacheado derivado de sesiones)
  await recalcularDuracionReal(sesion.actividad_id);
};

export const recalcularDuracionReal = async (actividadId: number): Promise<void> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(duracion_efectiva_min) AS total
     FROM actividad_sesion
     WHERE actividad_id = ? AND duracion_efectiva_min IS NOT NULL`,
    [actividadId]
  );
  const total = row?.total ?? null;
  await db.runAsync(
    `UPDATE actividad SET duracion_real_min = ? WHERE id = ?`,
    [total, actividadId]
  );
};

export const getSesionesByActividad = async (actividadId: number): Promise<ActividadSesion[]> => {
  const db = await getDatabase();
  return db.getAllAsync<ActividadSesion>(
    `SELECT * FROM actividad_sesion WHERE actividad_id = ? ORDER BY fecha_hora_inicio DESC`,
    [actividadId]
  );
};

export const getSesionActiva = async (actividadId: number): Promise<ActividadSesion | null> => {
  const db = await getDatabase();
  return db.getFirstAsync<ActividadSesion>(
    `SELECT * FROM actividad_sesion
     WHERE actividad_id = ? AND fecha_hora_fin IS NULL
     ORDER BY fecha_hora_inicio DESC LIMIT 1`,
    [actividadId]
  );
};

// ─── Subtareas ──────────────────────────────────────────────

export const getSubtareas = async (actividadId: number): Promise<ActividadSubtarea[]> => {
  const db = await getDatabase();
  return db.getAllAsync<ActividadSubtarea>(
    `SELECT * FROM actividad_subtarea WHERE actividad_id = ? ORDER BY orden, id`,
    [actividadId]
  );
};

export const crearSubtarea = async (actividadId: number, titulo: string): Promise<number> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ maxOrden: number | null }>(
    `SELECT MAX(orden) AS maxOrden FROM actividad_subtarea WHERE actividad_id = ?`,
    [actividadId]
  );
  const orden = (row?.maxOrden ?? -1) + 1;
  const result = await db.runAsync(
    `INSERT INTO actividad_subtarea (actividad_id, titulo, completado, orden) VALUES (?, ?, 0, ?)`,
    [actividadId, titulo.trim(), orden]
  );
  return result.lastInsertRowId;
};

export const toggleSubtarea = async (id: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE actividad_subtarea SET completado = 1 - completado WHERE id = ?`,
    [id]
  );
};

export const eliminarSubtarea = async (id: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM actividad_subtarea WHERE id = ?`, [id]);
};

export const contarSubtareas = async (actividadId: number): Promise<{ total: number; completadas: number }> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number; completadas: number }>(
    `SELECT COUNT(*) AS total, SUM(completado) AS completadas
     FROM actividad_subtarea WHERE actividad_id = ?`,
    [actividadId]
  );
  return { total: row?.total ?? 0, completadas: row?.completadas ?? 0 };
};

// ─── Recurrencia ────────────────────────────────────────────

export const crearReglaRecurrencia = async (data: {
  titulo: string;
  tipo_actividad_id: number;
  proyecto_id?: number | null;
  patron: PatronRecurrencia;
  dias_semana?: string | null;
  dia_inicio?: number | null;
  dia_fin?: number | null;
  fecha_inicio?: string | null;
  repeticion_numero?: number | null;
  repeticion_unidad?: UnidadRepeticion | null;
  hora?: string | null;
  duracion_estimada_min?: number | null;
  prioridad?: Prioridad;
}): Promise<number> => {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO regla_recurrencia
     (titulo, tipo_actividad_id, proyecto_id, patron, dias_semana,
      activa, dia_inicio, dia_fin, fecha_inicio, repeticion_numero, repeticion_unidad,
      hora, duracion_estimada_min, prioridad)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.titulo.trim(),
      data.tipo_actividad_id,
      data.proyecto_id ?? null,
      data.patron,
      data.dias_semana ?? null,
      data.dia_inicio ?? null,
      data.dia_fin ?? null,
      data.fecha_inicio ?? null,
      data.repeticion_numero ?? null,
      data.repeticion_unidad ?? null,
      data.hora?.trim() || null,
      data.duracion_estimada_min ?? null,
      data.prioridad ?? 'normal',
    ]
  );
  return result.lastInsertRowId;
};

export const getReglasRecurrencia = async (): Promise<ReglaRecurrencia[]> => {
  const db = await getDatabase();
  return db.getAllAsync<ReglaRecurrencia>(
    `SELECT * FROM regla_recurrencia ORDER BY id`
  );
};

/**
 * Generar instancias concretas de actividades recurrentes dentro de un horizonte de días.
 * No duplica instancias ya existentes para una misma regla+fecha.
 */
export const generarInstanciasRecurrentes = async (
  horizonteDias: number = 14
): Promise<number> => {
  const db = await getDatabase();
  const reglas = await getReglasRecurrencia();
  let creadas = 0;

  const hoy = new Date();

  for (const regla of reglas) {
    if (!regla.id) continue;
    // Regla desactivada (repetición terminada): no genera instancias nuevas
    if (regla.activa === 0) continue;

    const fechas = calcularFechasRecurrencia(regla, hoy, horizonteDias);

    for (const fecha of fechas) {
      // Guard ANTI-BUG: si ya existe la fila (incluso con eliminada=1), jamás recrear.
      const existente = await db.getFirstAsync<{ id: number }>(
        `SELECT id FROM actividad WHERE regla_recurrencia_id = ? AND fecha = ? LIMIT 1`,
        [regla.id, fecha]
      );
      if (existente) continue;

      await crearActividad({
        fecha,
        tipo_actividad_id: regla.tipo_actividad_id,
        titulo: regla.titulo,
        hora: regla.hora,
        proyecto_id: regla.proyecto_id,
        duracion_estimada_min: regla.duracion_estimada_min,
        prioridad: regla.prioridad as Prioridad,
        regla_recurrencia_id: regla.id,
      });
      creadas++;
    }
  }

  return creadas;
};

function isoDeFecha(dia: Date): string {
  const y = dia.getFullYear();
  const m = String(dia.getMonth() + 1).padStart(2, '0');
  const d = String(dia.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function diasDelRango(diaInicio: number, diaFin: number): number[] {
  const dias: number[] = [];
  if (diaInicio <= diaFin) {
    for (let d = diaInicio; d <= diaFin; d++) dias.push(d);
  } else {
    // Wraparound (ej. Vie=5 → Lun=1: 5,6,7,1)
    for (let d = diaInicio; d <= 7; d++) dias.push(d);
    for (let d = 1; d <= diaFin; d++) dias.push(d);
  }
  return dias;
}

function calcularFechaFin(regla: ReglaRecurrencia): Date | null {
  const { fecha_inicio, repeticion_numero, repeticion_unidad } = regla;
  if (!fecha_inicio || !repeticion_numero || !repeticion_unidad) return null;
  if (repeticion_unidad === 'indefinido') return null;

  const base = new Date(`${fecha_inicio}T00:00:00`);
  if (Number.isNaN(base.getTime())) return null;
  const n = repeticion_numero;

  const fin = new Date(base.getTime());
  switch (repeticion_unidad) {
    case 'dias':
      fin.setDate(fin.getDate() + n - 1);
      break;
    case 'semanas':
      fin.setDate(fin.getDate() + n * 7 - 1);
      break;
    case 'meses':
      fin.setMonth(fin.getMonth() + n);
      fin.setDate(fin.getDate() - 1);
      break;
  }
  return fin;
}

function calcularFechasRecurrencia(
  regla: ReglaRecurrencia,
  desde: Date,
  horizonteDias: number
): string[] {
  const fechas: string[] = [];
  const fechaFin = calcularFechaFin(regla);
  const diasPermitidos: number[] | null =
    regla.dia_inicio != null && regla.dia_fin != null
      ? diasDelRango(regla.dia_inicio, regla.dia_fin)
      : regla.dias_semana && regla.dias_semana.trim().length > 0
        ? regla.dias_semana.split(',').map(Number).filter((d) => Number.isFinite(d))
        : null;

  for (let i = 0; i < horizonteDias; i++) {
    const dia = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + i);
    const diaSemana = dia.getDay() === 0 ? 7 : dia.getDay(); // Lunes=1 ... Domingo=7
    const fechaISO = isoDeFecha(dia);

    // No generar antes del inicio del período
    if (regla.fecha_inicio && fechaISO < regla.fecha_inicio) continue;
    // No generar después del fin del período
    if (fechaFin && dia > fechaFin) continue;

    let incluir = false;

    if (diasPermitidos && diasPermitidos.length > 0) {
      incluir = diasPermitidos.includes(diaSemana);
    } else {
      // Patrones legacy sin rango explícito
      switch (regla.patron) {
        case 'diario':
          incluir = true;
          break;
        case 'semanal':
          incluir = diaSemana === 1;
          break;
        case 'mensual':
          incluir = dia.getDate() === desde.getDate();
          break;
        default:
          incluir = true;
      }
    }

    if (incluir) fechas.push(fechaISO);
  }
  return fechas;
}

// ─── Historial de Estados ───────────────────────────────────

export const getHistorialEstados = async (actividadId: number): Promise<HistorialEstado[]> => {
  const db = await getDatabase();
  return db.getAllAsync<HistorialEstado>(
    `SELECT * FROM actividad_historial_estado
     WHERE actividad_id = ? ORDER BY fecha_hora_cambio DESC`,
    [actividadId]
  );
};