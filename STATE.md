# STATE

## Objetivo actual
Vista de **Actividades** (tab nueva a la derecha de Inicio): la vista del mockup "tareas" adaptada al sistema real — tipos de actividad creables (trabajo/universidad/ocio), lista por día con selección de semana, tarjetas teñidas según el tipo activo. COMPLETADO; falta validar en dispositivo.

## Hecho
- Refresco visual (previo): `theme/theme.ts` sin neón (`primary #16876A`, superficies tintadas, tinta `#1E293B`), `TintPill` en vez de `NeonGlow`, navbar activo en esmeralda sin halo.
- Navegación: stack JS (`@react-navigation/stack`) con transición estilo Linux (`transition.ts`, 520ms, zoom-out de la cubierta); vuelta a Inicio = `popToTop()`. `TAB_ORDER` ahora `[billetera, inicio, actividades, metricas, perfil]`; `TAB_TO_SCREEN` registra `billetera→Billetera` y `actividades→Actividades`.
- **Vista Actividades**: esquema + repos + componentes:
  - `database/schema.ts`: tablas nuevas `tipo_actividad` y `actividad` (+ índice por fecha) con `tipo_actividad_id` FK y `proyecto_id` FK opcional (origen).
  - `repositories/actividadRepo.ts` (era un stub con typo): `TipoActividad`/`Actividad`, `TIPOS_INICIALES`, `COLORES_TIPO_ACTIVIDAD`, `asegurarTiposIniciales`, `getTiposActividad`, `crearTipoActividad`, `getActividades`, `crearActividad`, `toggleActividad`.
  - `utils/semana.ts`: `DayItem`, `fechaSemana` (Lun–Dom), `etiquetaFecha`, `saludoPorHora`, `toISODate`.
  - Componentes adaptados (mockup → sistema): `GreetingHeader`, `ContextButton`, `ContextSelectorSheet` (con "Crear tipo"), `WeekStrip`, `TaskList` (era copia de WeekStrip), `TaskCard`; + modales `AddActividadModal`, `NuevoTipoActividadModal`.
  - `Actividades.tsx` (reemplaza y elimina `Tareas.tsx`, que era 100% props de mockup): carga real con `useFocusEffect`, día seleccionable, filtro por tipo en memoria, toggle optimista, pendientes por tipo.
- `AGENTS.md` actualizado (tabs/orden, tabla de componentes, repositorios de actividades).

## Decisiones (no re-discutir)
- `ios_from_left/right` = 200ms fijos en Android → se ve apurado; el desliz calmado es `slide_from_left/right` (dirección en `params.anim`).
- native-stack pop cortaba en seco (exit de fragmento removido en Android) → stack JS siempre anima push y pop; nunca volver a native-stack para transiciones.
- Neón eliminado por decisión del usuario; armonía con superficies tintadas + tinta profunda.
- La pantalla del mockup era **actividades** (no tareas): el selector de arriba filtra por **tipo de actividad** creable (trabajo → `categorias.trabajo`, universidad → `categorias.objetivos`, ocio → `categorias.ocio`); la misma vista cambia de color según el tipo. `proyecto` se usa como "origen" opcional (FK `proyecto_id`).
- `ActividadesScreen` carga todo el día (todas las tipos) con `getActividades(fecha)` y filtra en memoria; no hay tabla "tareas" ni "contextos".

## Pendiente (en orden)
1. Probar en celular (Expo Go): tab Actividades (ida/vuelta fluida), selector de tipo, crear tipo, agregar/completar actividad por día de la semana.
2. Si la app queda en dev-client: rebuild por los módulos nativos (gesture-handler).
3. (Ideas) Vincular `proyecto_id` a la UI como "origen"; si los tipos crecen mucho, seeder único para usuario.

## Comandos útiles
- typecheck: `& "node_modules\.bin\tsc.cmd" --noEmit` (exit 0)

## Trampas conocidas
- `npx` bloqueado en PowerShell → usar `& npx.cmd expo install ...`
- `TransitionSpec`/`CardStyleInterpolator` NO se exportan desde `@react-navigation/stack`: usar `StackNavigationOptions['transitionSpec']` y `StackCardStyleInterpolator`/`StackCardInterpolationProps`.
- Editar líneas largas (AGENTS.md): usar archivo temp + `ReadAllLines`/`WriteAllLines` (UTF8 sin BOM), no el Edit tool (trunca a 2000 chars).
- El mockup generó archivos con imports inexistentes (`../types`, `../theme` sin index, `./icons/Icons`, `BottomNav`, tokens `colors/spacing/typography`): todo token sale de `src/theme/theme.ts` y los íconos de `@expo/vector-icons` (MaterialIcons).