import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { RegistroComida } from '../repositories/comidaRepo';

interface Props {
  registros: RegistroComida[];
  onDelete?: (id: number) => void;
}

export default function MealTimeline({ registros, onDelete }: Props) {
  
  if (registros.length === 0) return null;

  const colorForTipo = (tipo: string) => {
    switch(tipo) {
      case 'desayuno': return PALETTE.categorias.importante; // Ambar
      case 'almuerzo': return PALETTE.categorias.finanzas; // Esmeralda
      case 'merienda': return PALETTE.categorias.ocio; // Coral
      case 'cena': return PALETTE.categorias.objetivos; // Indigo
      default: return PALETTE.outline;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>HORARIO DE HOY</Text>
      
      <View style={styles.timeline}>
        {registros.map((reg, index) => {
          const color = colorForTipo(reg.tipo);
          return (
            <View key={reg.id} style={styles.itemRow}>
              
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>{reg.hora}</Text>
              </View>

              <View style={styles.lineColumn}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                {index < registros.length - 1 && <View style={styles.line} />}
              </View>

              <View style={styles.contentColumn}>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.tipoLabel, { color }]}>
                      {reg.tipo.toUpperCase()}
                    </Text>
                    {onDelete && (
                      <Pressable 
                        onPress={() => onDelete(reg.id!)}
                        style={({pressed}) => [pressed && {opacity: 0.5}]}
                      >
                        <Text style={styles.deleteText}>✕</Text>
                      </Pressable>
                    )}
                  </View>
                  
                  <Text style={styles.itemsText}>
                    {reg.items.map(i => {
                      const nombre = i.alimento?.nombre || 'Alimento';
                      const cant = i.cantidad || 1;
                      const unit = i.unidad !== 'unidad' && i.unidad !== 'porcion' ? ` ${i.unidad}` : '';
                      return `${cant}${unit} ${nombre}`;
                    }).join(' · ')}
                  </Text>

                  {reg.nota && reg.nota.trim().length > 0 && (
                    <Text style={styles.notaText}>{reg.nota}</Text>
                  )}
                </View>
              </View>
              
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  timeline: {
    flexDirection: 'column',
  },
  itemRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timeColumn: {
    width: 48,
    alignItems: 'flex-end',
    paddingTop: 14,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
  },
  lineColumn: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 16,
    zIndex: 2,
  },
  line: {
    position: 'absolute',
    top: 28,
    bottom: -16,
    width: 2,
    backgroundColor: PALETTE.hairline,
    zIndex: 1,
  },
  contentColumn: {
    flex: 1,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: RADIUS.cards,
    padding: 16,
    ...SHADOW.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipoLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  deleteText: {
    color: PALETTE.outline,
    fontSize: 16,
  },
  itemsText: {
    fontSize: 15,
    color: PALETTE.ink,
    lineHeight: 22,
  },
  notaText: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 8,
  }
});
