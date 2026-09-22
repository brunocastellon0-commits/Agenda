import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PALETTE, SHADOW } from '../theme/theme';
import { ResumenGeneral } from '../repositories/metricasRepo';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  resumen: ResumenGeneral | null;
}

export default function WeeklyOverviewCard({ resumen }: Props) {
  if (!resumen) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Resumen del Período</Text>
      <View style={styles.grid}>
        <KPIItem label="Cumplimiento">
          {resumen.cumplimientoPct != null ? (
            <View style={styles.cumplimientoContainer}>
              <ProgressRing pct={resumen.cumplimientoPct} />
              <Text style={styles.kpiValue}>{resumen.cumplimientoPct}%</Text>
            </View>
          ) : (
            <Text style={styles.kpiValue}>—</Text>
          )}
        </KPIItem>
        <KPIItem label="Horas Registradas">
          <Text style={styles.kpiValue}>
            {resumen.horasRegistradas != null ? `${resumen.horasRegistradas} h` : '—'}
          </Text>
        </KPIItem>
        <KPIItem label="Actividades">
          <Text style={styles.kpiValue}>{resumen.completadas} / {resumen.totalPlanificadas}</Text>
        </KPIItem>
        <KPIItem label="Días Activos">
          <Text style={styles.kpiValue}>{resumen.diasActivos}</Text>
        </KPIItem>
        <KPIItem label="Reprogramadas">
          <Text style={styles.kpiValue}>{resumen.reprogramadas}</Text>
        </KPIItem>
        <KPIItem label="Canceladas">
          <Text style={styles.kpiValue}>{resumen.canceladas}</Text>
        </KPIItem>
      </View>
    </View>
  );
}

function KPIItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const size = 24;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <View style={{ width: size, height: size, marginRight: 6 }}>
      <Svg width={size} height={size}>
        <Circle
          stroke={PALETTE.surfaceContainer}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={PALETTE.primary}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  kpi: {
    width: '45%',
  },
  kpiLabel: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PALETTE.ink,
  },
  cumplimientoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
