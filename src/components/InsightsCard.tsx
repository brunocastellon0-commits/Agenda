import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PALETTE, SHADOW } from '../theme/theme';
import { Insight } from '../repositories/metricasRepo';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  insights: Insight[];
}

export default function InsightsCard({ insights }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Insights</Text>
      {insights.length === 0 ? (
        <Text style={styles.empty}>No hay insights disponibles para este período.</Text>
      ) : (
        <View style={styles.list}>
          {insights.map((insight, index) => {
            let iconName = 'info';
            let color = PALETTE.onSurfaceVariant;

            switch (insight.tipo) {
              case 'info':
                iconName = 'info';
                color = PALETTE.categorias.eventos;
                break;
              case 'tendencia_positiva':
                iconName = 'trending-up';
                color = PALETTE.primary;
                break;
              case 'tendencia_negativa':
                iconName = 'trending-down';
                color = PALETTE.categorias.critico;
                break;
              case 'patron':
                iconName = 'insights';
                color = PALETTE.categorias.objetivos;
                break;
            }

            return (
              <View key={index} style={styles.row}>
                <MaterialIcons name={iconName as any} size={20} color={color} style={styles.icon} />
                <Text style={styles.text}>{insight.mensaje}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: 18,
    padding: 16,
    ...SHADOW.card,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 16,
  },
  empty: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginTop: 2,
    marginRight: 8,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.ink,
    lineHeight: 20,
  },
});
