export type MotivacionCategory = 'exercise' | 'food' | 'streak' | 'failure' | 'achievement' | 'general';
export type MotivacionTone = 'realistic' | 'disciplined' | 'encouraging' | 'calm';

export interface Phrase {
  id: string;
  text: string;
  category: MotivacionCategory;
  tone: MotivacionTone;
}

const PHRASES: Phrase[] = [
  // Ejercicio / Disciplina
  {
    id: 'ex_1',
    text: 'No estás intentando demostrar que puedes hacerlo. Estás demostrando que puedes repetirlo.',
    category: 'exercise',
    tone: 'disciplined'
  },
  {
    id: 'ex_2',
    text: 'Hoy no tienes que ser mejor que nadie. Solo tienes que cumplir lo que te prometiste.',
    category: 'exercise',
    tone: 'realistic'
  },
  {
    id: 'ex_3',
    text: 'No necesitas tener ganas. Solo necesitas empezar.',
    category: 'exercise',
    tone: 'disciplined'
  },
  {
    id: 'ex_4',
    text: 'La motivación te hizo empezar, el hábito te mantendrá en movimiento.',
    category: 'exercise',
    tone: 'realistic'
  },
  // Alimentación / Equilibrio
  {
    id: 'fd_1',
    text: 'Una decisión no arruina tu progreso. Vuelve a elegir con conciencia.',
    category: 'food',
    tone: 'calm'
  },
  {
    id: 'fd_2',
    text: 'No busques la perfección, busca la constancia.',
    category: 'food',
    tone: 'encouraging'
  },
  // Rachas
  {
    id: 'st_1',
    text: 'No fue suerte. Fueron todas esas veces que lo hiciste aunque no querías.',
    category: 'streak',
    tone: 'realistic'
  },
  {
    id: 'st_2',
    text: 'Un día a la vez. Esa es toda la magia.',
    category: 'streak',
    tone: 'calm'
  },
  // Fallos / Recuperación
  {
    id: 'fa_1',
    text: 'La racha terminó. El hábito no tiene por qué terminar con ella.',
    category: 'failure',
    tone: 'realistic'
  },
  {
    id: 'fa_2',
    text: 'No necesitas empezar de cero. Solo necesitas continuar desde aquí.',
    category: 'failure',
    tone: 'encouraging'
  },
  {
    id: 'fa_3',
    text: 'Fallar un día es parte del proceso. Fallar dos es el inicio de un nuevo hábito.',
    category: 'failure',
    tone: 'disciplined'
  },
  // Logros
  {
    id: 'ac_1',
    text: 'Estás construyendo la versión de ti que siempre dijiste que querías ser.',
    category: 'achievement',
    tone: 'encouraging'
  },
  // General
  {
    id: 'ge_1',
    text: 'Tus hábitos deciden tu futuro. Tú decides tus hábitos.',
    category: 'general',
    tone: 'realistic'
  }
];

export interface MotivacionContext {
  areaNombre: string; // Ej: 'Entrenamiento', 'Alimentación'
  rachaActual: number;
  mejorRacha: number;
  completadoHoy: boolean;
  completadoAyer: boolean;
}

// Mecanismo simple para no repetir la misma frase consecutivamente en la sesión actual
let lastPhraseId: string | null = null;

export const getMotivation = (context: MotivacionContext | null): Phrase => {
  let candidates = [...PHRASES];

  if (context) {
    const areaLower = context.areaNombre.toLowerCase();
    
    // Identificar categoría prioritaria
    let priorityCategory: MotivacionCategory = 'general';

    if (!context.completadoHoy && context.completadoAyer === false && context.rachaActual === 0) {
      priorityCategory = 'failure';
    } else if (context.rachaActual > 0 && context.rachaActual === context.mejorRacha && context.mejorRacha > 3) {
      priorityCategory = 'achievement';
    } else if (context.rachaActual > 3) {
      priorityCategory = 'streak';
    } else if (areaLower.includes('entrena') || areaLower.includes('ejercicio') || areaLower.includes('gimnasio') || areaLower.includes('gym')) {
      priorityCategory = 'exercise';
    } else if (areaLower.includes('alimentación') || areaLower.includes('comida') || areaLower.includes('dieta')) {
      priorityCategory = 'food';
    }

    // Filtrar candidatos por la categoría prioritaria
    const categoryCandidates = PHRASES.filter(p => p.category === priorityCategory);
    
    if (categoryCandidates.length > 0) {
      candidates = categoryCandidates;
    }
  }

  // Evitar repetición si hay múltiples opciones
  if (candidates.length > 1 && lastPhraseId) {
    candidates = candidates.filter(p => p.id !== lastPhraseId);
  }

  // Selección determinista o pseudo-aleatoria basada en el día actual para no saltar cada render
  // Usamos el día del mes y la racha como semilla simple
  const now = new Date();
  const seed = now.getDate() + (context?.rachaActual || 0);
  const index = seed % candidates.length;
  
  const selected = candidates[index] || candidates[0];
  lastPhraseId = selected.id;

  return selected;
};
