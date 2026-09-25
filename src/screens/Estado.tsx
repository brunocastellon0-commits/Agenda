import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Polyline, Circle } from 'react-native-svg';

import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { getHistorial, getUltimoRegistro, RegistroFisico, calcularIMC } from '../repositories/estadoFisicoRepo';
import AddMedicionSheet from '../components/AddMedicionSheet';
import { getUsuarios, Usuario } from '../repositories/usuario';

type Props = StackScreenProps<RootStackParamList, 'Estado'>;

export default function EstadoScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState<RegistroFisico[]>([]);
  const [ultimo, setUltimo] = useState<RegistroFisico | null>(null);
  const [anterior, setAnterior] = useState<RegistroFisico | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const usuarios = await getUsuarios();
      const currUser = usuarios.length > 0 ? usuarios[0] : null;
      setUsuario(currUser);

      if (currUser?.ci) {
        const histo = await getHistorial(currUser.ci, 30);
        setHistorial(histo);
        if (histo.length > 0) {
          setUltimo(histo[0]);
          if (histo.length > 1) {
            setAnterior(histo[1]);
          } else {
            setAnterior(null);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando estado físico:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ Volver</Text>
          </Pressable>
        </View>
        <ActivityIndicator size="large" color={PALETTE.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const formatDelta = (actual?: number, previo?: number) => {
    if (actual == null || previo == null) return null;
    const diff = actual - previo;
    if (diff === 0) return 'Sin cambios';
    return diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;
  };

  const imc = ultimo?.peso && ultimo?.altura ? calcularIMC(ultimo.peso, ultimo.altura) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Mi Estado</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* MI ESTADO ACTUAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTUALIDAD</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Peso</Text>
                <Text style={styles.metricValue}>{ultimo?.peso ? `${ultimo.peso} kg` : '—'}</Text>
                {anterior?.peso && ultimo?.peso && (
                  <Text style={styles.metricDelta}>{formatDelta(ultimo.peso, anterior.peso)}</Text>
                )}
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Cintura</Text>
                <Text style={styles.metricValue}>{ultimo?.cintura ? `${ultimo.cintura} cm` : '—'}</Text>
                {anterior?.cintura && ultimo?.cintura && (
                  <Text style={styles.metricDelta}>{formatDelta(ultimo.cintura, anterior.cintura)}</Text>
                )}
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Altura</Text>
                <Text style={styles.metricValue}>{ultimo?.altura ? `${ultimo.altura} cm` : '—'}</Text>
              </View>
            </View>
            <View style={[styles.row, { marginTop: 16 }]}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Cuello</Text>
                <Text style={styles.metricValue}>{ultimo?.cuello ? `${ultimo.cuello} cm` : '—'}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>IMC</Text>
                <Text style={styles.metricValue}>{imc ? imc.toFixed(1) : '—'}</Text>
              </View>
            </View>
            <Text style={styles.dateText}>
              Último registro: {ultimo ? ultimo.fecha_medicion : 'Nunca'}
            </Text>
          </View>
        </View>

        {/* EVOLUCIÓN GRÁFICA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EVOLUCIÓN (PESO)</Text>
          <View style={styles.card}>
            {historial.filter(h => h.peso != null).length < 2 ? (
              <Text style={styles.emptyText}>Historial insuficiente para mostrar evolución. Registra al menos 2 mediciones.</Text>
            ) : (
              <SimpleLineChart 
                data={[...historial].reverse().filter(h => h.peso != null).map(h => h.peso!)} 
              />
            )}
          </View>
        </View>

        {/* HISTORIAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HISTORIAL RECIENTE</Text>
          <View style={styles.card}>
            {historial.length === 0 ? (
              <Text style={styles.emptyText}>No hay mediciones registradas.</Text>
            ) : (
              historial.slice(0, 5).map((h, i) => (
                <View key={h.id || i} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{h.fecha_medicion}</Text>
                  <Text style={styles.historyValues}>
                    {h.peso ? `${h.peso}kg` : ''}
                    {h.peso && h.cintura ? ' · ' : ''}
                    {h.cintura ? `${h.cintura}cm` : ''}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>

      <View style={styles.floatingAction}>
        <Pressable 
          style={({pressed}) => [styles.addBtn, pressed && pressedFeedback]}
          onPress={() => setShowAdd(true)}
        >
          <Text style={styles.addBtnText}>+ Nueva Medición</Text>
        </Pressable>
      </View>

      {usuario?.ci && (
        <AddMedicionSheet 
          visible={showAdd}
          ultimoRegistro={ultimo}
          ciUsuario={usuario.ci}
          onClose={() => setShowAdd(false)}
          onSave={() => {
            setShowAdd(false);
            loadData();
          }}
        />
      )}
    </SafeAreaView>
  );
}

// COMPONENTE DE GRÁFICO SIMPLE
function SimpleLineChart({ data }: { data: number[] }) {
  const width = 280;
  const height = 120;
  const padding = 20;

  const min = Math.min(...data) - 1;
  const max = Math.max(...data) + 1;
  const range = max - min;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={{ alignItems: 'center', marginTop: 8 }}>
      <Svg width={width} height={height}>
        <Polyline points={points} fill="none" stroke={PALETTE.primary} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((val, i) => {
          const x = padding + (i / (data.length - 1)) * (width - padding * 2);
          const y = height - padding - ((val - min) / range) * (height - padding * 2);
          return <Circle key={i} cx={x} cy={y} r="4" fill={PALETTE.surfaceContainerLowest} stroke={PALETTE.primary} strokeWidth="2" />;
        })}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: width - padding * 2, marginTop: 8 }}>
        <Text style={{ fontSize: 10, color: PALETTE.onSurfaceVariant }}>{data[0]} kg</Text>
        <Text style={{ fontSize: 10, color: PALETTE.onSurfaceVariant }}>{data[data.length-1]} kg</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PALETTE.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderBottomWidth: 1, borderBottomColor: PALETTE.hairline
  },
  backBtn: { padding: 8 },
  backBtnText: { fontSize: 24, color: PALETTE.primary, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: PALETTE.ink },
  scrollContainer: { padding: 16, paddingBottom: 100 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: PALETTE.onSurfaceVariant, letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  card: { backgroundColor: PALETTE.surfaceContainerLowest, borderRadius: RADIUS.cards, padding: 16, ...SHADOW.card },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  metricBox: { flex: 1 },
  metricLabel: { fontSize: 12, color: PALETTE.onSurfaceVariant, marginBottom: 4 },
  metricValue: { fontSize: 20, fontWeight: '700', color: PALETTE.ink },
  metricDelta: { fontSize: 12, color: PALETTE.primary, marginTop: 4, fontWeight: '600' },
  dateText: { fontSize: 12, color: PALETTE.onSurfaceVariant, marginTop: 16, fontStyle: 'italic', textAlign: 'center' },
  emptyText: { fontSize: 14, color: PALETTE.onSurfaceVariant, textAlign: 'center', paddingVertical: 16 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PALETTE.hairline },
  historyDate: { fontSize: 14, color: PALETTE.ink, fontWeight: '500' },
  historyValues: { fontSize: 14, color: PALETTE.onSurfaceVariant },
  floatingAction: { position: 'absolute', bottom: 24, left: 16, right: 16 },
  addBtn: { backgroundColor: PALETTE.primary, borderRadius: RADIUS.buttons, paddingVertical: 16, alignItems: 'center', ...SHADOW.card },
  addBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' }
});
