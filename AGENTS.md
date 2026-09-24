# AGENTS.md — agenda-app

**Expo v57**: antes de usar APIs nuevas, leer https://docs.expo.dev/versions/v57.0.0/

## Contexto (IMPORTANTE)
Al INICIAR cada chat: leer **`CONTEXT.md`** (mapa del árbol, firmas de repos, estado, pendientes, trampas). No leer archivos de `src/` salvo que vayan a editarse. Tras terminar un trabajo, actualizar `CONTEXT.md` §10-§11.

## Design System (normas duras)
- Estética **calmada y sobria**: superficie `#FAF9F7`, cards blancas `#FFFFFF` con `SHADOW.card` (radius 18) y **sin bordes negros** (separadores `PALETTE.hairline #DDE5E1`). **Cero neón** (no existe `NeonGlow`/GLOW/lime/cyan/pink).
- Acentos/tab activa/selecciones = esmeralda `PALETTE.primary #16876A` o el semántico del área (`PALETTE.categorias.*`). Botones de color = relleno sólido + texto `onAccent`/`onDark` (blanco), o `TintPill` (tint 12%).
- Tinta `ink #1E293B`; secundaria `#55606E`. Tipografía sistema, pesos 400/500/600/700.
- **Todo token sale de `src/theme/theme.ts`** (`PALETTE`, `SHADOW`, `RADIUS`, `pressedFeedback`, `tint()`). Prohibido hexes sueltos.
- Tabla de tokens/completas y categorías: `CONTEXT.md` §5.

## Patrón de pantalla (todas las screens)
```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.surface }}>
  <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />
  <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 16, gap: 16 }}>
    {/* contenido */}
  </ScrollView>
  <BottomNavigationBar activeTab="..." onSelectTab={...} />
</SafeAreaView>
```
- Cards: bg `surfaceContainerLowest`, **sin borde** + `SHADOW.card`, radius 18 (inputs/paneles 12).
- Modales: bottom-sheet (`animationType="slide"`, overlay `rgba(19,26,24,0.4)`, `SHADOW.modal` hacia arriba). Inputs `surfaceContainer` sin borde; error solo `borderColor: critico`. Cancelar = tonal; Guardar = relleno semántico + `onAccent`, radius 16. Siempre `keyboardShouldPersistTaps="handled"` + `paddingBottom` con insets.
- **Feedback de press obligatorio**: todo `Pressable` usa `style={({ pressed }) => [styles.x, pressed && pressedFeedback]}`.
- **Nunca** `disabled` en Guardar por errores (queda muerto): validar en cada pulsación + errores inline.
- Tipografía: títulos 24 bold, saldos 28, cards 16-17, labels 12, cuerpo 13-14. Sin tipografía condensada/comic.
- Navegación: píldora `BottomNavigationBar` (tabs `[billetera, inicio, actividades, metricas, perfil]`); toda transición de tab por `navigateToTab(navigation, actual, tab)` desde `src/navigation/tabs.ts` (nunca `navigate` directo). Root = `@react-navigation/stack` (JS, **NO** native-stack) con transición `transition.ts` (520ms). Volver a Inicio = `popToTop()` con `canGoBack()`. Sin BackHandler/reset.
- **Billetera**: render instantáneo de cuentas; detalle en background con caché de módulo (`cacheMovimientos`/`cachePagos`/`enVuelo`); mutaciones con `refrescarDetalle(id)` (invalida caché), nunca `cargarDetalle` directo. NUNCA spinner de pantalla completa ni re-montar el FlatList del carrusel.

## Datos y repositorios
- Solo SQLite vía `getDatabase()` (`src/database/db.ts`). Cargar SIEMPRE con repositorios + estados de carga; **prohibido** mockear datos en screens cuando existe repo.
- Firmas completas de repos y modelo de Actividades (recurrencia, 3 modos de borrado, guard anti-regeneración): `CONTEXT.md` §4.
- `Usuario.ci` = FK de `billetera.ci_usuario` (obtener usuario con `getUsuarios()` antes de crear billetera).
- Pagos: progreso **derivado** de `movimientos_finan.pago_id` (no columna duplicada). `pagarPago` en transacción.
- Migraciones de columnas nuevas = `ensureColumn` en `db.ts` + `schema.ts` (instalaciones nuevas).

## Validación y seguridad (toda entrada de datos)
- Queries **parametrizadas** (`runAsync(sql, [params])`); nunca concatenar strings de usuario en SQL.
- `trim()` + longitudes (nombre/entidad 2–60, objetivo ≤80, descripción ≤160).
- Números: `parseNumero`/`validarMonto`/`validarMontoOpcional` de `src/utils/validacion.ts` (coma tolerante, `Number.isFinite`, ≤2 decimales). **Nunca** `parseFloat` directo ni persistir `NaN`.
- Enums por whitelist (`DIVISAS` de `billetera.ts`, prioridades, estados).
- Errores: `console.error` genérico sin datos sensibles; en UI `Alert.alert` tras el log. No loguear credenciales/tokens.
- Estados de carga: `ActivityIndicator` + estados vacíos descriptivos.

## Comandos
- Typecheck: `& "node_modules\.bin\tsc.cmd" --noEmit` (exit 0) — obligatorio tras cambios.
- `npx` bloqueado en PowerShell → `& npx.cmd expo install ...`.

## Trampas conocidas
- `TransitionSpec`/`CardStyleInterpolator` no se exportan de `@react-navigation/stack` → usar `StackNavigationOptions['transitionSpec']` y `StackCardStyleInterpolator`.
- Editar líneas >2000 chars (docs): usar Write completo o temp + `ReadAllLines`/`WriteAllLines` (UTF8 sin BOM), no Edit.
- Imports del mockup viejo inexistentes (`../types`, `../theme` sin index, tokens `colors/spacing/typography`) → todo de `src/theme/theme.ts` + `@expo/vector-icons`.
