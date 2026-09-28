import React, { useState, useCallback } from 'react';
import { View, StyleSheet, StatusBar, ScrollView, ActivityIndicator, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Usuario, getUsuarios, saveOrUpdateUsuario } from '../repositories/usuario';
import { getActividades, Actividad, asegurarTiposIniciales } from '../repositories/actividadRepo';
import { getConsistencia } from '../repositories/metricasRepo';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { MiDiaWidget } from '../widgets/MiDiaWidget';
import { Ionicons } from '@expo/vector-icons';

import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { BottomNavigationBar } from '../components/ButtonNavigationBar';
import { navigateToTab } from '../navigation/tabs';
import { RootStackParamList } from '../navigation/types';
import { getHabitosActivos } from '../repositories/habitosRepo';
import { getConductasActivas, ConductaProgreso } from '../repositories/conductaRepo';
import { getUltimoRegistro, RegistroFisico } from '../repositories/estadoFisicoRepo';

function getMensajeWidget(acts: Actividad[], hoyISO: string) {
  const hr = new Date().getHours();
  if (hr < 12) return "Tu día acaba de empezar.";
  if (hr < 18) return "Tu día sigue en marcha.";
  return "Un paso más para cerrar el día.";
}

import { ProfileBanner } from '../components/profileBanner';
import { getResumenDia, asegurarAlimentosIniciales, ResumenNutricional, RESUMEN_VACIO } from '../repositories/comidaRepo';
import NotificacionesSheet from '../components/NotificacionesSheet';
import { EditProfileModal } from '../components/EditProfile';
import { formatEstimado } from '../utils/nutricion';
import { validarTexto } from '../utils/validacion';

const DEFAULT_USUARIO: Usuario = {
  ci: '1', nombre: '', apellido: '', peso: 0, altura: 0, cintura: 0, cuello: 0, edad: 0, avatarUrl: ''
};

type Props = StackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [actividadesHoy, setActividadesHoy] = useState<Actividad[]>([]);
  const [resumenNutricional, setResumenNutricional] = useState<ResumenNutricional>(RESUMEN_VACIO);
  const [ultimoEstado, setUltimoEstado] = useState<RegistroFisico | null>(null);
  const [rachaDias, setRachaDias] = useState<number>(0);
  const [conductas, setConductas] = useState<ConductaProgreso[]>([]);

  const [showNotifSheet, setShowNotifSheet] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Onboarding de nombre
  const [nombreInput, setNombreInput] = useState('');
  const [nombreError, setNombreError] = useState<string | null>(null);
  const [guardandoNombre, setGuardandoNombre] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          await asegurarTiposIniciales();
          await asegurarAlimentosIniciales();

          const d = new Date();
          const hoyISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

          const [usuarios, consistencia, acts, cmp, conductasActivas, habs] = await Promise.all([
            getUsuarios(),
            getConsistencia(),
            getActividades(hoyISO),
            getResumenDia(hoyISO).then(async (res) => {
              const u = null;
              return { nutricion: res, ultimo: u };
            }),
            getConductasActivas(d),
            getHabitosActivos()
          ]);

          let activeUser = usuarios[0];
          if (!activeUser) {
            await saveOrUpdateUsuario(DEFAULT_USUARIO);
            activeUser = DEFAULT_USUARIO;
          }
          setUsuario(activeUser);

          setResumenNutricional(cmp.nutricion);
          if (activeUser.ci) {
            getUltimoRegistro(activeUser.ci).then(setUltimoEstado).catch(() => {});
          }

          setActividadesHoy(acts);
          setRachaDias(consistencia.rachaActual);
          setConductas(conductasActivas);

          // Actualizar Widget
          const widgetData = {
            actividadesRestantes: acts.filter(a => !a.completado).length,
            rachas: habs.filter(h => h.rachaActual > 0).map(h => ({ nombre: h.detalle.titulo, dias: h.rachaActual })).slice(0, 3),
            mensaje: getMensajeWidget(acts, hoyISO)
          };
          
          try {
            requestWidgetUpdate({
              widgetName: 'MiDiaWidget',
              renderWidget: () => <MiDiaWidget {...widgetData} />,
            });
          } catch (e) {
            console.error('Error al actualizar widget:', e);
          }
        } catch (error) {
          console.error("Error al cargar Home:", error);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  if (loading || !usuario) {
    return (
      <View style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
        </View>
      </View>
    );
  }

  const actsCompletadas = actividadesHoy.filter(a => a.completado).length;

  const guardarNombre = async () => {
    if (guardandoNombre || !usuario) return;
    const error = validarTexto(nombreInput, 2, 60, 'Nombre');
    setNombreError(error);
    if (error) return;

    setGuardandoNombre(true);
    try {
      const nuevo = { ...usuario, nombre: nombreInput.trim() };
      await saveOrUpdateUsuario(nuevo);
      setUsuario(nuevo);
      setNombreInput('');
      setNombreError(null);
    } catch (e) {
      console.error('Error al guardar el nombre:', e);
      setNombreError('No se pudo guardar el nombre. Probá de nuevo.');
    } finally {
      setGuardandoNombre(false);
    }
  };

  const guardarPerfil = async (actualizado: Usuario) => {
    try {
      await saveOrUpdateUsuario(actualizado);
      setUsuario(actualizado);
      setShowEditProfile(false);
    } catch (e) {
      console.error('Error al guardar el perfil:', e);
      Alert.alert('Error', 'No se pudo guardar el perfil.');
    }
  };
  
  const conductasEvitacion = conductas.filter(c => c.conducta.modalidad === 'evitacion_total');
  const totalConductasLimite = conductasEvitacion.length;
  const conductasEnLimite = conductasEvitacion.filter(c => c.eventosPeriodo <= c.conducta.objetivo).length;
  const mejorRachaConducta = conductasEvitacion.length > 0 ? Math.max(...conductasEvitacion.map(c => c.rachaActual)) : 0;

  const pendingActs = actividadesHoy.filter(a => !a.completado && a.hora);
  pendingActs.sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
  const proxActividad = pendingActs.length > 0 ? pendingActs[0] : null;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />

      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerTop}>
          <ProfileBanner usuario={usuario} onPress={() => setShowEditProfile(true)} />
          <Pressable 
            style={({pressed}) => [{ padding: 8, borderRadius: 20 }, pressed && pressedFeedback]}
            onPress={() => setShowNotifSheet(true)}
          >
            <Ionicons name="notifications-outline" size={24} color={PALETTE.ink} />
          </Pressable>
        </View>

        <Text style={styles.mapaTitle}>Tu Día en Marcha</Text>

        {/* MAPA DEL DÍA - ASIMÉTRICO */}
        <View style={styles.mapGrid}>
          
          {/* Fila 1 */}
          <View style={styles.mapRow}>
            {/* Actividades */}
            <Pressable 
              style={({pressed}) => [styles.mapNode, styles.nodeLarge, { backgroundColor: PALETTE.fondos.autocontrol }, pressed && pressedFeedback]}
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
              <Text style={[styles.nodeValue, { fontSize: 18 }]}>
                {resumenNutricional.itemsEstimados > 0 ? formatEstimado(resumenNutricional.kcal, '') : '—'}
              </Text>
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
              <View style={[styles.nodeIconBg, { backgroundColor: tint(PALETTE.categorias.habitos, 0.15) }]}>
                <Ionicons name="leaf-outline" size={22} color={PALETTE.primary} />
              </View>
              <Text style={styles.nodeLabel}>Constancia</Text>
              <Text style={[styles.nodeValue, { color: PALETTE.categorias.habitos }]}>🔥 {rachaDias}</Text>
              <Text style={styles.nodeSubtext}>días en racha</Text>
            </Pressable>

            {/* Conductas */}
            <Pressable 
              style={({pressed}) => [styles.mapNode, styles.nodeLarge, { backgroundColor: PALETTE.fondos.actividades }, pressed && pressedFeedback]}
              onPress={() => navigateToTab(navigation, 'inicio', 'metricas')}
            >
              <View style={[styles.nodeIconBg, { backgroundColor: tint(PALETTE.categorias.autocontrol, 0.15) }]}>
                <Ionicons name="shield-checkmark-outline" size={22} color={PALETTE.categorias.autocontrol} />
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
              style={({pressed}) => [styles.mapNode, styles.nodeFull, { backgroundColor: PALETTE.fondos.metricas }, pressed && pressedFeedback]}
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

          {/* Fila 4: CONTROL (Tu Esquina) */}
          <View style={styles.mapRow}>
            <Pressable 
              style={({pressed}) => [
                styles.mapNode, 
                styles.nodeFull, 
                { backgroundColor: PALETTE.fondos.control },
                pressed && pressedFeedback
              ]}
              onPress={() => navigation.navigate('Control')}
            >
              <View style={styles.estadoRow}>
                <View>
                  <Text style={[styles.nodeLabel, { color: PALETTE.outline }]}>Modo Control</Text>
                  <Text style={[styles.nodeValue, { color: PALETTE.onSurface }]}>Tu Esquina</Text>
                  <Text style={[styles.nodeSubtext, { color: PALETTE.onSurfaceVariant }]}>¿Necesitás un momento?</Text>
                </View>
                <View style={[styles.nodeIconBg, { backgroundColor: tint(PALETTE.categorias.control, 0.2) }]}>
                  <Ionicons name="fitness-outline" size={22} color={PALETTE.categorias.control} />
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

      {usuario.nombre === '' && (
        <View style={styles.nombreOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.nombreKav}
          >
            <View style={styles.nombreCard}>
              <Text style={styles.nombreTitulo}>¿Cómo te llamas?</Text>
              <Text style={styles.nombreDesc}>
                Ingresá tu nombre para personalizar tu experiencia.
              </Text>

              <TextInput
                autoFocus
                style={[styles.nombreInput, nombreError !== null && styles.nombreInputError]}
                placeholder="Tu nombre"
                placeholderTextColor={PALETTE.onSurfaceVariant}
                value={nombreInput}
                maxLength={60}
                autoCapitalize="words"
                returnKeyType="done"
                onChangeText={(t) => { setNombreInput(t); setNombreError(null); }}
                onSubmitEditing={guardarNombre}
              />
              {nombreError !== null && <Text style={styles.nombreError}>{nombreError}</Text>}

              <Pressable
                style={({ pressed }) => [styles.nombreBtn, pressed && pressedFeedback, guardandoNombre && { opacity: 0.7 }]}
                onPress={guardarNombre}
              >
                <Text style={styles.nombreBtnText}>{guardandoNombre ? 'Guardando...' : 'Guardar'}</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      <EditProfileModal
        visible={showEditProfile}
        currentProfile={usuario}
        onClose={() => setShowEditProfile(false)}
        onSave={guardarPerfil}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: PALETTE.surface,
  },
  nombreOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(19,26,24,0.4)',
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  nombreKav: {
    width: '100%',
  },
  nombreCard: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderTopLeftRadius: RADIUS.cards,
    borderTopRightRadius: RADIUS.cards,
    padding: 24,
    paddingBottom: 32,
    ...SHADOW.modal,
  },
  nombreTitulo: {
    fontSize: 24,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 8,
  },
  nombreDesc: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
    marginBottom: 20,
  },
  nombreInput: {
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: RADIUS.buttons,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: PALETTE.ink,
  },
  nombreInputError: {
    borderWidth: 1,
    borderColor: PALETTE.categorias.critico,
  },
  nombreError: {
    fontSize: 12,
    color: PALETTE.categorias.critico,
    marginTop: 8,
  },
  nombreBtn: {
    marginTop: 20,
    backgroundColor: PALETTE.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombreBtnText: {
    color: PALETTE.onAccent,
    fontSize: 16,
    fontWeight: '600',
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