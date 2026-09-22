import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useFocusEffect } from '@react-navigation/native';

import { PALETTE } from '../theme/theme';
import { BottomNavigationBar } from '../components/ButtonNavigationBar';
import { navigateToTab, TabKey } from '../navigation/tabs';

import {
  PeriodoMetricas,
  ResumenGeneral,
  DistribucionArea,
  MetricaConsistencia,
  ComparativaPeriodo,
  Insight,
  calcularRango,
  getResumenGeneral,
  getDistribucionPorArea,
  getConsistencia,
  getComparativa,
  generarInsights,
} from '../repositories/metricasRepo';

import PeriodSelector from '../components/PeriodSelector';
import WeeklyOverviewCard from '../components/WeeklyOverviewCard';
import TimeDistributionCard from '../components/TimeDistributionCard';
import PlanningReliabilityCard from '../components/PlanningReliabilityCard';
import ConsistencyCard from '../components/ConsistencyCard';
import TrendsComparisonCard from '../components/TrendsComparisonCard';
import InsightsCard from '../components/InsightsCard';

type Props = StackScreenProps<RootStackParamList, 'Metricas'>;

export default function MetricasScreen({ navigation }: Props) {
  const [periodo, setPeriodo] = useState<PeriodoMetricas>('semana');
  const [loading, setLoading] = useState(true);
  
  const [resumen, setResumen] = useState<ResumenGeneral | null>(null);
  const [distribucion, setDistribucion] = useState<DistribucionArea[]>([]);
  const [consistencia, setConsistencia] = useState<MetricaConsistencia | null>(null);
  const [comparativa, setComparativa] = useState<ComparativaPeriodo | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);

  const loadData = async (p: PeriodoMetricas) => {
    setLoading(true);
    try {
      const rango = calcularRango(p);
      const res = await getResumenGeneral(rango);
      const dist = await getDistribucionPorArea(rango);
      const cons = await getConsistencia();
      const comp = await getComparativa(p);
      const ins = await generarInsights(p);

      setResumen(res);
      setDistribucion(dist);
      setConsistencia(cons);
      setComparativa(comp);
      setInsights(ins);
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Dashboard</Text>
        
        <PeriodSelector selected={periodo} onSelect={setPeriodo} />

        {loading ? (
          <ActivityIndicator size="large" color={PALETTE.primary} style={styles.loader} />
        ) : (
          <>
            <WeeklyOverviewCard resumen={resumen} />
            <TimeDistributionCard distribucion={distribucion} />
            <PlanningReliabilityCard resumen={resumen} />
            <ConsistencyCard consistencia={consistencia} />
            <TrendsComparisonCard comparativa={comparativa} />
            <InsightsCard insights={insights} />
          </>
        )}
      </ScrollView>
      <BottomNavigationBar activeTab="metricas" onSelectTab={handleTabSelect} />
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
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 8,
  },
  loader: {
    marginTop: 40,
  },
});
