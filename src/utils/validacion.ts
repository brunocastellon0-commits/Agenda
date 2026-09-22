export const LIMITE_MONTO = 100000000;

export function parseNumero(valor: string): number {
  const normalizado = valor.trim().replace(',', '.');
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : NaN;
}

export function validarTexto(valor: string, min: number, max: number, label: string): string | null {
  const limpio = valor.trim();
  if (limpio.length < min) {
    return `${label}: ingresá al menos ${min} caracteres`;
  }
  if (limpio.length > max) {
    return `${label}: máximo ${max} caracteres`;
  }
  return null;
}

export function validarMonto(valor: string, max: number = LIMITE_MONTO): string | null {
  const numero = parseNumero(valor);
  if (Number.isNaN(numero)) {
    return 'Ingresá un monto válido';
  }
  if (numero <= 0) {
    return 'El monto debe ser mayor a 0';
  }
  if (numero > max) {
    return `El monto no puede superar ${max.toLocaleString('es-ES')}`;
  }
  if (Math.round(numero * 100) / 100 !== numero) {
    return 'El monto admite máximo 2 decimales';
  }
  return null;
}

export function validarMontoOpcional(valor: string, max: number = LIMITE_MONTO): string | null {
  if (valor.trim() === '') {
    return null;
  }
  return validarMonto(valor, max);
}

export function validarNumero(valor: string, min: number, max: number, unidad: string): string | null {
  const numero = parseNumero(valor);
  if (Number.isNaN(numero)) {
    return 'Ingresá un número válido';
  }
  if (numero < min || numero > max) {
    return `Debe estar entre ${min} y ${max} ${unidad}`;
  }
  return null;
}

export function validarEntero(valor: string, min: number, max: number): string | null {
  const numero = parseNumero(valor);
  if (Number.isNaN(numero) || !Number.isInteger(numero)) {
    return 'Ingresá un número entero válido';
  }
  if (numero < min || numero > max) {
    return `Debe estar entre ${min} y ${max}`;
  }
  return null;
}