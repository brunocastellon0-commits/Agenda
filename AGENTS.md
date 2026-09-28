# AGENTS.md — agenda-app

**Expo v57**: antes de usar APIs nuevas, leer https://docs.expo.dev/versions/v57.0.0/

## Contexto (IMPORTANTE)
Al INICIAR cada chat: leer **`CONTEXT.md`** (mapa del árbol, firmas de repos, estado, pendientes, trampas). No leer archivos de `src/` salvo que vayan a editarse. Tras terminar un trabajo, actualizar `CONTEXT.md` §10-§11.

## Design System (normas duras) — "Expressive Editorial Personal Dashboard"
- **Lienzo blanco puro** `PALETTE.surface #FFFFFF`; identidad **cyan oscuro `PALETTE.primary #155860`** (CTA, tab activa, selección, eyebrow) + `accent #0891B2` (progreso). Cards/sheets `surfaceContainerLowest #FFFFFF` **sin borde** + `SHADOW.card` (radius `RADIUS.cards` 24); separadores `PALETTE.hairline #E2E8F0` (**prohibido borde negro**). Cero neón/glow.
- **Lenguaje editorial** (`src/components/editorial/`, exportado por `index.ts`): `Eyebrow` (título de sección), `BigNumber` (número como elemento gráfico: `size` display/displaySm, `tone`/`labelTone` incl. `onColor`), `ColorBlock` (`solid`/`tint`/`open`, sin borde), `ProgressBar`. Composición: 1 número grande por bloque + label mayúsculas + apoyo `caption`; filas asimétricas (`flex 3 / flex 2`); **bloques abiertos** (hairline, sin bg/sombra) para filas navegables; nunca card dentro de card.
- Tinta `ink #0F172A`; secundaria `#475569`; `ash #64748B`. Tipografía sistema vía **`TYPE`** (`display 52 / displaySm 36 / title 28 / subtitle 18 / body 14 / caption 12 / label 11 uppercase`), pesos 400/500/600/700, **sin tracking negativo**. Ritmo `SPACE` (4/8/16/24/32/48).
- **Todo token sale de `src/theme/theme.ts`** (`PALETTE`, `TYPE`, `SPACE`, `RADIUS`, `SHADOW`, `pressedFeedback`, `tint()`, `PALETTE.scrim`). Prohibido hexes sueltos.
- **Prohibiciones de estilo**: sin dark mode; sin abandonar el fondo blanco; sin minimalismo vacío; sin exceso de cards/bordes/pills/**gradientes**/sombras (`SHADOW.lift` solo heroes); sin emojis como sustituto de diseño (iconos `Ionicons`/`MaterialIcons`); sin datos mock ni inventados en UI.
- Tabla de tokens, componentes y categorías: `CONTEXT.md` §5-§6. Skill cargable: `.opencode/skills/agenda-design-system/SKILL.md`.

## Patrón de pantalla (todas las screens)
```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.surface }}>
  <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />
  <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 16, gap: 16 }}>
    {/* contenido: Eyebrow + bloques editoriales */}
  </ScrollView>
  <BottomNavigationBar activeTab="..." onSelectTab={...} />
</SafeAreaView>
```
- Cards: bg `surfaceContainerLowest`, **sin borde** + `SHADOW.card`, radius 24 (inputs/paneles 16, bloques de color `RADIUS.block` 20).
- Modales: bottom-sheet (`animationType="slide"`, overlay `PALETTE.scrim`, top radius `RADIUS.hero` 28, `SHADOW.modal` hacia arriba). Inputs `surfaceContainer` sin borde; error solo `borderColor: critico`. Cancelar = tonal; Guardar = relleno semántico + `onAccent`, radius 16. Siempre `keyboardShouldPersistTaps="handled"` + `paddingBottom` con insets.
- **Feedback de press obligatorio**: todo `Pressable` usa `style={({ pressed }) => [styles.x, pressed && pressedFeedback]}`; targets ≥ 44×44 (o `hitSlop`).
- **Nunca** `disabled` en Guardar por errores (queda muerto): validar en cada pulsación + errores inline.
- Tipografía: títulos `TYPE.title` 28 bold, números `TYPE.display/displaySm`, labels `TYPE.label` 11 uppercase, cuerpo 13-14. Sin tipografía condensada/comic.
- Navegación: píldora `BottomNavigationBar` (tabs `[billetera, inicio, actividades, metricas, comida]`); toda transición de tab por `navigateToTab(navigation, actual, tab)` desde `src/navigation/tabs.ts` (nunca `navigate` directo). Root = `@react-navigation/stack` (JS, **NO** native-stack) con transición `transition.ts` (520ms) y **`gestureEnabled: false`** (sin swipe-back; `app.json → predictiveBackGestureEnabled: false`). Volver a Inicio = `popToTop()` con `canGoBack()`. Sin BackHandler/reset.
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
- Icono/splash (`assets/icon-1024.png`, `assets/mascota.png`, generado desde `assets/reloj1.jpg`) solo se ven en dev build/EAS, **no en Expo Go**.
