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
  await ensureColumn(db, 'billetera', 'objetivo', 'TEXT');
  await ensureColumn(db, 'billetera', 'objetivo_monto', 'REAL');
  await ensureColumn(db, 'movimientos_finan', 'billetera_destino_id', 'INTEGER REFERENCES billetera(id) ON DELETE SET NULL');
  await ensureColumn(db, 'movimientos_finan', 'tipo', "TEXT NOT NULL DEFAULT 'ingreso'");
  await ensureColumn(db, 'movimientos_finan', 'pago_id', 'INTEGER REFERENCES pago(id) ON DELETE SET NULL');
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('agenda_personal.db');
    await dbInstance.execAsync(CREATE_TABLES_SQL);
    await runMigrations(dbInstance);
  }
  return dbInstance;
}