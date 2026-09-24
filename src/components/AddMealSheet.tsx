import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PALETTE, RADIUS, SHADOW, pressedFeedback, tint } from '../theme/theme';
import { buscarAlimentos, registrarComida, TipoComida, Alimento } from '../repositories/comidaRepo';

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
  { id: 'otro', label: 'Otro' },
];

export default function AddMealSheet({ visible, fecha, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [hora, setHora] = useState('');
  const [tipo, setTipo] = useState<TipoComida>('almuerzo');
  const [nota, setNota] = useState('');
  
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<Alimento[]>([]);
  const [seleccionados, setSeleccionados] = useState<Alimento[]>([]);
  const [loading, setLoading] = useState(false);

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
      setNota('');
      buscar('');
    }
  }, [visible]);

  useEffect(() => {
    const delay = setTimeout(() => {
      buscar(query);
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

  const toggleAlimento = (al: Alimento) => {
    const exists = seleccionados.find(s => s.id === al.id);
    if (exists) {
      setSeleccionados(prev => prev.filter(s => s.id !== al.id));
    } else {
      setSeleccionados(prev => [...prev, al]);
    }
  };

  const handleSave = async () => {
    if (seleccionados.length === 0) return;
    
    // Validar hora sencilla (formato HH:MM)
    let horaGuardar = hora;
    if (!/^\d{2}:\d{2}$/.test(horaGuardar)) {
      horaGuardar = '12:00';
    }

    try {
      await registrarComida({
        fecha,
        hora: horaGuardar,
        tipo,
        nota,
        alimentoIds: seleccionados.map(s => s.id!)
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
        <View style={[styles.sheet, { paddingBottom: insets.bottom || 24, paddingTop: 16 }]}>
          <View style={styles.handle} />
          
          <Text style={styles.title}>Registrar Comida</Text>

          {/* HORA Y TIPO */}
          <View style={styles.rowTop}>
            <View style={styles.inputBox}>
              <Text style={styles.label}>Hora (HH:MM)</Text>
              <TextInput 
                style={styles.input}
                value={hora}
                onChangeText={setHora}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>

          <View style={styles.chipsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8}}>
              {TIPOS.map(t => {
                const isActive = tipo === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setTipo(t.id)}
                    style={[
                      styles.chip,
                      isActive ? styles.chipActive : {}
                    ]}
                  >
                    <Text style={[styles.chipText, isActive ? styles.chipTextActive : {}]}>
                      {t.label}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>

          {/* BUSCADOR */}
          <Text style={styles.label}>¿Qué comiste?</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Buscar alimentos..."
            value={query}
            onChangeText={setQuery}
          />

          {/* LISTA RESULTADOS */}
          <View style={styles.listContainer}>
            {loading ? (
              <ActivityIndicator color={PALETTE.primary} style={{marginTop: 20}} />
            ) : (
              <ScrollView>
                <View style={styles.alimentosGrid}>
                  {resultados.map(al => {
                    const isSelected = seleccionados.some(s => s.id === al.id);
                    return (
                      <Pressable 
                        key={al.id}
                        onPress={() => toggleAlimento(al)}
                        style={[
                          styles.alimentoItem,
                          isSelected && styles.alimentoItemActive
                        ]}
                      >
                        <Text style={[
                          styles.alimentoText,
                          isSelected && styles.alimentoTextActive
                        ]}>
                          {al.nombre}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>

          {/* SELECCIONADOS */}
          {seleccionados.length > 0 && (
            <View style={styles.seleccionadosContainer}>
              <Text style={styles.label}>Seleccionados:</Text>
              <Text style={styles.seleccionadosText}>
                {seleccionados.map(s => s.nombre).join(' + ')}
              </Text>
            </View>
          )}

          {/* BOTONES */}
          <View style={styles.actions}>
            <Pressable style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable 
              style={[styles.btnSave, !valid && styles.btnDisabled]} 
              onPress={handleSave}
              disabled={!valid}
            >
              <Text style={styles.btnSaveText}>Registrar</Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19,26,24,0.4)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  sheet: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderTopLeftRadius: RADIUS.hero,
    borderTopRightRadius: RADIUS.hero,
    paddingHorizontal: 24,
    ...SHADOW.modal,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: PALETTE.outline,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 16,
  },
  rowTop: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputBox: {
    width: 100,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
    marginBottom: 6,
  },
  input: {
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: RADIUS.interior,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: PALETTE.ink,
  },
  chipsRow: {
    marginBottom: 20,
  },
  chip: {
    backgroundColor: PALETTE.surfaceContainer,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: tint(PALETTE.primary, 0.12),
  },
  chipText: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
    fontWeight: '500',
  },
  chipTextActive: {
    color: PALETTE.primary,
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: RADIUS.interior,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: PALETTE.ink,
    marginBottom: 12,
  },
  listContainer: {
    height: 180,
    backgroundColor: PALETTE.surface,
    borderRadius: RADIUS.interior,
    padding: 12,
    marginBottom: 16,
  },
  alimentosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  alimentoItem: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: PALETTE.hairline,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  alimentoItemActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  alimentoText: {
    fontSize: 14,
    color: PALETTE.ink,
  },
  alimentoTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  seleccionadosContainer: {
    backgroundColor: tint(PALETTE.categorias.finanzas, 0.05),
    padding: 12,
    borderRadius: RADIUS.interior,
    marginBottom: 20,
  },
  seleccionadosText: {
    fontSize: 15,
    fontWeight: '500',
    color: PALETTE.ink,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: RADIUS.buttons,
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  btnSave: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: PALETTE.primary,
    borderRadius: RADIUS.buttons,
    alignItems: 'center',
  },
  btnSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  btnDisabled: {
    opacity: 0.5,
  }
});
