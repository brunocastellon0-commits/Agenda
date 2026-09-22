Plan de Mejora Estética (Estilo Billetera, Calendario Cuadernito & Badges Notificación)
Este plan integra las preferencias visuales clave expresadas por el usuario: tomar la estética de Billetera (tarjetas elegantes, gradientes sutiles, carrusel con elevación/escalado, tipografía clara) como referente para elevar Actividades, Métricas e Inicio, sustituir los emojis por MaterialIcons, cambiar la franja horizontal por un Calendario Estilo Cuadernito y presentar los contadores de tareas pendientes como Badges de Notificación de Redes Sociales.

1. Claves del Estilo Visual y Preferencias del Usuario
Adopción de la Estética de Billetera:

Aplicar el nivel de refinamiento visual de la pantalla Billetera (tarjetas con gradientes semánticos sutiles, carrusel peeking, chips tintados, sombras Material SHADOW.card, tipografía profunda #1E293B y cero bordes oscuros) a las vistas de Actividades, Métricas e Inicio.
Badges de Notificación (Estilo Redes Sociales):

Eliminar textos informativos largos tipo "actividades pendientes".
En su lugar, colocar en los selectores de tipo/área un Badge de Notificación superpuesto o al lado del ícono (píldora con contador numérico destacado [ 3 ] estilo mensajes sin leer de aplicaciones sociales).
Calendario Estilo Cuadernito (NotebookCalendar):

Reemplazar la barra horizontal de 1 línea (WeekStrip) por una vista de Cuadernito / Grilla de Calendario (NotebookCalendar).
Diseño tipo hoja de cuaderno de notas: encabezado con mes/año, días organizados en grilla por columnas (Lun–Dom), día seleccionado resaltado con círculo semántico (esmeralda/índigo) e indicadores de densidad de actividades (puntos/indicadores por estado).
Reemplazo Total de Emojis por Íconos Vectoriales (MaterialIcons):

tipo_actividad.icon_name almacenará el nombre del ícono ('work', 'school', 'sports_esports', 'fitness_center', 'shopping_cart', etc.).
Modal NuevoTipoActividadModal con cuadrícula de selección de íconos vectoriales.
2. Rediseño de Pantallas
A. Pantalla de Inicio (Hub Conectado con Estética Billetera)
Transformación en un Centro de Control dinámico con la elegancia visual de Billetera:


┌─────────────────────────────────────────────────────────────┐
│  ProfileBanner (Header con iniciales & fecha)               │
├─────────────────────────────────────────────────────────────┤
│  [ Resumen Financiero ] (Tarjeta Gradiente / Saldo Total)   │
│  Saldo total consolidado • Alertas de pagos del mes         │
├─────────────────────────────────────────────────────────────┤
│  [ Mi Día ] (Avance con Cuadernito & Top 3 Tareas de Hoy)   │
│  Badge estilo notificación de pendientes • Accesos rápidos  │
├─────────────────────────────────────────────────────────────┤
│  [ Métricas Rápida ] (Racha Activa & Cumplimiento %)        │
│  Visualización gráfica de racha y tasa de compromisos       │
├─────────────────────────────────────────────────────────────┤
│  [ Proyectos en Curso ] (Progreso por Objetivo/Proyecto)   │
└─────────────────────────────────────────────────────────────┘
B. Pantalla de Actividades
Selectores de Tipo: Con Badges de Notificación destacados (píldora roja/esmeralda con el número de tareas sin completar).
Calendario Cuadernito (NotebookCalendar.tsx): Reemplaza el WeekStrip horizontal por una grilla limpia y táctil tipo agenda escolar/cuaderno.
Tarjetas de Tareas (TaskCard.tsx): Acabado refinado con la elevación y detalles de AccountSummary / CuentaCard.
3. Cambios Propuestos por Componente
Base de Datos y Repositorios
[MODIFY] 
schema.ts
 & 
actividadRepo.ts
Reemplazar la columna emoji por icon_name en tipo_actividad.
Mapear valores por defecto (TIPOS_INICIALES) a íconos válidos de MaterialIcons.
Nuevos Componentes y Modificaciones UI
[NEW] 
NotebookCalendar.tsx
Calendario en formato grilla de cuaderno de notas, con cabecera de mes, días organizados en semana/mes, indicación de día actual y día seleccionado, e indicadores visuales de tareas programadas.
[MODIFY] 
ContextButton.tsx
 & 
ContextSelectorSheet.tsx
Añadir Badge de Notificación estilo Red Social (circulito/píldora flotante con número de pendientes en la esquina superior derecha del ícono/botón).
[MODIFY] 
NuevoTipoActividadModal.tsx
Cuadrícula de selección visual de íconos (MaterialIcons).
[NEW] 
FinanceSummaryCard.tsx
Tarjeta de balance global con el mismo lenguaje de diseño y gradientes que CuentaCard.
[NEW] 
TodaySummaryCard.tsx
Tarjeta de actividades del día con badge de notificación y resumen táctil de pendientes.
[NEW] 
QuickMetricsCard.tsx
Tarjeta de racha y cumplimiento con métricas visuales.
[NEW] 
ProjectsProgressCard.tsx
Avance de objetivos y proyectos.
[MODIFY] 
Home.tsx
Ensamblaje del Hub central conectando datos reales de repositorios.
[MODIFY] 
Actividades.tsx
Reemplazar WeekStrip por NotebookCalendar y actualizar botones con badges de notificación.
4. Verificación y Calidad
TypeScript compilation: Ejecutar tsc --noEmit para asegurar 0 errores de compilación.
Fidelidad al Design System: Comprobar que no existan bordes negros ni colores neón.
Feedback táctil: Garantizar pressedFeedback en todos los elementos interactivos.