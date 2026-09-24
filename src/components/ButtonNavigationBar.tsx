import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PALETTE, pressedFeedback } from '../theme/theme';
import { TabKey } from '../navigation/tabs';

export type { TabKey };

interface Props {
  activeTab: TabKey;
  onSelectTab?: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'billetera', label: 'Billetera', icon: 'account-balance-wallet' },
  { key: 'inicio', label: 'Inicio', icon: 'home' },
  { key: 'actividades', label: 'Actividades', icon: 'checklist' },
  { key: 'metricas', label: 'Métricas', icon: 'bar-chart' },
  { key: 'comida', label: 'Comida', icon: 'restaurant' },
];

export function BottomNavigationBar({ activeTab, onSelectTab }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 10 },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [styles.tab, pressed && pressedFeedback]}
            onPress={() => onSelectTab?.(tab.key)}
          >
            <MaterialIcons
              name={tab.icon}
              size={24}
              color={isActive ? PALETTE.primary : PALETTE.outline}
            />
            <Text style={[styles.tabLabel, isActive && styles.activeLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: PALETTE.surfaceContainerLowest,
    paddingTop: 10,
    paddingBottom: 10,
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tab: {
    alignItems: 'center',
    gap: 3,
    flex: 1,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tabLabel: {
    fontSize: 10,
    color: PALETTE.onSurfaceVariant,
    fontWeight: '600',
  },
  activeLabel: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});