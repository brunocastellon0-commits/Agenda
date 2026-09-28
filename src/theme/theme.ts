export const PALETTE = {
  // Canvas y superficies (Premium, azulado pálido)
  surface: '#F8FAFC', // slate-50 - fondo de pantalla general
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

  // Acentos agnósticos
  primary: '#0F172A', // La acción neutral es oscura
  secondary: '#64748B', 
  tertiary: '#0284C7',

  // Texto sobre fills
  onSurface: '#0F172A', 
  onAccent: '#FFFFFF', 
  onDark: '#F8FAFC', 
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
  }
};

export const RADIUS = {
  hairline: 1,
  cards: 24, // Mayor curvatura, más orgánico
  buttons: 16,
  interior: 16,
  hero: 28,
};

export const SHADOW = {
  card: {
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
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
  })
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