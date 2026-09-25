import { getDatabase } from '../database/db';

export interface RegistroFisico {
  id?: number;
  ci_usuario: string;
  fecha_medicion: string; // YYYY-MM-DD
  fecha_registro: string; // ISO datetime
  peso?: number | null;
  altura?: number | null;
  cintura?: number | null;
  cuello?: number | null;
  notas?: string | null;
  activo?: number;
}

export async function getUltimoRegistro(ci: string): Promise<RegistroFisico | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<RegistroFisico>(
    `SELECT * FROM registro_fisico 
     WHERE ci_usuario = ? AND activo = 1 
     ORDER BY fecha_medicion DESC, id DESC LIMIT 1`,
    [ci]
  );
  return result || null;
}

export async function getHistorial(ci: string, limite?: number): Promise<RegistroFisico[]> {
  const db = await getDatabase();
  let query = `SELECT * FROM registro_fisico WHERE ci_usuario = ? AND activo = 1 ORDER BY fecha_medicion DESC, id DESC`;
  const params: any[] = [ci];
  
  if (limite && limite > 0) {
    query += ` LIMIT ?`;
    params.push(limite);
  }
  
  const result = await db.getAllAsync<RegistroFisico>(query, params);
  return result;
}

export async function registrarMedicion(datos: RegistroFisico): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO registro_fisico 
     (ci_usuario, fecha_medicion, fecha_registro, peso, altura, cintura, cuello, notas, activo) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      datos.ci_usuario,
      datos.fecha_medicion,
      datos.fecha_registro,
      datos.peso ?? null,
      datos.altura ?? null,
      datos.cintura ?? null,
      datos.cuello ?? null,
      datos.notas ?? null
    ]
  );
}

export function calcularIMC(peso: number, alturaCm: number): number | null {
  if (!peso || !alturaCm || alturaCm <= 0) return null;
  const alturaM = alturaCm / 100;
  const imc = peso / (alturaM * alturaM);
  return Math.round(imc * 10) / 10;
}

export async function getComparativa(ci: string): Promise<{ ultimo: RegistroFisico | null; anterior: RegistroFisico | null }> {
  const registros = await getHistorial(ci, 2);
  return {
    ultimo: registros.length > 0 ? registros[0] : null,
    anterior: registros.length > 1 ? registros[1] : null,
  };
}

export function getEdadDesde(fechaNacimiento: string): number | null {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  if (isNaN(nac.getTime())) return null;
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
    edad--;
  }
  return edad >= 0 ? edad : null;
}
