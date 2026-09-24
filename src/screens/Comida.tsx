import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useFocusEffect } from '@react-navigation/native';

import { PALETTE, RADIUS, pressedFeedback, tint } from '../theme/theme';
import { BottomNavigationBar } from '../components/ButtonNavigationBar';
import { navigateToTab, TabKey } from '../navigation/tabs';

import { 
  getRegistrosDia, 
  RegistroComida, 
  analizarRango, 
  AnalisisAlimentacion, 
  eliminarRegistroComida,
  asegurarAlimentosIniciales
} from '../repositories/comidaRepo';

import { scheduleRecordatorioComida } from '../services/notificaciones';

import FoodQualityCard from '../components/FoodQualityCard';
import MealTimeline from '../components/MealTimeline';
import AddMealSheet from '../components/AddMealSheet';

type Props = StackScreenProps<RootStackParamList, 'Comida'>;

export default function ComidaScreen({ navigation }: Props) {
  const [fecha, setFecha] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  const [registros, setRegistros] = useState<RegistroComida[]>([]);
  const [analisis, setAnalisis] = useState<AnalisisAlimentacion | null>(null);
  
  const [showAddSheet, setShowAddSheet] = useState(false);

  // Inicializar DB de alimentos una vez
  useEffect(() => {
    asegurarAlimentosIniciales().catch(console.error);
  }, []);

  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const iso = toISO(fecha);
      const reg = await getRegistrosDia(iso);
      setRegistros(reg);

      const hoyISO = toISO(new Date());
      if (iso === hoyISO) {
        scheduleRecordatorioComida(reg.length > 0).catch(console.error);
      }

      // Análisis semanal hasta hoy
      const inicio = new Date(fecha);
      inicio.setDate(inicio.getDate() - 6);
      const ana = await analizarRango(toISO(inicio), iso);
      setAnalisis(ana);

    } catch (e) {
      console.error('Error cargando comidas:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [fecha])
  );

  const handleTabSelect = (tab: TabKey) => {
    navigateToTab(navigation, 'comida', tab);
  };

  const changeDay = (delta: number) => {
    const next = new Date(fecha);
    next.setDate(next.getDate() + delta);
    setFecha(next);
  };

  const handleDelete = async (id: number) => {
    await eliminarRegistroComida(id);
    loadData();
  };

  const formatearFecha = (d: Date) => {
    const hoy = new Date();
    if (d.getDate() === hoy.getDate() && d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear()) {
      return 'Hoy';
    }
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return `${dias[d.getDay()]} ${d.getDate()}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.surface} />
      
      {/* HEADER DE FECHA */}
      <View style={styles.header}>
        <Pressable onPress={() => changeDay(-1)} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.dateText}>{formatearFecha(fecha)}</Text>
        <Pressable onPress={() => changeDay(1)} style={styles.navBtn}>
          <Text style={styles.navBtnText}>›</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {loading ? (
          <ActivityIndicator size="large" color={PALETTE.primary} style={styles.loader} />
        ) : (
          <>
            {/* ANÁLISIS */}
            {analisis && registros.length > 0 && analisis.calidadGeneral >= 0 && (
              <FoodQualityCard analisis={analisis} label="calidad semanal" />
            )}

            {/* CRONOLOGÍA */}
            <MealTimeline registros={registros} onDelete={handleDelete} />

            {registros.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🍽️</Text>
                <Text style={styles.emptyDesc}>Todavía no has registrado comidas para este día.</Text>
              </View>
            )}

            {/* BOTÓN REGISTRAR */}
            <Pressable 
              style={({pressed}) => [styles.addButton, pressed && pressedFeedback]}
              onPress={() => setShowAddSheet(true)}
            >
              <Text style={styles.addButtonText}>+ Registrar comida</Text>
            </Pressable>

            {/* RETROALIMENTACIÓN */}
            {analisis && analisis.tendencias.length > 0 && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackTitle}>RETROALIMENTACIÓN</Text>
                <View style={styles.feedbackCard}>
                  {analisis.tendencias.map((t, i) => (
                    <Text key={i} style={styles.feedbackText}>"{t}"</Text>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

      </ScrollView>

      <BottomNavigationBar activeTab="comida" onSelectTab={handleTabSelect} />

      <AddMealSheet 
        visible={showAddSheet} 
        fecha={toISO(fecha)} 
        onClose={() => setShowAddSheet(false)}
        onSave={() => {
          setShowAddSheet(false);
          loadData();
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.hairline,
    backgroundColor: PALETTE.surfaceContainerLowest,
  },
  navBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  navBtnText: {
    fontSize: 24,
    color: PALETTE.primary,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.ink,
    minWidth: 120,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 100,
  },
  loader: {
    marginTop: 40,
  },
  addButton: {
    backgroundColor: PALETTE.primary,
    borderRadius: RADIUS.buttons,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyDesc: {
    fontSize: 15,
    color: PALETTE.onSurfaceVariant,
    textAlign: 'center',
  },
  feedbackSection: {
    marginTop: 8,
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  feedbackCard: {
    backgroundColor: tint(PALETTE.categorias.objetivos, 0.08),
    padding: 16,
    borderRadius: RADIUS.cards,
  },
  feedbackText: {
    fontSize: 15,
    color: PALETTE.ink,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 8,
  }
});
