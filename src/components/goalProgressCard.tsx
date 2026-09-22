import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { PALETTE, SHADOW } from '../theme/theme';

export function GoalProgressCard()
{
    return (
        <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
                <View>
                    <Text style={styles.cardTitle}>Titulo del objetivo</Text>
                    <Text style={styles.cardSubtitle}>subtitulo del objetivo</Text>    
                </View>
                <View style={styles.streakBadge}>
                    <Text>🔥</Text>
                    <Text style={styles.streakText}>dias en racha</Text>
                </View>
            </View>

        <View style={styles.gaugeBox}>
            <View style= {styles.svgWrapper}>
                <Svg width={80} height={80} viewBox="0 0 36 36">
                    <Path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={PALETTE.surfaceContainer}
                    strokeWidth="3.8"
                    />
                    <Path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={PALETTE.categorias.objetivos}
                strokeWidth="3.8"
                strokeDasharray="85, 100"
                strokeLinecap="round"
                />
                </Svg>

                <View style={styles.gaugeTextOverlay}>
                    <Text style={styles.gaugePercentage}>85%</Text>
                    <Text style={styles.gaugeSubtext}>completado</Text>
                </View>
            </View>

            <View style={styles.gaugeDetails}>
                <Text style={styles.gaugeTitle}>Titulo del objetivo</Text>
                <Text style={styles.gaugeDescription}>Descripcion del objetivo</Text>
                <View style={styles.flexRow}>
                    <MaterialIcons name="check-circle" size={16} color={PALETTE.ink} />
                    <Text style={styles.gaugeStatusText}>Objetivo alcanzado</Text>
                </View>
            </View>
        </View>
    </View>
    );
}





const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...SHADOW.card,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '800', color: PALETTE.ink },
  cardSubtitle: { fontSize: 12, color: PALETTE.onSurfaceVariant },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.categorias.objetivos,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streakText: { fontSize: 11, fontWeight: '700', color: PALETTE.onAccent },
  gaugeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: 12,
    padding: 12,
    gap: 16,
  },
  svgWrapper: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  gaugeTextOverlay: { position: 'absolute', alignItems: 'center' },
  gaugePercentage: { fontSize: 18, fontWeight: '800', color: PALETTE.ink },
  gaugeSubtext: { fontSize: 10, color: PALETTE.onSurfaceVariant },
  gaugeDetails: { flex: 1, gap: 4 },
  gaugeTitle: { fontSize: 14, fontWeight: '700', color: PALETTE.ink },
  gaugeDescription: { fontSize: 12, color: PALETTE.onSurfaceVariant },
  flexRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gaugeStatusText: { fontSize: 12, color: PALETTE.ink, fontWeight: '700' },
});


