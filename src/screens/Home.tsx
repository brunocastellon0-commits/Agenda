import React, { useCallback, useState } from 'react';
import { View, StyleSheet, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { navigateToTab } from '../navigation/tabs';
import { PALETTE } from '../theme/theme';
import { Usuario, getUsuarios, saveOrUpdateUsuario } from '../repositories/usuario';
import { getBilleteras, Billetera } from '../repositories/billetera';
import { getPagosByBilletera, Pago } from '../repositories/pagos';
import { getActividades, Actividad, toggleActividad, asegurarTiposIniciales } from '../repositories/actividadRepo';
import { getResumenGeneral, getConsistencia, calcularRango } from '../repositories/metricasRepo';
import { getProyectosConProgreso, ProyectoConProgreso } from '../repositories/proyectoRepo';
import { getRegistrosDia, RegistroComida } from '../repositories/comidaRepo';
import { requestPermissionsAsync } from '../services/notificaciones';
import { toISODate } from '../utils/semana';

import { ProfileBanner } from '../components/profileBanner';
import { TodaySummaryCard } from '../components/TodaySummaryCard';
import { FoodSummaryCard } from '../components/FoodSummaryCard';
import { QuickMetricsCard } from '../components/QuickMetricsCard';
import { FinanceSummaryCard } from '../components/FinanceSummaryCard';
import { ProjectsProgressCard } from '../components/ProjectsProgressCard';
import { BottomNavigationBar } from '../components/ButtonNavigationBar';

const DEFAULT_USUARIO: Usuario = {
  ci: '1',
  nombre: 'Viajero',
  apellido: '',
  peso: 0,
  altura: 0,
  cintura: 0,
  cuello: 0,
  edad: 0,
  avatarUrl: '',
};

type Props = StackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Actividades
  const [actividadesHoy, setActividadesHoy] = useState<Actividad[]>([]);
  // Comida
  const [comidasCount, setComidasCount] = useState(0);
  const [ultimaComida, setUltimaComida] = useState<string | null>(null);
  // Métricas
  const [rachaDias, setRachaDias] = useState<number>(0);
  const [cumplimientoPct, setCumplimientoPct] = useState<number>(0);
  // Finanzas
  const [saldoTotal, setSaldoTotal] = useState<number>(0);
  const [divisaBase, setDivisaBase] = useState<string>('BOB');
  const [cuentasCount, setCuentasCount] = useState<number>(0);
  const [pagosPendientesCount, setPagosPendientesCount] = useState<number>(0);
  // Proyectos
  const [proyectos, setProyectos] = useState<ProyectoConProgreso[]>([]);

  const cargarDatosControl = useCallback(async () => {
    try {
      await asegurarTiposIniciales();

      const hoyISO = toISODate(new Date());
      const rangoSemana = calcularRango('semana');

      const [usuarios, billeteras, resumen, consistencia, listProyectos, acts, comidas] = await Promise.all([
        getUsuarios(),
        getBilleteras(),
        getResumenGeneral(rangoSemana),
        getConsistencia(),
        getProyectosConProgreso(),
        getActividades(hoyISO),
        getRegistrosDia(hoyISO)
      ]);

      // Usuario
      if (usuarios.length === 0) {
        await saveOrUpdateUsuario(DEFAULT_USUARIO);
        setUsuario(DEFAULT_USUARIO);
      } else {
        setUsuario(usuarios[0]);
      }

      // Actividades
      setActividadesHoy(acts);

      // Comidas
      setComidasCount(comidas.length);
      if (comidas.length > 0) {
        const ultima = comidas[comidas.length - 1];
        setUltimaComida(`${ultima.tipo} · ${ultima.hora}`);
      } else {
        setUltimaComida(null);
      }

      // Métricas
      setRachaDias(consistencia.rachaActual);
      setCumplimientoPct(Math.round(resumen.cumplimientoPct ?? 0));

      // Finanzas
      setCuentasCount(billeteras.length);
      if (billeteras.length > 0) {
        setDivisaBase(billeteras[0].divisa);
        const sumSaldo = billeteras.reduce((acc: number, b: Billetera) => acc + b.monto, 0);
        setSaldoTotal(sumSaldo);

        let totalPagosPendientes = 0;
        for (const b of billeteras) {
          if (b.id) {
            const pagos = await getPagosByBilletera(b.id);
            totalPagosPendientes += pagos.filter((p: Pago) => (p.pagado ?? 0) < p.monto).length;
          }
        }
        setPagosPendientesCount(totalPagosPendientes);
      }

      // Proyectos
      setProyectos(listProyectos);
    } catch (error) {
      console.error('Error al cargar datos del Hub de Inicio:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarDatosControl();
      requestPermissionsAsync().catch(console.error);
    }, [cargarDatosControl])
  );

  const handleToggleTask = async (id: number) => {
    try {
      await toggleActividad(id);
      const hoyISO = toISODate(new Date());
      const updatedActs = await getActividades(hoyISO);
      setActividadesHoy(updatedActs);
    } catch (err) {
      console.error('Error al cambiar estado de actividad:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {usuario && <ProfileBanner usuario={usuario} />}

        {/* 1. Actividades (Hoy) */}
        <TodaySummaryCard
          actividades={actividadesHoy}
          onToggleTask={handleToggleTask}
          onNavigateActividades={() => navigateToTab(navigation, 'inicio', 'actividades')}
        />

        {/* 2. Comida */}
        <FoodSummaryCard 
          comidasCount={comidasCount}
          ultimaComida={ultimaComida}
          onPress={() => navigateToTab(navigation, 'inicio', 'comida')}
        />

        {/* 3. Constancia / Hábitos */}
        <QuickMetricsCard
          rachaDias={rachaDias}
          cumplimientoPct={cumplimientoPct}
          onNavigateMetricas={() => navigateToTab(navigation, 'inicio', 'metricas')}
        />

        {/* 4. Finanzas */}
        <FinanceSummaryCard
          saldoTotal={saldoTotal}
          divisaPrincipal={divisaBase}
          cuentasCount={cuentasCount}
          pagosPendientesCount={pagosPendientesCount}
          onPress={() => navigateToTab(navigation, 'inicio', 'billetera')}
        />

        {/* 5. Proyectos */}
        <ProjectsProgressCard proyectos={proyectos} />
      </ScrollView>

      <BottomNavigationBar
        activeTab="inicio"
        onSelectTab={(tab) => navigateToTab(navigation, 'inicio', tab)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: PALETTE.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 16,
    gap: 16,
  },
});