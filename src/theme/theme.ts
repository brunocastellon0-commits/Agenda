import type { TextStyle } from 'react-native';

export const PALETTE = {
  // Canvas y superficies — el lienzo es BLANCO puro (identidad editorial)
  surface: '#FFFFFF', // fondo de pantalla general
  surfaceContainer: '#F1F5F9', // slate-100 - inputs, fondos secundarios
  surfaceContainerLow: '#FFFFFF', // panels interiores
  surfaceContainerLowest: '#FFFFFF', // cards neutrales
  surfaceDark: '#0F172A', // slate-900 (CONTROL mode)

  // Tinta
  ink: '#0F172A', // slate-900
  onSurfaceVariant: '#475569', // slate-600
  outline: '#94A3B8', // slate-400
  hairline: '#E2E8F0', // slate-200
  ash: '#64748B', // slate-500

  // Identidad — CYAN OSCURO (mismo tono del icono/mascota)
  primary: '#155860', // identidad, CTA, tab activa, selección
  accent: '#0891B2', // indicadores, progreso, estados activos
  secondary: '#64748B',
  tertiary: '#0284C7',

  // Overlay de modales (antes hardcodeado en screens)
  scrim: 'rgba(19,26,24,0.4)',

  // Texto sobre fills
  onSurface: '#0F172A',
  onAccent: '#FFFFFF',
  onDark: '#F8FAFC',
  onDarkMuted: '#E2E8F0', // texto secundario sobre superficie oscura (Modo Control)
  border: '#E2E8F0',

  // Áreas semánticas - "COLOR CON PROPÓSITO"
  categorias: {
    actividades: '#0284C7', // cyan/azul - enfoque, acción
    comida: '#EA580C', // coral/naranja - energía
    habitos: '#10B981', // verde - progreso y continuidad
    autocontrol: '#F59E0B', // ámbar - atención
    metricas: '#8B5CF6', // violeta - reflexión y análisis
    finanzas: '#1D4ED8', // azul profundo - estabilidad
    control: '#E11D48', // coral/rojo oscuro - intensidad

    // Alias para no romper la BD o código existente
    trabajo: '#0284C7',
    ocio: '#EA580C',
    eventos: '#64748B',
    objetivos: '#8B5CF6',
    importante: '#F59E0B',
    critico: '#E11D48',
  },

  // Fondos suaves (Cards y bloques con personalidad cromática)
  fondos: {
    actividades: '#F0F9FF', // sky-50
    comida: '#FFF7ED', // orange-50
    habitos: '#ECFDF5', // emerald-50
    autocontrol: '#FFFBEB', // amber-50
    metricas: '#F5F3FF', // violet-50
    finanzas: '#EFF6FF', // blue-50
    control: '#1E293B', // slate-800
    identidad: '#EDF6F7', // teal muy claro — bloques abiertos de identidad
  },
};

/**
 * Escala tipográfica editorial.
 * Pesos 400/500/600/700, sistema, sin tracking negativo.
 * Uso: `<Text style={TYPE.title}>…</Text>` o `{...TYPE.display}`.
 */
export const TYPE: Record<
  'display' | 'displaySm' | 'title' | 'subtitle' | 'body' | 'caption' | 'label',
  TextStyle
> = {
  display: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: '700',
    letterSpacing: 0,
    color: PALETTE.ink,
  },
  displaySm: {
    fontSize: 36,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: 0,
    color: PALETTE.ink,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: 0,
    color: PALETTE.ink,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0,
    color: PALETTE.ink,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0,
    color: PALETTE.onSurfaceVariant,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0,
    color: PALETTE.onSurfaceVariant,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: PALETTE.ash,
  },
};

/** Ritmo editorial (spacing consistente) */
export const SPACE = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  hairline: 1,
  cards: 24, // tarjetas
  block: 20, // bloques cromáticos (radio distinto a propósito)
  interior: 16, // inputs/paneles
  buttons: 16,
  pill: 999,
  hero: 28, // top de sheets
};

export const SHADOW = {
  card: {
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  // Profundidad para bloques hero (se usan pocos, para que signifique algo)
  lift: {
    elevation: 8,
    shadowColor: '#155860',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
  },
  modal: {
    elevation: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
  },
  color: (hexColor: string) => ({
    elevation: 8,
    shadowColor: hexColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  }),
};

export const PRESS_SCALE = 0.96;

export const pressedFeedback = { transform: [{ scale: PRESS_SCALE }] };

// Tint de un color semántico para chips y fondos tintados (alpha dinámico)
export const tint = (hexColor: string, alpha = 0.16) => {
  if (!hexColor) return '#00000010';
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hexColor}${a}`;
};
