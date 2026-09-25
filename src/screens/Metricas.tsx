import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { BottomNavigationBar } from '../components/ButtonNavigationBar';
import { navigateToTab, TabKey } from '../navigation/tabs';

import { getHabitosActivos, HabitoProgreso } from '../repositories/habitosRepo';
import { getConductasActivas, ConductaProgreso, ConductaEvitar } from '../repositories/conductaRepo';
import { getActividades, Actividad } from '../repositories/actividadRepo';
import { getResumenDia, ResumenNutricional } from '../repositories/comidaRepo';
import { getComparativa, RegistroFisico } from '../repositories/estadoFisicoRepo';
import { getUsuarios } from '../repositories/usuario';
import { toISODate } from '../utils/semana';
import { formatEstimado } from '../utils/nutricion';

import HabitCard from '../components/HabitCard';
import AvoidanceCard from '../components/AvoidanceCard';
import AddConductaSheet from '../components/AddConductaSheet';
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
  
  // Datos Generales
  const [resumen, setResumen] = useState<ResumenGeneral | null>(null);
  const [distribucion, setDistribucion] = useState<DistribucionArea[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  // Secciones
  const [habitos, setHabitos] = useState<HabitoProgreso[]>([]);
  const [conductas, setConductas] = useState<ConductaProgreso[]>([]);
  const [actividadesHoy, setActividadesHoy] = useState<Actividad[]>([]);
  const [comidaResumen, setComidaResumen] = useState<ResumenNutricional>({ kcal: 0, prot: 0, carb: 0, grasa: 0 });
  const [estadoFisico, setEstadoFisico] = useState<RegistroFisico | null>(null);

  const [selectedConducta, setSelectedConducta] = useState<ConductaEvitar | null>(null);
  const [showFollowModal, setShowFollowModal] = useState(false);

  const loadData = async (p: PeriodoMetricas) => {
    setLoading(true);
    try {
      const hoyISO = toISODate(new Date());

      const [habs, conds, acts, nutri, users] = await Promise.all([
        getHabitosActivos(),
        getConductasActivas(),
        getActividades(hoyISO),
        getResumenDia(hoyISO),
        getUsuarios()
      ]);

      let cmp = null;
      if (users.length > 0 && users[0].ci) {
        cmp = await getComparativa(users[0].ci);
      }

      setHabitos(habs);
      setConductas(conds);
      setActividadesHoy(acts);
      setComidaResumen(nutri);
      setEstadoFisico(cmp?.ultimo || null);

      const rango = calcularRango(p);
      const res = await getResumenGeneral(rango);
      const dist = await getDistribucionPorArea(rango);
      const baseInsights = await generarInsights(p);
      
      // Inject habit messages into insights
      if (habs.length > 0) {
        const topHabit = habs.reduce((prev, current) => (prev.rachaActual > current.rachaActual) ? prev : current);
        if (topHabit.rachaActual > 2) {
          baseInsights.unshift({
            tipo: 'tendencia_positiva',
            mensaje: `Tu mejor racha actual es de ${topHabit.rachaActual} días en ${topHabit.detalle.titulo}.`
          });
        }
      }

      // Inject avoidance messages
      const topAvoidance = conds.filter(c => c.conducta.modalidad === 'evitacion_total').sort((a,b) => b.rachaActual - a.rachaActual)[0];
      if (topAvoidance && topAvoidance.rachaActual > 3) {
        baseInsights.unshift({
          tipo: 'tendencia_positiva',
          mensaje: `Llevas ${topAvoidance.rachaActual} días sin ${topAvoidance.conducta.nombre.toLowerCase()}.`
        });
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

  const actsCompletadas = actividadesHoy.filter(a => a.completado).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {loading && habitos.length === 0 ? (
          <ActivityIndicator size="large" color={PALETTE.primary} style={styles.loader} />
        ) : (
          <>
            {/* RESUMEN GLOBAL (Dashboard style) */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>ACTIVIDADES</Text>
                <Text style={styles.summaryValue}>{actsCompletadas} / {actividadesHoy.length}</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>HÁBITOS</Text>
                <Text style={styles.summaryValue}>{habitos.filter(h => h.completadoHoy).length} / {habitos.length}</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>CONDUCTAS</Text>
                <Text style={styles.summaryValue}>{conductas.length}</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>COMIDA</Text>
                <Text style={styles.summaryValue}>{formatEstimado(comidaResumen.kcal, '')}</Text>
              </View>
            </View>

            {/* MENSAJES CONTEXTUALES */}
            <PeriodSelector selected={periodo} onSelect={setPeriodo} />
            <InsightsCard insights={insights} />

            {/* SECCIÓN: HÁBITOS */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hábitos</Text>
            </View>
            {habitos.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyDesc}>No estás siguiendo hábitos.</Text>
                <Pressable onPress={() => setShowFollowModal(true)}><Text style={styles.linkText}>Configurar hábitos</Text></Pressable>
              </View>
            ) : (
              <>
                {habitos.map(h => <HabitCard key={h.detalle.id} habit={h} />)}
                <Pressable style={styles.linkBtn} onPress={() => setShowFollowModal(true)}>
                  <Text style={styles.linkText}>+ Seguir otro hábito</Text>
                </Pressable>
              </>
            )}

            {/* SECCIÓN: CONDUCTAS */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Conductas a Evitar</Text>
            </View>
            {conductas.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyDesc}>No tienes conductas registradas.</Text>
              </View>
            ) : (
              conductas.map(c => (
                <AvoidanceCard 
                  key={c.conducta.id} 
                  progreso={c} 
                  onRegister={() => setSelectedConducta(c.conducta)}
                />
              ))
            )}

            {/* SECCIÓN: ALIMENTACIÓN */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Alimentación (Hoy)</Text>
            </View>
            <Pressable 
              style={({pressed}) => [styles.estadoCard, pressed && pressedFeedback]} 
              onPress={() => navigateToTab(navigation, 'metricas', 'comida')}
            >
              <View>
                <Text style={styles.estadoLabel}>CALORÍAS REGISTRADAS</Text>
                <Text style={styles.estadoValue}>{formatEstimado(comidaResumen.kcal, ' kcal')}</Text>
                <Text style={styles.estadoSub}>
                  P: {formatEstimado(comidaResumen.prot, 'g')} · C: {formatEstimado(comidaResumen.carb, 'g')} · G: {formatEstimado(comidaResumen.grasa, 'g')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={PALETTE.primary} />
            </Pressable>

            {/* SECCIÓN: ESTADO FÍSICO */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Estado Físico</Text>
            </View>
            <Pressable 
              style={({pressed}) => [styles.estadoCard, pressed && pressedFeedback]} 
              onPress={() => navigation.navigate('Estado')}
            >
              <View>
                <Text style={styles.estadoLabel}>ÚLTIMO REGISTRO</Text>
                <Text style={styles.estadoValue}>{estadoFisico?.peso ? `${estadoFisico.peso} kg` : 'Sin datos'}</Text>
                {estadoFisico?.fecha_medicion && <Text style={styles.estadoSub}>{estadoFisico.fecha_medicion}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={20} color={PALETTE.primary} />
            </Pressable>

            {/* SECCIÓN: ANÁLISIS DE ACTIVIDADES */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Análisis de Actividades</Text>
            </View>
            <WeeklyOverviewCard resumen={resumen} />
            <TimeDistributionCard distribucion={distribucion} />

            <View style={{ height: 40 }} />
          </>
        )}

      </ScrollView>
      <BottomNavigationBar activeTab="metricas" onSelectTab={handleTabSelect} />

      <FollowActivityModal 
        visible={showFollowModal}
        onClose={() => setShowFollowModal(false)}
        onFollow={() => loadData(periodo)}
      />

      <AddConductaSheet 
        visible={!!selectedConducta}
        conducta={selectedConducta}
        onClose={() => setSelectedConducta(null)}
        onSaved={() => {
          setSelectedConducta(null);
          loadData(periodo);
        }}
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  summaryBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: RADIUS.cards,
    padding: 16,
    ...SHADOW.card,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.ink,
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
  emptyCard: {
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: RADIUS.cards,
    padding: 20,
    alignItems: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
    marginBottom: 8,
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.primary,
  },
  estadoCard: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: RADIUS.cards,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOW.card,
  },
  estadoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  estadoValue: {
    fontSize: 24,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  estadoSub: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
    marginTop: 4,
  },
});
