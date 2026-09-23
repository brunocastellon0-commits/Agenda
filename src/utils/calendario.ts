export interface DiaMes {
  fechaISO: string; // 'YYYY-MM-DD'
  diaNumero: number;
  esMesActual: boolean;
  esHoy: boolean;
  esSeleccionado: boolean;
}

const NOMBRES_DIA_SEMANA_CORTO = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const NOMBRES_MES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const NOMBRES_DIA_COMPLETO = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

export const DIAS_SEMANA_HEADERS = NOMBRES_DIA_SEMANA_CORTO;

export function padCero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toFechaISO(date: Date): string {
  const y = date.getFullYear();
  const m = padCero(date.getMonth() + 1);
  const d = padCero(date.getDate());
  return `${y}-${m}-${d}`;
}

export function parseFechaISO(fechaISO: string): Date {
  const [y, m, d] = fechaISO.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Retorna el label del mes y año en mayúsculas, ej: "SEPTIEMBRE 2026"
 */
export function formatoMesAno(year: number, monthIndex: number): string {
  return `${NOMBRES_MES[monthIndex].toUpperCase()} ${year}`;
}

/**
 * Retorna fecha completa legible, ej: "Miércoles, 23 de septiembre"
 */
export function formatoFechaHeader(fechaISO: string): string {
  const date = parseFechaISO(fechaISO);
  const diaSemana = NOMBRES_DIA_COMPLETO[date.getDay()];
  const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  const dia = date.getDate();
  const mes = NOMBRES_MES[date.getMonth()];
  return `${diaSemanaCap}, ${dia} de ${mes}`;
}

/**
 * Genera la grilla de días para un mes específico (Lunes a Domingo).
 * Incluye días de relleno del mes anterior y siguiente para completar semanas de 7 días.
 */
export function generarMatrizMes(
  year: number,
  monthIndex: number, // 0 a 11
  fechaSeleccionadaISO: string,
  fechaHoyISO: string = toFechaISO(new Date())
): DiaMes[] {
  const primerDiaMes = new Date(year, monthIndex, 1);
  const ultimoDiaMes = new Date(year, monthIndex + 1, 0);
  const totalDiasMes = ultimoDiaMes.getDate();

  // Día de la semana del primer día (0=Dom, 1=Lun, ..., 6=Sáb)
  // Convertimos a Lunes=0 ... Domingo=6
  const primerDiaSemana = (primerDiaMes.getDay() + 6) % 7;

  const dias: DiaMes[] = [];

  // Días del mes anterior para rellenar la primera fila
  if (primerDiaSemana > 0) {
    const ultimoDiaMesAnterior = new Date(year, monthIndex, 0).getDate();
    const mesAnteriorIndex = monthIndex === 0 ? 11 : monthIndex - 1;
    const yearMesAnterior = monthIndex === 0 ? year - 1 : year;

    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const diaNum = ultimoDiaMesAnterior - i;
      const fechaISO = `${yearMesAnterior}-${padCero(mesAnteriorIndex + 1)}-${padCero(diaNum)}`;
      dias.push({
        fechaISO,
        diaNumero: diaNum,
        esMesActual: false,
        esHoy: fechaISO === fechaHoyISO,
        esSeleccionado: fechaISO === fechaSeleccionadaISO,
      });
    }
  }

  // Días del mes actual
  for (let diaNum = 1; diaNum <= totalDiasMes; diaNum++) {
    const fechaISO = `${year}-${padCero(monthIndex + 1)}-${padCero(diaNum)}`;
    dias.push({
      fechaISO,
      diaNumero: diaNum,
      esMesActual: true,
      esHoy: fechaISO === fechaHoyISO,
      esSeleccionado: fechaISO === fechaSeleccionadaISO,
    });
  }

  // Días del mes siguiente para completar la última semana
  const diasRestantes = (7 - (dias.length % 7)) % 7;
  if (diasRestantes > 0) {
    const mesSiguienteIndex = monthIndex === 11 ? 0 : monthIndex + 1;
    const yearMesSiguiente = monthIndex === 11 ? year + 1 : year;

    for (let diaNum = 1; diaNum <= diasRestantes; diaNum++) {
      const fechaISO = `${yearMesSiguiente}-${padCero(mesSiguienteIndex + 1)}-${padCero(diaNum)}`;
      dias.push({
        fechaISO,
        diaNumero: diaNum,
        esMesActual: false,
        esHoy: fechaISO === fechaHoyISO,
        esSeleccionado: fechaISO === fechaSeleccionadaISO,
      });
    }
  }

  return dias;
}

/**
 * Calcula sugerencia contextual de posponer:
 * - "Esta tarde / Esta noche": según la hora actual.
 * - "Mañana".
 * - "Próximo lunes".
 */
export function calcularOpcionesPosponer(fechaISO: string, horaActual?: string | null): {
  opcionTarde: { label: string; fecha: string; hora: string } | null;
  opcionManana: { label: string; fecha: string; hora?: string | null };
  opcionProximoLunes: { label: string; fecha: string; hora?: string | null };
} {
  const hoy = new Date();
  const ahoraHoras = hoy.getHours();
  const hoyISO = toFechaISO(hoy);

  // Si la actividad es de hoy y aún no es tarde noche
  let opcionTarde: { label: string; fecha: string; hora: string } | null = null;
  if (fechaISO === hoyISO) {
    if (ahoraHoras < 15) {
      opcionTarde = { label: 'Esta tarde (16:00)', fecha: hoyISO, hora: '16:00' };
    } else if (ahoraHoras < 19) {
      opcionTarde = { label: 'Esta noche (20:00)', fecha: hoyISO, hora: '20:00' };
    }
  }

  // Mañana
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
  const mananaISO = toFechaISO(manana);
  const opcionManana = {
    label: 'Mañana',
    fecha: mananaISO,
    hora: horaActual ?? null,
  };

  // Próximo lunes
  const diaSemana = hoy.getDay(); // 0 es domingo, 1 es lunes
  const diasHastaLunes = diaSemana === 0 ? 1 : 8 - diaSemana;
  const proxLunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + diasHastaLunes);
  const proxLunesISO = toFechaISO(proxLunes);
  const opcionProximoLunes = {
    label: 'Próximo lunes',
    fecha: proxLunesISO,
    hora: horaActual ?? null,
  };

  return { opcionTarde, opcionManana, opcionProximoLunes };
}
