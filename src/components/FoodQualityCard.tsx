import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PALETTE, RADIUS, SHADOW } from '../theme/theme';
import { AnalisisAlimentacion } from '../repositories/comidaRepo';

interface Props {
  analisis: AnalisisAlimentacion;
  label?: string;
}

export default function FoodQualityCard({ analisis, label = 'calidad del día' }: Props) {
  
  if (analisis.calidadGeneral === 0 && analisis.desglose.proteina === 0 && analisis.desglose.vegetales === 0) {
    return null; // Ocultar si no hay datos
  }

  const renderBar = (title: string, score: number, color: string, isNegative = false) => {
    // score es 0 a 1
    const totalBlocks = 10;
    const filledBlocks = Math.round(score * totalBlocks);
    
    // Armar el string ████░░░░
    let barStr = '';
    for(let i=0; i<totalBlocks; i++) {
      if (i < filledBlocks) {
        barStr += '█';
      } else {
        barStr += '░';
      }
    }

    return (
      <View style={styles.row}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={[styles.bar, { color }]}>{barStr}</Text>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tu alimentación</Text>
      
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>{analisis.calidadGeneral.toFixed(1)} / 10</Text>
        <Text style={styles.scoreLabel}>{label}</Text>
      </View>

      <View style={styles.barsContainer}>
        {renderBar('Proteína', analisis.desglose.proteina, PALETTE.categorias.finanzas)}
        {renderBar('Vegetales', analisis.desglose.vegetales, PALETTE.primary)}
        {renderBar('Fruta', analisis.desglose.frutas, PALETTE.categorias.importante)}
        {renderBar('Ultraprocesados', analisis.desglose.ultraprocesados, PALETTE.categorias.critico, true)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: RADIUS.cards,
    padding: 20,
    ...SHADOW.card,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  scoreLabel: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
  },
  barsContainer: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 14,
    color: PALETTE.ink,
    width: 120,
  },
  bar: {
    fontSize: 14,
    letterSpacing: 2,
  }
});
