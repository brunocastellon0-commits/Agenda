---
name: expo-rn-token-efficiency
description: Reglas para gastar pocos tokens (al iniciar un chat, tomar contexto, compactar y hacer handoff entre chats) y buenas prácticas de React Native con Expo. Úsalo SIEMPRE al empezar una sesión, al compactar contexto, al cambiar de chat, y en cualquier tarea de código en un proyecto Expo / React Native / Expo Router, aunque el usuario no lo pida explícitamente.
---

# Eficiencia de tokens + React Native con Expo

Cada token leído o escrito cuesta. Objetivo: **leer lo mínimo, escribir lo mínimo, y dejar el estado guardado en disco para no reconstruirlo en cada chat.**

---

## 1. Al iniciar un chat (tomar contexto barato)

Orden obligatorio:


1. Localizar con búsqueda, no con lectura: `grep -rn "NombreSímbolo" app src --include=*.ts*` o glob. Luego leer **solo el rango de líneas** necesario.
2. Máximo ~5 archivos leídos antes de empezar a trabajar. Si necesitas más, pregunta o delega la exploración.
3. Nunca releer un archivo que ya está en el contexto de este chat.

**Prohibido leer o listar:**
`node_modules/`, `.expo/`, `ios/`, `android/` (son generados), `dist/`, `build/`, `.git/`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lockb`, imágenes/fuentes/assets binarios, archivos `*.map`, `coverage/`.

**Prohibido:** `ls -R`, `find .` sin filtro, `tree` sin `-L 2 -I node_modules`, `cat` de archivos grandes.

Para entender el proyecto usa: `package.json` (solo `dependencies` y `scripts`), `app.json`/`app.config.ts`, y la carpeta `app/` (rutas) con `ls` de un nivel.

---

## 2. Salida de comandos: siempre acotada

Nunca dejar que un comando vuelque logs completos al contexto.

| En vez de | Usar |
|---|---|
| `npx tsc` | `npx tsc --noEmit 2>&1 \| head -40` |
| `npx eslint .` | `npx eslint <archivos_cambiados> --quiet` |
| `npx jest` | `npx jest <archivo> --silent 2>&1 \| tail -40` |
| `npm install x` | `npx expo install x 2>&1 \| tail -10` |
| `git diff` | `git diff --stat` primero, luego diff del archivo puntual |
| `git log` | `git log --oneline -10` |
| Logs de Metro / EAS | `\| tail -30` o `\| grep -i error` |

Si un comando falla, leer **solo el primer error**; arreglarlo antes de mirar el resto (los demás suelen ser en cascada).

---

## 3. Persistencia de estado (clave para no gastar en cada chat nuevo)

Mantener en la raíz un archivo **`STATE.md`** (máx. 40 líneas). **Se actualiza durante el trabajo**, al cerrar cada subtarea, no al final ni al momento de compactar.

Plantilla:

```md
# STATE
## Objetivo actual
<1-2 líneas>

## Hecho
- <cambio> — `ruta/archivo.tsx:línea`

## Decisiones (no re-discutir)
- <decisión> — porque <razón corta>

## Pendiente (en orden)
1. ...
2. ...

## Comandos útiles
- test: `npx jest path --silent`
- typecheck: `npx tsc --noEmit | head -40`

## Trampas conocidas
- <bug/quirk que costó descubrir>
```

Reglas:
- Referenciar **rutas y líneas**, nunca pegar bloques de código.
- Borrar lo que ya no sirve; no acumular historial.
- Solo hechos verificados, nada especulativo.

---

## 4. Compactación y cambio de chat

**Cuándo cortar:** al terminar una unidad lógica de trabajo, o cuando el contexto pase ~60-70 %. No esperar al autocompact: compactar tarde es caro y pierde calidad. **Un chat = una tarea.**

**Antes de compactar / cerrar el chat:**
1. Actualizar `STATE.md`.
2. Generar el resumen en este formato fijo (máx. ~200 palabras):

```
Objetivo: ...
Estado: <qué funciona / qué no>
Archivos tocados: ruta:línea, ruta:línea
Decisiones: ...
Siguiente paso exacto: ...
```

**El resumen NO debe incluir:** código pegado, stack traces, salida de comandos, exploración descartada, intentos fallidos (salvo la lección en una línea), ni la conversación cronológica.

**Al retomar en chat nuevo:** leer `STATE.md` y seguir el "Siguiente paso exacto". Nada más.

---

## 5. Cómo trabajar sin desperdiciar tokens

- **Editar quirúrgicamente** (str_replace / patch). No reescribir archivos completos. No volver a imprimir el archivo tras editarlo.
- **No repetir el plan ni recapitular** lo que el usuario acaba de decir. Responder directo.
- Respuestas cortas: qué cambiaste (rutas), qué falta, y ya. Sin explicaciones no pedidas.
- Si la tarea es ambigua, **una sola pregunta concreta** antes de gastar tokens en implementar lo equivocado.
- Explorar en paralelo con subagentes o búsquedas dirigidas cuando la investigación es grande; traer de vuelta solo el resumen.
- No instalar ni leer documentación completa: buscar la sección exacta (`docs.expo.dev`) y leer solo eso.
- Verificar una vez al final (typecheck + test del archivo tocado), no tras cada línea editada.

Archivo `.claudeignore` / `.cursorignore` recomendado:

```
node_modules/
.expo/
ios/
android/
dist/
build/
coverage/
*.lock
package-lock.json
*.map
assets/
```

---

## 6. Buenas prácticas React Native + Expo

> Antes de asumir una API, **revisar la versión de `expo` en `package.json`**: el SDK cambia rápido y algunas recomendaciones dependen de la versión.

### Estructura y arquitectura
- **Expo Router** (rutas por archivos en `app/`). Mantener las pantallas delgadas: la lógica va en hooks (`src/hooks`), servicios (`src/services`) y componentes (`src/components`).
- Habilitar **typed routes** (`experiments.typedRoutes: true`) y **TypeScript `strict`**.
- Carpetas por feature cuando el proyecto crece (`src/features/auth/...`), no por tipo de archivo global.
- Alias de imports (`@/`) en `tsconfig.json` para evitar `../../../`.

### Dependencias y configuración
- Instalar siempre con **`npx expo install <paquete>`** (respeta la versión compatible con el SDK). Nunca `npm install` a ciegas para paquetes nativos.
- Tras subir de SDK o si algo raro falla: `npx expo install --fix` y `npx expo-doctor`.
- **No editar `ios/` ni `android/` a mano** (Continuous Native Generation). Cambios nativos vía `app.config.ts` y config plugins; regenerar con `npx expo prebuild --clean` solo si hace falta.
- Usar **development build** (`expo-dev-client`) en cuanto se necesiten módulos nativos fuera de Expo Go.
- Variables de entorno cliente con prefijo `EXPO_PUBLIC_`. **Nunca poner secretos en el bundle**; tokens sensibles en `expo-secure-store`, no en AsyncStorage.
- Builds y updates con **EAS** (`eas build`, `eas update`); separar perfiles `development` / `preview` / `production` en `eas.json`.

### Rendimiento
- Listas: `FlatList` bien configurada (`keyExtractor` estable, `renderItem` memoizado, `getItemLayout` si el alto es fijo, `initialNumToRender`/`windowSize` ajustados) o **FlashList** para listas largas. Nunca `ScrollView` + `.map()` para listas grandes.
- Imágenes con **`expo-image`** (caché, placeholders, `contentFit`) y assets optimizados (WebP/tamaño correcto).
- Animaciones con **Reanimated** (hilo de UI); evitar `Animated` con `setState` por frame.
- Evitar re-renders: no crear objetos/funciones nuevas en props de componentes de lista; `React.memo` / `useCallback` / `useMemo` donde el profiling lo justifique. Si el proyecto usa **React Compiler**, no memoizar a mano por defecto.
- Hermes y **New Architecture** vienen por defecto en SDKs recientes: no desactivarlos sin motivo y verificar que las librerías nativas sean compatibles.
- No importar librerías enteras (`import _ from 'lodash'` → `import debounce from 'lodash/debounce'`). Revisar peso con `npx expo export` cuando el bundle crece.
- Medir antes de optimizar: React DevTools Profiler y Perf Monitor, no intuición.

### Estado y datos
- **TanStack Query** para datos de servidor (caché, reintentos, invalidación). No hacer `fetch` en `useEffect` a mano.
- **Zustand** (o Context para casos simples) para estado de UI/cliente. Evitar prop drilling profundo.
- Validar respuestas de API con **Zod** en el borde; tipar todo lo que entra a la app.
- Persistencia: `expo-secure-store` (sensible), MMKV/AsyncStorage (no sensible).

### UI y plataforma
- `StyleSheet.create` (o el sistema de estilos elegido: NativeWind, Unistyles, Tamagui) de forma consistente; un solo enfoque por proyecto.
- **`react-native-safe-area-context`** en todas las pantallas (notch, barra inferior). `KeyboardAvoidingView`/`KeyboardAwareScrollView` en formularios.
- Diferencias iOS/Android con `Platform.select` o archivos `.ios.tsx` / `.android.tsx`, no `if` dispersos.
- Accesibilidad: `accessibilityLabel`, `accessibilityRole`, áreas táctiles ≥ 44×44 pt, contraste suficiente, soporte de tamaño de fuente del sistema.
- Tema claro/oscuro con `useColorScheme` y tokens de color centralizados.
- Manejar estados de **carga, vacío y error** en cada pantalla con datos remotos.

### Calidad
- ESLint (`eslint-config-expo`) + Prettier; `tsc --noEmit` en CI.
- Tests con **`jest-expo`** + **React Native Testing Library**: probar comportamiento (lo que ve/hace el usuario), no detalles de implementación.
- Error boundaries y reporte de errores (Sentry) en producción.
- Manejar permisos (cámara, ubicación, notificaciones) pidiéndolos en contexto y con fallback si el usuario los niega.
- Deep links, notificaciones y OTA updates: probar en build real, no solo en Expo Go.

---

## 7. Checklist rápido antes de responder

- [ ] ¿Leí `STATE.md` en vez de explorar el repo?
- [ ] ¿Busqué con grep/glob y leí solo rangos de líneas?
- [ ] ¿Todos los comandos tienen salida limitada?
- [ ] ¿Edité con parches en vez de reescribir archivos?
- [ ] ¿Actualicé `STATE.md` tras la subtarea?
- [ ] ¿Usé `npx expo install` para dependencias nativas?
- [ ] ¿Mi respuesta es corta y sin recapitular?