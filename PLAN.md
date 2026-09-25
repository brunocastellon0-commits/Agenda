# PLAN.md — agenda-app (v1)

Protocolo: leer `CONTEXT.md` + `AGENTS.md` antes de cada fase. Tras cada fase: `& "node_modules\.bin\tsc.cmd" --noEmit` (exit 0) + actualizar `CONTEXT.md` §10/§11. **Una fase = un chat.** Editar quirúrgicamente (grep + rangos de líneas), nunca reescribir archivos enteros. `npx` bloqueado → `& npx.cmd …`.

Orden: **bugs primero**, luego mejoras incrementales, luego los sistemas grandes: Alimentación (F4), Conductas a evitar (F5), Mi Estado (F6), Notificaciones (F7), Widgets (F8), cierre (F9).

---

## FASE 1 — Bugs de Actividades (prioridad)

### 1.1 Línea/píldora "AHORA" se sale del horario
- `src/components/TimeGrid.tsx:176-186`
- Causa raíz: `ahoraWrap` se posiciona con `top: ahoraTop` y sus hijos (`ahoraDot` :178, `ahoraPill` :180) suman **otro** `ahoraTop` → doble desplazamiento (~2× la posición real). El dot y el pill quedan fuera de la tarjeta.
- Fix: hijos relativos al wrap → `top: -4` (dot), `top: -9` (pill). La línea (`ahoraLine top:0`) ya es correcta.
- Verificar que `rangoAgenda` siempre incluye `ahoraMin` (`src/utils/scheduleLayout.ts:91-94` ✓) y que `ahoraVisible` (:91) no quede fuera de rango tras el fix.

### 1.2 Pills del bloque de actividad se desbordan
- `src/components/DayActivityBlock.tsx:128-169` (`metaRow` :244)
- `flexWrap:'wrap'` existe, pero el bloque es absolute con alto fijo y **no prioriza ni recorta**: 4 pills (En progreso / Atrasada / Crítica / área) solo caben en bloques anchos → se salen.
- Fix:
  - prioridad de render: estado (progreso/atrasada/crítica) > área > subtareas;
  - ocultar pills por ancho/alto insuficiente (mismos umbrales que `compact` y `altoParaMeta` :61);
  - garantizar que el contenido nunca exceda `height` (el bloque ya tiene `overflow:'hidden'` :179 — usarlo como red de seguridad, no como parche);
  - verificar `layoutColumnas` / `duracionVisual` si el rango pintado no coincide con la actividad (captura sugiere bloque de 12:00–16:00).
- Comprobar también `TaskCard.tsx:160-230` (mismos pills en sección Atrasadas) para consistencia.

### 1.3 Mejora del modal de actividad
- `src/components/AddActividadModal.tsx` (875 líneas)
- Diagnóstico UX en sitio: agrupar en "Esencial" (título, hora, área) / "Más opciones" (colapsado), errores inline sin `disabled` en Guardar (regla AGENTS.md), y **teclado correcto (Fase 2)**.
- No reescribir el modal; parches quirúrgicos.

### 1.4 Mejora de la gestión de subtareas
- `src/components/SubtaskListModal.tsx` (230 líneas) + `contarSubtareas` en `actividadRepo.ts:764`
- Revisar alta rápida (input fijo arriba, teclado gestionado), toggle, eliminar con confirmación mínima, contador sincronizado en `DayActivityBlock` / `TaskCard` / `AtrasadasSection`.

### Salida Fase 1
Captura en Expo Go: dot AHORA dentro del rango, pills dentro del bloque, modal y subtareas OK. Typecheck 0.

---

## FASE 2 — Teclado: jamás tapar el input

- Hallazgo: **no hay helper común**. Solo `AddMovimientoModal.tsx:84` y `TransferModal.tsx:77` usan `KeyboardAvoidingView`; los otros 9 formularios no.
- Crear `src/components/KeyboardSheet.tsx` (wrapper reutilizable):
  - `KeyboardAvoidingView` (`behavior='padding'` iOS / `undefined` Android con `adjustResize`),
  - `ScrollView` con `keyboardShouldPersistTaps="handled"` + `paddingBottom` con `useSafeAreaInsets().bottom`,
  - `onScrollBeginDrag={Keyboard.dismiss}` opcional.
- Verificar `app.json` → `android.softwareKeyboardLayoutMode` / `windowSoftInputMode: adjustResize` (Expo SDK 57).
- Aplicar a: `AddActividadModal`, `AddMealSheet` (:111-192, hoy sin persistTaps), `AddBilleteraModal` (:98), `EditProfile` (:125), `NuevoTipoActividadModal` (:73), `SubtaskListModal` (:61), `AddPagoModal` (:61), `PayPagoModal` (:65), `SessionTimerModal` (:111), `AddMovimientoModal`, `TransferModal`.
- Objetivo: el input activo siempre visible y centrado; el bottom-sheet se eleva con el teclado.
- **No instalar librería nueva** (`react-native-keyboard-aware-scroll-view`) salvo que el wrapper no baste — probar primero con lo existente.

### Salida Fase 2
Checklist manual de los 11 formularios tildado en dispositivo.

---

## FASE 3 — Notificaciones 15 minutos antes

- `src/services/notificaciones.ts:45` `scheduleActividadNotification(actividadId, titulo, fechaHoraIso)` → `trigger.date = fechaHora − ANTICIPACION_MIN`.
- Constante `export const ANTICIPACION_MIN = 15` en `notificaciones.ts` (futuro: configurable en Perfil sin tocar el resto).
- Puntos que deben re-agendar (calcular ISO con −15 antes de llamar):
  - crear: `actividadRepo.ts:394`
  - reprogramar instancia: `:594` (y `reprogramarLote` :473, `deshacerReprogramarLote` :506)
  - cancelación: ya existe `cancelActividadNotification` (:263, :273, :295, :433) — identificador `act_${id}` se reutiliza, no duplica.
- Guard: si `fecha − 15min` ya pasó → agendar a la hora exacta si aún está en el futuro; si no, descartar (mismo comportamiento actual de :48).
- No tocar `scheduleRecordatorioComida` (14:00 fijo, `Comida.tsx:59`).

### Salida Fase 3
Notificación llega 15 min antes en build real (canal Android HIGH ya configurado en :17).

---

## FASE 4 — Sistema de alimentación / nutrición completo

### 4.0 Estado actual (inspección hecha)
- Tablas (`src/database/schema.ts:199-227`): `comida_alimento(id, nombre, categoria, tags)` · `comida_registro(fecha, hora, tipo, nota)` · `comida_registro_item(registro_id, alimento_id)`.
- **Sin cantidades, sin kcal, sin macros, sin recetas, sin favoritos.**
- `src/repositories/comidaRepo.ts` (263 líneas): `asegurarAlimentosIniciales` (:45, 21 seeds), `buscarAlimentos` (:58), `crearAlimento` (:80, sin UI), `getRegistrosDia` (:89), `registrarComida` (:124), `eliminarRegistroComida` (:144), `analizarRango` (:162, score cualitativo 0-10).
- UI: `Comida.tsx` (día navegable + análisis 7 días), `AddMealSheet.tsx` (búsqueda + chips), `MealTimeline.tsx`, `FoodQualityCard.tsx`, `FoodSummaryCard.tsx` (Home).
- Notificación de comida: `notificaciones.ts:88`.

### 4.1 Modelo de datos (schema.ts + `ensureColumn` en db.ts)
```
comida_alimento      + kcal_100 REAL, prot_100 REAL, carb_100 REAL, grasa_100 REAL,
                      fibra_100 REAL NULL, unidad_base TEXT ('g'|'ml'),
                      origen TEXT ('sistema'|'usuario'), activo INTEGER DEFAULT 1,
                      es_receta INTEGER DEFAULT 0, descripcion TEXT NULL
comida_receta_item   NUEVA: id, receta_id FK, alimento_id FK, cantidad REAL, unidad TEXT
comida_registro_item + cantidad REAL, unidad TEXT,
                      kcal_est REAL, prot_est REAL, carb_est REAL, grasa_est REAL  (snapshot al guardar)
comida_receta        (opcional: se modela como alimento con es_receta=1 + comida_receta_item)
unidad/porción       ENUM en TS: g, ml, unidad, taza, cucharada, cucharadita, rebanada, vaso, pieza, porcion
```
- Snapshot nutricional en `comida_registro_item`: el histórico **nunca cambia** aunque luego edites el alimento.
- Recetas: kcal **se calculan** de ingredientes; si se cachea en `comida_alimento.kcal_100`, invalidar/recalcular al modificar `comida_receta_item`.

### 4.2 Motor de cálculo (nuevo `src/utils/nutricion.ts`)
- Base: `kcal = cantidad × kcal_100 / 100` (igual para macros).
- Unidades no métricas → factor de conversión a gramos/ml por alimento (ej. 1 taza arroz cocido ≈ 160 g, 1 huevo ≈ 50 g, 1 cucharada aceite ≈ 10 g). Tabla `CONVERSIONES` + override por alimento cuando aplique.
- Receta = Σ ingredientes; porción = total ÷ `porciones`.
- Tamaños pequeña/normal/grande = ×0.75 / ×1 / ×1.3 sobre porción estándar (derivado, consistente).
- **Display siempre estimado**: `~630 kcal`, `Estimación: 630 kcal`. Nunca decimales, nunca "exactamente".
- Macros: proteínas, carbohidratos, grasas (+ fibra si la columna existe). Separar SIEMPRE objetivo vs consumido.

### 4.3 Seeds — base inicial amplia (`comidaRepo.ts` o `src/database/seeds/alimentos.ts`)
- **120+ alimentostrazados por 100 g**, ~10 categorías: proteínas (20), carbohidratos (16), frutas (15), verduras (16), grasas (8), lácteos (7), bebidas (9), snacks/otros (10+) — listas del usuario como mínimo, ampliar razonablemente.
- **40+ platos preparados**: bolivianos (salteña, tucumana, silpancho, pique macho, lomo montado, plato paceño, chairo, sopa de maní, fricasé, chicharrón, sajta, api con pastel, anticucho, charque, falso conejo, milanesa, pollo broaster, arroz con pollo…) + internacionales (hamburguesa, pizza, hot dog, tacos, burrito, shawarma, pasta, ensalada de pollo, sándwich).
- Platos preparados: **estimados con porción estándar** (receta de ingredientes cuando sea realista; si no, valor estimado documentado en el seed).
- Sembrar solo si `COUNT(*)=0` (mecanismo actual `asegurarAlimentosIniciales`); migrar los 21 alimentosexistentes (no duplicar: match por nombre).
- Datos razonables y consistentes (valores reales de tablas nutricionales conocidas), comentados como estimados.

### 4.4 Nuevos repositorios (extender `comidaRepo.ts` o `nutricionRepo.ts`)
- Alimentos: `buscarAlimentos(query, categoria?)`, `crearAlimento`, `getAlimentoById`, `updateAlimento`.
- Recetas: `crearReceta`, `getRecetas`, `addIngrediente`, `calcularNutricionReceta`.
- Registros: `registrarComida` v2 (items con cantidad+unidad+kcal/macros snapshot), `getRegistrosDia`, `eliminarRegistroComida`, `actualizarRegistro`.
- Resumen: `getResumenDia(fecha)` → kcal consumidas + macros + desglose por tipo (desayuno/almuerzo/merienda/cena/snack).
- Objetivos: tabla `usuario_objetivo_nutricion` (kcal/prot/carb/grasa diarios, configurables, nullable). **No inventar valores médicos.**

### 4.5 UI (respetar design system, sheets existentes)
- `AddMealSheet` v2: momento del día → buscar (alimento O receta) → cantidad/unidad → preview `~kcal + macros` en vivo → guardar.
- `FoodSummaryCard` / pantalla Comida: resumen diario (consumido vs objetivo, macros, desayuno/almuerzo/…), con `~`.
- Búsqueda + filtros por categoría (chips, patrón existente).
- Comidas personalizadas: guardar combinación actual como receta ("Mi desayuno") → reutilizable.
- Conservar `FoodQualityCard` (score cualitativo) — no romper.

### 4.6 Integración
- Comida sigue siendo tab del mismo sistema: sin app separada, sin dependencias nuevas (cálculo propio, sin librerías de nutrición).
- Datos sensibles: nada de diagnósticos; solo números estimados.

### Salida Fase 4
Checklist de validación del usuario (§23): crear alimento, registrar porción, crear receta, cambiar cantidades → cambian kcal/macros, registrar desayuno/almuerzo/cena → total diario, buscar, categorías, persistencia tras reiniciar, y typecheck.

---

## FASE 5 — Conductas a evitar (autocontrol) + rachas

### 5.1 Estado actual (inspección hecha)
- Hábitos: `seguimiento_habito` (`schema.ts:191-197`) = seguimiento de una `regla_recurrencia`. No hay eventos ni rachas persistidas.
- Rachas: **calculadas al vuelo** en `habitosRepo.ts:148-266` (`rachaActual`/`mejorRacha`, diaria :160-204 o semanal :206-265 → `HabitoProgreso`) y globalmente en `metricasRepo.ts:228` (`getConsistencia`).
- UI: `Metricas.tsx` (+`HabitCard`), `QuickMetricsCard` (Home), `ConsistencyCard` (huérfano, reutilizar).
- Fuentes por fecha reutilizables: `bitacora.fecha` UNIQUE, `actividad.fecha`, `comida_registro.fecha`.

### 5.2 Modelo de datos (schema.ts + ensureColumn)
```
conducta_evitar      NUEVA: id, nombre, descripcion?, categoria TEXT, 
                      modalidad TEXT ('evitacion_total'|'limite'),
                      frecuencia TEXT ('diario'|'semanal'|'mensual'),
                      objetivo REAL (0 para evitación total; ej. 2/semana, 90 min/día),
                      unidad TEXT ('ocurrencias'|'comidas'|'minutos'),
                      activa INTEGER, fecha_creacion TEXT, recordatorio INTEGER DEFAULT 0,
                      origen TEXT ('propia'|'ejemplo')
conducta_evento      NUEVA: id, conducta_id FK, fecha TEXT, hora TEXT NULL,
                      cantidad REAL DEFAULT 1, unidad TEXT NULL, nota TEXT NULL
```
- **No copiar nombres literales del usuario si hay convención mejor**; seguir estilo del proyecto (`snake_case` tablas, interfaces en TS).
- Reusar motor de rachas: extraer lógica común de `habitosRepo.ts` a helper `src/utils/rachas.ts` (o `rachaRepo`) que soporte `PositiveStreak` y `AvoidanceStreak` sobre un conjunto de fechas/ocurrencias. No duplicar.

### 5.3 Reglas de racha de evitación
- Evitación total: días consecutivos **sin** evento hasta hoy. Una ocurrencia → racha se reinicia a 0.
- Límite (semanal/diario): la ocurrencia **no** rompe racha; se evalúa `≤ objetivo` por período → "Dentro del límite" / "Superaste el límite" (sin lenguaje de castigo).
- Tras ocurrencia: mostrar "Racha anterior: 12 días · Registrado hoy · Nueva racha: 0 · Mejor racha: 12" (mejor racha **nunca** se borra).
- Guardar historial de rachas: tabla `conducta_racha` (conducta_id, inicio, fin, dias, motivo_fin NULL) al romper; consultar mejor/histórico.

### 5.4 Métricas (integrar en `metricasRepo`/`conductaRepo`)
- Por conducta: racha actual, mejor racha, última ocurrencia, días desde última, ocurrencias (mes/semana), días evitados (X/Y), cumplimiento %, tendencia vs período anterior (↓40%).
- Semana/mes: ocurrencias actual vs anterior, gráfico simple si ya hay infraestructura (no instalar librería de charts).
- Visión general en dashboard: "Hábitos completados 5/6 · Conductas evitadas 3/4 · Límites respetados 2/3" — **sin puntuación moral global**.

### 5.5 UI (mismo lenguaje visual)
- Nueva tarjeta `AvoidanceCard` (clonar estilo de `HabitCard`): nombre, racha de evitación, mejor, última ocurrencia, progreso de límite (1/2 esta semana).
- Dashboard compacto: sección "Autocontrol" bajo "Hábitos" (Home + Métricas). No pantalla gigante.
- Registro rápido: 1 toque = día cumplido / sheet mínimo para ocurrencia (cantidad + unidad + nota opcional).
- Calendario/historial: ✓ día sin ocurrencia, ● ocurrencia, — sin seguimiento + **etiqueta textual** (no solo color) → reusar `MonthlyCalendar` o extender con marcadores.
- Lenguaje: prohibido "mal hábito / fallaste / fracaso / racha perdida". Categorías: Salud, Alimentación, Consumo, Tecnología, Productividad, Finanzas, Sueño, Personal + personalizada.
- **Privacidad**: notificaciones y textos compartidos solo dicen "Tienes un registro pendiente" / "Revisa tu progreso de hoy" (opt-out).

### 5.6 Integración con alimentación
- Conducta "Comida rápida" puede registrar eventos referenciando platos del Fase 4 (hamburguesa, pizza, broaster). Conteo de ocurrencias → métrica de reducción. Sin recomendaciones médicas.

### 5.7 Datos de prueba
- Sembrar 3 hábitos positivos (Entrenar, Leer, Tomar agua — ya existentes) + 3 conductas ejemplo (No fumar, Comida rápida, Redes sociales) marcadas `origen='ejemplo'` para poder eliminarlas sin tocar datos reales.

### 5.8 Migración y pruebas
- Nada existente se rompe (tablas nuevas, no se modifica `seguimiento_habito` salvo si hace falta FK).
- Checklist de 17 pruebas del usuario (crear evitación, crear reducción, racha, ocurrencia, mejor racha, historial, semanal/mensual, límites, edición, persistencia, métricas existentes, integración comida, notificaciones).

### Salida Fase 5
Resumen técnico de 14 puntos del usuario + typecheck 0 + persistencia verificada.

---

## FASE 6 — Mi Estado: identidad + evolución física

Concepto: **MI ESTADO** (quién soy / cómo estoy) + **MI EVOLUCIÓN** (cómo cambié). No es "mi perfil". Centro de seguimiento personal, datos y tendencias, **sin diagnósticos ni juicios**.

### 6.1 Inspección previa (hecha)
- `schema.ts:1-11` → `usuario(ci PK, nombre, apellido, peso, altura, cintura, cuello, edad, avatarUrl)` mezcla identidad + físico.
- `usuario.ts:15` `saveOrUpdateUsuario` = `INSERT OR REPLACE` completo (sobrescribe todo).
- `Home.tsx:31-34` crea DEFAULT_USUARIO con peso/altura/cintura/cuello/edad = **0** → viola "nunca 0 como dato inexistente"; `Home.tsx:79` lo persiste si no hay usuario.
- `EditProfile.tsx:22-29` ya valida rangos técnicos (altura 30-250, cintura 20-300, cuello 10-100, edad 1-120) con `validarNumero`.
- Relación `bitacora.ci_usuario → usuario.ci` debe conservarse. NO hay `expo-linking`.
- Gráficos: **`react-native-svg@15.15.4` ya instalado** (usado en `goalProgressCard.tsx`, `WeeklyOverviewCard.tsx`) → gráficos a mano, sin librería nueva.

### 6.2 Modelo de datos
```
registro_fisico   NUEVA: id, ci_usuario FK→usuario.ci, fecha_medicion TEXT, fecha_registro TEXT,
                  peso REAL NULL, altura REAL NULL, cintura REAL NULL, cuello REAL NULL, notas TEXT NULL, activo
                  + INDEX (ci_usuario, fecha_medicion)
usuario           conserva: ci, nombre, apellido, avatarUrl  + NUEVO fecha_nacimiento TEXT NULL
usuario           columnas físicas (peso/altura/cintura/cuello/edad): SE CONSERVAN temporalmente (compatibilidad);
                  retirar solo cuando nada las lea (documentar en CONTEXT.md)
objetivo_fisico   NUEVA (opcional en esta fase): ci_usuario, peso_objetivo, cintura_objetivo, otros NULL
registro_fisico_foto  FUTURO (no crear): estructura no debe impedirlo
campos futuros (pecho, brazo, cadera, muslo, grasa, masa muscular, FC reposo) → columnas NULL agregables por ensureColumn
```
- **Identidad ≠ evolución**: usuario = estable; `registro_fisico` = histórico **inmutable** (nunca sobrescribir; cada medición = fila nueva).
- `edad` → preferir `fecha_nacimiento` en `usuario` y calcular edad viva; si no hay fecha, fallback a columna `edad` documentada (migración segura, sin romper `EditProfile` ya existente).
- `fecha_medicion` (cuándo se midió) ≠ `fecha_registro` (cuándo se cargó). NO crear un segundo usuario por medición.

### 6.3 Migración (obligatorio, sin perder datos) — `db.ts` + `schema.ts`
1. Crear tabla `registro_fisico` (IF NOT EXISTS).
2. Si `usuario` tiene algún físico ≠ 0/NULL → insertar **1 registro_fisico** con esos valores y `fecha_medicion` = hoy (UN solo seed por usuario, guard con FLAG/migración ya ejecutada).
3. Conservar datos personales; `bitacora` y demás FK intactas.
4. Verificar referencias (`getUsuarios` en `Billetera.tsx:83`, `Home.tsx:68`).
5. Retirar columnas físicas de `usuario` **solo** tras confirmar que nada las lee (etapa posterior, documentada).

### 6.4 Repositorio nuevo `src/repositories/estadoFisicoRepo.ts` (patrón existente)
- `getUltimoRegistro(ci)` · `getHistorial(ci, limite?)` · `registrarMedicion(datos)` (INSERT, jamás UPDATE de histórico).
- `getComparativa(ci, desde?, hasta?)` → actual vs anterior, actual vs primer registro, cambio en últimos 30/90 días.
- `calcularIMC(peso, altura)` → **calculado al vuelo, NO persistido**; display 1 decimal; "No disponible" si faltan datos; **jamás diagnóstico**.
- `getEdadDesde(fechaNacimiento)`.
- Validaciones técnicas con `parseNumero`/`validarNumero`/`validarEntero` (negativos/imposibles = error de digitación, NO rangos médicos rígidos).
- NULL ≠ 0: mostrar "No registrado".

### 6.5 Pantalla nueva `src/screens/Estado.tsx` (pantalla de **stack**, NO nueva tab)
- Acceso: `ProfileBanner` (`Home.tsx`) → `navigation.navigate('Estado')` con `animParaTab`-compatible (regla: tabs solo por `navigateToTab`; esta es push de stack).
- Secciones:
  - **MI ESTADO ACTUAL**: último registro (peso/altura/cintura/cuello/edad o "No registrado") + fecha de medición. No inventar valores.
  - **COMPARACIÓN**: ahora vs registro anterior vs período (30 días) — solo números (`75 kg · -1 kg`), sin "mejorado/empeorado".
  - **EVOLUCIÓN**: gráficos línea con `react-native-svg` (peso, cintura, cuello si ≥2 puntos). **1 registro → valor actual + "historial insuficiente"** (nunca gráfico vacío).
  - **HISTORIAL**: lista cronológica (tap → detalle completo del registro).
  - **OBJETIVOS**: peso/cintura objetivo personales, separados del estado actual (`75 kg · objetivo 72 · diferencia 3`).
  - **+ NUEVA MEDICIÓN**: bottom-sheet (peso, altura, cintura, cuello, fecha=hoy) con **referencia del valor anterior** ("Peso anterior: 76 kg").
- **Registro inicial**: flujo de 1ª vez si no hay usuario → nombre, apellido, CI, avatar opcional + físicos opcionales (no obligar todos). Reemplaza el DEFAULT de ceros (`Home.tsx:31-34,79`).
- Relación con `act_entreno` / `comida_registro` / hábitos: **datos yuxtapuestos en el período** ("15 entrenamientos · peso -3 kg"), jamás causalidad.

### 6.6 Home — sección compacta "MI ESTADO"
- `75 kg ↓1 desde última medición` · `85 cm cintura ↓2` → tap abre `Estado.tsx`. Resumen, no pantalla gigante. Sin puntuación corporal.

### 6.7 Avatar
- `avatarUrl` se queda en identidad (`usuario`); conservar flujo existente de `EditProfile` para avatar/nombre.

### Salida Fase 6
Los 18 casos de prueb del usuario (crear usuario → 2 mediciones → evolución → comparación → IMC → objetivo → persistencia → bitácora OK) + typecheck 0.

---

## FASE 7 — Sistema de notificaciones centralizado y contextual

Objetivo: notificaciones con personalidad (humana, breve, elegante, directa, no invasiva, no infantil, no moralizante) conectadas a métricas reales. Insp. conceptual Duolingo permitido; **nunca** copy tipo "¡¡VAMOS!! 🔥" ni "NO ROMPAS TU RACHA!!!".

### 7.1 Inspección previa (hecha)
- `src/services/notificaciones.ts`: handler :7, `requestPermissionsAsync` :17 (canal Android HIGH), `scheduleActividadNotification` :45 (id `act_${id}`, cancela previa :53), `scheduleRecordatorioComida` :88 (14:00 fijo).
- Llamadas repartidas: `actividadRepo.ts:394,263,273,295,433`, `Comida.tsx:59`. Permiso se pide en `Home.tsx:130` **sin contexto**.
- Sin deep links (no hay `expo-linking` ni config `linking`). `expo-notifications ~57.0.21`.

### 7.2 Servicio central (ampliar `notificaciones.ts`, no duplicar)
API conceptual (nombres ajustables): `requestPermissionsConContexto()`, `getPermissionStatus()`, `scheduleActivityReminder()` (**−15 min**, constante `ANTICIPACION_MIN=15`), `syncHabitReminder()` / `cancelHabitReminder()`, `scheduleAvoidanceReminder()`, `scheduleMealReminder()`, `schedulePhysicalReminder()`, `scheduleDailySummary()`, `syncAll()`.
- **IDs deterministas** (`act_${id}`, `hab_${id}`, `dia_${fecha}`, `evit_${id}`) → cancelar-previa antes de agendar = **cero duplicados**; re-sincronizar al: crear/editar/completar actividad, completar hábito, registrar comida/medición, cambio de día, al abrir la app.
- La lógica vive en el servicio/repos, **no** en pantallas.

### 7.3 Lógica contextual (SI/NO)
- SI hábito pendiente Y no completado Y recordatorio activo Y dentro de horario → agendar. SI completado → **cancelar** su recordatorio.
- SI comida ya registrada → no notificar almuerzo. SI día sin pendientes → silencio. SI racha en 0 y sin hábitos → **no** enviar nada (estado vacío = nada).
- Agrupar: 1 notificación por franja (mañana/tarde/noche) en vez de N sueltas.

### 7.4 Tono y variedad
- 3-5 variantes de copy por tipo (hábito, racha, comida, agenda), sin perder claridad. Momentos del día: mañana (prioridades), mediodía (próximas), tarde (restantes), noche (cerrar el día) — **solo si el usuario los activa**.
- Resumen nocturno opcional: "Tu día · Hábitos 5/6 · Actividades 7/8 · Racha 12 · Alimentación registrada".

### 7.5 Privacidad (obligatorio)
- Pantalla bloqueada **genérica** para: conductas a evitar, peso/medidas, finanzas → "Tu seguimiento personal de hoy está pendiente" / "¿Quieres registrar tu día?". Detalle sensible solo dentro de la app.
- Nunca: "¿Fumaste marihuana?", "Peso: 75 kg", "Has gastado Bs 300" en lock screen.

### 7.6 Configuración — tabla `notif_config(clave TEXT PK, valor TEXT)` + sheet "Notificaciones"
- ON/OFF por categoría: Agenda, Hábitos, Rachas, Alimentación, Estado físico, Conductas a evitar, Resumen diario.
- Hora inicio / hora fin, días de la semana, **horario silencioso** (ej. 22:30→07:00, recordatorios normales cancelados en ese tramo).
- Recordatorios personalizables por hábito (hora + mensaje propio) con opción de mensaje automático.
- **Permisos con contexto**: explicación breve → activar → `requestPermissions`. Rechazo = app sigue normal. (Mover la petición de `Home.tsx:130` a este flujo.)

### 7.7 Deep links y acciones
- Instalar `expo-linking` (**aprobado como dependencia justificada**) + config `linking` en `AppNavigator`: `actividad/:id`, `habitos/:id`, `comida`, `estado`, `inicio`.
- Cada notificación lleva `data` con su ruta → al tocar abre la sección correcta (nunca siempre Inicio).
- Acciones rápidas en notificación ([Completar]/[Posponer]/[Registrar]) **solo si** `expo-notifications` de SDK 57 lo soporta estable → investigar primero; si no, documentar omisión.

### 7.8 Estado y badge
- Tracking centralizado: permiso concedido/denegado, recordatorio activo/cancelado, programada/enviada.
- Badge de pendientes (`setBadgeCount`) solo si soportado → actualizar al abrir/revisar app, opt-out, nunca acumularse.

### Salida Fase 7
Checklist: permisos, programación, cancelación, cero duplicados, deep links, contexto (hábito completado no notifica), resumen, privacidad lock screen, silencioso, badge, estado vacío, tono.

---

## FASE 8 — Widgets de pantalla de inicio (dev build / EAS)

Filosofía: **"Una pequeña ventana de mi agenda y mi progreso"** — estado actual sin abrir la app. Identidad: minimalista, elegante, limpia, calmada, premium; **no** copiar Duolingo ni gamificar.

### 8.1 Verificación obligatoria antes de código (FASE 8.0)
- Expo `~57.0.14`, RN 0.86, plugins actuales: `expo-sqlite`, `datetimepicker` (`app.json`). Existe `extra.eas.projectId` → EAS ya configurado.
- Determinar: soporte real de widgets en SDK 57 (`react-native-android-widget` u oficial Expo), qué requiere **development build / prebuild**, qué va en `app.json`, y que **NO funciona en Expo Go** → documentar claramente. **Aprobado: dev build/EAS.**
- Android primero; iOS documentado como pendiente (WidgetKit).

### 8.2 Widgets Android (tamaños s/m/l, datos REALES de SQLite → store nativo)
1. **MI DÍA** (principal): `3/5 hábitos · 🔥12 días · 2 tareas pendientes · ~1.840 kcal · Próximo: 14:00 Trabajar en proyecto`.
2. **RACHAS**: top-3 rachas activas (en tamaño pequeño: `🔥12 días · Entrenamiento`).
3. **MI ESTADO**: `75 kg ↓1 · 85 cm cintura ↓2 · Última medición: Hoy` (analizar privacidad en lock screen del SO).
4. **ACTIVIDADES**: "PRÓXIMO 14:00 Proyecto LILA" o barra de progreso del día.
5. **ALIMENTACIÓN** (opcional): `~1.840 / 2.200 kcal · Proteína 112 g` — oculto si no hay datos.

### 8.3 Reglas de contenido
- **Estado vacío**: widget → "MI AGENDA · Empieza registrando tu día" + acción abrir app. **Nunca** "0 hábitos / 0 kcal / 0 días".
- No inventar datos; no meter toda la app en el widget; adaptar contenido al tamaño.
- Paleta y áreas de `theme.ts` (finanzas, objetivos, trabajo, ocio, alimentación, estado físico) — misma identidad visual.

### 8.4 Actualización
- Refresco al mutar datos (actividad, hábito, racha, comida, medición) + actualización periódica nativa cuando el SO la permita.
- **Sin polling propio en background** ni procesos que consuman batería. Medir mecanismos soportados por el SDK 57 antes de implementar.

### 8.5 Interacción y configuración
- Tap → deep link (FASE 7.7) a la sección correspondiente (hábitos→hábitos, comida→comida, estado→evolución, actividad→actividad).
- Configuración del widget (qué sección/hábito/mostrar) **solo si la plataforma lo permite**; si no, documentar.

### 8.6 Ecosistema métricas → widget → notificación
- Racha 12 → widget `🔥12` → notif "Llevas 12 días manteniendo esta racha", **sin** notificar por cada pequeño cambio (umbral razonable).

### 8.7 Icono / splash / badge
- Revisar `app.json`: `icon.jpg`, adaptiveIcon, splash existentes → verificar requisitos de tamaño/формato SDK 57; **no cambiar la identidad** si ya está definida. Coherencia icono ↔ splash ↔ paleta.

### 8.8 Privacidad
- Widgets: evitar datos sensibles explícitos en pantalla bloqueada si el SO lo expone; preferir agregados ("5/6 hábitos") sobre detalles (peso exacto, conductas a evitar).

### Salida Fase 8
Respuestas a los 12 puntos del usuario: soporte real de widgets en Expo 57, archivos modificados, componentes nuevos, mecanismo de actualización, funcionamiento del sistema de notificaciones, anti-duplicados, deep links, permisos, privacidad lock screen, qué requiere dev build/EAS, prueba en Android, pendiente iOS.

---

## FASE 9 — Cierre y documentación
- Actualizar `CONTEXT.md` §10 (hecho) / §11 (pendiente) y §2/§4 con tablas y repos nuevos.
- Verificación final: typecheck, revisión design system (sin bordes negros, sin neón, `pressedFeedback` en todo Pressable), sin librerías nuevas no aprobadas.

---

## Reglas transversales (todas las fases)
1. Inspeccionar antes de modificar (grep + rangos de líneas, máx ~5 archivos leídos).
2. No romper funcionalidades existentes; migrar/adaptar datos, nunca borrarlos.
3. Queries parametrizadas; `parseNumero`/`validar*` de `validacion.ts`; enums por whitelist.
4. Todo token de color desde `theme.ts`; modales bottom-sheet con el patrón de AGENTS.md.
5. Nutrición = estimaciones (`~`), sin afirmaciones de precisión médica.
6. Sin dependencias nuevas salvo justificación explícita + aprobación.
7. Salida de comandos acotada (`| head -40`, `| tail -30`).
