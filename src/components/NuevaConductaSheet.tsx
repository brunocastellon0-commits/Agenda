import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, RADIUS, SHADOW, pressedFeedback } from '../theme/theme';
import { crearConducta, NuevaConducta } from '../repositories/conductaRepo';
import { validarTexto, validarNumero, parseNumero } from '../utils/validacion';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type Modalidad = NuevaConducta['modalidad'];
type Frecuencia = NonNullable<NuevaConducta['frecuencia']>;

const CATEGORIAS: { id: string; label: string }[] = [
  { id: 'autocontrol', label: 'Autocontrol' },
  { id: 'comida', label: 'Alimentación' },
  { id: 'habitos', label: 'Hábitos' },
  { id: 'trabajo', label: 'Trabajo' },
  { id: 'ocio', label: 'Ocio' },
  { id: 'eventos', label: 'Eventos' },
];

const MODALIDADES: { id: Modalidad; label: string; hint: string }[] = [
  { id: 'evitacion_total', label: 'Evitación total', hint: 'Cero ocurrencias: la racha cuenta días sin que ocurra.' },
  { id: 'limite', label: 'Límite periódico', hint: 'Máximo de veces por día, semana o mes.' },
];

const FRECUENCIAS: { id: Frecuencia; label: string }[] = [
  { id: 'diario', label: 'Diario' },
  { id: 'semanal', label: 'Semanal' },
  { id: 'mensual', label: 'Mensual' },
];

const UNIDADES: { id: string; label: string }[] = [
  { id: 'comidas', label: 'comidas' },
  { id: 'minutos', label: 'minutos' },
  { id: 'días', label: 'días' },
  { id: 'veces', label: 'veces' },
];

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && pressedFeedback]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function NuevaConductaSheet({ visible, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0].id);
  const [modalidad, setModalidad] = useState<Modalidad>('evitacion_total');
  const [frecuencia, setFrecuencia] = useState<Frecuencia>('diario');
  const [objetivo, setObjetivo] = useState('');
  const [unidad, setUnidad] = useState<string>(UNIDADES[0].id);

  const [errores, setErrores] = useState<{ nombre: string | null; objetivo: string | null }>({
    nombre: null,
    objetivo: null,
  });
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (visible) {
      setNombre('');
      setCategoria(CATEGORIAS[0].id);
      setModalidad('evitacion_total');
      setFrecuencia('diario');
      setObjetivo('');
      setUnidad(UNIDADES[0].id);
      setErrores({ nombre: null, objetivo: null });
      setErrorGeneral(null);
      setGuardando(false);
    }
  }, [visible]);

  const esLimite = modalidad === 'limite';

  const handleCrear = async () => {
    if (guardando) return;

    // Se valida en cada pulsación: el botón nunca queda muerto.
    const errNombre = validarTexto(nombre, 2, 60, 'Nombre');
    const errObjetivo = esLimite ? validarNumero(objetivo, 1, 9999, unidad) : null;
    setErrores({ nombre: errNombre, objetivo: errObjetivo });
    if (errNombre || errObjetivo) return;

    setGuardando(true);
    setErrorGeneral(null);
    try {
      await crearConducta({
        nombre,
        categoria,
        modalidad,
        ...(esLimite
          ? { frecuencia, objetivo: parseNumero(objetivo), unidad }
          : {}),
      });
      onSaved();
      onClose();
    } catch (e) {
      console.error('Error al crear la conducta:', e);
      setErrorGeneral('No se pudo crear la conducta. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, { paddingBottom: Math.max(24, insets.bottom + 12) }]}
        >
          <View style={styles.handle} />

          <ScrollView
            style={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.title}>Crear conducta</Text>
            <Text style={styles.subtitle}>¿Qué querés dejar de hacer o limitar?</Text>

            {/* NOMBRE */}
            <View style={styles.field}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={[styles.input, errores.nombre !== null && styles.inputError]}
                value={nombre}
                onChangeText={(t) => {
                  setNombre(t);
                  setErrores((prev) => ({ ...prev, nombre: null }));
                }}
                placeholder="Ej: No fumar, Azúcar, Redes sociales"
                placeholderTextColor={PALETTE.outline}
                maxLength={60}
                editable={!guardando}
              />
              {errores.nombre !== null && <Text style={styles.errorText}>{errores.nombre}</Text>}
            </View>

            {/* CATEGORÍA */}
            <View style={styles.field}>
              <Text style={styles.label}>Categoría</Text>
              <View style={styles.chipsRow}>
                {CATEGORIAS.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.label}
                    active={categoria === c.id}
                    onPress={() => !guardando && setCategoria(c.id)}
                  />
                ))}
              </View>
            </View>

            {/* MODALIDAD */}
            <View style={styles.field}>
              <Text style={styles.label}>Modalidad</Text>
              <View style={styles.chipsRow}>
                {MODALIDADES.map((m) => (
                  <Chip
                    key={m.id}
                    label={m.label}
                    active={modalidad === m.id}
                    onPress={() => !guardando && setModalidad(m.id)}
                  />
                ))}
              </View>
              <Text style={styles.hint}>
                {MODALIDADES.find((m) => m.id === modalidad)?.hint}
              </Text>
            </View>

            {/* LÍMITE: frecuencia + objetivo + unidad */}
            {esLimite && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Frecuencia</Text>
                  <View style={styles.chipsRow}>
                    {FRECUENCIAS.map((f) => (
                      <Chip
                        key={f.id}
                        label={f.label}
                        active={frecuencia === f.id}
                        onPress={() => !guardando && setFrecuencia(f.id)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Límite máximo</Text>
                  <View style={styles.inlineRow}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.objetivoInput,
                        errores.objetivo !== null && styles.inputError,
                      ]}
                      value={objetivo}
                      onChangeText={(t) => {
                        setObjetivo(t);
                        setErrores((prev) => ({ ...prev, objetivo: null }));
                      }}
                      keyboardType="numeric"
                      placeholder="Ej: 2"
                      placeholderTextColor={PALETTE.outline}
                      editable={!guardando}
                    />
                    <Text style={styles.inlineSuffix}>{unidad}</Text>
                  </View>
                  {errores.objetivo !== null && (
                    <Text style={styles.errorText}>{errores.objetivo}</Text>
                  )}
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Unidad</Text>
                  <View style={styles.chipsRow}>
                    {UNIDADES.map((u) => (
                      <Chip
                        key={u.id}
                        label={u.label}
                        active={unidad === u.id}
                        onPress={() => !guardando && setUnidad(u.id)}
                      />
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {errorGeneral !== null && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={PALETTE.categorias.critico} />
              <Text style={styles.errorBoxText}>{errorGeneral}</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [styles.btnCancel, pressed && pressedFeedback]}
              onPress={onClose}
            >
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btnCreate, pressed && pressedFeedback]}
              onPress={handleCrear}
            >
              {guardando ? (
                <ActivityIndicator color={PALETTE.onAccent} />
              ) : (
                <Text style={styles.btnCreateText}>Crear conducta</Text>
              )}
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
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: PALETTE.surfaceContainerLowest,
    borderTopLeftRadius: RADIUS.hero,
    borderTopRightRadius: RADIUS.hero,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '90%',
    ...SHADOW.modal,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
    backgroundColor: PALETTE.outline,
    opacity: 0.5,
  },
  // flexShrink: el cuerpo absorbe el desbordo del maxHeight y hace scroll,
  // el footer queda anclado abajo.
  body: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  subtitle: {
    fontSize: 14,
    color: PALETTE.onSurfaceVariant,
    marginTop: 4,
    marginBottom: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.ink,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: PALETTE.onSurfaceVariant,
    marginTop: 8,
    lineHeight: 17,
  },
  input: {
    backgroundColor: PALETTE.surfaceContainer,
    borderRadius: RADIUS.interior,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: PALETTE.ink,
  },
  inputError: {
    borderWidth: 1,
    borderColor: PALETTE.categorias.critico,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  objetivoInput: {
    flex: 1,
  },
  inlineSuffix: {
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.onSurfaceVariant,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: PALETTE.surfaceContainer,
    borderWidth: 1,
    borderColor: PALETTE.hairline,
  },
  chipActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.ink,
  },
  chipTextActive: {
    color: PALETTE.onAccent,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: PALETTE.categorias.critico,
    marginTop: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    flexShrink: 0,
  },
  errorBoxText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.categorias.critico,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    flexShrink: 0,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: PALETTE.surfaceContainer,
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  btnCreate: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: PALETTE.primary,
  },
  btnCreateText: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.onAccent,
  },
});
