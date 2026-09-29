import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { PALETTE, RADIUS, TYPE, pressedFeedback } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import {
  ETAPAS,
  CIERRE_TEXTO,
  TEXTO_BAJAS_GANAS,
  TEXTO_ALTA_GANAS,
  TEXTO_SEGUIMOS,
  fraseApoyo,
  seleccionarIntervencion,
  seleccionarPregunta,
  CategoriaFrase,
  Frase,
  Intervencion,
  OpcionPregunta,
  Pregunta,
  ReglaEntrada,
} from '../services/controlContent';
import { cerrarSesion, iniciarSesion, getUltimaSesion } from '../repositories/esquinaRepo';
import { toISODate } from '../utils/semana';

type Props = StackScreenProps<RootStackParamList, 'Control'>;

type Etapa = 'estado' | 'activacion' | 'cabeza' | 'entrada';
type EntradaSub = 'seguimos' | 'intervencion' | 'cierre';
type Reloj = { modo: 'round' | 'intervalo'; restante: number };

const ROUND_ACTIVACION = 90;
const ROUND_ENTRADA = 30;

/** Frase corta asociada a cada extremo de la escala (2-4 quedan vacíos). */
const ESCALA_FRASES: Record<number, string> = {
  1: 'PUEDO MANEJARLO',
  5: 'EMPIEZA EL CONFLICTO',
};

const categoriasApoyo = (ganas: number): CategoriaFrase[] =>
  ganas <= 2
    ? ['round', 'calma', 'coach']
    : ganas >= 4
      ? ['round', 'intensa', 'coach']
      : ['round', 'coach', 'transicion'];

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function ControlScreen({ navigation }: Props) {
  const [etapa, setEtapa] = useState<Etapa>('estado');
  const [entradaSub, setEntradaSub] = useState<EntradaSub>('intervencion');
  const [ganas, setGanas] = useState(3);
  const [pregunta, setPregunta] = useState<Pregunta | null>(null);
  const [intervencion, setIntervencion] = useState<Intervencion | null>(null);
  const [completado, setCompletado] = useState(false);
  const [reloj, setReloj] = useState<Reloj>({ modo: 'round', restante: ROUND_ACTIVACION });
  const [frase, setFrase] = useState<Frase | null>(null);

  const semillaRef = useRef(toISODate(new Date()));
  const etapaRef = useRef<Etapa>(etapa);
  const entradaSubRef = useRef<EntradaSub>(entradaSub);
  const relojRef = useRef<Reloj>(reloj);
  const ganasRef = useRef(ganas);
  const intervencionRef = useRef<Intervencion | null>(intervencion);
  const respuestaRef = useRef<{ preguntaId: string; opcionId: string; regla: ReglaEntrada } | null>(null);

  const sesionIdRef = useRef<number | null>(null);
  const sesionIniciadaRef = useRef(false);
  const sesionCerradaRef = useRef(false);
  const animandoRef = useRef(false);
  const montadoRef = useRef(true);
  const yendoRef = useRef(false);

  const usadasRef = useRef<string[]>([]);
  const ultimasRef = useRef<string[]>([]);
  const roundBaseRef = useRef(ROUND_ACTIVACION);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const tickRef = useRef<() => void>(() => {});

  const cambiarEtapa = (e: Etapa) => {
    etapaRef.current = e;
    setEtapa(e);
  };

  const cambiarEntradaSub = (s: EntradaSub) => {
    entradaSubRef.current = s;
    setEntradaSub(s);
  };

  const aplicarReloj = (nuevo: Reloj) => {
    relojRef.current = nuevo;
    setReloj(nuevo);
  };

  const registrarUsada = (id: string) => {
    if (!usadasRef.current.includes(id)) usadasRef.current.push(id);
  };

  const avanzarTrasCompletar = () => {
    animandoRef.current = false;
    if (etapaRef.current === 'activacion') {
      cambiarEtapa('cabeza');
    } else if (etapaRef.current === 'entrada' && entradaSubRef.current === 'intervencion') {
      cambiarEntradaSub('cierre');
    }
  };

  const completarIntervencion = () => {
    if (animandoRef.current) return;
    const actual = intervencionRef.current;
    if (!actual) return;
    animandoRef.current = true;
    registrarUsada(actual.id);
    setCompletado(true);
    checkAnim.setValue(0);
    Animated.spring(checkAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start(({ finished }) => {
      animandoRef.current = false;
      if (finished && montadoRef.current) avanzarTrasCompletar();
    });
  };

  // Único setInterval de la pantalla: callback por ref, se crea una sola vez.
  useEffect(() => {
    tickRef.current = () => {
      const actual = relojRef.current;
      if (actual.restante <= 0) return;
      const restante = actual.restante - 1;
      aplicarReloj({ modo: actual.modo, restante });
      if (restante === 0 && actual.modo === 'intervalo') {
        aplicarReloj({ modo: 'round', restante: roundBaseRef.current });
        completarIntervencion();
      }
    };
  });

  useEffect(() => {
    const id = setInterval(() => tickRef.current(), 1000);
    return () => clearInterval(id);
  }, []);

  // Anti-repetición: ids de la última sesión registrada.
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const ultima = await getUltimaSesion();
        if (!vivo || !ultima?.intervenciones) return;
        const ids = JSON.parse(ultima.intervenciones);
        if (Array.isArray(ids)) {
          ultimasRef.current = ids.filter((x): x is string => typeof x === 'string');
        }
      } catch {
        console.error('esquina: no se pudo leer la última sesión');
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      loopRef.current?.stop();
    };
  }, []);

  // Fade + spring al cambiar de etapa (patrón ya usado en la pantalla).
  useEffect(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, [etapa, entradaSub, fadeAnim, scaleAnim]);

  // Pulso del anillo: loop con cleanup garantizado (.stop() al salir o desmontar).
  const mostrarAnillo =
    etapa === 'activacion' || (etapa === 'entrada' && entradaSub === 'intervencion');
  useEffect(() => {
    if (mostrarAnillo) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loopRef.current = loop;
      loop.start();
    } else {
      loopRef.current?.stop();
      loopRef.current = null;
      pulseAnim.setValue(1);
    }
    return () => {
      loopRef.current?.stop();
      loopRef.current = null;
    };
  }, [mostrarAnillo, pulseAnim]);

  const salir = () => {
    if (yendoRef.current) return;
    const id = sesionIdRef.current;
    if (id !== null && !sesionCerradaRef.current) {
      sesionCerradaRef.current = true;
      const etapaFinal =
        etapaRef.current === 'entrada'
          ? `entrada:${entradaSubRef.current}`
          : etapaRef.current;
      const resp = respuestaRef.current;
      void cerrarSesion(id, {
        etapaFinal,
        respuestas: resp
          ? { preguntaId: resp.preguntaId, opcionId: resp.opcionId }
          : {},
        intervenciones: [...usadasRef.current],
      }).catch(() => {
        console.error('esquina: no se pudo cerrar la sesión');
      });
    }
    yendoRef.current = true;
    navigation.goBack();
  };

  const handleGanas = (n: number) => {
    if (sesionIniciadaRef.current) return;
    sesionIniciadaRef.current = true;

    ganasRef.current = n;
    setGanas(n);
    setPregunta(seleccionarPregunta(semillaRef.current));
    const elegida = seleccionarIntervencion('activacion', n, {
      evitadoIds: [...ultimasRef.current],
      semilla: semillaRef.current,
    });
    intervencionRef.current = elegida;
    setIntervencion(elegida);
    setCompletado(false);
    setFrase(fraseApoyo(categoriasApoyo(n), semillaRef.current));
    usadasRef.current = [];
    roundBaseRef.current = ROUND_ACTIVACION;
    aplicarReloj({ modo: 'round', restante: ROUND_ACTIVACION });
    cambiarEtapa('activacion');

    (async () => {
      try {
        sesionIdRef.current = await iniciarSesion(n);
      } catch {
        console.error('esquina: no se pudo iniciar la sesión');
        if (montadoRef.current) {
          Alert.alert('No se pudo registrar la sesión', 'Puedes continuar igual.');
        }
      }
    })();
  };

  const handleEmpezar = () => {
    const actual = intervencionRef.current;
    if (!actual || !actual.duracionSeg || animandoRef.current) return;
    if (relojRef.current.modo === 'round') {
      roundBaseRef.current = relojRef.current.restante;
    }
    aplicarReloj({ modo: 'intervalo', restante: actual.duracionSeg });
  };

  const handleListo = () => {
    aplicarReloj({ modo: 'round', restante: roundBaseRef.current });
    completarIntervencion();
  };

  const handleCambiarReto = () => {
    const actual = intervencionRef.current;
    if (!actual || animandoRef.current) return;
    const evitados = [...usadasRef.current, actual.id, ...ultimasRef.current];
    const siguiente = seleccionarIntervencion(actual.fase, ganasRef.current, {
      regla: actual.fase === 'entrada' ? respuestaRef.current?.regla : undefined,
      evitadoIds: evitados,
      semilla: `${semillaRef.current}:${evitados.length}`,
    });
    const elegida = siguiente;
    if (!elegida) return;
    intervencionRef.current = elegida;
    setIntervencion(elegida);
    setCompletado(false);
    animandoRef.current = false;
    if (relojRef.current.modo === 'intervalo') {
      aplicarReloj({ modo: 'round', restante: roundBaseRef.current });
    }
  };

  const handleRespuesta = (op: OpcionPregunta) => {
    const actual = pregunta;
    if (!actual || etapaRef.current !== 'cabeza') return;
    respuestaRef.current = {
      preguntaId: actual.id,
      opcionId: op.id,
      regla: op.entrada,
    };
    const entrada = seleccionarIntervencion('entrada', ganasRef.current, {
      regla: op.entrada,
      evitadoIds: [...usadasRef.current, ...ultimasRef.current],
      semilla: semillaRef.current,
    });
    intervencionRef.current = entrada;
    setIntervencion(entrada);
    setCompletado(false);
    animandoRef.current = false;
    roundBaseRef.current = ROUND_ENTRADA;
    aplicarReloj({ modo: 'round', restante: ROUND_ENTRADA });
    cambiarEntradaSub(ganasRef.current <= 2 ? 'seguimos' : 'intervencion');
    cambiarEtapa('entrada');
  };

  const handleSeguir = () => {
    roundBaseRef.current = ROUND_ENTRADA;
    aplicarReloj({ modo: 'round', restante: ROUND_ENTRADA });
    cambiarEntradaSub('intervencion');
  };

  const etapaIndex = etapa === 'estado' ? 0 : etapa === 'activacion' ? 1 : etapa === 'cabeza' ? 2 : 3;

  const renderAnillo = (roundLabel: string) => (
    <>
      <Text style={styles.roundLabel}>{roundLabel}</Text>
      <Animated.View
        style={[
          styles.timerCircle,
          reloj.modo === 'intervalo' && styles.timerCircleActivo,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Text style={styles.timerText}>{formatTime(reloj.restante)}</Text>
        <Text style={styles.timerModo}>{reloj.modo === 'intervalo' ? 'EN CURSO' : 'ROUND'}</Text>
      </Animated.View>
    </>
  );

  const renderIntervencionCard = (eyebrow: string) =>
    intervencion ? (
      <View style={styles.intervencionCard}>
        <Text style={styles.intervencionEyebrow}>{eyebrow}</Text>
        <Text style={styles.intervencionTitulo}>{intervencion.titulo}</Text>
        <Text style={styles.intervencionInstruccion}>{intervencion.instruccion}</Text>
        {(intervencion.reps || intervencion.duracionSeg) && (
          <Text style={styles.intervencionMeta}>
            {intervencion.reps ?? `${intervencion.duracionSeg} SEGUNDOS`}
          </Text>
        )}
      </View>
    ) : null;

  const renderAcciones = () => {
    if (completado) {
      return (
        <Animated.View style={[styles.completadoView, { transform: [{ scale: checkAnim }] }]}>
          <Ionicons name="checkmark-circle" size={56} color={PALETTE.categorias.habitos} />
          <Text style={styles.completadoTexto}>COMPLETADO</Text>
        </Animated.View>
      );
    }
    const actual = intervencionRef.current;
    const corriendo = reloj.modo === 'intervalo';
    return (
      <View style={{ width: '100%' }}>
        {corriendo ? (
          <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && pressedFeedback]} onPress={handleListo}>
            <Text style={styles.primaryBtnText}>LISTO</Text>
          </Pressable>
        ) : actual && actual.duracionSeg ? (
          <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && pressedFeedback]} onPress={handleEmpezar}>
            <Text style={styles.primaryBtnText}>EMPEZAR</Text>
          </Pressable>
        ) : (
          <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && pressedFeedback]} onPress={completarIntervencion}>
            <Text style={styles.primaryBtnText}>HECHO</Text>
          </Pressable>
        )}
        {!corriendo && (
          <Pressable style={({ pressed }) => [styles.ghostBtn, pressed && pressedFeedback]} onPress={handleCambiarReto}>
            <Text style={styles.ghostBtnText}>CAMBIAR RETO</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={salir}
          style={({ pressed }) => [styles.closeBtn, pressed && pressedFeedback]}
          hitSlop={6}
        >
          <Ionicons name="close" size={28} color={PALETTE.ash} />
        </Pressable>
        <Text style={styles.headerTitle}>TU ESQUINA</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
      >
        <View style={styles.center}>
          <View style={styles.pipsRow}>
            {ETAPAS.map((nombre, i) => (
              <React.Fragment key={nombre}>
                {i > 0 && (
                  <View style={[styles.pipLinea, i <= etapaIndex && styles.pipLineaHecha]} />
                )}
                <View
                  style={[
                    styles.pip,
                    i < etapaIndex && styles.pipHecha,
                    i === etapaIndex && styles.pipActiva,
                  ]}
                />
              </React.Fragment>
            ))}
          </View>
          <Text style={styles.pipLabel}>{ETAPAS[etapaIndex]}</Text>

          {etapa === 'estado' && (
            <>
              <Text style={styles.titleEscala}>¿Cómo te encuentras?</Text>
              <Text style={styles.escalaCaption}>1 = pocas ganas · 5 = muchas</Text>
              <View style={styles.ganasRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <View key={n} style={styles.ganasCol}>
                    <Pressable
                      onPress={() => handleGanas(n)}
                      style={({ pressed }) => [styles.ganasBtn, pressed && pressedFeedback]}
                    >
                      <Text style={styles.ganasNum}>{n}</Text>
                    </Pressable>
                    <Text style={styles.ganasFrase}>{ESCALA_FRASES[n] ?? ''}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.hintText}>Elige la que mejor describa tu momento. No hay respuesta mala.</Text>
            </>
          )}

          {etapa === 'activacion' && (
            <>
              {renderAnillo('ROUND 01')}
              {frase && <Text style={styles.quoteText}>{frase.texto}</Text>}
              {renderIntervencionCard('ACTIVACIÓN')}
              {renderAcciones()}
            </>
          )}

          {etapa === 'cabeza' && (
            <>
              <Text style={styles.eyebrow}>TU CABEZA</Text>
              <Text style={styles.title}>{pregunta?.texto ?? ''}</Text>
              <View style={styles.opciones}>
                {pregunta?.opciones.map(op => (
                  <Pressable
                    key={op.id}
                    onPress={() => handleRespuesta(op)}
                    style={({ pressed }) => [styles.opcionBtn, pressed && pressedFeedback]}
                  >
                    <Text style={styles.opcionText}>{op.etiqueta}</Text>
                    <Ionicons name="chevron-forward" size={18} color={PALETTE.outline} />
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {etapa === 'entrada' && entradaSub === 'seguimos' && (
            <>
              <Text style={styles.quoteText}>{TEXTO_BAJAS_GANAS}</Text>
              <Text style={styles.title}>{TEXTO_SEGUIMOS}</Text>
              <View style={{ width: '100%' }}>
                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && pressedFeedback]}
                  onPress={handleSeguir}
                >
                  <Text style={styles.primaryBtnText}>SEGUIR</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.ghostBtn, pressed && pressedFeedback]}
                  onPress={salir}
                >
                  <Text style={styles.ghostBtnText}>TERMINAR</Text>
                </Pressable>
              </View>
            </>
          )}

          {etapa === 'entrada' && entradaSub === 'intervencion' && (
            <>
              {renderAnillo('ROUND 02')}
              {renderIntervencionCard('ENTRADA')}
              {renderAcciones()}
            </>
          )}

          {etapa === 'entrada' && entradaSub === 'cierre' && (
            <>
              <Ionicons
                name="arrow-forward-circle"
                size={56}
                color={PALETTE.accent}
                style={{ marginBottom: 16 }}
              />
              <Text style={styles.title}>{CIERRE_TEXTO}</Text>
              {ganas >= 5 && <Text style={styles.quoteText}>{TEXTO_ALTA_GANAS}</Text>}
              <View style={{ width: '100%' }}>
                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && pressedFeedback]}
                  onPress={salir}
                >
                  <Text style={styles.primaryBtnText}>TERMINAR</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.surfaceDark },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: 44, height: 44 },
  headerTitle: { fontSize: 14, fontWeight: '800', color: PALETTE.ash, letterSpacing: 2 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, justifyContent: 'center' },
  center: { alignItems: 'center', width: '100%' },

  pipsRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 8 },
  pip: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: PALETTE.outline,
  },
  pipHecha: { backgroundColor: PALETTE.onSurfaceVariant, borderColor: PALETTE.onSurfaceVariant },
  pipActiva: {
    backgroundColor: PALETTE.categorias.importante,
    borderColor: PALETTE.categorias.importante,
  },
  pipLinea: {
    flex: 1,
    height: 1,
    backgroundColor: PALETTE.outline,
    opacity: 0.4,
    marginHorizontal: 4,
  },
  pipLineaHecha: { backgroundColor: PALETTE.categorias.importante, opacity: 0.8 },
  pipLabel: { ...TYPE.label, color: PALETTE.categorias.importante, textAlign: 'center', marginBottom: 24 },

  title: { ...TYPE.title, color: PALETTE.onDark, textAlign: 'center', marginBottom: 24 },
  titleEscala: { ...TYPE.title, color: PALETTE.onDark, textAlign: 'center', marginBottom: 8 },
  escalaCaption: { ...TYPE.caption, color: PALETTE.outline, textAlign: 'center', marginBottom: 24 },
  eyebrow: { ...TYPE.label, color: PALETTE.outline, textAlign: 'center', marginBottom: 12 },
  roundLabel: { ...TYPE.label, color: PALETTE.categorias.importante, marginBottom: 16 },
  quoteText: {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '600',
    color: PALETTE.onDarkMuted,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  hintText: { ...TYPE.caption, color: PALETTE.ash, textAlign: 'center', fontStyle: 'italic' },

  timerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
    borderColor: PALETTE.onSurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: PALETTE.surfaceDark,
  },
  timerCircleActivo: { borderColor: PALETTE.categorias.importante },
  timerText: {
    ...TYPE.display,
    fontSize: 48,
    lineHeight: 52,
    color: PALETTE.onDark,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0,
  },
  timerModo: { ...TYPE.label, color: PALETTE.outline, marginTop: 4 },

  ganasRow: { flexDirection: 'row', gap: 8, marginBottom: 16, justifyContent: 'center', alignItems: 'flex-start' },
  ganasCol: { flex: 1, alignItems: 'center', gap: 8 },
  ganasBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PALETTE.fondos.control,
    borderWidth: 1,
    borderColor: PALETTE.onSurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ganasNum: { fontSize: 22, fontWeight: '700', color: PALETTE.onDark, letterSpacing: 0 },
  ganasFrase: {
    ...TYPE.label,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.5,
    color: PALETTE.outline,
    textAlign: 'center',
  },

  intervencionCard: {
    width: '100%',
    backgroundColor: PALETTE.fondos.control,
    borderRadius: RADIUS.cards,
    padding: 24,
    marginBottom: 24,
  },
  intervencionEyebrow: { ...TYPE.label, color: PALETTE.outline, marginBottom: 8 },
  intervencionTitulo: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: PALETTE.onDark,
    marginBottom: 8,
    letterSpacing: 0,
  },
  intervencionInstruccion: {
    fontSize: 15,
    lineHeight: 22,
    color: PALETTE.onDarkMuted,
    marginBottom: 12,
    letterSpacing: 0,
  },
  intervencionMeta: { ...TYPE.label, color: PALETTE.categorias.importante },

  opciones: { width: '100%', gap: 12 },
  opcionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.fondos.control,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: RADIUS.cards,
    minHeight: 56,
  },
  opcionText: { fontSize: 16, fontWeight: '600', color: PALETTE.onDarkMuted, flex: 1, letterSpacing: 0 },

  completadoView: { alignItems: 'center', width: '100%', paddingVertical: 8 },
  completadoTexto: { ...TYPE.label, color: PALETTE.categorias.habitos, marginTop: 8 },

  primaryBtn: {
    width: '100%',
    minHeight: 56,
    backgroundColor: PALETTE.primary,
    borderRadius: RADIUS.buttons,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  primaryBtnText: { color: PALETTE.onAccent, fontSize: 15, fontWeight: '800', letterSpacing: 0, textAlign: 'center' },
  ghostBtn: {
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  ghostBtnText: { color: PALETTE.outline, fontSize: 14, fontWeight: '700', letterSpacing: 0 },
});
