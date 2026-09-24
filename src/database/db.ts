import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

let dbInstance: SQLite.SQLiteDatabase | null = null;

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  const exists = rows.some((row) => row.name === column);
  if (!exists) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // -- Billetera & movimientos (existentes) --
  await ensureColumn(db, 'billetera', 'objetivo', 'TEXT');
  await ensureColumn(db, 'billetera', 'objetivo_monto', 'REAL');
  await ensureColumn(db, 'movimientos_finan', 'billetera_destino_id', 'INTEGER REFERENCES billetera(id) ON DELETE SET NULL');
  await ensureColumn(db, 'movimientos_finan', 'tipo', "TEXT NOT NULL DEFAULT 'ingreso'");
  await ensureColumn(db, 'movimientos_finan', 'pago_id', 'INTEGER REFERENCES pago(id) ON DELETE SET NULL');

  // -- Actividad: sistema avanzado de planificación y ejecución --
  await ensureColumn(db, 'actividad', 'duracion_estimada_min', 'INTEGER');
  await ensureColumn(db, 'actividad', 'duracion_real_min', 'INTEGER');
  await ensureColumn(db, 'actividad', 'estado_planificacion', "TEXT DEFAULT 'planificada'");
  await ensureColumn(db, 'actividad', 'estado_ejecucion', "TEXT DEFAULT 'pendiente'");
  await ensureColumn(db, 'actividad', 'prioridad', "TEXT DEFAULT 'normal'");
  await ensureColumn(db, 'actividad', 'contexto', 'TEXT');
  await ensureColumn(db, 'actividad', 'resultado', 'TEXT');
  await ensureColumn(db, 'actividad', 'notas', 'TEXT');
  await ensureColumn(db, 'actividad', 'regla_recurrencia_id', 'INTEGER');
  await ensureColumn(db, 'actividad', 'instancia_origen_id', 'INTEGER');
  await ensureColumn(db, 'actividad', 'eliminada', 'INTEGER DEFAULT 0');

  // -- Regla de recurrencia: rango de días + período con unidades --
  await ensureColumn(db, 'regla_recurrencia', 'activa', 'INTEGER DEFAULT 1');
  await ensureColumn(db, 'regla_recurrencia', 'dia_inicio', 'INTEGER');
  await ensureColumn(db, 'regla_recurrencia', 'dia_fin', 'INTEGER');
  await ensureColumn(db, 'regla_recurrencia', 'fecha_inicio', 'TEXT');
  await ensureColumn(db, 'regla_recurrencia', 'repeticion_numero', 'INTEGER');
  await ensureColumn(db, 'regla_recurrencia', 'repeticion_unidad', 'TEXT');

  // Migración de reglas legacy: derivar dia_inicio/dia_fin desde dias_semana
  const reglasLegacy = await db.getAllAsync<{ id: number; dias_semana: string | null; patron: string }>(
    `SELECT id, dias_semana, patron FROM regla_recurrencia WHERE dia_inicio IS NULL`
  );
  for (const regla of reglasLegacy) {
    let diaInicio = 1
    let diaFin = 7
    if (regla.dias_semana && regla.dias_semana.trim().length > 0) {
      const dias = regla.dias_semana.split(',').map((d) => Number(d)).filter((d) => Number.isFinite(d))
      if (dias.length > 0) {
        diaInicio = Math.min(...dias)
        diaFin = Math.max(...dias)
      }
    } else if (regla.patron === 'semanal') {
      diaInicio = 1
      diaFin = 1
    }
    await db.runAsync(
      `UPDATE regla_recurrencia SET dia_inicio = ?, dia_fin = ?, activa = 1 WHERE id = ?`,
      [diaInicio, diaFin, regla.id]
    );
  }

  // Reconstrucción neutra: sincronizar estado_ejecucion con completado existente
  // Solo para registros que aún tienen el default 'pendiente' pero completado=1
  await db.runAsync(
    `UPDATE actividad SET estado_ejecucion = 'completada'
     WHERE completado = 1 AND estado_ejecucion = 'pendiente'`
  );
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('agenda_personal.db');
    await dbInstance.execAsync('PRAGMA foreign_keys = ON;');
    await dbInstance.execAsync(CREATE_TABLES_SQL);
    await runMigrations(dbInstance);
  }
  return dbInstance;
}