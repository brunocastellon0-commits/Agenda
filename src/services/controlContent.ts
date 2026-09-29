export type Tone = 'entrenador' | 'frio' | 'intenso' | 'reflexivo' | 'cinematico' | 'seco' | 'coach' | 'calma';
export type CategoriaFrase = 'disciplina' | 'round' | 'directa' | 'perspectiva' | 'coach' | 'intensa' | 'cinematica' | 'humor' | 'calma' | 'post_recaida' | 'post_resistencia' | 'transicion' | 'contextual';

export interface Frase {
  id: string;
  texto: string;
  categoria: CategoriaFrase;
  tonos: Tone[];
  contextoAsociado?: string[];
}

export const FRASES_BIBLIOTECA: Frase[] = [
  // DISCIPLINA
  { id: 'd1', texto: 'No todo impulso merece una respuesta.', categoria: 'disciplina', tonos: ['frio', 'reflexivo'] },
  { id: 'd2', texto: 'La decisión puede esperar. El impulso también.', categoria: 'disciplina', tonos: ['frio', 'coach'] },
  { id: 'd3', texto: 'No conviertas una sensación momentánea en una decisión permanente.', categoria: 'disciplina', tonos: ['reflexivo', 'coach'] },
  { id: 'd4', texto: 'Podés sentirlo sin obedecerlo.', categoria: 'disciplina', tonos: ['frio', 'entrenador'] },
  { id: 'd5', texto: 'No tenés que demostrar nada. Solo mantené tu decisión durante este round.', categoria: 'disciplina', tonos: ['entrenador'] },
  { id: 'd6', texto: 'La disciplina también existe cuando nadie está mirando.', categoria: 'disciplina', tonos: ['intenso', 'reflexivo'] },
  { id: 'd7', texto: 'Hoy no necesitás ser perfecto. Necesitás ser consciente.', categoria: 'disciplina', tonos: ['coach', 'reflexivo'] },
  { id: 'd8', texto: 'Una reacción automática deja de ser automática cuando haces una pausa.', categoria: 'disciplina', tonos: ['frio', 'reflexivo'] },
  { id: 'd9', texto: 'No negocies con la versión de ti que quiere rendirse.', categoria: 'disciplina', tonos: ['intenso', 'entrenador'] },
  { id: 'd10', texto: 'El confort inmediato suele cobrar intereses muy altos.', categoria: 'disciplina', tonos: ['frio', 'seco'] },
  { id: 'd11', texto: 'Tu cerebro busca el camino fácil. Tú decides si lo tomas.', categoria: 'disciplina', tonos: ['frio', 'entrenador'] },
  { id: 'd12', texto: 'El impulso miente. Te dice que es urgente. No lo es.', categoria: 'disciplina', tonos: ['reflexivo'] },
  { id: 'd13', texto: 'No cambies lo que más quieres por lo que quieres ahora mismo.', categoria: 'disciplina', tonos: ['coach'] },
  { id: 'd14', texto: 'La incomodidad de resistir es temporal. El orgullo es permanente.', categoria: 'disciplina', tonos: ['entrenador'] },
  { id: 'd15', texto: 'Decidir no actuar también es una acción.', categoria: 'disciplina', tonos: ['frio'] },
  { id: 'd16', texto: 'Si siempre haces lo que sientes, nunca cambiarás lo que eres.', categoria: 'disciplina', tonos: ['intenso'] },
  { id: 'd17', texto: 'Pausa. Evalúa. Ejecuta.', categoria: 'disciplina', tonos: ['seco', 'frio'] },
  { id: 'd18', texto: 'Ser dueño de ti mismo empieza en este exacto momento.', categoria: 'disciplina', tonos: ['coach'] },
  { id: 'd19', texto: 'La gratificación inmediata es un préstamo con intereses altísimos.', categoria: 'disciplina', tonos: ['reflexivo', 'seco'] },
  { id: 'd20', texto: 'Romper el patrón duele hoy, pero te libera mañana.', categoria: 'disciplina', tonos: ['entrenador'] },

  // ROUND / COMBATE
  { id: 'r1', texto: 'Primer round. Nada más.', categoria: 'round', tonos: ['entrenador', 'frio'] },
  { id: 'r2', texto: 'No pienses en toda la pelea. Mira el round que tienes delante.', categoria: 'round', tonos: ['entrenador', 'coach'] },
  { id: 'r3', texto: 'Todavía no terminó el round.', categoria: 'round', tonos: ['entrenador', 'intenso'] },
  { id: 'r4', texto: 'Vuelve a tu esquina.', categoria: 'round', tonos: ['entrenador', 'cinematico'] },
  { id: 'r5', texto: 'Respira. Recupera posición.', categoria: 'round', tonos: ['coach', 'entrenador'] },
  { id: 'r6', texto: 'Un golpe no decide una pelea. Un impulso tampoco decide tu historia.', categoria: 'round', tonos: ['cinematico', 'reflexivo'] },
  { id: 'r7', texto: 'No persigas la victoria. Protege este momento.', categoria: 'round', tonos: ['intenso', 'cinematico'] },
  { id: 'r8', texto: 'Mantén la guardia.', categoria: 'round', tonos: ['entrenador', 'frio'] },
  { id: 'r9', texto: 'Un minuto más.', categoria: 'round', tonos: ['frio', 'coach'] },
  { id: 'r10', texto: 'Quédate dentro del round.', categoria: 'round', tonos: ['coach', 'entrenador'] },
  { id: 'r11', texto: 'El objetivo ahora no es ganar para siempre. Es no abandonar este momento.', categoria: 'round', tonos: ['reflexivo', 'coach'] },
  { id: 'r12', texto: 'Recupera el ritmo.', categoria: 'round', tonos: ['entrenador'] },
  { id: 'r13', texto: 'Mira al frente.', categoria: 'round', tonos: ['entrenador', 'intenso'] },
  { id: 'r14', texto: 'Baja los hombros. Respira. Seguimos.', categoria: 'round', tonos: ['coach', 'calma'] },
  { id: 'r15', texto: 'Nadie gana la pelea en la esquina. Pero aquí se recupera el aire.', categoria: 'round', tonos: ['entrenador'] },
  { id: 'r16', texto: 'El dolor del entrenamiento siempre es menor al dolor de la derrota.', categoria: 'round', tonos: ['intenso'] },
  { id: 'r17', texto: 'Protege tu guardia. Protege tu decisión.', categoria: 'round', tonos: ['coach'] },
  { id: 'r18', texto: 'Un golpe encajado no significa perder el combate.', categoria: 'round', tonos: ['cinematico'] },
  { id: 'r19', texto: 'Estás en el round de campeonato. Actúa como tal.', categoria: 'round', tonos: ['intenso'] },
  { id: 'r20', texto: 'No escuches a la fatiga. Escucha tu objetivo.', categoria: 'round', tonos: ['entrenador'] },
  { id: 'r21', texto: 'Gana tu espacio. Defiende tu centro.', categoria: 'round', tonos: ['cinematico'] },
  { id: 'r22', texto: 'Este round es tuyo si decides que lo sea.', categoria: 'round', tonos: ['coach'] },

  // DIRECTAS / FRÍAS
  { id: 'df1', texto: 'Espera.', categoria: 'directa', tonos: ['frio', 'intenso'] },
  { id: 'df2', texto: 'Todavía no.', categoria: 'directa', tonos: ['frio'] },
  { id: 'df3', texto: 'No decidas ahora.', categoria: 'directa', tonos: ['frio', 'coach'] },
  { id: 'df4', texto: 'Respirá primero.', categoria: 'directa', tonos: ['frio', 'calma'] },
  { id: 'df5', texto: 'Mirá lo que estás haciendo.', categoria: 'directa', tonos: ['frio', 'intenso'] },
  { id: 'df6', texto: 'El impulso puede esperar.', categoria: 'directa', tonos: ['frio', 'reflexivo'] },
  { id: 'df7', texto: 'Cambiá de lugar.', categoria: 'directa', tonos: ['frio', 'entrenador'] },
  { id: 'df8', texto: 'Un minuto.', categoria: 'directa', tonos: ['frio'] },
  { id: 'df9', texto: 'Vuelve a pensar.', categoria: 'directa', tonos: ['frio', 'coach'] },
  { id: 'df10', texto: 'No necesitás actuar.', categoria: 'directa', tonos: ['frio', 'reflexivo'] },
  { id: 'df11', texto: 'Pausa.', categoria: 'directa', tonos: ['frio', 'calma'] },
  { id: 'df12', texto: 'Todavía tenés elección.', categoria: 'directa', tonos: ['frio', 'reflexivo'] },
  { id: 'df13', texto: 'Freno de mano. Ahora.', categoria: 'directa', tonos: ['frio', 'intenso'] },
  { id: 'df14', texto: 'Silencio.', categoria: 'directa', tonos: ['frio'] },
  { id: 'df15', texto: 'No des el siguiente paso.', categoria: 'directa', tonos: ['frio', 'seco'] },
  { id: 'df16', texto: 'Distancia.', categoria: 'directa', tonos: ['frio'] },
  { id: 'df17', texto: 'Mirá tus manos. Dejalas quietas.', categoria: 'directa', tonos: ['frio', 'coach'] },
  { id: 'df18', texto: 'Retrocede.', categoria: 'directa', tonos: ['frio'] },
  { id: 'df19', texto: 'Detente. Y mira.', categoria: 'directa', tonos: ['frio'] },

  // PERSPECTIVA
  { id: 'p1', texto: 'Lo que sientes ahora no necesariamente representa lo que quieres mañana.', categoria: 'perspectiva', tonos: ['reflexivo', 'coach'] },
  { id: 'p2', texto: 'Una urgencia puede sentirse enorme y aun así ser temporal.', categoria: 'perspectiva', tonos: ['reflexivo'] },
  { id: 'p3', texto: 'No necesitás eliminar el deseo para elegir diferente.', categoria: 'perspectiva', tonos: ['reflexivo', 'frio'] },
  { id: 'p4', texto: 'Pregúntate qué quieres después de que este momento termine.', categoria: 'perspectiva', tonos: ['reflexivo', 'coach'] },
  { id: 'p5', texto: '¿Esto resuelve algo o solamente cambia cómo te sientes durante unos minutos?', categoria: 'perspectiva', tonos: ['reflexivo', 'seco'] },
  { id: 'p6', texto: 'El momento pasará. La decisión también tendrá consecuencias.', categoria: 'perspectiva', tonos: ['reflexivo', 'frio'] },
  { id: 'p7', texto: 'No confundas alivio inmediato con lo que realmente estás buscando.', categoria: 'perspectiva', tonos: ['reflexivo', 'intenso'] },
  { id: 'p8', texto: 'A veces ganar consiste simplemente en no responder inmediatamente.', categoria: 'perspectiva', tonos: ['reflexivo', 'coach'] },
  { id: 'p9', texto: 'Imagina cómo te sentirás dentro de 30 minutos si cedes.', categoria: 'perspectiva', tonos: ['reflexivo'] },
  { id: 'p10', texto: '¿Estás escapando de algo al hacer esto?', categoria: 'perspectiva', tonos: ['reflexivo'] },
  { id: 'p11', texto: 'Un pequeño desliz no es el fin, pero podés evitarlo ahora.', categoria: 'perspectiva', tonos: ['reflexivo'] },
  { id: 'p12', texto: 'Ese impulso es un fantasma. Dejalo que se desvanezca solo.', categoria: 'perspectiva', tonos: ['reflexivo', 'calma'] },
  { id: 'p13', texto: 'La urgencia es solo tu cerebro pidiendo dopamina fácil.', categoria: 'perspectiva', tonos: ['reflexivo', 'frio'] },

  // COACH / ENTRENADOR
  { id: 'c1', texto: 'Mírame. Respira. Todavía no tomes la decisión.', categoria: 'coach', tonos: ['coach', 'entrenador'] },
  { id: 'c2', texto: 'Bien. Ya identificaste lo que está pasando. Ahora hacemos algo al respecto.', categoria: 'coach', tonos: ['coach'] },
  { id: 'c3', texto: 'No necesitas explicarlo. Necesitas atravesar este round.', categoria: 'coach', tonos: ['entrenador', 'intenso'] },
  { id: 'c4', texto: 'Quédate conmigo durante estos próximos 90 segundos.', categoria: 'coach', tonos: ['coach', 'calma'] },
  { id: 'c5', texto: 'Un paso. Después otro.', categoria: 'coach', tonos: ['coach', 'frio'] },
  { id: 'c6', texto: 'No corras detrás del impulso. Déjalo pasar mientras recuperas el control.', categoria: 'coach', tonos: ['coach', 'reflexivo'] },
  { id: 'c7', texto: 'Bien. El primer round ya empezó.', categoria: 'coach', tonos: ['coach', 'entrenador'] },
  { id: 'c8', texto: 'No estamos buscando perfección. Estamos buscando una decisión consciente.', categoria: 'coach', tonos: ['coach', 'reflexivo'] },

  // INTENSAS
  { id: 'i1', texto: 'Aquí es donde normalmente cedes. Esta vez observa el momento.', categoria: 'intensa', tonos: ['intenso'] },
  { id: 'i2', texto: 'No necesitas sentirte motivado.', categoria: 'intensa', tonos: ['intenso', 'frio'] },
  { id: 'i3', texto: 'Haz lo que decidiste cuando estabas tranquilo.', categoria: 'intensa', tonos: ['intenso', 'coach'] },
  { id: 'i4', texto: 'El impulso está haciendo ruido. No tienes que hacerlo.', categoria: 'intensa', tonos: ['intenso', 'reflexivo'] },
  { id: 'i5', texto: 'Mantén la posición.', categoria: 'intensa', tonos: ['intenso', 'entrenador'] },
  { id: 'i6', texto: 'No te distraigas de la decisión que ya tomaste.', categoria: 'intensa', tonos: ['intenso', 'coach'] },
  { id: 'i7', texto: 'Este es exactamente el tipo de momento para el que estabas preparando este sistema.', categoria: 'intensa', tonos: ['intenso', 'reflexivo'] },
  { id: 'i8', texto: 'No busques una salida rápida. Busca recuperar el control.', categoria: 'intensa', tonos: ['intenso', 'coach'] },

  // CINEMÁTICAS
  { id: 'cn1', texto: 'Nadie entra al ring cuando todo está fácil.', categoria: 'cinematica', tonos: ['cinematico', 'entrenador'] },
  { id: 'cn2', texto: 'Este es el momento que nadie ve.', categoria: 'cinematica', tonos: ['cinematico', 'reflexivo'] },
  { id: 'cn3', texto: 'Las decisiones importantes rara vez hacen ruido.', categoria: 'cinematica', tonos: ['cinematico', 'frio'] },
  { id: 'cn4', texto: 'El verdadero round empieza cuando desaparece la motivación.', categoria: 'cinematica', tonos: ['cinematico', 'intenso'] },
  { id: 'cn5', texto: 'No necesitás una multitud. Necesitás mantener tu decisión.', categoria: 'cinematica', tonos: ['cinematico', 'coach'] },
  { id: 'cn6', texto: 'Cuando termine este momento, podrás mirar atrás y saber qué hiciste con él.', categoria: 'cinematica', tonos: ['cinematico', 'reflexivo'] },
  { id: 'cn7', texto: 'La distancia entre lo que eres y lo que quieres ser es lo que haces ahora.', categoria: 'cinematica', tonos: ['cinematico', 'intenso'] },
  { id: 'cn8', texto: 'No viniste hasta aquí para rendirte por un capricho.', categoria: 'cinematica', tonos: ['cinematico'] },
  { id: 'cn9', texto: 'El acero se forja en el fuego. Tú te forjas en estos 90 segundos.', categoria: 'cinematica', tonos: ['cinematico'] },
  { id: 'cn10', texto: 'El héroe no es el que nunca cae, es el que decide quedarse de pie cuando todo invita a caer.', categoria: 'cinematica', tonos: ['cinematico'] },
  { id: 'cn11', texto: 'Esta es la escena donde la música se detiene. Tu turno.', categoria: 'cinematica', tonos: ['cinematico'] },

  // HUMOR SECO
  { id: 'h1', texto: 'Tu cerebro acaba de presentar una propuesta.\nRevisemos los términos antes de firmar.', categoria: 'humor', tonos: ['seco'] },
  { id: 'h2', texto: 'Excelente argumento.\nLástima que apareció justo cuando estabas intentando cambiar.', categoria: 'humor', tonos: ['seco'] },
  { id: 'h3', texto: 'Parece urgente.\nCuriosamente, también puede esperar 90 segundos.', categoria: 'humor', tonos: ['seco'] },
  { id: 'h4', texto: 'Tu impulso quiere una respuesta inmediata.\nQué conveniente.', categoria: 'humor', tonos: ['seco'] },
  { id: 'h5', texto: 'No vamos a tomar decisiones importantes mientras tu cerebro está haciendo campaña.', categoria: 'humor', tonos: ['seco'] },
  { id: 'h6', texto: 'Esa excusa merece un premio a la creatividad. Ahora ignórala.', categoria: 'humor', tonos: ['seco'] },
  { id: 'h7', texto: 'Tu cerebro está actuando como un vendedor de tiempos compartidos. Di no.', categoria: 'humor', tonos: ['seco'] },
  { id: 'h8', texto: 'Dato curioso: no morirás si ignoras ese impulso. Probado científicamente.', categoria: 'humor', tonos: ['seco'] },
  { id: 'h9', texto: 'Ese impulso tiene la misma credibilidad que un correo de spam.', categoria: 'humor', tonos: ['seco'] },

  // CALMA
  { id: 'ca1', texto: 'No tienes que luchar contra el momento. Solo atravesarlo.', categoria: 'calma', tonos: ['calma', 'reflexivo'] },
  { id: 'ca2', texto: 'Baja el ritmo.', categoria: 'calma', tonos: ['calma', 'frio'] },
  { id: 'ca3', texto: 'Respira.', categoria: 'calma', tonos: ['calma', 'frio', 'coach'] },
  { id: 'ca4', texto: 'Déjalo pasar sin perseguirlo.', categoria: 'calma', tonos: ['calma', 'reflexivo'] },
  { id: 'ca5', texto: 'No necesitas resolver toda tu vida ahora.', categoria: 'calma', tonos: ['calma', 'coach'] },
  { id: 'ca6', texto: 'Este momento tiene un principio y tendrá un final.', categoria: 'calma', tonos: ['calma', 'reflexivo'] },
  { id: 'ca7', texto: 'Quédate aquí un poco más.', categoria: 'calma', tonos: ['calma', 'coach'] },
  { id: 'ca8', texto: 'Puedes esperar.', categoria: 'calma', tonos: ['calma', 'frio'] },
  { id: 'ca9', texto: 'Relaja la mandíbula. Suelta la tensión.', categoria: 'calma', tonos: ['calma'] },
  { id: 'ca10', texto: 'No hay emergencia. Solo una sensación pasajera.', categoria: 'calma', tonos: ['calma'] },
  { id: 'ca11', texto: 'Permítete sentirlo sin reaccionar.', categoria: 'calma', tonos: ['calma', 'reflexivo'] },

  // DESPUÉS DE UNA RECAÍDA
  { id: 'pr1', texto: 'El round terminó. Ahora podemos aprender qué ocurrió.', categoria: 'post_recaida', tonos: ['coach', 'reflexivo', 'entrenador'] },
  { id: 'pr2', texto: 'Esto no necesita convertirse en una excusa para abandonar todo lo demás.', categoria: 'post_recaida', tonos: ['frio', 'coach'] },
  { id: 'pr3', texto: 'Registrá lo que pasó. Mañana tendrás información que hoy no tenías.', categoria: 'post_recaida', tonos: ['reflexivo', 'coach'] },
  { id: 'pr4', texto: 'No borres el progreso anterior por una sola decisión.', categoria: 'post_recaida', tonos: ['frio', 'reflexivo'] },
  { id: 'pr5', texto: 'No necesitás castigarte para aprender.', categoria: 'post_recaida', tonos: ['calma', 'reflexivo'] },
  { id: 'pr6', texto: 'Mirá el patrón. No te juzgues.', categoria: 'post_recaida', tonos: ['frio', 'calma'] },
  { id: 'pr7', texto: '¿Qué ocurrió justo antes?', categoria: 'post_recaida', tonos: ['frio', 'coach'] },
  { id: 'pr8', texto: 'El objetivo ahora es entender, no castigarte.', categoria: 'post_recaida', tonos: ['coach', 'reflexivo'] },

  // DESPUÉS DE RESISTIR
  { id: 'ps1', texto: 'Round terminado.', categoria: 'post_resistencia', tonos: ['frio', 'entrenador'] },
  { id: 'ps2', texto: 'Tomaste una decisión consciente.', categoria: 'post_resistencia', tonos: ['coach', 'reflexivo'] },
  { id: 'ps3', texto: 'El impulso pasó y tú seguiste aquí.', categoria: 'post_resistencia', tonos: ['cinematico', 'reflexivo'] },
  { id: 'ps4', texto: 'Bien. Guarda este momento.', categoria: 'post_resistencia', tonos: ['coach', 'frio'] },
  { id: 'ps5', texto: 'Esto también forma parte del entrenamiento.', categoria: 'post_resistencia', tonos: ['entrenador', 'intenso'] },
  { id: 'ps6', texto: 'Recuerda qué hiciste cuando vuelva a ocurrir.', categoria: 'post_resistencia', tonos: ['coach', 'reflexivo'] },
  { id: 'ps7', texto: 'No necesitás celebrar una guerra. Solo reconocé el round que acabas de completar.', categoria: 'post_resistencia', tonos: ['frio', 'reflexivo'] },

  // CONTEXTUALES
  { id: 'cx1', texto: 'No necesitás llenar cada silencio.', categoria: 'contextual', contextoAsociado: ['Estoy aburrido'], tonos: ['reflexivo', 'frio'] },
  { id: 'cx2', texto: 'Quizá no quieres hacerlo. Quizá solamente quieres sentir algo diferente.', categoria: 'contextual', contextoAsociado: ['Estoy aburrido'], tonos: ['reflexivo', 'coach'] },
  { id: 'cx3', texto: 'No tomes una decisión automática para solucionar una emoción momentánea.', categoria: 'contextual', contextoAsociado: ['Estoy estresado', 'Ansiedad'], tonos: ['reflexivo', 'frio'] },
  { id: 'cx4', texto: 'Primero baja la velocidad. Después decide.', categoria: 'contextual', contextoAsociado: ['Estoy estresado'], tonos: ['coach', 'calma'] },
  { id: 'cx5', texto: 'Esta vez observa el movimiento antes de completarlo.', categoria: 'contextual', contextoAsociado: ['Hábito automático'], tonos: ['frio', 'coach'] },
  { id: 'cx6', texto: 'Que otros lo hagan no significa que tú tengas que hacerlo.', categoria: 'contextual', contextoAsociado: ['Presión social'], tonos: ['intenso', 'frio'] },
  
  // TRANSICIONES
  { id: 'tr1', texto: 'Vamos a ver qué está pasando.', categoria: 'transicion', tonos: ['coach'] },
  { id: 'tr2', texto: 'No tienes que resolverlo todo. Solo empieza.', categoria: 'transicion', tonos: ['coach', 'calma'] },
  { id: 'tr3', texto: 'Entonces cambiamos de estrategia.', categoria: 'transicion', tonos: ['frio', 'entrenador'] },
  { id: 'tr4', texto: 'Todavía no terminó.', categoria: 'transicion', tonos: ['frio', 'intenso'] },
  { id: 'tr5', texto: 'La decisión es tuya. Hazla conscientemente.', categoria: 'transicion', tonos: ['reflexivo', 'frio'] }
];

/** 'suave' | 'countdown' | 'sombra' | 'estandar' — reglas de UX que aplican
 *  la respuesta de CABEZA a la intervención de ENTRADA. No son evaluación psicológica. */
export type ReglaEntrada = 'suave' | 'countdown' | 'sombra' | 'estandar';
export type FaseIntervencion = 'activacion' | 'entrada';
export type TipoIntervencion = 'movimiento' | 'respiracion' | 'sombra' | 'countdown';

export interface Intervencion {
  id: string;
  fase: FaseIntervencion;
  titulo: string;
  instruccion: string;
  /** ej. '10 flexiones' — si existe, el CTA es [HECHO] */
  reps?: string;
  /** si existe, el anillo pasa a modo intervalo y el CTA es [EMPEZAR] */
  duracionSeg?: number;
  bandas: number[];
  regla?: ReglaEntrada;
}

export const INTERVENCIONES: Intervencion[] = [
  // ── ACTIVACIÓN (1ª intervención, por banda de ganas) ──
  { id: 'act_agua', fase: 'activacion', titulo: 'UN VASO DE AGUA', bandas: [1, 2],
    instruccion: 'Toma un vaso de agua sin apuro. Baja el ritmo mientras tanto.' },
  { id: 'act_respira444', fase: 'activacion', titulo: 'RESPIRACIÓN 4-4-4', bandas: [1, 2],
    instruccion: 'Inhala contando 4. Mantén 4. Exhala 4. Tres ciclos.', duracionSeg: 36 },
  { id: 'act_caminar', fase: 'activacion', titulo: 'CAMINA UN MINUTO', bandas: [1, 2],
    instruccion: 'Levántate y camina por la casa durante un minuto.', duracionSeg: 60 },

  { id: 'act_flex', fase: 'activacion', titulo: '10 FLEXIONES', bandas: [3],
    instruccion: 'Diez flexiones, a tu ritmo. Sin apuro.', reps: '10 flexiones' },
  { id: 'act_sent', fase: 'activacion', titulo: '15 SENTADILLAS', bandas: [3],
    instruccion: 'Quince sentadillas, controlando el descenso.', reps: '15 sentadillas' },
  { id: 'act_plancha', fase: 'activacion', titulo: 'PLANCHA DE 30', bandas: [3],
    instruccion: 'Mantén la plancha 30 segundos con la espalda recta.', duracionSeg: 30 },

  { id: 'act_burpees', fase: 'activacion', titulo: '10 BURPEES', bandas: [4, 5],
    instruccion: 'Diez burpees. Si necesitas frenar un momento, frena.', reps: '10 burpees' },
  { id: 'act_salto', fase: 'activacion', titulo: '15 SENTADILLAS CON SALTO', bandas: [4, 5],
    instruccion: 'Quince sentadillas con salto. Elevación corta.', reps: '15 con salto' },
  { id: 'act_sprint', fase: 'activacion', titulo: 'SPRINT EN EL LUGAR', bandas: [4, 5],
    instruccion: 'Rodillas arriba, 30 segundos sin frenar.', duracionSeg: 30 },

  // ── ENTRADA (2ª intervención corta, condicionada por la respuesta de CABEZA) ──
  { id: 'ent_suave30', fase: 'entrada', regla: 'suave', bandas: [1, 2, 3, 4, 5],
    titulo: '30 SEGUNDOS DE MOVIMIENTO SUAVE',
    instruccion: 'Estira los brazos y mueve los hombros. Mantente en movimiento.', duracionSeg: 30 },
  { id: 'ent_suave_respira', fase: 'entrada', regla: 'suave', bandas: [1, 2, 3, 4, 5],
    titulo: 'RESPIRACIÓN 4-4-4',
    instruccion: 'Inhala 4, mantén 4, exhala 4. Tres ciclos.', duracionSeg: 36 },

  { id: 'ent_cd_sent', fase: 'entrada', regla: 'countdown', bandas: [1, 2, 3, 4, 5],
    titulo: 'CUENTA 5 · 4 · 3 · 2 · 1',
    instruccion: 'Cuenta hacia atrás en voz alta y termina con 10 sentadillas.', reps: '10 sentadillas' },
  { id: 'ent_cd_flex', fase: 'entrada', regla: 'countdown', bandas: [1, 2, 3, 4, 5],
    titulo: 'CUENTA 5 · 4 · 3 · 2 · 1',
    instruccion: 'Cuenta hacia atrás en voz alta y termina con 10 flexiones.', reps: '10 flexiones' },

  { id: 'ent_sombra20', fase: 'entrada', regla: 'sombra', bandas: [1, 2, 3, 4, 5],
    titulo: '20 SEGUNDOS DE SOMBRA',
    instruccion: 'Guardia arriba, golpes cortos. Solo muévete.', duracionSeg: 20 },
  { id: 'ent_sombra30', fase: 'entrada', regla: 'sombra', bandas: [1, 2, 3, 4, 5],
    titulo: '30 SEGUNDOS DE SOMBRA',
    instruccion: 'Muévete sin frenar durante 30 segundos.', duracionSeg: 30 },

  { id: 'ent_std_sent', fase: 'entrada', regla: 'estandar', bandas: [1, 2, 3, 4, 5],
    titulo: '15 SENTADILLAS',
    instruccion: 'Quince sentadillas. La segunda vuelta es corta.', reps: '15 sentadillas' },
  { id: 'ent_std_flex', fase: 'entrada', regla: 'estandar', bandas: [1, 2, 3, 4, 5],
    titulo: '10 FLEXIONES',
    instruccion: 'Diez flexiones. Solo para entrar en movimiento.', reps: '10 flexiones' },
];

export interface OpcionPregunta {
  id: string;
  etiqueta: string;
  entrada: ReglaEntrada;
}

export interface Pregunta {
  id: string;
  texto: string;
  opciones: OpcionPregunta[];
}

export const PREGUNTAS: Pregunta[] = [
  { id: 'q_freno', texto: '¿Qué te está frenando hoy?', opciones: [
    { id: 'cansancio', etiqueta: 'Cansancio', entrada: 'suave' },
    { id: 'pereza', etiqueta: 'Pereza', entrada: 'countdown' },
    { id: 'estres', etiqueta: 'Estrés', entrada: 'sombra' },
    { id: 'tiempo', etiqueta: 'Falta de tiempo', entrada: 'estandar' },
    { id: 'nada', etiqueta: 'Nada', entrada: 'estandar' },
  ]},
  { id: 'q_sentir', texto: '¿Qué quieres sentir cuando termines?', opciones: [
    { id: 'energia', etiqueta: 'Más energía', entrada: 'estandar' },
    { id: 'tranquilo', etiqueta: 'Más tranquilo', entrada: 'sombra' },
    { id: 'fuerte', etiqueta: 'Más fuerte', entrada: 'countdown' },
    { id: 'orgullo', etiqueta: 'Orgulloso de haber venido', entrada: 'estandar' },
  ]},
  { id: 'q_trabajo', texto: '¿Qué vas a trabajar hoy?', opciones: [
    { id: 'tecnica', etiqueta: 'Técnica', entrada: 'estandar' },
    { id: 'fuerza', etiqueta: 'Fuerza', entrada: 'countdown' },
    { id: 'cardio', etiqueta: 'Cardio', entrada: 'sombra' },
    { id: 'todo', etiqueta: 'Todo un poco', entrada: 'estandar' },
  ]},
  { id: 'q_necesita', texto: '¿Qué necesitas hoy?', opciones: [
    { id: 'despacio', etiqueta: 'Empezar despacio', entrada: 'suave' },
    { id: 'exigirme', etiqueta: 'Exigirme', entrada: 'countdown' },
    { id: 'despejar', etiqueta: 'Despejarme', entrada: 'sombra' },
    { id: 'cumplir', etiqueta: 'Simplemente cumplir', entrada: 'estandar' },
  ]},
  { id: 'q_veinte', texto: 'Si hoy solo haces 20 minutos, ¿igual cuenta?', opciones: [
    { id: 'si_cuenta', etiqueta: 'Sí, cuenta', entrada: 'estandar' },
  ]},
];

/** Etapas del indicador ●──○──○──○ (4 pips). */
export const ETAPAS = ['ESTADO', 'ACTIVACIÓN', 'CABEZA', 'ENTRADA'] as const;

export const CIERRE_TEXTO = 'YA ESTÁ. No tienes que pensar en todo el entrenamiento. Solo empieza.';
export const TEXTO_BAJAS_GANAS = 'Hoy no llegas con energía. No hace falta para empezar.';
export const TEXTO_ALTA_GANAS = 'ESTÁS ENCENDIDO. No desperdiciemos el impulso.';
export const TEXTO_SEGUIMOS = '¿Seguimos?';

const hash = (texto: string): number => {
  let h = 5381;
  for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) >>> 0;
  return h;
};

interface SeleccionOpts {
  evitadoIds?: string[];
  regla?: ReglaEntrada;
  semilla?: string;
}

/**
 * Selección determinista (semilla fecha+día, sin IA): filtra por fase y banda,
 * estrecha por la regla de entrada cuando corresponde y descarta las ya usadas
 * (historial de la sesión + `getUltimaSesion()`).
 */
export const seleccionarIntervencion = (
  fase: FaseIntervencion,
  banda: number,
  opts: SeleccionOpts = {}
): Intervencion | null => {
  let pool = INTERVENCIONES.filter(i => i.fase === fase && i.bandas.includes(banda));

  if (fase === 'entrada' && opts.regla) {
    const porRegla = pool.filter(i => i.regla === opts.regla);
    if (porRegla.length > 0) pool = porRegla;
  }

  const evitados = opts.evitadoIds ?? [];
  if (evitados.length > 0) {
    const resto = pool.filter(i => !evitados.includes(i.id));
    if (resto.length > 0) pool = resto;
  }

  if (pool.length === 0) return null;
  return pool[hash(`${opts.semilla ?? ''}:${fase}`) % pool.length];
};

/** Pregunta de CABEZA: 1 por sesión, determinista. */
export const seleccionarPregunta = (semilla: string): Pregunta =>
  PREGUNTAS[hash(`${semilla}:cabeza`) % PREGUNTAS.length];

/** Línea de apoyo del round (banco de frases, categorías de apoyo). */
export const fraseApoyo = (categorias: CategoriaFrase[], semilla: string): Frase => {
  const posibles = FRASES_BIBLIOTECA.filter(f => categorias.includes(f.categoria));
  const banco = posibles.length > 0 ? posibles : FRASES_BIBLIOTECA;
  return banco[hash(semilla) % banco.length];
};
