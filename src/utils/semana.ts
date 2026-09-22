export interface DayItem {
  id: string; // 'YYYY-MM-DD'
  dayLabel: string;
  date: number;
  isToday: boolean;
}

const NOMBRES_DIA_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const NOMBRES_DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const NOMBRES_MES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fechaSemana(fecha: Date): DayItem[] {
  const lunesOffset = (fecha.getDay() + 6) % 7;
  const lunes = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - lunesOffset);
  const hoy = toISODate(fecha);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i);
    const id = toISODate(day);
    return {
      id,
      dayLabel: NOMBRES_DIA_CORTO[day.getDay()],
      date: day.getDate(),
      isToday: id === hoy,
    };
  });
}

export function etiquetaFecha(fechaISO: string): string {
  const [y, m, d] = fechaISO.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${NOMBRES_DIA[date.getDay()]} ${date.getDate()} de ${NOMBRES_MES[date.getMonth()]}`;
}

export function saludoPorHora(fecha: Date = new Date()): string {
  const h = fecha.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}