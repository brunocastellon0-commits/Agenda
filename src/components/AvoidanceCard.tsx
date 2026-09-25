import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { ConductaProgreso } from '../repositories/conductaRepo';

interface AvoidanceCardProps {
  progreso: ConductaProgreso;
  onPress?: () => void;
  onRegister?: () => void;
}

export default function AvoidanceCard({ progreso, onPress, onRegister }: AvoidanceCardProps) {
  const { conducta, rachaActual, ultimaOcurrencia, eventosPeriodo } = progreso;
  
  const colorBase = PALETTE.categorias[conducta.categoria.toLowerCase() as keyof typeof PALETTE.categorias] || PALETTE.primary;
  
  const isLimit = conducta.modalidad === 'limite';
  const overLimit = isLimit && eventosPeriodo > conducta.objetivo;
  
  const progressPct = isLimit ? Math.min((eventosPeriodo / conducta.objetivo) * 100, 100) : 0;

  return (
    <Pressable 
      style={({ pressed }) => [styles.card, pressed && pressedFeedback]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{conducta.nombre}</Text>
        <Pressable 
          style={({pressed}) => [styles.registerBtn, pressed && pressedFeedback]}
          onPress={onRegister}
        >
          <Text style={styles.registerBtnText}>Registrar</Text>
        </Pressable>
      </View>

      <View style={styles.metricRow}>
        {isLimit ? (
          <Text style={styles.metricText}>
            {eventosPeriodo} / {conducta.objetivo} {conducta.frecuencia === 'semanal' ? 'esta semana' : conducta.frecuencia}
          </Text>
        ) : (
          <Text style={styles.metricText}>{rachaActual} días sin registro</Text>
        )}
      </View>

      {isLimit && (
        <View style={styles.progressBarBg}>
          <View style={[
            styles.progressBarFill, 
            { width: `${progressPct}%`, backgroundColor: overLimit ? PALETTE.categorias.critico : colorBase }
          ]} />
        </View>
      )}

      <View style={[styles.footer, { marginTop: isLimit ? 0 : 8 }]}>
        <Text style={styles.footerText}>
          Último: {ultimaOcurrencia ? ultimaOcurrencia : 'Nunca'}
        </Text>
        {isLimit && (
          <Text style={styles.footerText}>
            Racha: {rachaActual} d
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: RADIUS.cards,
    padding: 16,
    ...SHADOW.card,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  registerBtn: {
    backgroundColor: PALETTE.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.buttons,
  },
  registerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  metricRow: {
    marginBottom: 8,
  },
  metricText: {
    fontSize: 15,
    fontWeight: '500',
    color: PALETTE.ink,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
  },
});
