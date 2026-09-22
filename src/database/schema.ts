export const CREATE_TABLES_SQL = `
-- 1. Tabla de Usuario (Datos personales y métricas físicas)
CREATE TABLE IF NOT EXISTS usuario (
    ci TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    peso REAL,
    altura REAL,
    cintura REAL,
    cuello REAL,
    edad INTEGER,
    avatarUrl TEXT
);

-- 2. Tabla de Bitácora (El contenedor central de cada día)
CREATE TABLE IF NOT EXISTS bitacora (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT UNIQUE NOT NULL, -- Formato 'YYYY-MM-DD'
    descripcion TEXT,
    ci_usuario TEXT,
    FOREIGN KEY (ci_usuario) REFERENCES usuario(ci) ON DELETE CASCADE
);

-- 3. Tabla de Billetera (Cuentas financieras)
CREATE TABLE IF NOT EXISTS billetera (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    entidad TEXT NOT NULL,
    monto REAL DEFAULT 0,
    divisa TEXT DEFAULT 'BOB',
    objetivo TEXT,
    objetivo_monto REAL,
    ci_usuario TEXT,
    FOREIGN KEY (ci_usuario) REFERENCES usuario(ci) ON DELETE CASCADE
);

-- 4. Movimientos Financieros (Ingresos / Gastos / Transferencias)
CREATE TABLE IF NOT EXISTS movimientos_finan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    billetera_id INTEGER NOT NULL,
    billetera_destino_id INTEGER,
    pago_id INTEGER,
    tipo TEXT NOT NULL DEFAULT 'ingreso',
    titulo TEXT NOT NULL,
    descripcion TEXT,
    monto REAL NOT NULL,
    fecha_hora TEXT NOT NULL,
    FOREIGN KEY (billetera_id) REFERENCES billetera(id) ON DELETE CASCADE,
    FOREIGN KEY (billetera_destino_id) REFERENCES billetera(id) ON DELETE SET NULL,
    FOREIGN KEY (pago_id) REFERENCES pago(id) ON DELETE SET NULL
);

-- 4b. Pagos (compromisos de una cuenta: únicos o mensuales)
CREATE TABLE IF NOT EXISTS pago (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    billetera_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    monto REAL NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'individual', -- 'individual' | 'mensual'
    FOREIGN KEY (billetera_id) REFERENCES billetera(id) ON DELETE CASCADE
);

-- 5. Proyectos (Trabajo a largo plazo)
CREATE TABLE IF NOT EXISTS proyecto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    fecha_inicio TEXT,
    fecha_fin TEXT,
    descripcion TEXT,
    completado INTEGER DEFAULT 0 -- 0 para falso, 1 para verdadero en SQLite
);

-- 6. Actividades de Trabajo (Vinculadas a bitácora y opcionalmente a un proyecto)
CREATE TABLE IF NOT EXISTS actividad_trabajo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bitacora_id INTEGER NOT NULL,
    proyecto_id INTEGER,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    completado INTEGER DEFAULT 0,
    entidad TEXT,
    FOREIGN KEY (bitacora_id) REFERENCES bitacora(id) ON DELETE CASCADE,
    FOREIGN KEY (proyecto_id) REFERENCES proyecto(id) ON DELETE SET NULL
);

-- 7. Actividades de Ocio
CREATE TABLE IF NOT EXISTS activad_ocio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bitacora_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    FOREIGN KEY (bitacora_id) REFERENCES bitacora(id) ON DELETE CASCADE
);

-- 8. Actividades de Entrenamiento
CREATE TABLE IF NOT EXISTS act_entreno (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bitacora_id INTEGER NOT NULL,
    descripcion TEXT,
    cali_entre INTEGER, -- Calificación del entrenamiento (ej. 1 al 5)
    FOREIGN KEY (bitacora_id) REFERENCES bitacora(id) ON DELETE CASCADE
);

-- 9. Tipos / Orígenes de Actividad (trabajo, universidad, ocio, ... creables)
CREATE TABLE IF NOT EXISTS tipo_actividad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    emoji TEXT,
    orden INTEGER DEFAULT 0
);

-- 10. Actividades del día (vinculadas a un tipo y opcionalmente a un proyecto origen)
CREATE TABLE IF NOT EXISTS actividad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL, -- Formato 'YYYY-MM-DD'
    tipo_actividad_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    hora TEXT,
    completado INTEGER DEFAULT 0, -- 0 para falso, 1 para verdadero en SQLite
    proyecto_id INTEGER,
    FOREIGN KEY (tipo_actividad_id) REFERENCES tipo_actividad(id) ON DELETE CASCADE,
    FOREIGN KEY (proyecto_id) REFERENCES proyecto(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_actividad_fecha ON actividad(fecha);
`;