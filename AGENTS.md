# AGENTS.md

# Expo v57 — IMPORTANTE

Expo y React Native cambiaron. Antes de escribir código, leé la documentación versionada exacta: https://docs.expo.dev/versions/v57.0.0/

---

# Design System — agenda-app

Aplicación de agenda personal (React Native + Expo + SQLite local). Estética **calmada y sobria**: superficie con tinte verdegris suave (`surface #F4F7F5`), tarjetas `surfaceContainerLowest` blancas con **sombra suave** (`SHADOW.card`, radius 18) y **SIN bordes negros** (separaciones internas: `PALETTE.hairline` `#DDE5E1`). **Cero neón** (no existe `NeonGlow`/`GLOW`/lime/cyan/pink — eliminados por el usuario): acentos de acciones, tab activa y selecciones en esmeralda `PALETTE.primary #16876A` o el semántico del área; botones de color = relleno sólido con texto `onAccent`/`onDark`, o `TintPill` (tint 12%). Los **colores semánticos** (`categorias`: esmeralda/índigo/petróleo/coral/ámbar/rojo) clasifican contenido por área. Tinta profunda `#1E293B` (`ink`/`onSurface`); tinta secundaria `#55606E`. Tipografía del sistema normal, pesos 400/500/600/700. Todo token sale de `src/theme/theme.ts` (`PALETTE`, `SHADOW`, `RADIUS`, `pressedFeedback`, `tint()`) — no inventar colores ni hexes sueltos.

## Tokens reales — `src/theme/theme.ts`

| Token | Uso |
|---|---|
| `PALETTE.surface` `#FAF9F7` (crema cálido) | Fondo de pantalla / canvas |
| `PALETTE.surfaceContainer` `#F1EFEA` | Inputs, tracks, filas tintadas y botones "tonal" (cancelar) |
| `PALETTE.surfaceContainerLow/Lowest` `#FFFFFF` | Cards, sheets de modales y paneles interiores |
| `PALETTE.surfaceDark` `#1E293B` | Paneles invertidos (texto `onDark`) |
| `PALETTE.ink` `#1E293B` (también `onSurface`) | Texto fuerte (nunca usarlo como borde) |
| `PALETTE.hairline` `#DDE5E1` / `onSurfaceVariant` `#55606E` / `outline` `#94A3B8` | Divisor interno / texto secundario / iconos inactivos |
| `PALETTE.border` `#DDE5E1` | Borde **suave** separador (alias de `hairline`). **PROHIBIDO** borde negro en cualquier superficie |
| `PALETTE.primary` `#16876A` (esmeralda) | CTA y acción principal; tab activa; selecciones |
| `PALETTE.secondary` `#E76F51` (coral) / `PALETTE.tertiary` `#4F46A5` (índigo) | Acentos cálido / objetivos |
| `PALETTE.onAccent` `#FFFFFF` | Texto/íconos sobre fills de color (esmeralda/índigo/petróleo/ámbar/rojo) |
| `PALETTE.onDark` `#FFFFFF` | Texto/íconos sobre `surfaceDark` **y sobre fills semánticos oscuros** (esmeralda/índigo/petróleo/ámbar/rojo) |
| `PALETTE.categorias` | Color semántico por área (usar SIEMPRE para clasificar contenido) |
| `SHADOW.card` / `SHADOW.modal` | Sombra suave Material de cards (elevation 2 / opacidad 0.05) y de bottom-sheets (offset negativo, sombra **hacia arriba**) |
| `TintPill` (`src/components/TintPill.tsx`, props `color/radius/alpha/style`) | Pill con tint suave del color (12%) para envolver acciones/selecciones; **NO** hay halos neón |
| `tint(hex, alpha)` | Tintar un color con alfa (fondos tintados, scrollbars, chips) |
| `PRESS_SCALE` (0.97) / `pressedFeedback` | Feedback de press: `style={({ pressed }) => [styles.x, pressed && pressedFeedback]}` en TODOS los Pressables |

### Categorías semánticas (`PALETTE.categorias.*`)

| Área | Token | Color |
|---|---|---|
| Finanzas (billetera, movimientos) | `categorias.finanzas` | `#16876A` esmeralda |
| Objetivos (progreso, metas) | `categorias.objetivos` | `#4F46A5` índigo |
| Trabajo (actividades laborales) | `categorias.trabajo` | `#176B87` petróleo |
| Ocio | `categorias.ocio` | `#E76F51` coral |
| Eventos generales | `categorias.eventos` | `#64748B` gris azulado |
| Importante / urgente | `categorias.importante` | `#D89B22` ámbar |
| Crítico (errores, vencimientos) | `categorias.critico` | `#C94C4C` rojo |

Regla: un área usa su color semántico como **relleno de chip/botón/barras**, como **pill tintada** (`TintPill`, alpha 0.12) o como **tint de fondos** (`tint(color)`); texto e íconos sobre fills semánticos oscuros = **blanco** (`PALETTE.onAccent` / `onDark`). El semántico se usa también como texto/ícono sobre blanco (ej. saldo esmeralda). Evitar ámbar `#D89B22` y rojo como texto pequeño; usarlos como fill. **NO existen acentos neón** (eliminados por el usuario): todo acento es `PALETTE.primary` esmeralda o el semántico del área.

## Patrón de pantalla (aplicar en TODAS las screens)

```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.surface }}>
  <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />
  <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 16, gap: 16 }}>
    {/* contenido */}
  </ScrollView>
  <BottomNavigationBar activeTab="..." onSelectTab={...} />
</SafeAreaView>
```

- Cards y paneles: `backgroundColor: PALETTE.surfaceContainerLowest` (`#FFFFFF`), **SIN borde** + `...SHADOW.card`, `borderRadius: 18` (cards) / 12 (inputs y paneles interiores). Excepción: `CuentaCard`/`WalletCarousel` llevan su gradiente/sombra fuerte (esencia del usuario) — el carrusel marca la slide seleccionada con `TintPill` (tint esmeralda `categorias.finanzas`, scale 1; adyacentes 0.88). Fondos internos tintados: `PALETTE.surfaceContainer` (`#E9EFEB`) o `tint(color)` cuando la tint acompaña al área.
- **Sin halos neón**: ya no existe `NeonGlow`/`GLOW`. Los acentos de acciones, tab activa y selecciones se logran con **deep color sólido** (relleno semántico + texto `onAccent`/`onDark`) o con `TintPill` (tint suave del color). No añadir resplandores ni sombras de color.
- Modales de edición: bottom-sheet (`animationType="slide"`, `justifyContent: 'flex-end'`, borde superior 20 **sin borde negro**, `...SHADOW.modal` con sombra hacia arriba, overlay `rgba(19,26,24,0.4)`). Inputs: `backgroundColor: PALETTE.surfaceContainer` (tintado, sin borde), radius 12, texto `ink`; el error de validación solo añade `borderColor: critico`. Selectores (chips de divisa, cards de tipo, filas destino): sin borde; el estado seleccionado = relleno semántico + texto `onDark` (ver `divisaChip`, `tipoCard`, `destinoRow`). Cancelar = botón **tonal** (bg `surfaceContainer` + texto `ink`, sin borde); Guardar/acción = relleno semántico + texto `onAccent` (blanco), `borderRadius: 16`; opcionalmente envuelto en `TintPill` si se quiere resaltar. Todo modal sobre teclado: envolver en `ScrollView keyboardShouldPersistTaps="handled"` y `paddingBottom` con `useSafeAreaInsets().bottom` (evita que la barra de gestos tape los botones).
- Tipografía: **sistema normal, SIN tipografía condensada/comic** (no hay tokens `TYPO`). Títulos de pantalla 24 bold, saldos 28 bold, títulos de card 16–17 bold; labels 12, cuerpo 13–14, pesos 400/500/700/800. Sin tracking negativo.
- Botón primario: **relleno del color semántico del área + texto `PALETTE.onAccent` (blanco) bold**, `borderRadius: 16`, sin borde y **sin halo**. Si hace falta resaltar, envolver en `TintPill` del mismo color.
- **Feedback de press obligatorio**: todo `Pressable` usa `style={({ pressed }) => [styles.x, pressed && pressedFeedback]}` (escala 0.97).
- **Nunca** deshabilitar el botón de guardar por errores de validación (`disabled={tieneErrores}` es un bug conocido: tras el primer error queda muerto). Validar en cada pulsación y mostrar errores inline.
- Navegación: la barra inferior es una **píldora flotante** `BottomNavigationBar` (blanca, sin borde, sombra suave, radius 24 — ver `ButtonNavigationBar.tsx`); tab activa = ícono y label en esmeralda `PALETTE.primary` (sin relleno ni halo detrás — el verde neón lime y `NeonGlow` fueron eliminados). Orden de tabs `[billetera, inicio, actividades, metricas, perfil]` (Inicio hacia el centro, Actividades a su derecha). Toda transición entre tabs va por `navigateToTab(navigation, tabActual, tab)` desde `src/navigation/tabs.ts` (NO `navigation.navigate` directo fuera de ese helper). El root usa **`@react-navigation/stack`** (JS, NO native-stack), con transición estilo Linux en `src/navigation/transition.ts`: `SER_ESPEC_TRANSICION` (520ms, `Easing.inOut(cubic)`) + `interpoladorTab(params)`. La pantalla que entra desliza 100%→0 (dirección según `params.anim` = `slide_from_left/right`) con scale 1.04→1; la que queda abajo hace zoom-out (scale→0.96) y baja opacidad. El stack JS anima push y pop por igual → nunca hay corte seco (el pop de native-stack cortaba por exit de fragmento removido en Android). Volver a Inicio = `popToTop()` guardado con `canGoBack()` (el pop ya anima fluido; NO hay reset ni `BackHandler`). Pantallas tipadas: `Billetera: TabAnimParams | undefined`, `Actividades: TabAnimParams | undefined`, `Home: undefined`; usan `StackScreenProps`. `TAB_TO_SCREEN` registra `billetera→Billetera` y `actividades→Actividades`; las tab sin pantalla (Métricas/Perfil) no hacen nada hasta tener screen — al crearlas heredan `animParaTab` y su propia dirección de vuelta.
- **Carga asíncrona fluida (Billetera)**: render instantáneo apenas llegan las cuentas; movimientos/pagos de la cuenta activa se cargan en segundo plano con un `ActivityIndicator` por sección (pasando `cargando` a `PagosCard`/`MovementsTimeline`) y **caché a nivel módulo** (`cacheMovimientos`/`cachePagos`/`enVuelo` en `Billetera.tsx`, persistente entre desmontajes — por eso una re-entrada a la pantalla no vuelve a mostrar "Cargando…"). Reglas: `cargarDetalle(id)` devuelve temprano si ya está en caché o en vuelo; las **mutaciones** usan `refrescarDetalle(id)` (invalida caché + recarga), nunca `cargarDetalle` directo (se saltaría con datos viejos). NUNCA un spinner de pantalla completa que bloquee el carrusel ni forzar re-render del `FlatList` del carrusel (mantener `cuentas` memeada estable mientras no cambie la lista, para que el swiping no se congele).

## Componentes reales (usar estos, no recrear)

Todos en `src/components/`:

| Componente | Props | Uso |
|---|---|---|
| `ProfileBanner` (`profileBanner.tsx`) | `usuario: Usuario; onEditPress: () => void` | Banner de perfil con iniciales y edad |
| `EditProfileModal` (`EditProfile.tsx`) | `visible; currentProfile: Usuario; onClose; onSave` | Edición validada del perfil |
| `GoalProgressCard` (`goalProgressCard.tsx`) | — (sin props, aún mock) | Progreso de objetivo (índigo) |
| `ComparisonCard` (`ComparasionCard.tsx`) | — (sin props, aún mock) | Comparativa mensual |
| `DistributionCard` (`DistributionCard.tsx`) | — (sin props, aún mock) | Distribución por categoría |
| `BottomNavigationBar` (`ButtonNavigationBar.tsx`) | `activeTab: 'inicio'\|'billetera'\|'actividades'\|'metricas'\|'perfil'; onSelectTab?: (tab) => void` | Barra inferior con safe-area; pasar `onSelectTab` para navegar |
| `CuentaCard` (`CuentaCard.tsx`) | `data: CuentaCardData { id: string; nombre; entidad; divisa; monto; colorInicio; colorFin }` + `LinearGradient` | Tarjeta de cuenta estilo débito |
| `WalletCarousel` (`WalletCarrousel.tsx`) | `cuentas: CuentaCardData[]; selectedIndex: number; onSelectCuenta: (index) => void` | Carrusel con efecto peeking (seleccionada scale 1 / adyacentes 0.88) y dots de paginación |
| `AccountSummary` (`AccountSummary.tsx`) | `cuenta: Billetera; ingresosMes: number; egresosMes: number; onIngreso; onEgreso; onTransferir` | Saldo + ingresos/egresos del mes + acciones |
| `PagosCard` (`PagosCard.tsx`) | `pagos: Pago[]; divisa: string; saldo: number; cargando?: boolean; onAddPago; onPagar; onDelete` | Tablita de pagos de la cuenta (únicos y mensuales) con progreso, botón Pagar y fila de carga si `cargando` |
| `AddPagoModal` (`AddPagoModal.tsx`) | `visible; cuentaNombre; onClose; onSave({nombre, monto, tipo})` | Alta validada de pago (único o mensual) |
| `PayPagoModal` (`PayPagoModal.tsx`) | `visible; pago: Pago\|null; saldo; divisa; onClose; onSave(monto)` | Pagar un pago: completar el restante o abonar un monto parcial |
| `MovementsTimeline` (`MovementsTimeline.tsx`) | `movimientos: Movimiento[]; cuentaId: number; divisa: string; nombresBilletera: Record<number, string>; cargando?: boolean` | Historial agrupado por mes y día; filas desplegables con detalle completo, badge "Pago" en movimientos vinculados y fila de carga si `cargando` |
| `AddMovimientoModal` (`AddMovimientoModal.tsx`) | `visible; tipo: 'ingreso'\|'egreso'; cuentaNombre; onClose; onSave` | Registro validado de ingreso/salida |
| `TransferModal` (`TransferModal.tsx`) | `visible; origen: Billetera; destinos: Billetera[]; onClose; onSave` | Transferencia entre cuentas (mismo divisa) |
| `AddBilleteraModal` (`AddBilleteraModal.tsx`) | `visible; ciUsuario: string\|undefined; onClose; onSave` | Alta validada de billetera (divisas whitelist) + meta opcional |
| `GreetingHeader` (`GreetingHeader.tsx`) | `dateLabel; greeting; pendingCount; accentColor` | Cabecera de saludo con pendientes del día |
| `ContextButton` (`ContextButton.tsx`) | `tipo: TipoActividad; onPress` | Selector del tipo de actividad activo |
| `ContextSelectorSheet` (`ContextSelectorSheet.tsx`) | `visible; tipos: TipoActividad[]; activeTipoId?; pendientesPorTipo; onSelect; onCreateTipo; onClose` | Bottom-sheet para cambiar/crear tipo de actividad |
| `WeekStrip` (`WeekStrip.tsx`) | `days: DayItem[]; selectedDayId; onSelectDay; accentColor` | Strip de la semana actual (Lun–Dom) |
| `TaskList` (`TaskList.tsx`) | `title; actividades: Actividad[]; pendingCount; accentColor; onToggle; onAddPress` | Lista de actividades del tipo activo + botón agregar |
| `TaskCard` (`TaskCard.tsx`) | `actividad: Actividad; accentColor; origenLabel?; onToggle` | Card de actividad con checkbox de completado |
| `AddActividadModal` (`AddActividadModal.tsx`) | `visible; tipoNombre; accentColor; onClose; onSave` | Alta validada de actividad del día |
| `NuevoTipoActividadModal` (`NuevoTipoActividadModal.tsx`) | `visible; onClose; onSave` | Alta validada de tipo de actividad (color del palette + emoji) |

## Datos y repositorios

- Solo SQLite vía `src/database/db.ts` (`getDatabase()`). Modelos en `src/repositories/`: `usuario.ts` (`Usuario`), `billetera.ts` (`Billetera`, `DIVISAS`), `movimientos.ts` (`Movimiento`, `TipoMovimiento`, `signoMovimiento`), `pagos.ts` (`Pago`, `TipoPago`), `actividadRepo.ts` (`TipoActividad`, `Actividad`, `TIPOS_INICIALES`, `COLORES_TIPO_ACTIVIDAD`).
- **Siempre** cargar datos con repositorios (`getUsuarios`, `getBilleteras`, `getMovimientosByBilletera`, `getPagosByBilletera`, …) y estados de carga. **Prohibido** mockear datos de usuario/billetera/movimientos/pagos dentro de las screens cuando ya existe el repositorio.
- `Usuario.ci` es la clave y FK de `billetera.ci_usuario`. Antes de crear una billetera, obtener el usuario actual con `getUsuarios()`.
- Movimientos asociados a una cuenta: `getMovimientosByBilletera(id)` devuelve los que involucran a la cuenta (origen *o* destino). Ingresos/egresos y transferencias se persisten en transacción (`withExclusiveTransactionAsync`): ajustan `billetera.monto` al mismo tiempo que insertan el movimiento. Transferencias solo entre cuentas de la misma divisa.
- `createBilletera` devuelve el `lastInsertRowId` (para seleccionar la nueva cuenta en el carrusel).
- **Pagos**: cada cuenta puede tener pagos `individual` (se completan una sola vez) o `mensual` (su progreso vuelve a cero cada mes). El progreso (`pagado`) se **deriva de los movimientos vinculados** (`movimientos_finan.pago_id`): individual = suma de todos los tiempos; mensual = suma del mes en curso. `pagarPago` descuenta saldo e inserta el movimiento egreso vinculado, todo en una transacción validando saldo y pendiente. No duplicar ese estado en otra columna.
- **Actividades (vista tab `actividades`)**: tipos creables en `tipo_actividad` (nombre único, color del palette `categorias`, emoji, orden) y actividades del día en `actividad` (fecha `YYYY-MM-DD`, `tipo_actividad_id`, título, descripción/hora opcionales, `completado` 0/1, `proyecto_id` opcional como origen). Semilla con `asegurarTiposIniciales()` (Trabajo→`categorias.trabajo`, Universidad→`categorias.objetivos` índigo, Ocio→`categorias.ocio`); los tipos nuevos eligen color de `COLORES_TIPO_ACTIVIDAD`. `ActividadesScreen` carga todas las actividades del día y filtra por tipo en memoria; toggle optimista + `toggleActividad`. Días de la semana: `src/utils/semana.ts` (`fechaSemana`, `etiquetaFecha`, `saludoPorHora`, `toISODate`).
- Validación y parseo numérico: `src/utils/validacion.ts`. Signos y formato de divisas: `src/utils/divisas.ts` (`signoDivisa`, `formatMonto`) — no duplicar mapas de divisas en componentes.

## Validación y seguridad (obligatorio en TODA entrada de datos)

- **Queries**: siempre parametrizadas (`runAsync(sql, [parametros])`). Nunca concatenar strings de usuario en SQL.
- **Strings**: `trim()` antes de validar/persistir; validar longitud mínima/máxima (nombre/entidad: 2–60, objetivo: máx 80, descripción: máx 160).
- **Números**: usar `parseNumero`/`validarMonto`/`validarMontoOpcional` de `src/utils/validacion.ts` (parseo tolerante a coma, `Number.isFinite`, rangos lógicos, rechazar negativos, ≤2 decimales). Nunca persistir `NaN` (ej. `parseFloat` directo está prohibido).
- **Valores cerrados (enums)**: whitelist. Divisa solo desde `DIVISAS` de `src/repositories/billetera.ts`.
- **Errores**: `console.error` con mensaje genérico, sin datos sensibles ni personales. En la UI, `Alert.alert` antecedido de `console.error`.
- **Estado**: mostrar `ActivityIndicator` mientras se lee SQLite y estados vacíos descriptivos.
- **Otro segmento**: nunca loguear ni persistir credenciales/tokens.
