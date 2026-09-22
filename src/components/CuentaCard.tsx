import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { signoDivisa, formatMonto } from '../utils/divisas';

export interface CuentaCardData {
  id: string;
  nombre: string;
  entidad: string;
  divisa: string;
  monto: number;
  colorInicio: string;
  colorFin: string;
}

interface Props {
  data: CuentaCardData;
}

export function CuentaCard({ data }: Props) {
  const signo = signoDivisa(data.divisa);

  return (
    <LinearGradient
      colors={[data.colorInicio, data.colorFin]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.chipGroup}>
          <MaterialIcons name="contactless" size={22} color="#FFFFFF" />
          <View style={styles.simChip} />
        </View>
        <Text style={styles.tipoText} numberOfLines={1}>
          {data.entidad.toUpperCase()}
        </Text>
      </View>

      <View style={styles.middleRow}>
        <Text style={styles.accountName} numberOfLines={1}>
          {data.nombre}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.saldoBlock}>
          <Text style={styles.saldoLabel}>SALDO DISPONIBLE</Text>
          <Text style={styles.saldoAmount} numberOfLines={1}>
            {signo}
            {formatMonto(data.monto)}
          </Text>
        </View>
        <Text style={styles.divisa}>{data.divisa}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 190,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simChip: {
    width: 30,
    height: 22,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    opacity: 0.8,
  },
  tipoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    opacity: 0.85,
    flexShrink: 1,
  },
  middleRow: {
    marginVertical: 4,
  },
  accountName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  saldoBlock: {
    flex: 1,
  },
  saldoLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    opacity: 0.75,
    letterSpacing: 0.5,
  },
  saldoAmount: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  divisa: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.9,
  },
});