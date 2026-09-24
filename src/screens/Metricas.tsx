import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useFocusEffect } from '@react-navigation/native';

import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { BottomNavigationBar } from '../components/ButtonNavigationBar';
import { navigateToTab, TabKey } from '../navigation/tabs';

import { getHabitosActivos, HabitoProgreso } from '../repositories/habitosRepo';
import { getMotivation, MotivacionContext, Phrase } from '../utils/motivacion';
import HabitCard from '../components/HabitCard';
import FollowActivityModal from '../components/FollowActivityModal';

import PeriodSelector from '../components/PeriodSelector';
import WeeklyOverviewCard from '../components/WeeklyOverviewCard';
import TimeDistributionCard from '../components/TimeDistributionCard';
import InsightsCard from '../components/InsightsCard';

import {
  PeriodoMetricas,
  ResumenGeneral,
  DistribucionArea,
  Insight,
  calcularRango,
  getResumenGeneral,
  getDistribucionPorArea,
  generarInsights,
} from '../repositories/metricasRepo';

type Props = StackScreenProps<RootStackParamList, 'Metricas'>;

export default function MetricasScreen({ navigation }: Props) {
  const [periodo, setPeriodo] = useState<PeriodoMetricas>('semana');
  const [loading, setLoading] = useState(true);
  
  const [habitos, setHabitos] = useState<HabitoProgreso[]>([]);
  const [motivacion, setMotivacion] = useState<Phrase | null>(null);
  const [showFollowModal, setShowFollowModal] = useState(false);

  // Datos legacy para mantener métricas útiles
  const [resumen, setResumen] = useState<ResumenGeneral | null>(null);
  const [distribucion, setDistribucion] = useState<DistribucionArea[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  const loadData = async (p: PeriodoMetricas) => {
    setLoading(true);
    try {
      // 1. Cargar Hábitos
      const habs = await getHabitosActivos();
      setHabitos(habs);

      // 2. Cargar motivación basada en el primer hábito o de forma general
      let mContext: MotivacionContext | null = null;
      if (habs.length > 0) {
        // Tomamos el primer hábito como referencia principal, o uno que requiera atención
        const hab = habs[0];
        mContext = {
          areaNombre: hab.detalle.tipo_actividad_nombre,
          rachaActual: hab.rachaActual,
          mejorRacha: hab.mejorRacha,
          completadoHoy: hab.completadoHoy,
          completadoAyer: hab.completadoAyer
        };
      }
      setMotivacion(getMotivation(mContext));

      // 3. Cargar métricas clásicas
      const rango = calcularRango(p);
      const res = await getResumenGeneral(rango);
      const dist = await getDistribucionPorArea(rango);
      
      // Ampliamos insights base con insights de hábitos si queremos a futuro
      const baseInsights = await generarInsights(p);
      
      // Insight de hábitos inyectado
      if (habs.length > 0) {
        const topHabit = habs.reduce((prev, current) => (prev.rachaActual > current.rachaActual) ? prev : current);
        if (topHabit.rachaActual > 2) {
          baseInsights.unshift({
            tipo: 'tendencia_positiva',
            mensaje: `Tu mejor racha actual es de ${topHabit.rachaActual} en ${topHabit.detalle.titulo}.`
          });
        }
      }

      setResumen(res);
      setDistribucion(dist);
      setInsights(baseInsights);

    } catch (e) {
      console.error('Error cargando métricas:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData(periodo);
    }, [periodo])
  );

  const handleTabSelect = (tab: TabKey) => {
    navigateToTab(navigation, 'metricas', tab);
  };

  // Calcular Constancia Global de Hábitos
  const constanciaGlobal = habitos.length > 0 
    ? Math.round(
        (habitos.reduce((acc, h) => acc + h.completadosSemana, 0) / 
         habitos.reduce((acc, h) => acc + h.objetivoSemanal, 0)) * 100
      )
    : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {loading && habitos.length === 0 ? (
          <ActivityIndicator size="large" color={PALETTE.primary} style={styles.loader} />
        ) : habitos.length === 0 ? (
          // ESTADO VACÍO
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Text style={styles.emptyIcon}>🌱</Text>
            </View>
            <Text style={styles.emptyTitle}>Todavía no estás siguiendo ningún hábito.</Text>
            <Text style={styles.emptyDesc}>
              Elige una actividad repetitiva que quieras empezar a controlar. Nosotros registraremos tu constancia.
            </Text>
            <Pressable 
              style={({pressed}) => [styles.primaryButton, pressed && pressedFeedback]}
              onPress={() => setShowFollowModal(true)}
            >
              <Text style={styles.primaryButtonText}>+ Seguir actividad</Text>
            </Pressable>
          </View>
        ) : (
          // ESTADO CON HÁBITOS
          <>
            <View style={styles.constanciaCard}>
              <Text style={styles.constanciaLabel}>Tu constancia</Text>
              <View style={styles.constanciaRow}>
                <Text style={styles.constanciaValue}>{constanciaGlobal}%</Text>
                <Text style={styles.constanciaSub}>{habitos.length} hábitos activos</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hábitos que sigues</Text>
            </View>

            {habitos.map(h => (
              <HabitCard key={h.detalle.id} habit={h} />
            ))}

            <Pressable 
              style={({pressed}) => [styles.addHabitBtn, pressed && pressedFeedback]}
              onPress={() => setShowFollowModal(true)}
            >
              <Text style={styles.addHabitText}>+ Seguir actividad</Text>
            </Pressable>

            {motivacion && (
              <View style={styles.motivationSection}>
                <Text style={styles.motivationLabel}>✦ Para hoy</Text>
                <Text style={styles.motivationText}>"{motivacion.text}"</Text>
              </View>
            )}

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Análisis General</Text>
            <PeriodSelector selected={periodo} onSelect={setPeriodo} />
            
            <InsightsCard insights={insights} />
            <WeeklyOverviewCard resumen={resumen} />
            <TimeDistributionCard distribucion={distribucion} />
          </>
        )}

      </ScrollView>
      <BottomNavigationBar activeTab="metricas" onSelectTab={handleTabSelect} />

      <FollowActivityModal 
        visible={showFollowModal}
        onClose={() => setShowFollowModal(false)}
        onFollow={() => loadData(periodo)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.surface,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
  loader: {
    marginTop: 40,
  },
  // Constancia Top Card
  constanciaCard: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: RADIUS.cards,
    padding: 20,
    ...SHADOW.card,
  },
  constanciaLabel: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
    marginBottom: 8,
  },
  constanciaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  constanciaValue: {
    fontSize: 32,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  constanciaSub: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  addHabitBtn: {
    backgroundColor: tint(PALETTE.primary, 0.12),
    borderRadius: RADIUS.buttons,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  addHabitText: {
    color: PALETTE.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Motivación
  motivationSection: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  motivationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.categorias.importante,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  motivationText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
    color: PALETTE.ink,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.hairline,
    marginVertical: 8,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tint(PALETTE.primary, 0.12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.ink,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDesc: {
    fontSize: 15,
    color: PALETTE.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: PALETTE.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.buttons,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
