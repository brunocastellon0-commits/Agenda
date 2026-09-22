export type TabAnimParams = {
  anim: 'slide_from_left' | 'slide_from_right';
};

export type RootStackParamList = {
  Home: undefined;
  Billetera: TabAnimParams | undefined;
  Actividades: TabAnimParams | undefined;
  Metricas: TabAnimParams | undefined;
};