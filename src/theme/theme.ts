export const PALETTE = {
  // Canvas y superficies (Material — cálido, tintado, sin blancos crudos)
  surface: '#F4F7F5', // verdegris suave · fondo de pantalla
  surfaceContainer: '#E9EFEB', // panel tintado · tracks, chips inactivos, inputs
  surfaceContainerLow: '#FBFCFB', // paneles interiores
  surfaceContainerLowest: '#FFFFFF', // cards
  surfaceDark: '#1E293B', // slate profundo · paneles invertidos

  // Tinta
  ink: '#1E293B', // onSurface (slate-800 · tinta principal)
  onSurfaceVariant: '#55606E', // texto secundario
  outline: '#94A3B8', // iconos / bordes funcionales
  hairline: '#DDE5E1', // separación interna sutil (1px)
  ash: '#7A8794', // helper / disabled

  // Acentos (semánticos, calmados)
  primary: '#16876A', // esmeralda · acción principal y finanzas
  secondary: '#E76F51', // coral · acento cálido
  tertiary: '#4F46A5', // índigo · objetivos

  // Texto sobre fills
  onSurface: '#1E293B', // alias de ink (compatibilidad con componentes existentes)
  onAccent: '#FFFFFF', // texto sobre fills de color
  onDark: '#FFFFFF', // texto sobre fills semánticos oscuros y surfaceDark
  border: '#DDE5E1', // borde suave de separación (el nombre se conserva, NO es negro)
  categorias: {
    finanzas: '#16876A', // esmeralda · crecimiento y control financiero
    objetivos: '#4F46A5', // índigo · dirección y progreso
    trabajo: '#176B87', // petróleo · profesionalismo
    ocio: '#E76F51', // coral · energía y desconexión
    eventos: '#64748B', // gris azulado · neutral
    importante: '#D89B22', // ámbar · atención sin peligro extremo
    critico: '#C94C4C', // rojo · riesgo y acción inmediata
  },
};

export const RADIUS = {
  hairline: 1,
  cards: 18,
  buttons: 16,
  interior: 12,
  hero: 20,
};

export const SHADOW = {
  card: {
    elevation: 4,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  modal: {
    elevation: 24,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
  },
};

export const PRESS_SCALE = 0.97;

export const pressedFeedback = { transform: [{ scale: PRESS_SCALE }] };

// Tint de un color semántico (~16% opacidad) para chips y fondos tintados
export const tint = (hexColor: string, alpha = 0.16) => {
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hexColor}${a}`;
};