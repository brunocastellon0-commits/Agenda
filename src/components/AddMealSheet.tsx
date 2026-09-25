import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { buscarAlimentos, registrarComida, TipoComida, Alimento } from '../repositories/comidaRepo';
import { UnidadMedida, calcularNutricion, sumarNutricion, formatEstimado } from '../utils/nutricion';

interface Props {
  visible: boolean;
  fecha: string;
  onClose: () => void;
  onSave: () => void;
}

const TIPOS: { id: TipoComida; label: string }[] = [
  { id: 'desayuno', label: 'Desayuno' },
  { id: 'almuerzo', label: 'Almuerzo' },
  { id: 'merienda', label: 'Merienda' },
  { id: 'cena', label: 'Cena' },
  { id: 'otro', label: 'Snack' },
];

interface Seleccion {
  alimento: Alimento;
  cantidad: number;
  unidad: UnidadMedida;
}

export default function AddMealSheet({ visible, fecha, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [hora, setHora] = useState('');
  const [tipo, setTipo] = useState<TipoComida>('almuerzo');
  
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<Alimento[]>([]);
  const [seleccionados, setSeleccionados] = useState<Seleccion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (visible) {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setHora(`${h}:${m}`);
      
      let t: TipoComida = 'otro';
      const hr = now.getHours();
      if (hr >= 6 && hr < 11) t = 'desayuno';
      else if (hr >= 11 && hr < 16) t = 'almuerzo';
      else if (hr >= 16 && hr < 19) t = 'merienda';
      else if (hr >= 19 && hr <= 23) t = 'cena';
      setTipo(t);

      setSeleccionados([]);
      setQuery('');
      setIsSearching(false);
      buscar('');
    }
  }, [visible]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.trim().length > 0) {
        setIsSearching(true);
        buscar(query);
      } else {
        buscar('');
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  const buscar = async (q: string) => {
    setLoading(true);
    try {
      const r = await buscarAlimentos(q);
      setResultados(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addAlimento = (al: Alimento) => {
    const exists = seleccionados.find(s => s.alimento.id === al.id);
    if (!exists) {
      setSeleccionados(prev => [...prev, { alimento: al, cantidad: 1, unidad: al.unidad_base }]);
    }
    setQuery('');
    setIsSearching(false);
  };

  const removeAlimento = (alId: number) => {
    setSeleccionados(prev => prev.filter(s => s.alimento.id !== alId));
  };

  const updateCantidad = (alId: number, cantStr: string) => {
    const cant = parseFloat(cantStr.replace(',', '.'));
    setSeleccionados(prev => prev.map(s => 
      s.alimento.id === alId ? { ...s, cantidad: isNaN(cant) ? 0 : cant } : s
    ));
  };

  const nutricionTotal = useMemo(() => {
    const macros = seleccionados.map(s => calcularNutricion(s.cantidad, s.unidad, {
      kcal: s.alimento.kcal_100,
      prot: s.alimento.prot_100,
      carb: s.alimento.carb_100,
      grasa: s.alimento.grasa_100,
      fibra: s.alimento.fibra_100
    }));
    return sumarNutricion(macros);
  }, [seleccionados]);

  const handleSave = async () => {
    if (seleccionados.length === 0) return;
    
    let horaGuardar = hora;
    if (!/^\\d{2}:\\d{2}$/.test(horaGuardar)) {
      horaGuardar = '12:00';
    }

    try {
      await registrarComida({
        fecha,
        hora: horaGuardar,
        tipo,
        items: seleccionados.map(s => {
          const macros = calcularNutricion(s.cantidad, s.unidad, {
            kcal: s.alimento.kcal_100,
            prot: s.alimento.prot_100,
            carb: s.alimento.carb_100,
            grasa: s.alimento.grasa_100
          });
          return {
            alimento_id: s.alimento.id!,
            cantidad: s.cantidad,
            unidad: s.unidad,
            kcal_est: macros.kcal,
            prot_est: macros.prot,
            carb_est: macros.carb,
            grasa_est: macros.grasa
          };
        })
      });
      onSave();
    } catch (e) {
      console.error(e);
    }
  };

  if (!visible) return null;

  const valid = seleccionados.length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={[styles.sheet, { paddingBottom: insets.bottom || 24 }]}
        >
          <View style={styles.handle} />
          
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* INTRODUCCIÓN */}
            <View style={styles.header}>
              <Text style={styles.title}>Registrar Comida</Text>
              <View style={styles.horaContainer}>
                <TextInput 
                  style={styles.horaInput}
                  value={hora}
                  onChangeText={setHora}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>

            {/* MOMENTO DEL DÍA */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MOMENTO DEL DÍA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {TIPOS.map(t => {
                  const isActive = tipo === t.id;
                  return (
                    <Pressable 
                      key={t.id} 
                      onPress={() => setTipo(t.id)} 
                      style={[styles.chip, isActive && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{t.label}</Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </View>

            {/* BUSCADOR */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ALIMENTOS</Text>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={PALETTE.onSurfaceVariant} style={styles.searchIcon} />
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Buscar alimento (ej. Pollo, Arroz)..."
                  placeholderTextColor={PALETTE.onSurfaceVariant}
                  value={query}
                  onChangeText={setQuery}
                  onFocus={() => setIsSearching(true)}
                />
                {query.length > 0 && (
                  <Pressable onPress={() => { setQuery(''); setIsSearching(false); }} style={{ padding: 4 }}>
                    <Ionicons name="close-circle" size={20} color={PALETTE.onSurfaceVariant} />
                  </Pressable>
                )}
              </View>

              {isSearching && (
                <View style={styles.searchResults}>
                  {loading ? (
                    <ActivityIndicator color={PALETTE.primary} style={{ margin: 20 }} />
                  ) : resultados.length > 0 ? (
                    resultados.map(al => (
                      <Pressable 
                        key={al.id} 
                        style={({pressed}) => [styles.resultItem, pressed && pressedFeedback]}
                        onPress={() => addAlimento(al)}
                      >
                        <View>
                          <Text style={styles.resultName}>{al.nombre}</Text>
                          <Text style={styles.resultDetails}>{al.categoria} · {formatEstimado(al.kcal_100, ' kcal')} por 100{al.unidad_base}</Text>
                        </View>
                        <Ionicons name="add-circle-outline" size={24} color={PALETTE.primary} />
                      </Pressable>
                    ))
                  ) : (
                    <Text style={styles.noResultsText}>No se encontraron alimentos</Text>
                  )}
                </View>
              )}
            </View>

            {/* REGISTRADOS */}
            {seleccionados.length > 0 && !isSearching && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>REGISTRADOS</Text>
                <View style={styles.registradosList}>
                  {seleccionados.map(s => {
                    const itemMacros = calcularNutricion(s.cantidad, s.unidad, {
                      kcal: s.alimento.kcal_100,
                      prot: s.alimento.prot_100,
                      carb: s.alimento.carb_100,
                      grasa: s.alimento.grasa_100
                    });

                    return (
                      <View key={s.alimento.id} style={styles.registradoItem}>
                        <View style={styles.registradoHeader}>
                          <Text style={styles.registradoName}>{s.alimento.nombre}</Text>
                          <Pressable onPress={() => removeAlimento(s.alimento.id!)} style={{ padding: 4 }}>
                            <Ionicons name="trash-outline" size={20} color={PALETTE.onSurfaceVariant} />
                          </Pressable>
                        </View>
                        
                        <View style={styles.registradoConfig}>
                          <View style={styles.cantidadControl}>
                            <TextInput 
                              style={styles.cantidadInput}
                              keyboardType="numeric"
                              value={s.cantidad.toString()}
                              onChangeText={(t) => updateCantidad(s.alimento.id!, t)}
                            />
                            <Text style={styles.unidadText}>{s.unidad}</Text>
                          </View>
                          
                          <View style={styles.registradoMacros}>
                            <Text style={styles.itemKcal}>{formatEstimado(itemMacros.kcal, ' kcal')}</Text>
                            <Text style={styles.itemDetalleMacros}>
                              P {formatEstimado(itemMacros.prot, 'g')} · C {formatEstimado(itemMacros.carb, 'g')} · G {formatEstimado(itemMacros.grasa, 'g')}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ESTIMACIÓN TOTAL */}
            {seleccionados.length > 0 && !isSearching && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>ESTIMACIÓN TOTAL</Text>
                <View style={styles.totalCard}>
                  <Text style={styles.totalKcal}>{formatEstimado(nutricionTotal.kcal, ' kcal')}</Text>
                  <View style={styles.totalMacrosRow}>
                    <Text style={styles.totalMacroItem}>P {formatEstimado(nutricionTotal.prot, 'g')}</Text>
                    <Text style={styles.macroDivider}>·</Text>
                    <Text style={styles.totalMacroItem}>C {formatEstimado(nutricionTotal.carb, 'g')}</Text>
                    <Text style={styles.macroDivider}>·</Text>
                    <Text style={styles.totalMacroItem}>G {formatEstimado(nutricionTotal.grasa, 'g')}</Text>
                  </View>
                </View>
              </View>
            )}

          </ScrollView>

          {/* GUARDAR */}
          <View style={styles.footer}>
            <Pressable style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable 
              style={({pressed}) => [styles.btnSave, !valid && styles.btnDisabled, pressed && valid && pressedFeedback]} 
              onPress={handleSave} 
              disabled={!valid}
            >
              <Text style={styles.btnSaveText}>Registrar comida</Text>
            </Pressable>
          </View>

        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(19,26,24,0.4)', 
    justifyContent: 'flex-end' 
  },
  backdrop: { 
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 
  },
  sheet: { 
    backgroundColor: PALETTE.surface, 
    borderTopLeftRadius: RADIUS.hero, 
    borderTopRightRadius: RADIUS.hero, 
    ...SHADOW.modal, 
    maxHeight: '92%' 
  },
  handle: { 
    width: 40, height: 4, 
    backgroundColor: PALETTE.outline, 
    borderRadius: 2, 
    alignSelf: 'center', 
    marginTop: 12, 
    marginBottom: 8, 
    opacity: 0.5 
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: PALETTE.ink 
  },
  horaContainer: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: RADIUS.interior,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...SHADOW.card,
    elevation: 1,
  },
  horaInput: {
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 12,
  },
  chipsRow: { 
    gap: 12,
  },
  chip: { 
    backgroundColor: PALETTE.surfaceContainerLowest, 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.hairline,
  },
  chipActive: { 
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  chipText: { 
    fontSize: 14, 
    color: PALETTE.onSurfaceVariant, 
    fontWeight: '500' 
  },
  chipTextActive: { 
    color: '#FFF', 
    fontWeight: '600' 
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: RADIUS.buttons,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: PALETTE.hairline,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: PALETTE.ink,
  },
  searchResults: {
    marginTop: 8,
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: RADIUS.cards,
    borderWidth: 1,
    borderColor: PALETTE.hairline,
    maxHeight: 250,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.hairline,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
    color: PALETTE.ink,
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 13,
    color: PALETTE.onSurfaceVariant,
  },
  noResultsText: {
    padding: 20,
    textAlign: 'center',
    color: PALETTE.onSurfaceVariant,
  },
  registradosList: {
    gap: 12,
  },
  registradoItem: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderRadius: RADIUS.cards,
    padding: 16,
    ...SHADOW.card,
    elevation: 2,
  },
  registradoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  registradoName: {
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  registradoConfig: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cantidadControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: RADIUS.interior,
    padding: 4,
  },
  cantidadInput: {
    width: 60,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: PALETTE.ink,
  },
  unidadText: {
    paddingHorizontal: 8,
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
    fontWeight: '500',
  },
  registradoMacros: {
    alignItems: 'flex-end',
  },
  itemKcal: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  itemDetalleMacros: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    marginTop: 2,
  },
  totalCard: {
    backgroundColor: tint(PALETTE.categorias.finanzas, 0.08),
    borderRadius: RADIUS.cards,
    padding: 20,
    alignItems: 'center',
  },
  totalKcal: {
    fontSize: 32,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 8,
  },
  totalMacrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalMacroItem: {
    fontSize: 15,
    fontWeight: '500',
    color: PALETTE.onSurfaceVariant,
  },
  macroDivider: {
    marginHorizontal: 8,
    color: PALETTE.outline,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: PALETTE.surface,
    borderTopWidth: 1,
    borderTopColor: PALETTE.hairline,
  },
  btnCancel: { 
    flex: 1, 
    paddingVertical: 16, 
    alignItems: 'center',
    marginRight: 12,
  },
  btnCancelText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: PALETTE.onSurfaceVariant 
  },
  btnSave: { 
    flex: 2, 
    paddingVertical: 16, 
    backgroundColor: PALETTE.primary, 
    borderRadius: RADIUS.buttons, 
    alignItems: 'center' 
  },
  btnSaveText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#FFF' 
  },
  btnDisabled: { 
    opacity: 0.5 
  }
});
