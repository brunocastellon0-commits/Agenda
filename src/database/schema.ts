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
    eliminada INTEGER DEFAULT 0,  -- soft-delete: 1 = eliminada (evita regeneración recurrente)
    proyecto_id INTEGER,
    FOREIGN KEY (tipo_actividad_id) REFERENCES tipo_actividad(id) ON DELETE CASCADE,
    FOREIGN KEY (proyecto_id) REFERENCES proyecto(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_actividad_fecha ON actividad(fecha);

-- 11. Reglas de Recurrencia (patrones de repetición para generar instancias)
CREATE TABLE IF NOT EXISTS regla_recurrencia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    tipo_actividad_id INTEGER NOT NULL,
    proyecto_id INTEGER,
    patron TEXT NOT NULL, -- 'diario' | 'dias_semana' | 'semanal' | 'mensual'
    dias_semana TEXT,     -- ej. '1,3,5' (lunes=1 ... domingo=7) — legacy
    activa INTEGER DEFAULT 1,            -- 0 = terminó / desactivada (no genera más instancias)
    dia_inicio INTEGER,                 -- rango de días (lunes=1 ... domingo=7)
    dia_fin INTEGER,
    fecha_inicio TEXT,                  -- fecha base del período (YYYY-MM-DD)
    repeticion_numero INTEGER,          -- cantidad del período (ej. 4)
    repeticion_unidad TEXT,             -- 'dias' | 'semanas' | 'meses' | 'indefinido'
    hora TEXT,
    duracion_estimada_min INTEGER,
    prioridad TEXT DEFAULT 'normal',
    FOREIGN KEY (tipo_actividad_id) REFERENCES tipo_actividad(id) ON DELETE CASCADE,
    FOREIGN KEY (proyecto_id) REFERENCES proyecto(id) ON DELETE SET NULL
);

-- 12. Sesiones de Actividad (fuente de verdad del tiempo ejecutado)
CREATE TABLE IF NOT EXISTS actividad_sesion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actividad_id INTEGER NOT NULL,
    fecha_hora_inicio TEXT NOT NULL,
    fecha_hora_fin TEXT,
    duracion_efectiva_min INTEGER,
    duracion_pausa_min INTEGER DEFAULT 0,
    notas TEXT,
    FOREIGN KEY (actividad_id) REFERENCES actividad(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sesion_actividad ON actividad_sesion(actividad_id);

-- 13. Subtareas de Actividad (checklist interna)
CREATE TABLE IF NOT EXISTS actividad_subtarea (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actividad_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    completado INTEGER DEFAULT 0,
    orden INTEGER DEFAULT 0,
    FOREIGN KEY (actividad_id) REFERENCES actividad(id) ON DELETE CASCADE
);

-- 14. Historial de Estados (auditoría de transiciones reales)
CREATE TABLE IF NOT EXISTS actividad_historial_estado (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actividad_id INTEGER NOT NULL,
    estado_planificacion_anterior TEXT,
    estado_planificacion_nuevo TEXT,
    estado_ejecucion_anterior TEXT,
    estado_ejecucion_nuevo TEXT,
    fecha_hora_cambio TEXT NOT NULL,
    motivo TEXT,
    FOREIGN KEY (actividad_id) REFERENCES actividad(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_historial_actividad ON actividad_historial_estado(actividad_id);

-- 15. Seguimiento de Hábitos (Actividades recurrentes que el usuario decide controlar)
CREATE TABLE IF NOT EXISTS seguimiento_habito (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    regla_recurrencia_id INTEGER NOT NULL UNIQUE,
    fecha_creacion TEXT NOT NULL,
    activo INTEGER DEFAULT 1,
    FOREIGN KEY (regla_recurrencia_id) REFERENCES regla_recurrencia(id) ON DELETE CASCADE
);

-- 16. Biblioteca de Alimentos
CREATE TABLE IF NOT EXISTS comida_alimento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    tags TEXT,
    kcal_100 REAL,
    prot_100 REAL,
    carb_100 REAL,
    grasa_100 REAL,
    fibra_100 REAL,
    unidad_base TEXT,
    origen TEXT,
    activo INTEGER DEFAULT 1,
    es_receta INTEGER DEFAULT 0,
    descripcion TEXT
);

-- 16b. Ingredientes de Recetas
CREATE TABLE IF NOT EXISTS comida_receta_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receta_id INTEGER NOT NULL,
    alimento_id INTEGER NOT NULL,
    cantidad REAL NOT NULL,
    unidad TEXT NOT NULL,
    FOREIGN KEY (receta_id) REFERENCES comida_alimento(id) ON DELETE CASCADE,
    FOREIGN KEY (alimento_id) REFERENCES comida_alimento(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_comida_receta_item ON comida_receta_item(receta_id);

-- 17. Registro de Comidas
CREATE TABLE IF NOT EXISTS comida_registro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    tipo TEXT NOT NULL,
    nota TEXT
);

CREATE INDEX IF NOT EXISTS idx_comida_fecha ON comida_registro(fecha);

-- 18. Items del Registro de Comidas
CREATE TABLE IF NOT EXISTS comida_registro_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registro_id INTEGER NOT NULL,
    alimento_id INTEGER NOT NULL,
    cantidad REAL,
    unidad TEXT,
    kcal_est REAL,
    prot_est REAL,
    carb_est REAL,
    grasa_est REAL,
    FOREIGN KEY (registro_id) REFERENCES comida_registro(id) ON DELETE CASCADE,
    FOREIGN KEY (alimento_id) REFERENCES comida_alimento(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comida_item_reg ON comida_registro_item(registro_id);

-- 19. Conductas a evitar (Autocontrol)
CREATE TABLE IF NOT EXISTS conducta_evitar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT NOT NULL,
    modalidad TEXT NOT NULL, -- 'evitacion_total' | 'limite'
    frecuencia TEXT NOT NULL, -- 'diario' | 'semanal' | 'mensual'
    objetivo REAL NOT NULL,
    unidad TEXT NOT NULL,
    activa INTEGER DEFAULT 1,
    fecha_creacion TEXT NOT NULL,
    recordatorio INTEGER DEFAULT 0,
    origen TEXT NOT NULL -- 'propia' | 'ejemplo'
);

-- 20. Eventos (ocurrencias) de las conductas
CREATE TABLE IF NOT EXISTS conducta_evento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conducta_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    hora TEXT,
    cantidad REAL DEFAULT 1,
    unidad TEXT,
    nota TEXT,
    FOREIGN KEY (conducta_id) REFERENCES conducta_evitar(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_conducta_evento_fecha ON conducta_evento(fecha);

-- 21. Historial de Rachas de Conductas (Guardadas al romperse)
CREATE TABLE IF NOT EXISTS conducta_racha (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conducta_id INTEGER NOT NULL,
    fecha_inicio TEXT NOT NULL,
    fecha_fin TEXT NOT NULL,
    dias INTEGER NOT NULL,
    motivo_fin TEXT,
    FOREIGN KEY (conducta_id) REFERENCES conducta_evitar(id) ON DELETE CASCADE
);

-- 22. Evolución Física (Mi Estado)
CREATE TABLE IF NOT EXISTS registro_fisico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ci_usuario TEXT NOT NULL,
    fecha_medicion TEXT NOT NULL,
    fecha_registro TEXT NOT NULL,
    peso REAL,
    altura REAL,
    cintura REAL,
    cuello REAL,
    notas TEXT,
    activo INTEGER DEFAULT 1,
    FOREIGN KEY (ci_usuario) REFERENCES usuario(ci) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_registro_fisico_ci_fecha ON registro_fisico(ci_usuario, fecha_medicion);

-- 23. Configuración de Notificaciones
CREATE TABLE IF NOT EXISTS notif_config (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
);
`;