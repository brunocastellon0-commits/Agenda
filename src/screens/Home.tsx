import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { navigateToTab } from '../navigation/tabs';
import { PALETTE } from '../theme/theme';
import { Usuario, getUsuarios, saveOrUpdateUsuario } from '../repositories/usuario';
import { getBilleteras, Billetera } from '../repositories/billetera';
import { getPagosByBilletera, Pago } from '../repositories/pagos';
import { getActividades, Actividad, toggleActividad, asegurarTiposIniciales } from '../repositories/actividadRepo';
import { getResumenGeneral, getConsistencia, calcularRango } from '../repositories/metricasRepo';
import { getProyectosConProgreso, ProyectoConProgreso } from '../repositories/proyectoRepo';
import { toISODate } from '../utils/semana';

import { ProfileBanner } from '../components/profileBanner';
import { EditProfileModal } from '../components/EditProfile';
import { FinanceSummaryCard } from '../components/FinanceSummaryCard';
import { TodaySummaryCard } from '../components/TodaySummaryCard';
import { QuickMetricsCard } from '../components/QuickMetricsCard';
import { ProjectsProgressCard } from '../components/ProjectsProgressCard';
import { BottomNavigationBar } from '../components/ButtonNavigationBar';

const DEFAULT_USUARIO: Usuario = {
  ci: '1',
  nombre: 'Valeria',
  apellido: 'Morales',
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
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Datos reales integrados
  const [saldoTotal, setSaldoTotal] = useState<number>(0);
  const [divisaBase, setDivisaBase] = useState<string>('BOB');
  const [cuentasCount, setCuentasCount] = useState<number>(0);
  const [pagosPendientesCount, setPagosPendientesCount] = useState<number>(0);

  const [actividadesHoy, setActividadesHoy] = useState<Actividad[]>([]);
  const [rachaDias, setRachaDias] = useState<number>(0);
  const [cumplimientoPct, setCumplimientoPct] = useState<number>(0);
  const [proyectos, setProyectos] = useState<ProyectoConProgreso[]>([]);

  const cargarDatosControl = useCallback(async () => {
    try {
      await asegurarTiposIniciales();

      const rangoSemana = calcularRango('semana');
      const [usuarios, billeteras, resumen, consistencia, listProyectos] = await Promise.all([
        getUsuarios(),
        getBilleteras(),
        getResumenGeneral(rangoSemana),
        getConsistencia(),
        getProyectosConProgreso(),
      ]);

      // Usuario
      if (usuarios.length === 0) {
        await saveOrUpdateUsuario(DEFAULT_USUARIO);
        setUsuario(DEFAULT_USUARIO);
      } else {
        setUsuario(usuarios[0]);
      }

      // Finanzas
      setCuentasCount(billeteras.length);
      if (billeteras.length > 0) {
        setDivisaBase(billeteras[0].divisa);
        const sumSaldo = billeteras.reduce((acc: number, b: Billetera) => acc + b.monto, 0);
        setSaldoTotal(sumSaldo);

        // Pagos pendientes
        let totalPagosPendientes = 0;
        for (const b of billeteras) {
          if (b.id) {
            const pagos = await getPagosByBilletera(b.id);
            totalPagosPendientes += pagos.filter((p: Pago) => (p.pagado ?? 0) < p.monto).length;
          }
        }
        setPagosPendientesCount(totalPagosPendientes);
      }

      // Actividades de Hoy
      const hoyISO = toISODate(new Date());
      const acts = await getActividades(hoyISO);
      setActividadesHoy(acts);

      // Métricas
      setRachaDias(consistencia.rachaActual);
      setCumplimientoPct(Math.round(resumen.cumplimientoPct ?? 0));

      // Proyectos
      setProyectos(listProyectos);
    } catch (error) {
      console.error('Error al cargar datos del Hub de Inicio:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatosControl();
  }, [cargarDatosControl]);

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

  const handleSaveProfile = (updated: Usuario) => {
    setUsuario(updated);
    setIsModalOpen(false);
    saveOrUpdateUsuario(updated).catch((error) => {
      console.error('Error al guardar el usuario:', error);
    });
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
        {usuario && (
          <ProfileBanner
            usuario={usuario}
            onEditPress={() => setIsModalOpen(true)}
          />
        )}

        {/* Resumen Financiero Estilo Billetera */}
        <FinanceSummaryCard
          saldoTotal={saldoTotal}
          divisaPrincipal={divisaBase}
          cuentasCount={cuentasCount}
          pagosPendientesCount={pagosPendientesCount}
          onPress={() => navigateToTab(navigation, 'inicio', 'billetera')}
        />

        {/* Mi Jornada de Hoy con Badges de Notificación */}
        <TodaySummaryCard
          actividades={actividadesHoy}
          onToggleTask={handleToggleTask}
          onNavigateActividades={() => navigateToTab(navigation, 'inicio', 'actividades')}
        />

        {/* Rendimiento & Métricas */}
        <QuickMetricsCard
          rachaDias={rachaDias}
          cumplimientoPct={cumplimientoPct}
          onNavigateMetricas={() => navigateToTab(navigation, 'inicio', 'metricas')}
        />

        {/* Proyectos & Objetivos en Curso */}
        <ProjectsProgressCard proyectos={proyectos} />
      </ScrollView>

      <BottomNavigationBar
        activeTab="inicio"
        onSelectTab={(tab) => navigateToTab(navigation, 'inicio', tab)}
      />

      {usuario && (
        <EditProfileModal
          visible={isModalOpen}
          currentProfile={usuario}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProfile}
        />
      )}
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