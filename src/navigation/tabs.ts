import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, TabAnimParams } from './types';

export const TAB_ORDER = ['actividades', 'metricas', 'inicio', 'comida', 'billetera'] as const;
export type TabKey = (typeof TAB_ORDER)[number];

type ScreenNavegable = Exclude<keyof RootStackParamList, 'Home'>;

const TAB_TO_SCREEN: Partial<Record<TabKey, ScreenNavegable>> = {
  billetera: 'Billetera',
  actividades: 'Actividades',
  metricas: 'Metricas',
  comida: 'Comida',
};

export function tabIndex(tab: TabKey): number {
  return TAB_ORDER.indexOf(tab);
}

export function tabDistancia(a: TabKey, b: TabKey): number {
  return Math.abs(tabIndex(a) - tabIndex(b));
}

export function animParaTab(desde: TabKey, hacia: TabKey): TabAnimParams {
  return {
    anim: tabIndex(hacia) > tabIndex(desde) ? 'slide_from_right' : 'slide_from_left',
  };
}

export function navigateToTab<S extends keyof RootStackParamList>(
  navigation: StackNavigationProp<RootStackParamList, S>,
  desde: TabKey,
  hacia: TabKey
): void {
  if (desde === hacia) return;
  if (hacia === 'inicio') {
    if (navigation.canGoBack()) navigation.popToTop();
    return;
  }
  const screen = TAB_TO_SCREEN[hacia];
  if (!screen) return;
  navigation.navigate(screen, animParaTab(desde, hacia));
}