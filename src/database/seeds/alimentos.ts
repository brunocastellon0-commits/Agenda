import { UnidadMedida } from '../../utils/nutricion';

export interface SeedAlimento {
  nombre: string;
  categoria: string;
  tags: string[];
  kcal_100: number;
  prot_100: number;
  carb_100: number;
  grasa_100: number;
  fibra_100?: number;
  unidad_base: UnidadMedida;
  origen: 'sistema';
}

export const ALIMENTOS_INICIALES: SeedAlimento[] = [
  // PROTEÍNAS
  { nombre: 'Huevos', categoria: 'proteina', tags: ['proteina'], kcal_100: 155, prot_100: 13, carb_100: 1.1, grasa_100: 11, unidad_base: 'unidad', origen: 'sistema' },
  { nombre: 'Pechuga de Pollo', categoria: 'proteina', tags: ['proteina'], kcal_100: 165, prot_100: 31, carb_100: 0, grasa_100: 3.6, unidad_base: 'g', origen: 'sistema' },
  { nombre: 'Carne de Res (Magra)', categoria: 'proteina', tags: ['proteina'], kcal_100: 250, prot_100: 26, carb_100: 0, grasa_100: 15, unidad_base: 'g', origen: 'sistema' },
  { nombre: 'Pescado (Tilapia)', categoria: 'proteina', tags: ['proteina'], kcal_100: 96, prot_100: 20, carb_100: 0, grasa_100: 1.7, unidad_base: 'g', origen: 'sistema' },
  { nombre: 'Atún en lata (al agua)', categoria: 'proteina', tags: ['proteina'], kcal_100: 86, prot_100: 19, carb_100: 0, grasa_100: 1, unidad_base: 'g', origen: 'sistema' },
  { nombre: 'Lentejas (cocidas)', categoria: 'proteina', tags: ['proteina', 'fibra', 'vegetal'], kcal_100: 116, prot_100: 9, carb_100: 20, grasa_100: 0.4, fibra_100: 8, unidad_base: 'g', origen: 'sistema' },
  { nombre: 'Tofu', categoria: 'proteina', tags: ['proteina', 'vegetariano'], kcal_100: 76, prot_100: 8, carb_100: 2, grasa_100: 4.8, fibra_100: 0.3, unidad_base: 'g', origen: 'sistema' },
  
  // CARBOHIDRATOS
  { nombre: 'Arroz Blanco (cocido)', categoria: 'cereal', tags: ['carbohidrato'], kcal_100: 130, prot_100: 2.7, carb_100: 28, grasa_100: 0.3, fibra_100: 0.4, unidad_base: 'g', origen: 'sistema' },
  { nombre: 'Arroz Integral (cocido)', categoria: 'cereal', tags: ['carbohidrato', 'fibra'], kcal_100: 111, prot_100: 2.6, carb_100: 23, grasa_100: 0.9, fibra_100: 1.8, unidad_base: 'g', origen: 'sistema' },
  { nombre: 'Pan Blanco', categoria: 'cereal', tags: ['carbohidrato', 'ultraprocesado'], kcal_100: 265, prot_100: 9, carb_100: 49, grasa_100: 3.2, fibra_100: 2.7, unidad_base: 'rebanada', origen: 'sistema' },
  { nombre: 'Pan Integral', categoria: 'cereal', tags: ['carbohidrato', 'fibra'], kcal_100: 247, prot_100: 13, carb_100: 41, grasa_100: 4.2, fibra_100: 7.4, unidad_base: 'rebanada', origen: 'sistema' },
  { nombre: 'Avena', categoria: 'cereal', tags: ['carbohidrato', 'fibra'], kcal_100: 389, prot_100: 16.9, carb_100: 66.3, grasa_100: 6.9, fibra_100: 10.6, unidad_base: 'g', origen: 'sistema' },
  { nombre: 'Papa (cocida)', categoria: 'cereal', tags: ['carbohidrato'], kcal_100: 87, prot_100: 1.9, carb_100: 20, grasa_100: 0.1, fibra_100: 1.8, unidad_base: 'g', origen: 'sistema' },
  { nombre: 'Fideos / Pasta (cocida)', categoria: 'cereal', tags: ['carbohidrato'], kcal_100: 131, prot_100: 5, carb_100: 25, grasa_100: 1.1, fibra_100: 1.2, unidad_base: 'g', origen: 'sistema' },
  { nombre: 'Quinua (cocida)', categoria: 'cereal', tags: ['carbohidrato', 'proteina'], kcal_100: 120, prot_100: 4.4, carb_100: 21.3, grasa_100: 1.9, fibra_100: 2.8, unidad_base: 'g', origen: 'sistema' },

  // VEGETALES
  { nombre: 'Brócoli', categoria: 'vegetal', tags: ['vegetal', 'fibra'], kcal_100: 34, prot_100: 2.8, carb_100: 6.6, grasa_100: 0.4, fibra_100: 2.6, unidad_base: 'g', origen: 'sistema' },
  { nombre: 'Tomate', categoria: 'vegetal', tags: ['vegetal'], kcal_100: 18, prot_100: 0.9, carb_100: 3.9, grasa_100: 0.2, fibra_100: 1.2, unidad_base: 'unidad', origen: 'sistema' },
  { nombre: 'Lechuga', categoria: 'vegetal', tags: ['vegetal'], kcal_100: 15, prot_100: 1.4, carb_100: 2.9, grasa_100: 0.2, fibra_100: 1.3, unidad_base: 'g', origen: 'sistema' },
  { nombre: 'Zanahoria', categoria: 'vegetal', tags: ['vegetal', 'fibra'], kcal_100: 41, prot_100: 0.9, carb_100: 9.6, grasa_100: 0.2, fibra_100: 2.8, unidad_base: 'unidad', origen: 'sistema' },
  { nombre: 'Cebolla', categoria: 'vegetal', tags: ['vegetal'], kcal_100: 40, prot_100: 1.1, carb_100: 9.3, grasa_100: 0.1, fibra_100: 1.7, unidad_base: 'unidad', origen: 'sistema' },
  
  // FRUTAS
  { nombre: 'Banana', categoria: 'fruta', tags: ['fruta', 'carbohidrato'], kcal_100: 89, prot_100: 1.1, carb_100: 23, grasa_100: 0.3, fibra_100: 2.6, unidad_base: 'unidad', origen: 'sistema' },
  { nombre: 'Manzana', categoria: 'fruta', tags: ['fruta', 'fibra'], kcal_100: 52, prot_100: 0.3, carb_100: 14, grasa_100: 0.2, fibra_100: 2.4, unidad_base: 'unidad', origen: 'sistema' },
  { nombre: 'Naranja', categoria: 'fruta', tags: ['fruta', 'vitamina_c'], kcal_100: 47, prot_100: 0.9, carb_100: 12, grasa_100: 0.1, fibra_100: 2.4, unidad_base: 'unidad', origen: 'sistema' },
  { nombre: 'Fresa', categoria: 'fruta', tags: ['fruta'], kcal_100: 32, prot_100: 0.7, carb_100: 7.7, grasa_100: 0.3, fibra_100: 2, unidad_base: 'g', origen: 'sistema' },
  
  // GRASAS
  { nombre: 'Palta / Aguacate', categoria: 'grasa', tags: ['grasa', 'fibra', 'vegetal'], kcal_100: 160, prot_100: 2, carb_100: 8.5, grasa_100: 14.7, fibra_100: 6.7, unidad_base: 'unidad', origen: 'sistema' },
  { nombre: 'Aceite de Oliva', categoria: 'grasa', tags: ['grasa'], kcal_100: 884, prot_100: 0, carb_100: 0, grasa_100: 100, unidad_base: 'ml', origen: 'sistema' },
  { nombre: 'Nueces', categoria: 'grasa', tags: ['grasa', 'fibra'], kcal_100: 654, prot_100: 15.2, carb_100: 13.7, grasa_100: 65.2, fibra_100: 6.7, unidad_base: 'g', origen: 'sistema' },
  { nombre: 'Mantequilla de Maní', categoria: 'grasa', tags: ['grasa', 'proteina'], kcal_100: 588, prot_100: 25, carb_100: 20, grasa_100: 50, fibra_100: 6, unidad_base: 'cucharada', origen: 'sistema' },
  
  // LÁCTEOS
  { nombre: 'Leche Entera', categoria: 'lacteo', tags: ['lacteo', 'proteina', 'grasa'], kcal_100: 61, prot_100: 3.2, carb_100: 4.8, grasa_100: 3.3, unidad_base: 'ml', origen: 'sistema' },
  { nombre: 'Queso Cheddar', categoria: 'lacteo', tags: ['lacteo', 'grasa', 'proteina'], kcal_100: 402, prot_100: 25, carb_100: 1.3, grasa_100: 33, unidad_base: 'g', origen: 'sistema' },
  { nombre: 'Yogurt Griego', categoria: 'lacteo', tags: ['lacteo', 'proteina'], kcal_100: 59, prot_100: 10, carb_100: 3.6, grasa_100: 0.4, unidad_base: 'g', origen: 'sistema' },

  // BEBIDAS & SNACKS
  { nombre: 'Agua', categoria: 'bebida', tags: ['bebida'], kcal_100: 0, prot_100: 0, carb_100: 0, grasa_100: 0, unidad_base: 'vaso', origen: 'sistema' },
  { nombre: 'Café (sin azúcar)', categoria: 'bebida', tags: ['bebida'], kcal_100: 1, prot_100: 0.1, carb_100: 0, grasa_100: 0, unidad_base: 'taza', origen: 'sistema' },
  { nombre: 'Gaseosa Regular', categoria: 'bebida', tags: ['bebida', 'azucar', 'ultraprocesado'], kcal_100: 41, prot_100: 0, carb_100: 10.6, grasa_100: 0, unidad_base: 'ml', origen: 'sistema' },
  { nombre: 'Galletas Dulces', categoria: 'mixto', tags: ['ultraprocesado', 'azucar', 'grasa', 'carbohidrato'], kcal_100: 502, prot_100: 5, carb_100: 64, grasa_100: 25, fibra_100: 1.5, unidad_base: 'g', origen: 'sistema' },
  { nombre: 'Papas Fritas (Bolsa)', categoria: 'mixto', tags: ['ultraprocesado', 'grasa', 'carbohidrato'], kcal_100: 536, prot_100: 7, carb_100: 53, grasa_100: 35, fibra_100: 3.1, unidad_base: 'g', origen: 'sistema' },
];

// Platos preparados estimados (como recetas genéricas o platos rápidos)
export const PLATOS_INICIALES: SeedAlimento[] = [
  // Platos Generales
  { nombre: 'Pizza (Porción)', categoria: 'mixto', tags: ['ultraprocesado', 'carbohidrato', 'grasa'], kcal_100: 266, prot_100: 11, carb_100: 33, grasa_100: 10, fibra_100: 2.3, unidad_base: 'rebanada', origen: 'sistema' },
  { nombre: 'Hamburguesa (Simple)', categoria: 'mixto', tags: ['ultraprocesado', 'proteina', 'grasa', 'carbohidrato'], kcal_100: 250, prot_100: 12, carb_100: 24, grasa_100: 12, fibra_100: 1.5, unidad_base: 'unidad', origen: 'sistema' },
  { nombre: 'Sándwich de Jamón y Queso', categoria: 'mixto', tags: ['carbohidrato', 'proteina'], kcal_100: 240, prot_100: 12, carb_100: 28, grasa_100: 9, fibra_100: 2, unidad_base: 'unidad', origen: 'sistema' },
  
  // Platos Bolivianos
  { nombre: 'Salteña', categoria: 'mixto', tags: ['carbohidrato', 'grasa', 'proteina'], kcal_100: 250, prot_100: 8, carb_100: 30, grasa_100: 11, fibra_100: 2, unidad_base: 'unidad', origen: 'sistema' },
  { nombre: 'Silpancho', categoria: 'mixto', tags: ['carbohidrato', 'proteina', 'grasa'], kcal_100: 180, prot_100: 9, carb_100: 22, grasa_100: 6, fibra_100: 2, unidad_base: 'porcion', origen: 'sistema' },
  { nombre: 'Pique Macho', categoria: 'mixto', tags: ['proteina', 'grasa', 'carbohidrato'], kcal_100: 200, prot_100: 12, carb_100: 15, grasa_100: 10, fibra_100: 2, unidad_base: 'porcion', origen: 'sistema' },
  { nombre: 'Sopa de Maní', categoria: 'mixto', tags: ['carbohidrato', 'grasa', 'proteina'], kcal_100: 150, prot_100: 6, carb_100: 15, grasa_100: 7, fibra_100: 2, unidad_base: 'porcion', origen: 'sistema' },
  { nombre: 'Pollo Broaster (Pieza)', categoria: 'proteina', tags: ['proteina', 'grasa', 'ultraprocesado'], kcal_100: 290, prot_100: 14, carb_100: 15, grasa_100: 19, fibra_100: 1, unidad_base: 'pieza', origen: 'sistema' },
  { nombre: 'Arroz con Pollo', categoria: 'mixto', tags: ['carbohidrato', 'proteina'], kcal_100: 160, prot_100: 8, carb_100: 20, grasa_100: 5, fibra_100: 1.5, unidad_base: 'porcion', origen: 'sistema' }
];
