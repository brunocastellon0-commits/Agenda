import React, { useCallback, useState } from 'react';
import { View, StyleSheet, StatusBar, ScrollView, ActivityIndicator, Text, Pressable } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { navigateToTab } from '../navigation/tabs';
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { Usuario, getUsuarios, saveOrUpdateUsuario } from '../repositories/usuario';
import { getActividades, Actividad, asegurarTiposIniciales } from '../repositories/actividadRepo';
import { getConsistencia } from '../repositories/metricasRepo';
import { getRegistrosDia, getResumenDia, ResumenNutricional } from '../repositories/comidaRepo';
import { getConductasActivas, asegurarConductasIniciales, ConductaProgreso } from '../repositories/conductaRepo';
import { getComparativa, RegistroFisico } from '../repositories/estadoFisicoRepo';
import { toISODate } from '../utils/semana';
import { scheduleDailySummary, scheduleAvoidanceReminder } from '../services/notificaciones';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { MiDiaWidget } from '../widgets/MiDiaWidget';
import { Ionicons } from '@expo/vector-icons';
import { getHabitosActivos } from '../repositories/habitosRepo';

function getMensajeWidget(acts: Actividad[], hoyISO: string) {
  const hr = new Date().getHours();
  if (hr < 12) return "Tu día acaba de empezar.";
  if (hr < 18) return "Tu día sigue en marcha.";
  return "Un paso más para cerrar el día.";
}

import { ProfileBanner } from '../components/profileBanner';
import { BottomNavigationBar } from '../components/ButtonNavigationBar';
import NotificacionesSheet from '../components/NotificacionesSheet';
import { formatEstimado } from '../utils/nutricion';

const DEFAULT_USUARIO: Usuario = {
  ci: '1', nombre: 'Viajero', apellido: '', peso: 0, altura: 0, cintura: 0, cuello: 0, edad: 0, avatarUrl: ''
};

type Props = StackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [actividadesHoy, setActividadesHoy] = useState<Actividad[]>([]);
  const [comidasCount, setComidasCount] = useState(0);
  const [resumenNutricional, setResumenNutricional] = useState<ResumenNutricional>({ kcal: 0, prot: 0, carb: 0, grasa: 0 });
  const [ultimoEstado, setUltimoEstado] = useState<RegistroFisico | null>(null);
  const [rachaDias, setRachaDias] = useState<number>(0);
  const [conductas, setConductas] = useState<ConductaProgreso[]>([]);
  
  const [showNotifSheet, setShowNotifSheet] = useState(false);

  const cargarDatosControl = useCallback(async () => {
    try {
      await asegurarTiposIniciales();
      await asegurarConductasIniciales();

      const hoyISO = toISODate(new Date());

      const [usuarios, consistencia, acts, comidas, resNutri, conductasActivas, habs] = await Promise.all([
        getUsuarios(),
        getConsistencia(),
        getActividades(hoyISO),
        getRegistrosDia(hoyISO),
        getResumenDia(hoyISO),
        getConductasActivas(),
        getHabitosActivos()
      ]);

      let activeUser = usuarios.length > 0 ? usuarios[0] : null;
      if (!activeUser) {
        await saveOrUpdateUsuario(DEFAULT_USUARIO);
        activeUser = DEFAULT_USUARIO;
      }
      setUsuario(activeUser);

      if (activeUser.ci) {
        const cmp = await getComparativa(activeUser.ci);
        setUltimoEstado(cmp.ultimo);
      }

      setActividadesHoy(acts);
      setComidasCount(comidas.length);
      setResumenNutricional(resNutri);
      setRachaDias(consistencia.rachaActual);
      setConductas(conductasActivas);

      scheduleDailySummary().catch(console.error);
      if (conductasActivas.length > 0) {
        scheduleAvoidanceReminder(conductasActivas[0].conducta.id).catch(console.error);
      }

      try {
        const widgetData = {
          rachas: habs.filter(h => h.rachaActual > 0).map(h => ({ nombre: h.detalle.titulo, dias: h.rachaActual })).slice(0, 3),
          mensaje: getMensajeWidget(acts, hoyISO)
        };
        await AsyncStorage.setItem('widget_mi_dia_data', JSON.stringify(widgetData));
        requestWidgetUpdate({
          widgetName: 'MiDiaWidget',
          renderWidget: () => <MiDiaWidget {...widgetData} />,
          widgetNotFound: () => {}
        });
      } catch (e) {
        console.error('Error al actualizar widget:', e);
      }
    } catch (error) {
      console.error('Error al cargar datos del Hub de Inicio:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarDatosControl();
    }, [cargarDatosControl])
  );

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

  // Preparar datos para el Mapa
  const actsCompletadas = actividadesHoy.filter(a => a.completado).length;
  const conductasEnLimite = conductas.filter(c => c.conducta.modalidad === 'limite' && c.eventosPeriodo <= c.conducta.objetivo).length;
  const totalConductasLimite = conductas.filter(c => c.conducta.modalidad === 'limite').length;
  
  const conductasEvitacion = conductas.filter(c => c.conducta.modalidad === 'evitacion_total');
  const mejorRachaConducta = conductasEvitacion.length > 0 ? Math.max(...conductasEvitacion.map(c => c.rachaActual)) : 0;

  const pendingActs = actividadesHoy.filter(a => !a.completado && a.hora);
  const proxActividad = pendingActs.length > 0 ? pendingActs.sort((a,b) => (a.hora || '23:59').localeCompare(b.hora || '23:59'))[0] : null;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            {usuario && <ProfileBanner usuario={usuario} onPress={() => navigation.navigate('Estado')} />}
          </View>
          <Pressable onPress={() => setShowNotifSheet(true)} style={({pressed}) => [{ padding: 8 }, pressed && {opacity: 0.7}]}>
            <Ionicons name="settings-outline" size={24} color={PALETTE.onSurfaceVariant} />
          </Pressable>
        </View>

        <Text style={styles.mapaTitle}>Tu Día en Marcha</Text>

        {/* MAPA DEL DÍA - ASIMÉTRICO */}
        <View style={styles.mapGrid}>
          
          {/* Fila 1 */}
          <View style={styles.mapRow}>
            {/* Actividades */}
            <Pressable 
              style={({pressed}) => [styles.mapNode, styles.nodeLarge, pressed && pressedFeedback]}
              onPress={() => navigateToTab(navigation, 'inicio', 'actividades')}
            >
              <View style={[styles.nodeIconBg, { backgroundColor: tint(PALETTE.categorias.trabajo, 0.12) }]}>
                <Ionicons name="calendar-outline" size={22} color={PALETTE.categorias.trabajo} />
              </View>
              <Text style={styles.nodeLabel}>Actividades</Text>
              <Text style={styles.nodeValue}>{actsCompletadas} / {actividadesHoy.length}</Text>
              {proxActividad && (
                <Text style={styles.nodeSubtext} numberOfLines={1}>Próxima: {proxActividad.hora} {proxActividad.titulo}</Text>
              )}
            </Pressable>

            {/* Alimentación */}
            <Pressable 
              style={({pressed}) => [styles.mapNode, styles.nodeSmall, pressed && pressedFeedback]}
              onPress={() => navigateToTab(navigation, 'inicio', 'comida')}
            >
              <View style={[styles.nodeIconBg, { backgroundColor: tint(PALETTE.categorias.ocio, 0.12) }]}>
                <Ionicons name="restaurant-outline" size={22} color={PALETTE.categorias.ocio} />
              </View>
              <Text style={styles.nodeLabel}>Alimentación</Text>
              <Text style={[styles.nodeValue, { fontSize: 18 }]}>~{formatEstimado(resumenNutricional.kcal, '')}</Text>
              <Text style={styles.nodeSubtext}>kcal registradas</Text>
            </Pressable>
          </View>

          {/* Fila 2 */}
          <View style={styles.mapRow}>
            {/* Hábitos / Constancia */}
            <Pressable 
              style={({pressed}) => [styles.mapNode, styles.nodeSmall, pressed && pressedFeedback]}
              onPress={() => navigateToTab(navigation, 'inicio', 'metricas')}
            >
              <View style={[styles.nodeIconBg, { backgroundColor: tint(PALETTE.primary, 0.12) }]}>
                <Ionicons name="leaf-outline" size={22} color={PALETTE.primary} />
              </View>
              <Text style={styles.nodeLabel}>Constancia</Text>
              <Text style={[styles.nodeValue, { color: PALETTE.primary }]}>🔥 {rachaDias}</Text>
              <Text style={styles.nodeSubtext}>días en racha</Text>
            </Pressable>

            {/* Conductas */}
            <Pressable 
              style={({pressed}) => [styles.mapNode, styles.nodeLarge, pressed && pressedFeedback]}
              onPress={() => navigateToTab(navigation, 'inicio', 'metricas')}
            >
              <View style={[styles.nodeIconBg, { backgroundColor: tint(PALETTE.categorias.importante, 0.12) }]}>
                <Ionicons name="shield-checkmark-outline" size={22} color={PALETTE.categorias.importante} />
              </View>
              <Text style={styles.nodeLabel}>Autocontrol</Text>
              {totalConductasLimite > 0 && (
                <Text style={styles.nodeValue}>{conductasEnLimite} / {totalConductasLimite} límites</Text>
              )}
              {mejorRachaConducta > 0 && (
                <Text style={styles.nodeSubtext}>Mejor racha activa: {mejorRachaConducta} d</Text>
              )}
              {totalConductasLimite === 0 && mejorRachaConducta === 0 && (
                <Text style={styles.nodeSubtext}>Todo en orden</Text>
              )}
            </Pressable>
          </View>

          {/* Fila 3 */}
          <View style={styles.mapRow}>
            {/* Estado Físico */}
            <Pressable 
              style={({pressed}) => [styles.mapNode, styles.nodeFull, pressed && pressedFeedback]}
              onPress={() => navigation.navigate('Estado')}
            >
              <View style={styles.estadoRow}>
                <View>
                  <Text style={styles.nodeLabel}>Estado Físico</Text>
                  <Text style={styles.nodeValue}>{ultimoEstado?.peso ? `${ultimoEstado.peso} kg` : 'Sin mediciones'}</Text>
                  <Text style={styles.nodeSubtext}>Último registro: {ultimoEstado?.fecha_medicion || 'Nunca'}</Text>
                </View>
                <View style={[styles.nodeIconBg, { backgroundColor: tint(PALETTE.categorias.objetivos, 0.12) }]}>
                  <Ionicons name="body-outline" size={22} color={PALETTE.categorias.objetivos} />
                </View>
              </View>
            </Pressable>
          </View>

        </View>

        <View style={styles.analyticsHint}>
          <Ionicons name="analytics-outline" size={20} color={PALETTE.onSurfaceVariant} style={{marginRight: 8}} />
          <Text style={styles.analyticsHintText}>Encuentra tu análisis detallado e historial en Métricas.</Text>
        </View>

      </ScrollView>

      <BottomNavigationBar
        activeTab="inicio"
        onSelectTab={(tab) => navigateToTab(navigation, 'inicio', tab)}
      />

      <NotificacionesSheet 
        visible={showNotifSheet}
        onClose={() => setShowNotifSheet(false)}
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
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  mapaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  mapGrid: {
    gap: 12,
  },
  mapRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mapNode: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: RADIUS.cards,
    padding: 20,
    ...SHADOW.card,
    elevation: 4,
    justifyContent: 'center',
  },
  nodeLarge: {
    flex: 3,
  },
  nodeSmall: {
    flex: 2,
  },
  nodeFull: {
    flex: 1,
  },
  nodeIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  nodeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
    marginBottom: 4,
  },
  nodeValue: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 8,
  },
  nodeSubtext: {
    fontSize: 13,
    color: PALETTE.outline,
    fontWeight: '500',
  },
  estadoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analyticsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  analyticsHintText: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
    textAlign: 'center',
    flex: 1,
  }
});