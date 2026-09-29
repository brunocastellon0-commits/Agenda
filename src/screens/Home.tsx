import React, { useState, useCallback } from 'react';
import { View, StyleSheet, StatusBar, ScrollView, ActivityIndicator, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Usuario, getUsuarios, saveOrUpdateUsuario } from '../repositories/usuario';
import { getActividades, Actividad, asegurarTiposIniciales } from '../repositories/actividadRepo';
import { getConsistencia } from '../repositories/metricasRepo';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { MiDiaWidget } from '../widgets/MiDiaWidget';
import { Ionicons } from '@expo/vector-icons';

import { PALETTE, RADIUS, SHADOW, TYPE, pressedFeedback, tint } from '../theme/theme';
import { Eyebrow, BigNumber } from '../components/editorial';
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
            style={({pressed}) => [styles.iconBtn, pressed && pressedFeedback]}
            onPress={() => setShowNotifSheet(true)}
          >
            <Ionicons name="notifications-outline" size={22} color={PALETTE.ink} />
          </Pressable>
        </View>

        <Eyebrow text="Tu Día en Marcha" />

        {/* MAPA DEL DÍA - ASIMÉTRICO: bloques sólidos, tintes y composición abierta */}
        <View style={styles.mapGrid}>
          
          {/* Fila 1 */}
          <View style={styles.mapRow}>
            {/* Actividades — bloque sólido de identidad */}
            <Pressable 
              style={({pressed}) => [styles.nodeSolid, { backgroundColor: PALETTE.primary }, styles.nodeLarge, pressed && pressedFeedback]}
              onPress={() => navigateToTab(navigation, 'inicio', 'actividades')}
            >
              <View style={styles.nodeHeadRow}>
                <Text style={[styles.nodeLabel, { color: PALETTE.onAccent }]} numberOfLines={1}>Actividades</Text>
                <Ionicons name="calendar-outline" size={20} color={PALETTE.onAccent} />
              </View>
              <BigNumber
                value={`${actsCompletadas}/${actividadesHoy.length}`}
                tone="onColor"
                size="displaySm"
              />
              <Text style={styles.nodeSubOnColor} numberOfLines={1}>
                {proxActividad ? `Próxima: ${proxActividad.hora} ${proxActividad.titulo}` : 'Día resuelto'}
              </Text>
            </Pressable>

            {/* Alimentación — composición abierta sobre el lienzo */}
            <Pressable 
              style={({pressed}) => [styles.nodeOpen, styles.nodeSmall, pressed && pressedFeedback]}
              onPress={() => navigateToTab(navigation, 'inicio', 'comida')}
            >
              <View style={styles.nodeHeadRow}>
                <Text style={styles.nodeLabel} numberOfLines={1}>Alimentación</Text>
              </View>
              <BigNumber
                value={resumenNutricional.itemsEstimados > 0 ? formatEstimado(resumenNutricional.kcal, '') : '—'}
                unit={resumenNutricional.itemsEstimados > 0 ? 'kcal' : undefined}
                color={PALETTE.categorias.comida}
                size="displaySm"
                label="registradas hoy"
              />
              <Ionicons
                name="restaurant-outline"
                size={20}
                color={PALETTE.categorias.comida}
                style={styles.cornerIconOpen}
              />
            </Pressable>
          </View>

          {/* Fila 2 */}
          <View style={styles.mapRow}>
            {/* Constancia — bloque sólido de progreso */}
            <Pressable 
              style={({pressed}) => [styles.nodeSolid, { backgroundColor: PALETTE.categorias.habitos }, styles.nodeSmall, pressed && pressedFeedback]}
              onPress={() => navigateToTab(navigation, 'inicio', 'metricas')}
            >
              <View style={styles.nodeHeadRow}>
                <Text style={[styles.nodeLabel, { color: PALETTE.onAccent }]} numberOfLines={1}>Constancia</Text>
              </View>
              <BigNumber
                value={String(rachaDias)}
                unit={rachaDias === 1 ? 'día' : 'días'}
                tone="onColor"
                size="displaySm"
                label="en racha"
                labelTone="onColor"
              />
              <Ionicons
                name="flame-outline"
                size={20}
                color={PALETTE.onAccent}
                style={styles.cornerIconSolid}
              />
            </Pressable>

            {/* Autocontrol — tinte de área */}
            <Pressable 
              style={({pressed}) => [styles.nodeTint, { backgroundColor: tint(PALETTE.categorias.autocontrol, 0.14) }, styles.nodeLarge, pressed && pressedFeedback]}
              onPress={() => navigateToTab(navigation, 'inicio', 'metricas')}
            >
              <View style={styles.nodeHeadRow}>
                <Text style={styles.nodeLabel} numberOfLines={1}>Autocontrol</Text>
                <Ionicons name="shield-checkmark-outline" size={20} color={PALETTE.categorias.autocontrol} />
              </View>
              {totalConductasLimite > 0 ? (
                <BigNumber
                  value={`${conductasEnLimite}/${totalConductasLimite}`}
                  size="displaySm"
                  label="límites respetados"
                />
              ) : (
                <Text style={styles.nodeSubtext}>Sin límites activos</Text>
              )}
              {mejorRachaConducta > 0 ? (
                <Text style={styles.nodeSubtext}>Mejor racha activa: {mejorRachaConducta} d</Text>
              ) : totalConductasLimite > 0 ? (
                <Text style={styles.nodeSubtext}>Todo en orden</Text>
              ) : null}
            </Pressable>
          </View>

          {/* Fila 3 — composición abierta con separador */}
          <View style={styles.mapRow}>
            <Pressable 
              style={({pressed}) => [styles.nodeOpenFull, pressed && pressedFeedback]}
              onPress={() => navigation.navigate('Estado')}
            >
              <View style={styles.estadoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nodeLabel} numberOfLines={1}>Estado Físico</Text>
                  <BigNumber
                    value={ultimoEstado?.peso ? `${ultimoEstado.peso}` : '—'}
                    unit={ultimoEstado?.peso ? 'kg' : undefined}
                    size="displaySm"
                    label={ultimoEstado?.fecha_medicion ? `Último registro: ${ultimoEstado.fecha_medicion}` : 'Sin mediciones'}
                  />
                </View>
                <Ionicons name="body-outline" size={28} color={PALETTE.categorias.objetivos} />
              </View>
            </Pressable>
          </View>

          {/* Fila 4: CONTROL — bloque oscuro */}
          <View style={styles.mapRow}>
            <Pressable 
              style={({pressed}) => [
                styles.nodeSolid,
                styles.nodeFull,
                { backgroundColor: PALETTE.fondos.control },
                pressed && pressedFeedback
              ]}
              onPress={() => navigation.navigate('Control')}
            >
              <View style={styles.estadoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nodeLabel, { color: PALETTE.outline }]} numberOfLines={1}>Modo Control</Text>
                  <Text style={styles.controlTitle}>Tu Esquina</Text>
                  <Text style={[styles.nodeSubtext, { color: PALETTE.outline }]}>¿Necesitás un momento?</Text>
                </View>
                <Ionicons name="fitness-outline" size={28} color={PALETTE.onDark} />
              </View>
            </Pressable>
          </View>

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
              <View style={styles.nombreHandle} />
              <Image
                source={require('../../assets/mascota.png')}
                style={styles.nombreMascota}
                resizeMode="contain"
              />
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
    backgroundColor: PALETTE.scrim,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  nombreKav: {
    width: '100%',
  },
  nombreCard: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderTopLeftRadius: RADIUS.hero,
    borderTopRightRadius: RADIUS.hero,
    padding: 24,
    paddingBottom: 32,
    ...SHADOW.modal,
  },
  nombreHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
    backgroundColor: PALETTE.outline,
    opacity: 0.5,
  },
  nombreMascota: {
    width: 76,
    height: 76,
    alignSelf: 'center',
    marginBottom: 12,
  },
  nombreTitulo: {
    ...TYPE.title,
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  nombreDesc: {
    ...TYPE.body,
    marginBottom: 20,
    textAlign: 'center',
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
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.surfaceContainer,
  },
  mapGrid: {
    gap: 12,
    marginTop: 16,
  },
  mapRow: {
    flexDirection: 'row',
    gap: 12,
  },
  // Bloques con fill: el color hace el trabajo, sin sombra ni card blanca
  nodeSolid: {
    borderRadius: RADIUS.block,
    padding: 20,
    minHeight: 148,
    justifyContent: 'space-between',
  },
  nodeTint: {
    borderRadius: RADIUS.block,
    padding: 20,
    minHeight: 148,
    justifyContent: 'space-between',
  },
  // Composición abierta: directo sobre el lienzo + separador editorial
  nodeOpen: {
    minHeight: 148,
    paddingVertical: 8,
    paddingBottom: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.hairline,
  },
  nodeOpenFull: {
    flex: 1,
    paddingVertical: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.hairline,
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
  nodeHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nodeLabel: {
    ...TYPE.label,
    flexShrink: 1,
  },
  nodeSubtext: {
    ...TYPE.caption,
    marginTop: 4,
  },
  nodeSubOnColor: {
    ...TYPE.caption,
    color: PALETTE.onDark,
  },
  controlTitle: {
    ...TYPE.title,
    fontSize: 24,
    color: PALETTE.onDark,
    marginBottom: 4,
  },
  estadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cornerIconOpen: {
    position: 'absolute',
    right: 0,
    bottom: 16,
  },
  cornerIconSolid: {
    position: 'absolute',
    right: 12,
    bottom: 20,
  },
});