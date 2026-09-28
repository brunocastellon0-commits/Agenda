import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { PALETTE, RADIUS, TYPE, pressedFeedback } from '../theme/theme';
import { Eyebrow, BigNumber, ColorBlock } from '../components/editorial';
import { BottomNavigationBar } from '../components/ButtonNavigationBar';
import { navigateToTab, TabKey } from '../navigation/tabs';

import { getHabitosActivos, HabitoProgreso } from '../repositories/habitosRepo';
import { getConductasActivas, ConductaProgreso, ConductaEvitar, fraseRachaEvitacion } from '../repositories/conductaRepo';
import { getActividades, Actividad } from '../repositories/actividadRepo';
import { getResumenDia, ResumenNutricional, RESUMEN_VACIO } from '../repositories/comidaRepo';
import { getComparativa, RegistroFisico } from '../repositories/estadoFisicoRepo';
import { getUsuarios } from '../repositories/usuario';
import { toISODate } from '../utils/semana';
import { formatEstimado } from '../utils/nutricion';

import HabitCard from '../components/HabitCard';
import AvoidanceCard from '../components/AvoidanceCard';
import AddConductaSheet from '../components/AddConductaSheet';
import NuevaConductaSheet from '../components/NuevaConductaSheet';
import FollowActivityModal from '../components/FollowActivityModal';
import PeriodSelector from '../components/PeriodSelector';
import WeeklyOverviewCard from '../components/WeeklyOverviewCard';
import TimeDistributionCard from '../components/TimeDistributionCard';
import ManageTrackingModal from '../components/ManageTrackingModal';
import InsightsCard from '../components/InsightsCard';

import {
  PeriodoMetricas,
  ResumenGeneral,
  DistribucionArea,
  Insight,
  MetricaConsistencia,
  calcularRango,
  getResumenGeneral,
  getDistribucionPorArea,
  generarInsights,
  getConsistencia,
} from '../repositories/metricasRepo';

type Props = StackScreenProps<RootStackParamList, 'Metricas'>;

export default function MetricasScreen({ navigation }: Props) {
  const [periodo, setPeriodo] = useState<PeriodoMetricas>('semana');
  const [loading, setLoading] = useState(true);
  
  // Datos Generales
  const [resumen, setResumen] = useState<ResumenGeneral | null>(null);
  const [distribucion, setDistribucion] = useState<DistribucionArea[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [consistencia, setConsistencia] = useState<MetricaConsistencia | null>(null);

  // Secciones
  const [habitos, setHabitos] = useState<HabitoProgreso[]>([]);
  const [conductas, setConductas] = useState<ConductaProgreso[]>([]);
  const [actividadesHoy, setActividadesHoy] = useState<Actividad[]>([]);
  const [comidaResumen, setComidaResumen] = useState<ResumenNutricional>(RESUMEN_VACIO);
  const [estadoFisico, setEstadoFisico] = useState<RegistroFisico | null>(null);

  const [selectedConducta, setSelectedConducta] = useState<ConductaEvitar | null>(null);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showNuevaConducta, setShowNuevaConducta] = useState(false);

  const loadData = async (p: PeriodoMetricas) => {
    setLoading(true);
    try {
      const hoyISO = toISODate(new Date());

      const [habs, conds, acts, nutri, users, racha] = await Promise.all([
        getHabitosActivos(),
        getConductasActivas(),
        getActividades(hoyISO),
        getResumenDia(hoyISO),
        getUsuarios(),
        getConsistencia(),
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
      setConsistencia(racha);

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
          mensaje: fraseRachaEvitacion(topAvoidance)
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
  const habitosCompletados = habitos.filter(h => h.completadoHoy).length;

  const etiquetaPeriodo = periodo === 'hoy' ? 'de hoy' : periodo === 'semana' ? 'de la semana' : 'del mes';
  const pct = resumen?.cumplimientoPct;
  const hayComida = comidaResumen.itemsEstimados > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {loading && habitos.length === 0 ? (
          <ActivityIndicator size="large" color={PALETTE.primary} style={styles.loader} />
        ) : (
          <>
            {/* PANEL EDITORIAL: cumplimiento + racha + contadores */}
            <View style={styles.heroBlock}>
              <Eyebrow text="Panel de evolución" color={PALETTE.primary} />
              <View style={styles.heroRow}>
                <View style={styles.heroMain}>
                  <BigNumber
                    value={pct != null ? String(pct) : '—'}
                    unit={pct != null ? '%' : undefined}
                    size="display"
                    tone="ink"
                    label={
                      resumen?.totalPlanificadas
                        ? `Cumplimiento ${etiquetaPeriodo}`
                        : `Sin planificaciones ${etiquetaPeriodo}`
                    }
                  />
                  {resumen?.completadas != null && (
                    <Text style={styles.heroSub}>
                      {resumen.completadas} de {resumen.totalPlanificadas} hechas
                    </Text>
                  )}
                </View>
                <ColorBlock variant="solid" color={PALETTE.primary} style={styles.heroRacha}>
                  <BigNumber
                    value={String(consistencia?.rachaActual ?? 0)}
                    unit={consistencia?.rachaActual === 1 ? 'día' : 'días'}
                    size="displaySm"
                    tone="onColor"
                    label="Racha actual"
                    labelTone="onColor"
                  />
                  <Text style={styles.heroRachaSub}>
                    Récord {consistencia?.rachaMaxima ?? 0} días
                  </Text>
                </ColorBlock>
              </View>
              <View style={styles.statRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>Actividades</Text>
                  <Text style={styles.statValue}>{actsCompletadas}/{actividadesHoy.length}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>Hábitos</Text>
                  <Text style={styles.statValue}>{habitosCompletados}/{habitos.length}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>Conductas</Text>
                  <Text style={styles.statValue}>{conductas.length}</Text>
                </View>
              </View>
            </View>

            {/* MENSAJES CONTEXTUALES */}
            <PeriodSelector selected={periodo} onSelect={setPeriodo} />
            <InsightsCard insights={insights} />

            {/* SECCIÓN: HÁBITOS */}
            <View style={styles.sectionHeader}>
              <Eyebrow text="Hábitos" color={PALETTE.categorias.habitos} />
              <Pressable accessibilityLabel="Configurar hábitos" onPress={() => setShowManageModal(true)} style={({pressed}) => [styles.gearBtn, pressed && pressedFeedback]}>
                <Ionicons name="settings-outline" size={20} color={PALETTE.outline} />
              </Pressable>
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
              <Eyebrow text="Conductas a evitar" color={PALETTE.categorias.autocontrol} />
              <Pressable
                accessibilityLabel="Crear conducta"
                onPress={() => setShowNuevaConducta(true)}
                style={({pressed}) => [styles.gearBtn, pressed && pressedFeedback]}
              >
                <Ionicons name="add" size={24} color={PALETTE.outline} />
              </Pressable>
            </View>
            {conductas.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyDesc}>No tenés conductas registradas.</Text>
                <Pressable
                  style={({pressed}) => [styles.linkBtn, pressed && pressedFeedback]}
                  onPress={() => setShowNuevaConducta(true)}
                >
                  <Text style={styles.linkText}>+ Crear conducta</Text>
                </Pressable>
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
              <Eyebrow text="Alimentación · Hoy" color={PALETTE.categorias.comida} />
            </View>
            <Pressable
              style={({pressed}) => [styles.estadoOpen, pressed && pressedFeedback]}
              onPress={() => navigateToTab(navigation, 'metricas', 'comida')}
            >
              <View style={styles.estadoOpenMain}>
                <BigNumber
                  value={hayComida ? formatEstimado(comidaResumen.kcal, '') : '—'}
                  unit={hayComida ? 'kcal' : undefined}
                  size="displaySm"
                  color={PALETTE.categorias.comida}
                  label="Calorías registradas"
                />
                <Text style={styles.estadoSub}>
                  P {hayComida ? formatEstimado(comidaResumen.prot, 'g') : '—'} ·
                  C {hayComida ? formatEstimado(comidaResumen.carb, 'g') : '—'} ·
                  G {hayComida ? formatEstimado(comidaResumen.grasa, 'g') : '—'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={PALETTE.categorias.comida} />
            </Pressable>

            {/* SECCIÓN: ESTADO FÍSICO */}
            <View style={styles.sectionHeader}>
              <Eyebrow text="Estado físico" color={PALETTE.categorias.objetivos} />
            </View>
            <Pressable
              style={({pressed}) => [styles.estadoOpen, pressed && pressedFeedback]}
              onPress={() => navigation.navigate('Estado')}
            >
              <View style={styles.estadoOpenMain}>
                <BigNumber
                  value={estadoFisico?.peso ? `${estadoFisico.peso}` : '—'}
                  unit={estadoFisico?.peso ? 'kg' : undefined}
                  size="displaySm"
                  color={PALETTE.categorias.objetivos}
                  label="Último registro"
                />
                <Text style={styles.estadoSub}>
                  {estadoFisico?.fecha_medicion ?? 'Sin mediciones registradas'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={PALETTE.categorias.objetivos} />
            </Pressable>

            {/* SECCIÓN: ANÁLISIS DE ACTIVIDADES */}
            <View style={styles.sectionHeader}>
              <Eyebrow text="Análisis de actividades" color={PALETTE.categorias.actividades} />
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

      <ManageTrackingModal 
        visible={showManageModal}
        onClose={() => setShowManageModal(false)}
        onChanged={() => loadData(periodo)}
      />

      <NuevaConductaSheet
        visible={showNuevaConducta}
        onClose={() => setShowNuevaConducta(false)}
        onSaved={() => loadData(periodo)}
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
  heroBlock: {
    gap: 12,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  heroMain: {
    flex: 3,
    justifyContent: 'center',
    paddingVertical: 4,
    paddingRight: 4,
  },
  heroRacha: {
    flex: 2,
    justifyContent: 'space-between',
  },
  heroSub: {
    ...TYPE.body,
    color: PALETTE.onSurfaceVariant,
    marginTop: 8,
  },
  heroRachaSub: {
    ...TYPE.caption,
    color: PALETTE.onAccent,
    opacity: 0.85,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: PALETTE.hairline,
    paddingTop: 12,
  },
  statCell: {
    flex: 1,
    paddingHorizontal: 4,
    gap: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: PALETTE.hairline,
  },
  statLabel: {
    ...TYPE.label,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.ink,
    letterSpacing: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  gearBtn: {
    width: 44,
    height: 44,
    marginRight: -12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.cards,
  },
  emptyCard: {
    backgroundColor: PALETTE.fondos.identidad,
    borderRadius: RADIUS.block,
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  emptyDesc: {
    ...TYPE.body,
    color: PALETTE.ink,
    marginBottom: 4,
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
  estadoOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.hairline,
  },
  estadoOpenMain: {
    flex: 1,
    gap: 4,
  },
  estadoSub: {
    ...TYPE.caption,
    color: PALETTE.onSurfaceVariant,
    marginTop: 4,
  },
});
