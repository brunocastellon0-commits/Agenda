# CONTEXT.md — agenda-app (leer al INICIAR cada chat)

Protocolo de ahorro de tokens: **este archivo es tu contexto vivo**. Léelo una vez al arrancar. No leas archivos de `src/` salvo que vayas a **editarlos**. Las normas duras de estilo están en `AGENTS.md` (ya inyectado); tablas, APIs y estado viven aquí. Si cambia el estado, actualiza §11.

---

## 1. Qué es + stack

- **Agenda personal** (React Native + **Expo SDK 57** / RN 0.86 / React 19 / TypeScript ~6). SQLite **local** vía `expo-sqlite` (sin backend, sin auth).
- Tabs: **Billetera** (finanzas), **Inicio** (hub), **Actividades** (planificación del día), **Métricas**, **Perfil**.
- Deps clave: `@react-navigation/stack` (JS stack, NO native-stack para el root), `@react-native-community/datetimepicker`, `expo-linear-gradient`, `@expo/vector-icons` (MaterialIcons), `react-native-safe-area-context`.
- **Typecheck (obligatorio tras cambios)**: `& "node_modules\.bin\tsc.cmd" --noEmit` (exit 0). `npx` está bloqueado en PowerShell → usar `& npx.cmd expo install ...`.
- Expo v57: antes de APIs nuevas, leer https://docs.expo.dev/versions/v57.0.0/

## 2. Mapa del árbol (1 línea por archivo → no explorar)

```
App.tsx                      → SafeAreaProvider + AppNavigator
src/navigation/AppNavigator.tsx → root Stack JS: Billetera | Home | Actividades (tabs se resuelven en tabs.ts)
src/navigation/tabs.ts       → TAB_ORDER [billetera,inicio,actividades,metricas,perfil]; navigateToTab(nav, actual, destino) ÚNICA forma de cambiar de tab; TAB_TO_SCREEN mapea billetera→Billetera, actividades→Actividades
src/navigation/transition.ts → SER_ESPEC_TRANSICION 520ms Easing.inOut(cubic) + interpoladorTab(params.anim slide_from_left/right); push y pop animan igual
src/navigation/types.ts      → RootStackParamList, TabAnimParams { anim?: 'slide_from_left'|'slide_from_right'; paraTab?: TabKey }
src/theme/theme.ts           → PALETTE / RADIUS / SHADOW / pressedFeedback / tint() — ÚNICA fuente de colores
src/database/schema.ts       → CREATE_TABLES_SQL completo (usuario, billetera, movimientos_finan, pago, proyecto, tipo_actividad, actividad, regla_recurrencia, actividad_sesion, actividad_subtarea, actividad_historial_estado)
src/database/db.ts           → getDatabase() singleton + ensureColumn() migrations (columnas nuevas de actividad/regla aquí)
src/repositories/*.ts        → ver §4 (capa de datos, TODO pasa por aquí)
src/utils/validacion.ts      → parseNumero, validarTexto, validarMonto[Opcional], validarNumero, validarEntero
src/utils/divisas.ts         → signoDivisa, formatMonto, DIVISA_SIGNOS (no duplicar mapas de divisa)
src/utils/calendario.ts      → padCero, toFechaISO, parseFechaISO, formatoFechaHeader, generarMatrizMes, calcularOpcionesPosponer, DIAS_SEMANA_HEADERS
src/utils/semana.ts          → DayItem, fechaSemana, etiquetaFecha, saludoPorHora, toISODate
src/utils/triage.ts          → horaAMinutos, minutosAHora (exportados) + buildAllAreasDay/detectarChoques/resolverPorArea (LEGACY: ya no se renderizan, conservados en disco)
src/utils/scheduleLayout.ts  → agenda horaria: SLOT_MIN 30, PX_PER_SLOT 44, DURACION_DEFAULT_VISUAL 60, duracionVisual/finVisual (cap 1440), rangoAgenda (±60min, mín 4h, une AHORA si hoy), topFor/heightFor, layoutColumnas (clusters transitivos + greedy), formatoDuracion/formatoRango, minutosDeAhora
src/screens/Billetera.tsx    → carrusel cuentas + detalle en 2ª plan (caché módulo cacheMovimientos/cachePagos/enVuelo; mutaciones usan refrescarDetalle)
src/screens/Home.tsx         → hub: ProfileBanner + FinanceSummaryCard + TodaySummaryCard + QuickMetricsCard + ProjectsProgressCard
src/screens/Actividades.tsx  → pantalla de actividades (calendario mensual + DaySchedule agenda horaria + ActivityActionsSheet + modales); carga con useFocusEffect → cargarDatos(); estado actionsTarget (sheet de acciones)
src/screens/Metricas.tsx     → métricas (metricasRepo) con PeriodSelector
src/components/…             → tabla de props en §6 (abajo)
```

Componentes no usados en Actividades/Home (viejos del mockup, no borrar sin verificar): `WeekStrip`, `NotebookCalendar`, `TaskList`, `ContextButton`, `BilleteraCard`.

## 3. Navegación (reglas duras)

- Cambio de tab = SIEMPRE `navigateToTab(navigation, tabActual, tab)` (calcula anim de ida/vuelta). Jamás `navigation.navigate` directo fuera de ese helper.
- Root = `@react-navigation/stack` (JS). **Nunca** volver a native-stack: su pop cortaba en seco en Android (fragment removido).
- Volver a Inicio = `popToTop()` guardado con `canGoBack()`. No hay BackHandler ni reset.
- Pantallas tipadas `StackScreenProps<RootStackParamList, 'Billetera'|'Actividades'>`; `Home: undefined`.
- Transición: entra desliza 100%→0 + scale 1.04→1; la de abajo zoom-out →0.96 y baja opacidad.

## 4. Datos: SQLite + repos (firmas clave — NO leer los archivos salvo editar)

Flujo: **screen → repo → `getDatabase()`**. Queries SIEMPRE parametrizadas. Prohibido mockear datos en screens.

### `usuario.ts`
- `Usuario { ci (PK), nombre, apellido, peso?, altura?, cintura?, cuello?, edad?, avatarUrl? }`
- `getUsuarios(): Usuario[]` · `saveOrUpdateUsuario(u)`. `Usuario.ci` = FK de `billetera.ci_usuario`.

### `billetera.ts`
- `DIVISAS = ['BOB','USD','EUR','ARS','PEN','MXN','CLP','VES']` (whitelist) · `Billetera { id?, nombre, entidad, monto, divisa, objetivo?, objetivo_monto?, ci_usuario? }`
- `getBilleteras()` · `createBilletera(b): number` (devuelve lastInsertRowId) · `updateBilletera(...)`.

### `movimientos.ts`
- `TipoMovimiento = 'ingreso'|'egreso'|'transferencia'` · `getMovimientosByBilletera(id)` (involucra origen O destino) · `signoMovimiento(m, cuentaId)` · `registrarMovimiento` / `transferir`: transacción `withExclusiveTransactionAsync` ajusta `billetera.monto` + inserta. Transferencias solo misma divisa.

### `pagos.ts`
- `TipoPago = 'individual'|'mensual'` · `getPagosByBilletera(id)` · `createPago` · `deletePago` · `pagarPago(pagoId, monto)` (transacción: valida saldo + pendiente, descuenta y inserta egreso con `movimientos_finan.pago_id`). El `pagado` se **deriva** de movimientos vinculados (individual = suma total; mensual = suma del mes); NO duplicar en columna.

### `proyectoRepo.ts`
- `getProyectos` / `getProyectosActivos` / `getProyectoById` / `crearProyecto` / `toggleProyecto` / `getProyectosConProgreso` (`ProyectoConProgreso`).

### `metricasRepo.ts`
- `PeriodoMetricas = 'hoy'|'semana'|'mes'` · `calcularRango(periodo, fechaRef?)` / `calcularRangoAnterior` · `getResumenGeneral(rango)` · `getDistribucionPorArea(rango)` · `getConsistencia()` · `getComparativa(periodo)` · `generarInsights(periodo)`.

### `actividadRepo.ts` (módulo Actividades — modelo ACTUAL)
Tipos:
- `TipoActividad { id?, nombre, color, emoji? (nombre de MaterialIcons), orden }`
- `Actividad { id?, fecha 'YYYY-MM-DD', tipo_actividad_id, titulo, descripcion?, hora? 'HH:MM', completado 0|1, eliminada 0|1 (soft-delete), proyecto_id?, duracion_estimada_min?, duracion_real_min?, estado_planificacion?, estado_ejecucion?, prioridad?, contexto?, resultado?, notas?, regla_recurrencia_id?, instancia_origen_id? }`
- `ReglaRecurrencia { id?, titulo, tipo_actividad_id, patron, dias_semana? legacy, activa 0|1, dia_inicio? 1=Lun..7=Dom, dia_fin?, fecha_inicio? 'YYYY-MM-DD', repeticion_numero?, repeticion_unidad? 'dias'|'semanas'|'meses'|'indefinido', hora?, duracion_estimada_min?, prioridad }`
- Estados: `EstadoPlanificacion 'planificada'|'reprogramada'|'cancelada'` · `EstadoEjecucion 'pendiente'|'en_progreso'|'completada'|'no_realizada'` · `Prioridad 'critica'|'alta'|'normal'|'baja'` (constantes `PRIORIDADES`, `COLORES_TIPO_ACTIVIDAD`, `CONTEXTOS`).
- Tablas extra: `actividad_sesion` (tiempo real; `duracion_real_min` cacheada), `actividad_subtarea`, `actividad_historial_estado` (auditoría en `toggleActividad` y `transicionarEstado`).

Funciones (las de uso común):
- Tipos/áreas: `asegurarTiposIniciales()` (semilla + migración de emojis→iconos), `getTiposActividad()`, `crearTipoActividad({nombre,color,emoji})`.
- Lectura: `getActividades(fecha, tipoId?)` (filtra `eliminada=0`), `getActividadById`, `getIndicadoresMes(anoMes, tipoId?)` → `Record<fecha,{total,pendientes,colores,totalAreas,tieneCritica}>`, `getActividadesAtrasadas()` (fecha < hoy, pendientes).
- Alta: `crearActividad(data)` → id. **Para recurrentes: crear PRIMERO la regla (`crearReglaRecurrencia`), luego `crearActividad({... regla_recurrencia_id})`, luego `generarInstanciasRecurrentes(horizonte)`** (así no duplica el día base).
- Borrado (3 modos, ver `DeleteActividadModal`):
  1. `eliminarInstancia(id)` → soft-delete `eliminada=1` (fila queda → el guard anti-regeneración la ve); Undo = `restaurarInstancia(id)`.
  2. `eliminarSerie(reglaId)` → borra instancias + regla en transacción.
  3. `desactivarRegla(reglaId)` (`activa=0`, conserva instancias); Undo = `activarRegla(reglaId)`.
  - `eliminarActividad(id)` = borrado duro, SOLO para undo de posponer.
- **Anti-bug regeneración**: `generarInstanciasRecurrentes(horizonteDias)` salta si existe fila `regla+fecha` **aunque `eliminada=1`**, y salta reglas `activa=0`. Rango de días con wraparound (Vie→Lun); fin de período = `fecha_inicio` + `repeticion_numero` de `repeticion_unidad` (`indefinido` = sin fin). El horizonte en `cargarDatos` cubre día seleccionado + mes visible. **Jamás quitar esas dos guardas.**
- Ejecución: `toggleActividad(id)` (optimista en UI + historial), `marcarEnProgreso(id)`, `transicionarEstado(id, planif, ejec, motivo?)` (matriz `TRANSICIONES_VALIDAS`; devuelve false si inválida), `reprogramarActividad(id, nuevaFecha, motivo?)` (marca original `reprogramada` + crea vinculada con `instancia_origen_id`), `reprogramarLote(ids, fecha)` + `deshacerReprogramarLote(undo)`, `guardarResultado`.
- Sesiones: `iniciarSesion` / `finalizarSesion` / `getSesionActiva` / `getSesionesByActividad` / `recalcularDuracionReal`.
- Subtareas: `get/crear/toggle/eliminar/contarSubtarea(s)`.

## 5. Design system (resumen; normas duras en `AGENTS.md`)

- Superficie `PALETTE.surface #FAF9F7`; inputs/tonal `surfaceContainer #F1EFEA`; cards/sheets `surfaceContainerLowest #FFFFFF` **sin borde** + `SHADOW.card` radius 18; hairline/border `#DDE5E1`. **PROHIBIDO borde negro y neón** (no existe `NeonGlow`).
- Acento/CTA/tab activa: `PALETTE.primary #16876A`. `secondary #E76F51`, `tertiary #4F46A5`.
- Tinta `ink/onSurface #1E293B`; `onSurfaceVariant #55606E`; `outline #94A3B8`; `surfaceDark #1E293B`.
- Texto sobre fills semánticos = `onAccent`/`onDark` (blanco `#FFFFFF`). Ámbar/rojo como fill, no como texto pequeño.

### Categorías semánticas (`PALETTE.categorias`)

| Área | Token | Color |
|---|---|---|
| Finanzas | `finanzas` | `#16876A` esmeralda |
| Objetivos | `objetivos` | `#4F46A5` índigo |
| Trabajo | `trabajo` | `#176B87` petróleo |
| Ocio | `ocio` | `#E76F51` coral |
| Eventos | `eventos` | `#64748B` gris azulado |
| Importante | `importante` | `#D89B22` ámbar |
| Crítico | `critico` | `#C94C4C` rojo |

Uso: chip/botón/barras = fill sólido semántico; fondo suave = `TintPill` (alpha 0.12) o `tint(color)`; texto sobre fill oscuro = blanco.

- Botón primario = **relleno semántico + texto blanco bold** radius 16, sin halo. Resaltar = `TintPill { color, radius?, alpha?, style? }`.
- `RADIUS`: cards 18 / interior 12 / buttons 16 / hero 20 (top de sheets). `SHADOW.card` (elevation suave) y `SHADOW.modal` (sombra hacia arriba). `PRESS_SCALE 0.97`.
- **`pressedFeedback` obligatorio en TODO Pressable** (`style={({pressed}) => [styles.x, pressed && pressedFeedback]}`).
- Modales = bottom-sheet slide, overlay `rgba(19,26,24,0.4)`, inputs `surfaceContainer` sin borde (error solo añade `borderColor: critico`), Guardar = relleno semántico, Cancelar = tonal. En ScrollView: `keyboardShouldPersistTaps="handled"` + `paddingBottom` con `useSafeAreaInsets().bottom`.
- **Nunca** `disabled` en Guardar por errores de validación → validar al pulsar + errores inline.
- Carga: `ActivityIndicator` por sección + estados vacíos; en Billetera: render instantáneo, detalle en background con caché a nivel módulo (nunca spinner de pantalla completa; no re-montar el FlatList del carrusel).
- Patrón de pantalla: `SafeAreaView` bg surface + `StatusBar dark-content` + `ScrollView` (px 16, pb ~100-110, gap 16) + `BottomNavigationBar`. FAB bottom 86/right 20.
- Tipografía sistema 400/500/600/700; títulos 24 bold, saldos 28, card 16-17, labels 12, cuerpo 13-14. Sin tracking negativo.

## 6. Componentes (tabla de props — usar estos, no recrear)

| Componente (archivo) | Props / uso |
|---|---|
| `ProfileBanner` (`profileBanner.tsx`) | `usuario, onEditPress` |
| `EditProfileModal` (`EditProfile.tsx`) | `visible, currentProfile, onClose, onSave` |
| `FinanceSummaryCard` | saldo global consolidado (Home) |
| `TodaySummaryCard` | top de tareas de hoy + badge (Home) |
| `QuickMetricsCard` | racha + cumplimiento % (Home) |
| `ProjectsProgressCard` | `proyectos` (ProyectoConProgreso) |
| `GoalProgressCard` / `ComparisonCard` / `DistributionCard` | cards mock de métricas |
| `BottomNavigationBar` (`ButtonNavigationBar.tsx`) | `activeTab, onSelectTab?: (tab)=>void`; píldora flotante blanca; activa en esmeralda sin halo |
| `CuentaCard` | `data: CuentaCardData {id,nombre,entidad,divisa,monto,colorInicio,colorFin}` + LinearGradient |
| `WalletCarousel` (`WalletCarrousel.tsx`) | `cuentas, selectedIndex, onSelectCuenta`; React.memo; peeking (seleccionada 1 / adyacentes 0.88) + dots |
| `AccountSummary` | `cuenta, ingresosMes, egresosMes, onIngreso, onEgreso, onTransferir` |
| `PagosCard` | `pagos, divisa, saldo, cargando?, onAddPago, onPagar, onDelete` |
| `AddPagoModal` | `visible, cuentaNombre, onClose, onSave({nombre,monto,tipo})` |
| `PayPagoModal` | `visible, pago, saldo, divisa, onClose, onSave(monto)` |
| `MovementsTimeline` | `movimientos, cuentaId, divisa, nombresBilletera, cargando?` |
| `AddMovimientoModal` | `visible, tipo:'ingreso'|'egreso', cuentaNombre, onClose, onSave` |
| `TransferModal` | `visible, origen, destinos, onClose, onSave` |
| `AddBilleteraModal` | `visible, ciUsuario, onClose, onSave` (divisas whitelist + meta opcional) |
| `GreetingHeader` | `dateLabel, greeting, pendingCount, inProgressCount?, completedCount?, accentColor, areasCount?, areaNombre?` |
| `AreaSelector` | selector compacto de área (Todas por defecto) + onPress |
| `AreaVerticalTransition` | `areaKey, areaIndex` — transición vertical al cambiar de área |
| `MonthlyCalendar` | `year, monthIndex, dias, indicadoresPorFecha, accentColor, esMesHoy, modoTodas, onPrevMonth, onNextMonth, onSelectDay, onGoToToday` |
| `NotebookCalendar` / `WeekStrip` | calendarios alternativos (no en uso activo) |
| `ContextButton` / `ContextSelectorSheet` | selector de tipo de área (sheet con "Crear tipo", badges de pendientes) |
| `ActivityTimeline` | LEGACY (conservado en disco, ya NO se renderiza): `actividades, tipos, accentColor, areaFiltrada?, …` |
| `AllAreasDayView` | LEGACY (conservado en disco, ya NO se renderiza): triage Todas (Ahora, Atrasadas, por área) |
| `DaySchedule` | **AGENDA ACTIVA** — `programadas, sinHora, atrasadas, tipos, esHoy, fechaISO, ahoraRef, cargando, accentColor, subtareasCounts?, onToggle, onToggleEnProgreso, onPostpone, onDelete, onPressSubtareas, onOpenActions, onReprogramarLoteAtrasadas, onPressTime?`; orquesta AtrasadasSection (solo esHoy) + TimeGrid + UntimedActivities; SIN ScrollView propio (usa el de la screen); estados vacíos ("Día libre") y cargando |
| `TimeGrid` | `startMin, endMin, bloques (BloqueLayout[]), actividades, tipos, esHoy, ahoraMin, accentColor, subtareasCounts?, onToggle, onOpenActions, onPressTime?`; rejilla 30min (jerarquía hora/media-hora), línea `● AHORA HH:MM` (solo hoy, dentro del rango), ranuras Pressable capa inferior para futuro `onPressTime(minute)`, `onLayout` → ancho bloques; zIndex: slots 0 / líneas 1 / bloques 2 / AHORA 5 |
| `DayActivityBlock` | bloque de actividad en la matriz: `actividad, tipo?, top, height, left, width, compact, subtareaProgreso?, onToggle, onOpenActions`; fondo `tint(area,0.07)` + barra 3px color área, radius 12, SIN sombra; ○/◉/✓ + tachado; compact si cols>1 o ancho<150 (oculta rango/metadatos); tocar → sheet |
| `UntimedActivities` | lista vertical de filas "SIN HORA" (NO chips horizontales): `actividades, tipos, accentColor, onToggle, onOpenActions`; barra 3px color área + checkbox + pills área/progreso; tocar fila → ActivityActionsSheet |
| `AtrasadasSection` | `atrasadas, tipos, subtareasCounts?, onToggle, onPostpone, onToggleEnProgreso, onDelete(id), onPressSubtareas, onReprogramarLoteAtrasadas`; colapso >3 ("Ver N más"), badge, "Mover a hoy ›"; reutiliza `TaskCard` |
| `ActivityActionsSheet` | bottom-sheet de acciones: `visible, actividad, tipo?, subtareaProgreso?, onClose, onToggle, onToggleEnProgreso, onPostpone, onSubtareas, onDelete`; acciones: Completar/Reactivar, En progreso/Pausar (`marcarEnProgreso` toggle), Pospuesta, Subtareas, Eliminar; **cierra con delay 280ms antes de abrir Postpone/Subtask/Delete** (nunca 2 capas) |
| `TaskCard` | `actividad, accentColor, origenLabel?, subtareaProgreso?, barraColor?, showArea?, avisoChoque?, onToggle, onPostpone?, onToggleEnProgreso?, onDelete?, onPressSubtareas?, onLongPress?`; menú expandible al tocar (Posponer/En progreso/Eliminar); usado por AtrasadasSection |
| `TaskList` | lista con header + pill pendientes + botón agregar (contexto viejo) |
| `AddActividadModal` | `visible, tipos, tipoPorDefectoId?, fechaPorDefecto?, accentColor, onClose, onSave(NuevaActividadData)` — título, hora (picker), área (chips), "Más opciones": descripción, duración HH:MM, prioridad, recurrencia rango-días+nº+unidad |
| `DeleteActividadModal` | `visible, actividad, accentColor, onConfirm(modo), onClose`; modos `'solo_dia'|'todas_repeticiones'|'terminar_repeticion'` |
| `PostponeModal` | `visible, actividad, onClose, onPostpone(id, nuevaFecha, hora?)` |
| `SubtaskListModal` | `visible, actividadTitulo, accentColor, subtareas, onToggle, onAdd, onDelete, onClose` |
| `SessionTimerModal` | timer de sesión (iniciar/finalizar) |
| `NuevoTipoActividadModal` | `visible, onClose, onSave(NuevaTipoData {nombre,color,emoji?})` (`emoji` = nombre de MaterialIcons); `ICONOS_DISPONIBLES` |
| `UndoToast` | `visible, mensaje, onUndo, onDismiss` |
| `TintPill` | `color, radius?, alpha?, style, children` |
| `InsightsCard` / `PeriodSelector` / `TimeDistributionCard` / `TrendsComparisonCard` / `ConsistencyCard` / `PlanningReliabilityCard` / `WeeklyOverviewCard` | bloques de Métricas |

## 7. Validación y seguridad (obligatorio en toda entrada)

- Queries parametrizadas; `trim()` + longitudes (título/nombre 2–60, objetivo ≤80, descripción ≤160).
- Números solo con `parseNumero`/`validarMonto*` de `validacion.ts`; nunca `parseFloat` directo; nunca persistir `NaN`; ≤2 decimales.
- Enums por whitelist (`DIVISAS`, prioridades, estados).
- Errores: `console.error` genérico (sin datos sensibles) + `Alert.alert` en UI. Nunca loguear credenciales.

## 8. Decisiones cerradas (no re-discutir)

- Neón eliminado por el usuario → superficies tintadas + esmeralda sólida.
- native-stack solo si no hay pop animado (nunca el root). Transición = la de `transition.ts`.
- La vista es **Actividades** (no "tareas"): selector = tipo/área creable; `proyecto_id` = origen opcional.
- `ActividadesScreen` carga TODAS las áreas del día con `getActividades(fecha)` y filtra en memoria.
- Pago: progreso derivado de movimientos, no columna.
- Recurrencia: modelo rango-días + período (nº + unidad); legacy `dias_semana`/`patron` solo lectura (migrado en `db.ts`).

## 9. Trampas conocidas

- `npx` bloqueado en PowerShell → `& npx.cmd …`.
- `TransitionSpec`/`CardStyleInterpolator` no se exportan de `@react-navigation/stack` → tipar con `StackNavigationOptions['transitionSpec']` y `StackCardStyleInterpolator`.
- Líneas largas en AGENTS.md/STATE: el Edit tool trunca a 2000 chars por línea → Write completo o temp + ReadAllLines/WriteAllLines (UTF8 sin BOM).
- Imports inexistentes del mockup viejo (`../types`, `../theme` sin index, tokens `colors/spacing/typography`) → todo sale de `src/theme/theme.ts` e `@expo/vector-icons`.
- Bug histórico: deshabilitar Guardar por errores (queda botón muerto) — ya no.

## 10. Estado actual

- **Hecho**: sistema visual sin neón; navegación con transición Linux y tabs `[billetera, inicio, actividades, metricas, comida]`; Billetera completa; Actividades (matriz temporal, recurrencia, subtareas). Rediseño de Métricas (enfocada en Hábitos y Constancia).
- **Último trabajo (Pantalla Comida)**: Se reemplazó "Perfil" por "Comida" en la navegación inferior. Se creó una nueva pantalla para registrar alimentos y analizar patrones, conectada a tres nuevas tablas (`comida_alimento`, `comida_registro`, `comida_registro_item`). La vista principal es una línea de tiempo (timeline) diaria similar a `DaySchedule`. Se desarrolló un sistema de "Registro rápido" a través del bottom-sheet `AddMealSheet` con búsqueda local de alimentos. El análisis (`FoodQualityCard`) calcula una puntuación cualitativa (0-10) basada en presencia de proteínas/vegetales y penalización por ultraprocesados, además de generar retroalimentación objetiva (tendencias y patrones de horario) sin recurrir al conteo calórico. Typecheck superado.

## 11. Pendiente (en orden)

1. **Prueba en celular (Expo Go)** del nuevo sistema de Hábitos y Comida: seguir una actividad, registrar un desayuno, cambiar de día y verificar la retroalimentación cualitativa.
2. Probar casos borde en `ComidaScreen` (registros simultáneos o borrar ítems).
3. Ideas: vincular `proyecto_id` a la UI como "origen"; poder guardar combinaciones de alimentos como "Comidas frecuentes" para registrar aún más rápido.

## 12. Al tocar X, leer solo Y

| Tarea | Leer |
|---|---|
| Cualquier tarea nueva | este archivo (+ AGENTS.md ya inyectado) |
| Editar un screen/component | SOLO ese archivo |
| Reglas de datos/SQL | `actividadRepo.ts` u otro repo + `schema.ts` |
| Migrar columnas | `db.ts` (ensureColumn) + `schema.ts` |
| Color/token nuevo | `theme.ts` (nunca hex suelto) |
| Navegación/transición | `tabs.ts` / `transition.ts` |
