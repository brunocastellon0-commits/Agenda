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
src/navigation/AppNavigator.tsx → root Stack JS: Billetera | Home | Actividades (tabs se resuelven en tabs.ts); `gestureEnabled: false` (sin swipe-back: roba el drag horizontal al carrusel de Billetera)
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

Estética vigente: **"Expressive Editorial Personal Dashboard"** — lienzo blanco, identidad cyan oscuro, tipografía con escala editorial y composición asimétrica. **Home, Métricas y Comida ya migradas**; el resto de módulos sigue el mismo lenguaje (tanda siguiente).

- Lienzo **blanco puro** `PALETTE.surface #FFFFFF`; inputs/tonal `surfaceContainer #F1F5F9`; cards/sheets `surfaceContainerLowest #FFFFFF` **sin borde** + `SHADOW.card` (radius `RADIUS.cards` 24); hairline `#E2E8F0` (`PALETTE.hairline`). **PROHIBIDO borde negro, neón, gradiente y dark mode.**
- **Identidad**: `PALETTE.primary #155860` (CTA, tab activa, selección, eyebrow por defecto) · `accent #0891B2` (progreso/indicadores). Mismo tono que `assets/icon-1024.png`, `assets/mascota.png` y el splash. `secondary #64748B`, `tertiary #0284C7`. Overlay: `PALETTE.scrim rgba(19,26,24,0.4)`.
- Tinta `ink/onSurface #0F172A`; `onSurfaceVariant #475569`; `ash #64748B`; `outline #94A3B8`.
- Texto sobre fills semánticos = `onAccent`/`onDark` (blanco). Sobre superficie oscura: `onDarkMuted #E2E8F0` (texto secundario) y `surfaceDark #0F172A` / `fondos.control #1E293B`. Ámbar/rojo como fill, no como texto pequeño.

### Categorías semánticas (`PALETTE.categorias`)

| Área | Token | Color |
|---|---|---|
| Actividades / Trabajo | `actividades` / `trabajo` | `#0284C7` |
| Comida / Ocio | `comida` / `ocio` | `#EA580C` |
| Hábitos | `habitos` | `#10B981` |
| Autocontrol / Importante | `autocontrol` / `importante` | `#F59E0B` |
| Métricas / Objetivos | `metricas` / `objetivos` | `#8B5CF6` |
| Finanzas | `finanzas` | `#1D4ED8` |
| Control / Crítico | `control` / `critico` | `#E11D48` |
| Eventos | `eventos` | `#64748B` |

Fondos suaves por área en `PALETTE.fondos.*` + `fondos.identidad #EDF6F7` y `fondos.control #1E293B`.

Uso: chip/botón/barras = fill sólido semántico; fondo suave = `TintPill` (alpha 0.12) o `tint(color, 0.08–0.16)`; texto sobre fill oscuro = blanco.

### Lenguaje editorial (`src/components/editorial/`, exportados por `index.ts`)

| Componente | Props / uso |
|---|---|
| `Eyebrow` | `text, color?=primary, style?` — marcador 18×4 + label `TYPE.label`. Reemplaza a los `sectionTitle` en mayúsculas. |
| `BigNumber` | `value, unit?, label?, size?='display'\|'displaySm', tone?='ink'\|'primary'\|'accent'\|'onColor', labelTone?, color?, labelColor?, style?` — número como elemento gráfico; el valor lo formatea el caller (dato real). |
| `ColorBlock` | `variant?='tint'\|'solid'\|'open', color?, radius?=`RADIUS.block`, elevated? (→`SHADOW.lift`), style?, children` — bloque cromático **sin borde**; no es una card. |
| `ProgressBar` | `pct (0–100 clamped), color?=accent, trackColor?=hairline, height?=6, style?` |

Composición: 1 número grande por bloque + label en mayúsculas + apoyo `caption`; filas asimétricas (`flex 3 / flex 2`); **bloque abierto** (sin bg/sombra, `borderBottomWidth 1` hairline) para filas navegables; nunca card dentro de card.

- Botón primario = **relleno semántico + texto blanco bold** radius 16, sin halo. Resaltar = `TintPill { color, radius?, alpha?, style? }`.
- `RADIUS`: cards 24 / **block 20** (bloques cromáticos) / interior 16 / buttons 16 / pill 999 / hero 28 (top de sheets) / hairline 1. `SHADOW.card` (elevation 3), `SHADOW.lift` (hero, shadowColor `#155860`) y `SHADOW.modal` (hacia arriba). `PRESS_SCALE 0.96`.
- **`pressedFeedback` obligatorio en TODO Pressable** (`style={({pressed}) => [styles.x, pressed && pressedFeedback]}`); targets ≥ 44×44.
- Modales = bottom-sheet slide, overlay `PALETTE.scrim`, top radius `RADIUS.hero`, inputs `surfaceContainer` sin borde (error solo añade `borderColor: critico`), Guardar = relleno semántico, Cancelar = tonal. En ScrollView: `keyboardShouldPersistTaps="handled"` + `paddingBottom` con `useSafeAreaInsets().bottom`.
- **Nunca** `disabled` en Guardar por errores de validación → validar al pulsar + errores inline.
- Carga: `ActivityIndicator` por sección + estados vacíos **con icono `Ionicons` (sin emoji)**; en Billetera: render instantáneo, detalle en background con caché a nivel módulo (nunca spinner de pantalla completa; no re-montar el FlatList del carrusel).
- Patrón de pantalla: `SafeAreaView` bg surface + `StatusBar dark-content` + `ScrollView` (px 16, pb ~100-110, gap 16) + `BottomNavigationBar`. FAB bottom 86/right 20.
- Tipografía vía **`TYPE`**: `display 52/700`, `displaySm 36/700`, `title 28/700`, `subtitle 18/600`, `body 14/400`, `caption 12/500`, `label 11/700 uppercase (ls 1.2)`. Ritmo `SPACE = { xs 4, sm 8, md 16, lg 24, xl 32, xxl 48 }`. Sistema 400/500/600/700, **sin tracking negativo**.
- Assets: `assets/icon-1024.png` (icono, esquinas `#155860`), `assets/mascota.png` (splash, fondo `#155860`), ambos derivados de `assets/reloj1.jpg`; visibles solo en dev build/EAS (no en Expo Go).

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
| `BottomNavigationBar` (`ButtonNavigationBar.tsx`) | `activeTab, onSelectTab?: (tab)=>void`; píldora flotante blanca; activa en `primary #155860` sin halo |
| `CuentaCard` | `data: CuentaCardData {id,nombre,entidad,divisa,monto,colorInicio,colorFin}` + LinearGradient |
| `WalletCarousel` (`WalletCarrousel.tsx`) | `cuentas, selectedIndex, onSelectCuenta`; React.memo; peeking (seleccionada 1 / adyacentes 0.88) + dots **Pressables** (32×32 + hitSlop 6 ≈ 44×44) que llaman a `handleCardPress`; padding lateral exacto `(W - CARD)/2` |
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
| `AddConductaSheet` | `visible, conducta, onClose, onSaved` — registro de una **ocurrencia** de una conducta existente |
| `NuevaConductaSheet` | `visible, onClose, onSaved` — **alta** de conducta (`crearConducta` → `origen='propia'`); nombre 2–60, categoría (claves de `PALETTE.categorias`), modalidad evitación total/límite, frecuencia/límite/unidad; sin semillas: la lista de conductas nace acá |
| `Eyebrow` / `BigNumber` / `ColorBlock` / `ProgressBar` (`components/editorial/`) | lenguaje editorial (props en §5); `Eyebrow` unifica los títulos de sección, `BigNumber` compone números reales ya formateados, `ColorBlock` agrupa contenido con color **sin ser card**, `ProgressBar` reemplaza los tracks ad-hoc |

## 7. Validación y seguridad (obligatorio en toda entrada)

- Queries parametrizadas; `trim()` + longitudes (título/nombre 2–60, objetivo ≤80, descripción ≤160).
- Números solo con `parseNumero`/`validarMonto*` de `validacion.ts`; nunca `parseFloat` directo; nunca persistir `NaN`; ≤2 decimales.
- Enums por whitelist (`DIVISAS`, prioridades, estados).
- Errores: `console.error` genérico (sin datos sensibles) + `Alert.alert` en UI. Nunca loguear credenciales.

## 8. Decisiones cerradas (no re-discutir)

- Neón eliminado por el usuario → superficies tintadas + fill sólido de identidad (hoy `primary #155860`; antes esmeralda `#16876A`, reemplazada en el rediseño Agenda 2.0).
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
- **PLAN.md Fase 1 completada**: Bugs de Actividades — (1.1) Fix doble desplazamiento línea AHORA en `TimeGrid.tsx` (hijos usaban `ahoraTop` redundante del wrap), (1.2) Pills de `DayActivityBlock.tsx` ahora tienen prioridad (estado > prioridad > área > subtareas) y cap por ancho (1/2/3 pills según px disponibles), (1.3) Error inline en `AddActividadModal.tsx` junto al input con borde rojo, (1.4) `SubtaskListModal.tsx` reestructurado: input arriba para alta rápida, validación 2-60 chars, estado vacío, botón X en header. Typecheck 0.
- **PLAN.md Fase 2 completada**: Todos los modales (11 formularios) ahora están envueltos en `KeyboardAvoidingView` y los ScrollViews correspondientes tienen `keyboardShouldPersistTaps="handled"`. El teclado ya no tapa los inputs y al hacer tap en una acción la oculta sin perder el foco inesperadamente. Typecheck 0.
- **PLAN.md Fase 3 completada**: Notificaciones 15 min antes implementadas. `scheduleActividadNotification` resta 15 minutos (`ANTICIPACION_MIN`) a la hora de la actividad. Se corrigió `reprogramarLote` y `deshacerReprogramarLote` para reprogramar notificaciones de actividades que cambiaron de fecha. Además, transiciones a `reprogramada` o `cancelada` ahora cancelan la alarma anterior.
- **PLAN.md Fase 4 completada**: Sistema de Nutrición. Motor de cálculos implementado (`nutricion.ts`) que mapea porciones y unidades (g, ml, taza, plato) a macros base. `schema.ts` y `db.ts` extendidos para almacenar Kcal/Prot/Carb/Grasa/Fibra en alimentos y el snapshot en registros. Repositorios y seeds (`alimentos.ts`) con +40 items con macros reales. UI actualizada: `AddMealSheet` permite indicar cantidades con un live-preview de macros, y `FoodSummaryCard` (en Home y Comida) renderiza los macros consumidos del día.
- **PLAN.md Fase 5 completada**: Conductas a evitar y Autocontrol. Lógica de rachas centralizada en `rachas.ts` y aplicada a `habitosRepo.ts`. Nuevas tablas `conducta_evitar`, `conducta_evento` y repositorio `conductaRepo.ts` para gestionar modalidades "evitación total" (racha continua de 0 eventos) y "límite" (frecuencia máxima). Sección de "Autocontrol" incorporada en `Home.tsx` y `Metricas.tsx` usando la nueva UI `AvoidanceCard.tsx` y el modal `AddConductaSheet.tsx`.
- **PLAN.md Fase 6 completada**: Evolución Física (Mi Estado). Nuevo repositorio `estadoFisicoRepo.ts` y tabla `registro_fisico`. Migración de atributos físicos previos de `usuario` a un registro histórico inicial (`db.ts`). UI: `Estado.tsx` agregada a la navegación con gráfico SVG de evolución del peso, diferencial contra medición previa e historial. Banner del `Home` (`ProfileBanner`) redirige a `Estado`, además de una tarjeta de acceso rápido con métricas resumidas en la vista de Home. Se creó el bottom-sheet `AddMedicionSheet.tsx` para registrar nuevas medidas (peso, altura, cintura, cuello) mostrando valores anteriores de referencia. Typecheck limpio.
- **PLAN.md Fase 7 completada**: Sistema de notificaciones centralizado. Creada tabla `notif_config` y sheet de configuración `NotificacionesSheet.tsx` en Home. Notificaciones con IDs deterministas (`act_${id}`, `hab_${id}`, `dia_${fecha}`, `evit_${id}`). Creados recordatorios contextuales para evitar duplicados en `toggleActividad` y rutinas nocturnas genéricas (Resumen a las 21:00, Conductas a las 20:00, Hábitos a las 19:00, Comida a las 14:00). Reemplazada solicitud inicial ciega de permisos por `requestPermissionsConContexto()`.
- **PLAN.md Fase 8 completada**: Implementación de Widgets Android.
- **PLAN.md Refinamiento UX/UI (Fase Actual)**: Se restructuró completamente la arquitectura de experiencia. `Home.tsx` se transformó en un "Mapa del Día" asimétrico, y `Metricas.tsx` es ahora el centro analítico unificado. El registro de `Comida` en `AddMealSheet` es progresivo y centrado en alimentos individuales. El seguimiento de `Conductas` se simplificó, y `AddConductaSheet` ahora muestra feedback neutral ("Racha anterior, Nueva Racha") inmediatamente tras registrar la ocurrencia. Se adaptó el widget Android para enfocarse en Rachas activas y mensajes motivacionales según la hora. Typecheck superado en todas las interfaces modificadas.
- **Fix build EAS (ERESOLVE)**: Se eliminó todo el tooling de pruebas (`jest`, `jest-expo`, `@types/jest`, `@react-native/jest-preset`, script `test`, `jest.config.js` y los 3 `*.test.ts` de `src/utils/`) porque `jest-expo@57.0.5` exigía `@react-native/jest-preset@^0.86.3` mientras `react-native@0.86.2` exige `0.86.2` exacto → conflicto irreconciliable que rompía `npm ci --include=dev` en EAS. `package-lock.json` regenerado sin `--legacy-peer-deps`; verificado `npm ci --include=dev` exit 0 + `tsc --noEmit` exit 0. Commiteado (`913fdd8`) y pusheado. **No reinstalar jest sin antes alinear `react-native@0.86.3`** (bundle Expo ≥57.0.25).- **Plan de 5 bloques (datos/sincronización/copy/comida/UI)**: **B1 datos** — `nutricion.ts` con `formatEstimado(null→"—")`, `formatNutritionReference` (nunca inventa valores) y `formatCantidadUnidad`; `comidaRepo.ts` con campos numéricos `|null`, saneo defensivo de alimentos de origen `sistema` sin `kcal_100` (baja a `activo=0`; sin DB en el repo → **sin verificar en dispositivo**), macros reales en `getRegistrosDia`, `ResumenNutricional.itemsEstimados` + `RESUMEN_VACIO`. **B2 sincronización** — `habitosRepo.ts` con una sola query semanal (lun→dom, días futuros `futuro:true`), `HistorialReciente`, `completadosSemana` derivado solo de días no futuros; `HabitCard.tsx` sin `.reverse()` y con `dayCircleFuturo`; `WalletCarrousel.tsx` con commit síncrono del índice (`onScroll`/`onScrollEndDrag`/`onMomentumScrollEnd` + `committedRef`) para que `selectedCuentaId` sea única fuente; `Comida.tsx` spinner solo en la primera carga; `Billetera.tsx` `SafeAreaView` con `edges=['top']`. **B3 copy/voseo** — ~70 frases pasadas a voseo (`controlContent.ts`, `motivacion.ts`, `Metricas`, `Estado`, `Control`, `ManageTrackingModal`, `notificaciones.ts`, `comidaRepo.analizarRango`, etc.) sin tocar `triage.ts` ni subjuntivos ya correctos; nueva util `fraseRachaEvitacion()` en `conductaRepo.ts` (quita la partícula "No " del nombre → evita "sin no fumar") usada en `Metricas`; pluralidad corregida en `metricasRepo`, `AvoidanceCard`, `AllAreasDayView`, `MiDiaWidget`. **B4 comida UX** — `AddMealSheet.tsx` con cantidad opcional (`cantidad:null` → "sin cantidad"), validación de selección/hora con regex `/^\d{2}:\d{2}$/` corregido, estados `guardando/guardado/error` con error inline y botón **sin** `disabled`; `MealTimeline.tsx` reagrupado por momento (desayuno→otro) con `—` en secciones vacías; `FoodSummaryCard.tsx` `onPress` opcional y `—` cuando `itemsEstimados===0`. **B5 UI** — backdrop de `AddConductaSheet.tsx` con un solo hijo raíz + `absoluteFill` (antes dos hijos `flex:1` partían la pantalla); engranaje de Métricas a 44×44; tarjetas `~0` → `—` en `Metricas` y `Home` (además se quitó el `~` literal duplicado y `setResumenNutricional` pasó a ser incondicional); hex sueltos → tokens. **Onboarding de nombre (nuevo)** — el prompt de `Home.tsx` pasó a sheet inferior con `KeyboardAvoidingView` (antes el teclado lo tapaba: "no hay lugar para escribir el nombre"), `autoFocus`, botón **Guardar** con `validarTexto(2,60)` + error inline y tokens de theme; `EditProfileModal` (antes 0 usos) quedó conectado al `ProfileBanner` de Home (deja de navegar a `Estado`, que sigue accesible desde Métricas). Typecheck `tsc --noEmit` = 0 tras cada bloque.

- **Corrección de 8 puntos (sprint posterior al plan de 5 bloques)**: **1. Sin navegación por gesto** — `AppNavigator.screenOptions.gestureEnabled = false` y `app.json → android.predictiveBackGestureEnabled = false`: el swipe-back de la pila capturaba todo gesto horizontal de la pantalla y le robaba el drag al carrusel de Billetera; el único camino entre módulos es el Bottom Nav. `react-native-gesture-handler` sigue en `App.tsx`/`index.ts` (lo pide `@react-navigation/stack`). **2. `WalletCarrousel.tsx`** — el paginador dejó de ser `View` mudo: ahora es `Pressable` (32×32 + `hitSlop` 6 ≈ 44×44, con `pressedFeedback`) que llama a `handleCardPress(index)`; `contentContainerStyle.paddingHorizontal` corregido a `(SCREEN_WIDTH - CARD_WIDTH)/2` para que el offset exacto de la tarjeta centrada sea `index * SNAP_INTERVAL` (lo que `handleScroll` redondea); toda celda se renderiza con el mismo árbol `TintPill > Pressable` usando `alpha={isSelected ? 0.12 : 0}` para evitar unmount/remount a mitad de scroll. `Billetera.tsx` intacto (`selectedCuentaId` sigue siendo la única fuente). **3. Conductas sin mock** — eliminada `asegurarConductasIniciales()` (definida pero nunca llamada), `getConductasActivas` filtra `origen = 'propia'` (las filas de ejemplo existentes quedan en SQLite pero ocultas; sin DELETE ni migración), nuevo `crearConducta()` con query parametrizada y nuevo sheet `NuevaConductaSheet.tsx` (nombre 2–60 con `validarTexto`, categoría con claves reales de `PALETTE.categorias` para que `AvoidanceCard` resuelva color, modalidad evitación total/límite + frecuencia/límite/unidad, botón **nunca** `disabled`); alta desde `Metricas.tsx` (botón `+` en la cabecera y CTA "+ Crear conducta" en el estado vacío). **4. `AddMealSheet.tsx`** — eliminado el estado `isSearching`: la lista de resultados está **siempre** visible y hace scroll propio dentro de `maxHeight: 250` (contenedor `overflow:'hidden'` + `ScrollView` con `flexShrink:1` y `nestedScrollEnabled`), sin `borderBottom` en el último ítem; el body del sheet con `flexShrink:1` y `errorBox`/`footer` con `flexShrink:0` para que el footer quede anclado bajo `maxHeight:'92%'`. **5. Métricas visual** — **diferido** por decisión del usuario. Typecheck `--noEmit` exit 0 tras todo el sprint.

- **Rediseño visual "Expressive Editorial Personal Dashboard" / Agenda 2.0 — tanda 1 (Home, Métricas, Comida)**: **FASE 0** — `src/theme/theme.ts` reescrito: lienzo `surface #FFFFFF`, identidad `primary #155860` (mismo teal del icono), `accent #0891B2`, `scrim`, `fondos.identidad #EDF6F7`, escala **`TYPE`** (display 52 / displaySm 36 / title 28 / subtitle 18 / body 14 / caption 12 / label 11 uppercase, sin tracking negativo), **`SPACE`**, `RADIUS` (cards 24, **block 20**, interior 16, buttons 16, pill 999, hero 28), `SHADOW.lift` (shadowColor `#155860`), `PRESS_SCALE 0.96`. Nuevos componentes **`src/components/editorial/`**: `Eyebrow`, `BigNumber`, `ColorBlock` (solid/tint/open, sin borde), `ProgressBar`, con `index.ts`. **FASE 1** — `assets/mascota.png` (~656 KB, esquinas transparentes) e `assets/icon-1024.png` (~1.1 MB, opaco teal `#155860`) recortados desde `assets/reloj1.jpg` (bbox por píxeles teal, máscara rounded-rect `r=0.16*min` que elimina el halo blanco, resize a 1024 con canvas teal); `app.json` apunta `icon`, `android.adaptiveIcon.foregroundImage` (`backgroundColor #155860`), plugin `expo-splash-screen` (`image ./assets/mascota.png`, `imageWidth 180`, `resizeMode contain`, `backgroundColor #155860`) y `web.favicon`. El script temporal `scratch/gen-assets.ps1` se borró. **FASE 2 `Home.tsx`** — `Eyebrow "Tu Día en Marcha"`; el "mapa del día" ahora es: fila 1 Actividades (`nodeSolid` teal + `BigNumber` `{hechas}/{total}` en `onColor`) y Alimentación (`nodeOpen` con `BigNumber` kcal en color comida y `'—'` sin datos); fila 2 Constancia (solid verde `habitos`, racha sin emoji) y Autocontrol (`nodeTint` ámbar 14%); fila 3 Estado Físico (`nodeOpenFull` con hairline y peso en BigNumber); fila 4 Modo Control (`nodeSolid` en `fondos.control`); hint de analytics → `ColorBlock tint` con `hintText`; botón de notificaciones → `iconBtn` 44×44; overlay del onboarding con `PALETTE.scrim`, handle, mascota (`Image require('../../assets/mascota.png')`) y `TYPE.title` (lógica y validación intactas); estilos nuevos (`nodeSolid/nodeTint/nodeOpen/nodeOpenFull/nodeHeadRow/nodeLabel=node TYPE.label/nodeSubOnColor/controlTitle/estadoRow/hintBlock/hintText`) y borrados `mapaTitle/mapNode/nodeIconBg/nodeValue/analyticsHint*` (incluida la sombra `elevation: 4`). **FASE 3 `Metricas.tsx`** — nuevo hero editorial: `Eyebrow "Panel de evolución"` + fila asimétrica (`BigNumber` display del `cumplimientoPct` de `getResumenGeneral` con apoyo `{completadas} de {totalPlanificadas} hechas` / `ColorBlock solid primary` con `BigNumber` de **racha** `getConsistencia()` nuevo en `loadData` y "Récord N días") + fila de contadores abiertos con divisores hairline (Actividades / Hábitos / Conductas); los 4 `summaryBox` idénticos desaparecieron; las 5 secciones usan `Eyebrow` con color semántico y los bloques Alimentación/Estado físico pasaron a composición **abierta** (`estadoOpen` con hairline) en vez de `estadoCard` con sombra; estados vacíos sobre `fondos.identidad`. **FASE 4 `FoodSummaryCard` + `Comida.tsx` + `MealTimeline` + `AddMealSheet`** — `FoodSummaryCard` ahora es `ColorBlock tint comida` con `Eyebrow`, `BigNumber` display de kcal y fila de macros abierta con divisores; `MealTimeline` con `Eyebrow "Comidas del día"` y registros abiertos (hairline, sin card con sombra); `Comida.tsx` sin `borderBottom` en el header de fecha, estado vacío con `Ionicons restaurant-outline` (sin 🍽️) y `Eyebrow "Retroalimentación"`; filas de `searchResults` en `AddMealSheet` con categoría en `TYPE.label` + nombre bold + referencia nutricional + número de kcal a la derecha y botón `+` circular tintado (fila entera sigue siendo el target con `accessibilityLabel "Agregar {alimento}"`). **Verificado**: `tsc --noEmit` exit 0 tras cada fase. **Sin**: migraciones, cambios de lógica de negocio, dependencias nuevas, toques de `ios/`/`android/`, datos mock, dark mode ni commits.

- **Fix navegación a "Tu Esquina" (Control)**: `navigation.navigate('Control')` desde el bloque Modo Control de `Home.tsx` fallaba con *"The action 'NAVIGATE' with payload {name: 'Control'} was not handled by any navigator"*. **Causa**: el commit `7760822` agregó `import ControlScreen` (`AppNavigator.tsx:10`) y la entrada `Control: undefined` en `types.ts:12`, pero **nunca registró `<Stack.Screen name="Control">`** (verificado con `git log -S 'name="Control"'` → sin resultados); el tipo compilaba y en runtime no existía la ruta. **Solución**: pantalla registrada con `options={{ title: 'Tu Esquina', headerShown: false }}` (la pantalla dibuja su propio header oscuro con X → `navigation.goBack()`), mismo patrón que `Estado`. Limpieza relacionada: `Control.tsx` **sin hex sueltos** (16 reemplazos → `surfaceDark`, `fondos.control`, `onSurfaceVariant`, `outline`, `ash`, `onDark`, `onDarkMuted` [nuevo token `#E2E8F0` para texto secundario sobre oscuridad], `hairline`→`onDarkMuted` en el ActivityIndicator, `onAccent` en el botón claro) y `letterSpacing: -1` del timer → `0` (tracking negativo prohibido). `tsc --noEmit` exit 0. **Pendiente visual**: Control no sigue aún el lenguaje editorial (tanda 2, §11).

## 11. Pendiente (en orden)

1. **Inspeccionar en el dispositivo** el saneo de alimentos legacy (`comida_alimento.origen='sistema'` sin `kcal_100`): no hay `*.db` en el repo, así que el `UPDATE ... activo=0` quedó sin probar en datos reales.
2. **Prueba manual en Expo Go**: onboarding de nombre (teclado, validación, persistencia), `EditProfileModal` desde el banner, backdrop de `AddConductaSheet`, sincronización del carrusel de Billetera con `selectedCuentaId`, MealTimeline con días sin comidas.
3. **Prueba manual de la corrección de 8 puntos**: (a) el swipe horizontal no navega entre pantallas y el Bottom Nav sí; (b) en Billetera con ≥3 cuentas, arrastrar A→B→C y volver a A manteniendo el resumen sincronizado, tocar los puntos del paginador para saltar de cuenta, y verificar que la tarjeta centrada queda exactamente al centro; (c) en Métricas, con la tabla `conducta_evitar` sin filas propias: estado vacío + "+ Crear conducta" → alta y reaparición tras recargar (las filas `origen='ejemplo'` no deben renderizarse); (d) en Comida, `AddMealSheet` abierto muestra la lista de alimentos con consulta vacía, filtra con "arroz", hace scroll interno dentro de los 250px, el último ítem sin línea inferior y el footer **no** se pisa con el teclado ni con la lista.
4. Verificar en Play Store/App que el widget (`MiDiaWidget`) siga viéndose bien con el plural "1 día".
5. (Si corresponde) Iniciar nueva fase de desarrollo de nuevas features según el roadmap del usuario.
6. **Checklist visual Agenda 2.0 (tanda 1)** — verificar en dispositivo/Expo Go: **Home** (Eyebrow, bloques sólidos/abiertos, BigNumber con datos reales, estado sin actividad con `'—'`, overlay de nombre con mascota + token `scrim`); **Métricas** (hero `cumplimientoPct` de `getResumenGeneral`, bloque racha de `getConsistencia()`, fila de contadores con divisores, 5 secciones con `Eyebrow`, Alimentación/Estado físico abiertos); **Comida** (`FoodSummaryCard` con kcal reales, `MealTimeline` sin cards apiladas, filas del buscador con kcal + botón `+`, estado vacío con icono y no emoji). **Icono/splash solo visibles en dev build o EAS** (Expo Go usa su propio icono): `assets/icon-1024.png` (esquinas `#155860`) y splash `assets/mascota.png` sobre `#155860`.
7. **Tanda 2 del rediseño**: migrar al mismo lenguaje (Eyebrow / BigNumber / ColorBlock, bloques abiertos, `PALETTE.scrim` en overlays) el resto de módulos — Billetera, Actividades, Estado, Control, Perfil — y los bottom sheets aún no tocados. Incluye **hex sueltos preexistentes fuera de tanda 1**: `Billetera.tsx:33-36` (gradientes `#16876A/#0D5C49`, `#4F46A5`, `#E76F51`), `FinanceSummaryCard.tsx:29`, `notificaciones.ts:73` (`lightColor '#16876A'`), `MiDiaWidget.tsx:16/37/38` (`#FAF9F7`, `#16876A`).

## 12. Al tocar X, leer solo Y

| Tarea | Leer |
|---|---|
| Cualquier tarea nueva | este archivo (+ AGENTS.md ya inyectado) |
| Editar un screen/component | SOLO ese archivo |
| Reglas de datos/SQL | `actividadRepo.ts` u otro repo + `schema.ts` |
| Migrar columnas | `db.ts` (ensureColumn) + `schema.ts` |
| Color/token nuevo | `theme.ts` (nunca hex suelto) |
| Navegación/transición | `tabs.ts` / `transition.ts` |
