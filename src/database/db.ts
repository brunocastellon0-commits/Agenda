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

  // -- Comida / Nutrición (Fase 4) --
  await ensureColumn(db, 'comida_alimento', 'kcal_100', 'REAL');
  await ensureColumn(db, 'comida_alimento', 'prot_100', 'REAL');
  await ensureColumn(db, 'comida_alimento', 'carb_100', 'REAL');
  await ensureColumn(db, 'comida_alimento', 'grasa_100', 'REAL');
  await ensureColumn(db, 'comida_alimento', 'fibra_100', 'REAL');
  await ensureColumn(db, 'comida_alimento', 'unidad_base', 'TEXT');
  await ensureColumn(db, 'comida_alimento', 'origen', 'TEXT');
  await ensureColumn(db, 'comida_alimento', 'activo', 'INTEGER DEFAULT 1');
  await ensureColumn(db, 'comida_alimento', 'es_receta', 'INTEGER DEFAULT 0');
  await ensureColumn(db, 'comida_alimento', 'descripcion', 'TEXT');

  await ensureColumn(db, 'comida_registro_item', 'cantidad', 'REAL');
  await ensureColumn(db, 'comida_registro_item', 'unidad', 'TEXT');
  await ensureColumn(db, 'comida_registro_item', 'kcal_est', 'REAL');
  await ensureColumn(db, 'comida_registro_item', 'prot_est', 'REAL');
  await ensureColumn(db, 'comida_registro_item', 'carb_est', 'REAL');
  await ensureColumn(db, 'comida_registro_item', 'grasa_est', 'REAL');

  // -- Evolución Física (Fase 6) --
  await ensureColumn(db, 'usuario', 'fecha_nacimiento', 'TEXT');
  
  // Migrar datos físicos de usuario a registro_fisico si la tabla está vacía
  const fisicosCount = await db.getFirstAsync<{c: number}>(`SELECT COUNT(*) as c FROM registro_fisico`);
  if (fisicosCount && fisicosCount.c === 0) {
    const usuariosConDatos = await db.getAllAsync<{ci: string, peso: number, altura: number, cintura: number, cuello: number}>(
      `SELECT ci, peso, altura, cintura, cuello FROM usuario WHERE peso > 0 OR altura > 0 OR cintura > 0`
    );
    const hoyIso = new Date().toISOString().split('T')[0];
    const hoyHoraIso = new Date().toISOString();
    for (const u of usuariosConDatos) {
      await db.runAsync(
        `INSERT INTO registro_fisico (ci_usuario, fecha_medicion, fecha_registro, peso, altura, cintura, cuello, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [u.ci, hoyIso, hoyHoraIso, u.peso || null, u.altura || null, u.cintura || null, u.cuello || null]
      );
    }
  }
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