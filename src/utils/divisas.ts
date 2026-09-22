export const DIVISA_SIGNOS: Record<string, string> = {
  BOB: 'Bs ',
  USD: 'US$ ',
  EUR: '€ ',
  ARS: '$ ',
  PEN: 'S/ ',
  MXN: '$ ',
  CLP: '$ ',
  VES: 'Bs. ',
};

export function signoDivisa(divisa: string): string {
  return DIVISA_SIGNOS[divisa] ?? '';
}

export function formatMonto(monto: number): string {
  return monto.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}