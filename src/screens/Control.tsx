import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Easing, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { FRASES_BIBLIOTECA, INTERVENCIONES, Frase, Intervencion, Tone } from '../services/controlContent';

type Props = StackScreenProps<RootStackParamList, 'Control'>;

type Step = 'intensidíad' | 'contexto' | 'preparacion' | 'round' | 'evaluacion' | 'momento_clave' | 'final';

const CONTEXTOS = [
  'Tengo ganas de hacerlo',
  'Estoy aburrido',
  'Estoy estresado',
  'Busco una excusa',
  'A punto de romper',
  'Ansiedíad',
  'Hábito automático',
  'Presión social'
];

export default function ControlScreen({ navigation }: Props) {
  const userTone: Tone = 'entrenador';

  const [step, setStep] = useState<Step>('intensidíad');
  const [intensidíad, setIntensidíad] = useState<number>(5);
  const [contexto, setContexto] = useState<string>('');
  
  const [currentRound, setCurrentRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(2);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  
  const [fraseActual, setFraseActual] = useState<Frase | null>(null);
  const [intervencionActual, setIntervencionActual] = useState<Intervencion | null>(null);
  const [comboStep, setComboStep] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const getFrase = (cat?: string): Frase => {
    let posibles = FRASES_BIBLIOTECA.filter(f => f.tonos.includes(userTone));
    if (cat) posibles = posibles.filter(f => f.categoria === cat);
    if (posibles.length === 0) posibles = FRASES_BIBLIOTECA; 
    return posibles[Math.floor(Math.random() * posibles.length)];
  };

  const getIntervencion = (evitarId?: string): Intervencion => {
    let posibles = INTERVENCIONES;
    if (evitarId) posibles = posibles.filter(i => i.id !== evitarId);
    return posibles[Math.floor(Math.random() * posibles.length)];
  };

  const animateIn = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
    ]).start();
  };

  useEffect(() => { animateIn(); }, [step]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timerActive && timeLeft === 0) {
      setTimerActive(false);
      setStep('evaluacion');
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  useEffect(() => {
    if (step === 'round') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [step]);

  const handleIntensidíad = (val: number) => {
    setIntensidíad(val);
    if (val <= 3) setMaxRounds(1);
    else if (val <= 6) setMaxRounds(2);
    else if (val <= 8) setMaxRounds(3);
    else setMaxRounds(4); 
    setStep('contexto');
  };

  const handleContexto = (ctx: string) => {
    setContexto(ctx);
    setStep('preparacion');
    setTimeout(() => {
      iniciarRound(1, false);
    }, 2500);
  };

  const iniciarRound = (roundNum: number, esAgresivo: boolean) => {
    setCurrentRound(roundNum);
    setComboStep(0);
    
    let dur = 90;
    if (roundNum === 2) dur = 120;
    if (roundNum >= 3) dur = 180;
    
    setTimeLeft(dur);
    setFraseActual(getFrase(esAgresivo ? 'intensa' : 'round'));
    setIntervencionActual(getIntervencion());
    setStep('round');
    setTimerActive(true);
  };

  const handleEvaluacion = (estado: 'mejor' | 'igual' | 'peor' | 'recaidía') => {
    if (estado === 'recaidía') {
      setFraseActual(getFrase('post_recaida'));
      setStep('final');
      return;
    }
    
    if (estado === 'mejor' || currentRound >= maxRounds) {
      setStep('momento_clave');
    } else if (estado === 'igual') {
      iniciarRound(currentRound + 1, false);
    } else if (estado === 'peor') {
      iniciarRound(currentRound + 1, true);
    }
  };

  const avanzarCombo = () => {
    if (intervencionActual && comboStep < intervencionActual.pasos.length - 1) {
      setComboStep(c => c + 1);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color="#64748B" />
        </Pressable>
        <Text style={styles.headerTitle}>TU ESQUINA</Text>
        <View style={{ width: 28 }} />
      </View>

      <Animated.ScrollView 
        contentContainerStyle={styles.scroll}
        style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
      >
        {step === 'intensidíad' && (
          <View style={styles.centerContainer}>
            <Text style={styles.title}>¿Qué tan fuerte es el impulso?</Text>
            <View style={styles.intensidíadScale}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
                const color = n > 7 ? PALETTE.categorias.importante : n > 3 ? '#475569' : '#1E293B';
                const shadow = n > 7 ? { shadowColor: PALETTE.categorias.importante, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 } : {};
                return (
                  <Pressable 
                    key={n} 
                    onPress={() => handleIntensidíad(n)}
                    style={({pressed}) => [
                      styles.intensidíadBtn,
                      { borderColor: color, backgroundColor: n > 7 ? tint(PALETTE.categorias.importante, 0.1) : '#0F172A' },
                      shadow,
                      pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
                    ]}
                  >
                    <Text style={styles.intensidíadText}>{n}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.intensidíadLabels}>
              <Text style={styles.hintText}>Leve</Text>
              <Text style={styles.hintText}>A punto de actuar</Text>
            </View>
          </View>
        )}

        {step === 'contexto' && (
          <View style={styles.centerContainer}>
            <Text style={styles.title}>¿Qué está pasando?</Text>
            <View style={styles.optionsGrid}>
              {CONTEXTOS.map(ctx => (
                <Pressable 
                  key={ctx}
                  style={({pressed}) => [styles.optionBtn, pressed && { backgroundColor: '#334155' }]}
                  onPress={() => handleContexto(ctx)}
                >
                  <Text style={styles.optionText}>{ctx}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 'preparacion' && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#E2E8F0" style={{ marginBottom: 24 }} />
            <Text style={styles.quoteText}>{getFrase('transicion')?.texto || 'Preparando round...'}</Text>
          </View>
        )}

        {step === 'round' && (
          <View style={styles.centerContainer}>
            <Text style={styles.roundLabel}>ROUND 0{currentRound}</Text>
            
            <Animated.View style={[styles.timerCircle, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </Animated.View>

            <Text style={styles.quoteText}>"{fraseActual?.texto}"</Text>

            {intervencionActual && (
              <View style={styles.intervencionCard}>
                <Text style={styles.intervencionTitle}>{intervencionActual.titulo}</Text>
                
                {intervencionActual.tipo === 'combo' || intervencionActual.tipo === 'movimiento' ? (
                  <View>
                    {intervencionActual.pasos.map((paso, idx) => {
                      const isPast = idx < comboStep;
                      const isCurrent = idx === comboStep;
                      return (
                        <Pressable 
                          key={idx} 
                          onPress={isCurrent ? avanzarCombo : undefined}
                          style={[styles.comboRow, isPast && { opacity: 0.4 }]}
                        >
                          <Ionicons 
                            name={isPast ? "checkmark-circle" : isCurrent ? "ellipse-outline" : "ellipse"} 
                            size={20} 
                            color={isPast ? PALETTE.categorias.finanzas : isCurrent ? "#F8FAFC" : "#334155"} 
                          />
                          <Text style={[styles.comboText, isCurrent && styles.comboTextActive]}>{paso}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.intervencionBody}>
                    {intervencionActual.pasos.join('\n\n')}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {step === 'evaluacion' && (
          <View style={styles.centerContainer}>
            <Text style={styles.roundLabel}>ROUND TERMINADO</Text>
            <Text style={styles.title}>¿Cómo estás ahora?</Text>

            <View style={styles.decisionOptions}>
              <Pressable style={({pressed}) => [styles.decBtn, pressed && pressedFeedback]} onPress={() => handleEvaluacion('mejor')}>
                <Text style={styles.decText}>El impulso bajó (Mucho mejor)</Text>
              </Pressable>
              <Pressable style={({pressed}) => [styles.decBtn, styles.decBtnAlt, pressed && pressedFeedback]} onPress={() => handleEvaluacion('igual')}>
                <Text style={styles.decTextAlt}>Todíavía tengo ganas (Igual)</Text>
              </Pressable>
              <Pressable style={({pressed}) => [styles.decBtn, styles.decBtnAlt, pressed && pressedFeedback]} onPress={() => handleEvaluacion('peor')}>
                <Text style={styles.decTextAlt}>Está más fuerte (Peor)</Text>
              </Pressable>
              <Pressable style={({pressed}) => [styles.decBtn, styles.decBtnGhost, pressed && pressedFeedback]} onPress={() => handleEvaluacion('recaidía')}>
                <Text style={styles.decTextGhost}>Terminé haciéndolo</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 'momento_clave' && (
          <View style={styles.centerContainer}>
            <Text style={styles.superTitle}>PAUSA.</Text>
            <Text style={styles.title}>Hace unos minutos querías actuar.</Text>
            <Text style={[styles.title, { color: PALETTE.categorias.importante }]}>Ahora seguís aquí.</Text>
            
            <Text style={styles.quoteText}>{getFrase('post_resistencia')?.texto}</Text>

            <Pressable style={({pressed}) => [styles.finishBtn, pressed && pressedFeedback]} onPress={() => setStep('final')}>
              <Text style={styles.finishBtnText}>Terminar Entrenamiento</Text>
            </Pressable>
          </View>
        )}

        {step === 'final' && (
          <View style={styles.centerContainer}>
            <Ionicons name="shield-checkmark" size={64} color="#334155" style={{ marginBottom: 24 }} />
            <Text style={styles.title}>Round Registrado.</Text>
            
            {fraseActual?.categoria === 'post_recaida' && (
              <Text style={styles.quoteText}>"{fraseActual.texto}"</Text>
            )}
            
            <Text style={styles.hintText}>Podés volver a tu esquina cuando lo necesites.</Text>

            <Pressable style={({pressed}) => [styles.finishBtn, pressed && pressedFeedback]} onPress={() => navigation.goBack()}>
              <Text style={styles.finishBtnText}>Volver al mapa</Text>
            </Pressable>
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  closeBtn: { padding: 8 },
  headerTitle: { fontSize: 14, fontWeight: '800', color: '#64748B', letterSpacing: 2 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, justifyContent: 'center' },
  centerContainer: { alignItems: 'center', width: '100%' },
  superTitle: { fontSize: 16, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#F8FAFC', marginBottom: 32, textAlign: 'center', lineHeight: 34 },
  intensidíadScale: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 12 },
  intensidíadBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  intensidíadText: { fontSize: 20, fontWeight: '700', color: '#F8FAFC' },
  intensidíadLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 16 },
  optionsGrid: { width: '100%', gap: 12 },
  optionBtn: { backgroundColor: '#1E293B', paddingVertical: 18, paddingHorizontal: 20, borderRadius: RADIUS.cards, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  optionText: { fontSize: 16, fontWeight: '600', color: '#E2E8F0' },
  roundLabel: { fontSize: 16, fontWeight: '800', color: PALETTE.categorias.importante, letterSpacing: 2, marginBottom: 24 },
  timerCircle: { 
    width: 200, height: 200, 
    borderRadius: 100, 
    borderWidth: 6, 
    borderColor: '#334155', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 32,
    backgroundColor: '#0F172A',
    shadowColor: PALETTE.categorias.importante,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20
  },
  timerText: { fontSize: 64, fontWeight: '800', color: '#F8FAFC', fontVariant: ['tabular-nums'], letterSpacing: -1 },
  quoteText: { fontSize: 22, fontWeight: '700', color: '#E2E8F0', textAlign: 'center', lineHeight: 32, marginBottom: 32, paddingHorizontal: 8 },
  intervencionCard: { 
    backgroundColor: '#1E293B', 
    padding: 24, 
    borderRadius: RADIUS.cards, 
    width: '100%', 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderLeftWidth: 4, 
    borderLeftColor: PALETTE.categorias.objetivos,
    shadowColor: PALETTE.categorias.objetivos,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 16
  },
  intervencionTitle: { fontSize: 13, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 16 },
  intervencionBody: { fontSize: 16, color: '#F8FAFC', lineHeight: 26, fontWeight: '500' },
  comboRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  comboText: { fontSize: 16, color: '#94A3B8', fontWeight: '500' },
  comboTextActive: { color: '#F8FAFC', fontWeight: '700' },
  hintText: { fontSize: 14, color: '#64748B', textAlign: 'center', fontStyle: 'italic' },
  decisionOptions: { width: '100%', gap: 12 },
  decBtn: { backgroundColor: '#F8FAFC', paddingVertical: 18, borderRadius: RADIUS.buttons, alignItems: 'center' },
  decText: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  decBtnAlt: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  decTextAlt: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  decBtnGhost: { backgroundColor: 'transparent', marginTop: 12 },
  decTextGhost: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  finishBtn: { backgroundColor: PALETTE.primary, paddingVertical: 18, paddingHorizontal: 40, borderRadius: RADIUS.buttons, marginTop: 32, width: '100%', alignItems: 'center' },
  finishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});
