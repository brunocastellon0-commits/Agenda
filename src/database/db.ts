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
    await dbInstance.execAsync(CREATE_TABLES_SQL);
    await runMigrations(dbInstance);
  }
  return dbInstance;
}