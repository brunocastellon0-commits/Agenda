import { toISODate } from './semana';

export interface RachaStats {
  rachaActual: number;
  mejorRacha: number;
}

/**
 * Calcula la racha diaria de un hábito positivo (completar algo cada día).
 * @param fechas Array de fechas YYYY-MM-DD en las que se cumplió el hábito (sin importar orden)
 * @param referencia Fecha desde la cual calcular (normalmente hoy)
 */
export function calcularRachaDiariaPositiva(fechas: string[], referencia: Date = new Date()): RachaStats {
  const fechasSet = new Set(fechas);
  const refIso = toISODate(referencia);
  const ayer = new Date(referencia);
  ayer.setDate(ayer.getDate() - 1);
  const ayerIso = toISODate(ayer);

  // Racha actual
  let rActual = 0;
  let d = new Date(referencia);
  
  if (!fechasSet.has(refIso)) {
    d.setDate(d.getDate() - 1); // Si hoy no está cumplido, mirar ayer
  }

  while (true) {
    if (fechasSet.has(toISODate(d))) {
      rActual++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  // Mejor racha
  const fechasOrdenadas = Array.from(fechasSet).sort((a, b) => b.localeCompare(a)); // DESC
  let rMax = 0;
  let curr = 0;
  let prevTs = 0;

  for (let i = 0; i < fechasOrdenadas.length; i++) {
    const ts = new Date(fechasOrdenadas[i] + 'T00:00:00').getTime();
    if (i === 0) {
      curr = 1;
      prevTs = ts;
    } else {
      const diffDays = Math.round((prevTs - ts) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        curr++;
      } else {
        if (curr > rMax) rMax = curr;
        curr = 1;
      }
      prevTs = ts;
    }
  }
  if (curr > rMax) rMax = curr;

  return { rachaActual: rActual, mejorRacha: rMax };
}

/**
 * Calcula la racha semanal de un hábito positivo (cumplir el objetivo de la semana).
 * @param semanasCumplidas Array de ISO strings correspondientes al LUNES de cada semana cumplida
 * @param referencia Fecha actual (para calcular semana actual)
 */
export function calcularRachaSemanalPositiva(semanasCumplidas: string[], referencia: Date = new Date()): RachaStats {
  const semanasSet = new Set(semanasCumplidas);
  
  const loff = (referencia.getDay() + 6) % 7;
  const lunesSemanaActual = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate() - loff);
  const inicioSemanaIso = toISODate(lunesSemanaActual);

  // Racha actual
  let rActual = 0;
  let wDate = new Date(lunesSemanaActual);

  if (!semanasSet.has(inicioSemanaIso)) {
    wDate.setDate(wDate.getDate() - 7);
  }

  while (true) {
    if (semanasSet.has(toISODate(wDate))) {
      rActual++;
      wDate.setDate(wDate.getDate() - 7);
    } else {
      break;
    }
  }

  // Mejor racha
  const semanasOrdenadas = Array.from(semanasSet).sort((a, b) => b.localeCompare(a)); // DESC
  let rMax = 0;
  let curr = 0;
  let prevTs = 0;

  for (let i = 0; i < semanasOrdenadas.length; i++) {
    const ts = new Date(semanasOrdenadas[i] + 'T00:00:00').getTime();
    if (i === 0) {
      curr = 1;
      prevTs = ts;
    } else {
      const diffDays = Math.round((prevTs - ts) / (1000 * 60 * 60 * 24));
      if (diffDays === 7) {
        curr++;
      } else {
        if (curr > rMax) rMax = curr;
        curr = 1;
      }
      prevTs = ts;
    }
  }
  if (curr > rMax) rMax = curr;

  return { rachaActual: rActual, mejorRacha: rMax };
}

/**
 * Calcula la racha diaria de EVITACIÓN TOTAL (días consecutivos sin ninguna ocurrencia hasta hoy).
 * @param fechaInicioSeguimiento Fecha en la que empezó a registrar la conducta (evita dar 1000 días de racha desde siempre)
 * @param fechasConEventos Fechas en las que SÍ hubo evento (rompe racha)
 * @param referencia Fecha de cálculo (normalmente hoy)
 */
export function calcularRachaEvitacionTotal(fechaInicioSeguimiento: string, fechasConEventos: string[], referencia: Date = new Date()): RachaStats {
  const eventosSet = new Set(fechasConEventos);
  const inicioSeg = new Date(fechaInicioSeguimiento + 'T00:00:00');
  
  let d = new Date(referencia);
  let rActual = 0;

  // Calculamos la racha actual retrocediendo desde hoy
  while (d >= inicioSeg) {
    if (eventosSet.has(toISODate(d))) {
      break;
    }
    rActual++;
    d.setDate(d.getDate() - 1);
  }

  // Calcular mejor racha analizando los huecos entre eventos
  const eventosSorted = Array.from(eventosSet)
    .filter(f => new Date(f + 'T00:00:00') >= inicioSeg && new Date(f + 'T00:00:00') <= referencia)
    .sort(); // ASC

  let mejorRacha = 0;
  let prevDate = inicioSeg;

  for (const ev of eventosSorted) {
    const evDate = new Date(ev + 'T00:00:00');
    // Días entre el día después del evento anterior (o inicio) y el día antes de este evento
    const diffTime = evDate.getTime() - prevDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > mejorRacha) mejorRacha = diffDays;
    
    prevDate = new Date(evDate);
    prevDate.setDate(prevDate.getDate() + 1); // Empezar a contar desde el día siguiente al evento
  }

  // Comprobar el último tramo (desde el último evento hasta hoy)
  const finalDiffTime = referencia.getTime() - prevDate.getTime();
  const finalDiffDays = Math.floor(finalDiffTime / (1000 * 60 * 60 * 24)) + 1; // Incluir hoy
  if (finalDiffDays > mejorRacha && prevDate <= referencia) {
    mejorRacha = finalDiffDays;
  }

  // Si no hay ningún evento
  if (eventosSorted.length === 0) {
    const totalDiffTime = referencia.getTime() - inicioSeg.getTime();
    const totalDiffDays = Math.floor(totalDiffTime / (1000 * 60 * 60 * 24)) + 1;
    mejorRacha = totalDiffDays;
  }

  // Asegurar que mejorRacha al menos sea rActual
  if (rActual > mejorRacha) mejorRacha = rActual;

  return { rachaActual: rActual, mejorRacha };
}
