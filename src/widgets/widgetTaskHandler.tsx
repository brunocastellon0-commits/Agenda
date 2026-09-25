import React from 'react';
import { WidgetTaskHandlerProps } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MiDiaWidget, WidgetData } from './MiDiaWidget';

const WIDGET_DATA_KEY = 'widget_mi_dia_data';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const Widget =
    props.widgetAction === 'WIDGET_RESIZED'
      ? props.renderWidget
      : props.renderWidget;

  switch (widgetInfo.widgetName) {
    case 'MiDiaWidget':
      let data: WidgetData = { rachas: [], mensaje: 'Tu día en marcha.' };
      try {
        const stored = await AsyncStorage.getItem(WIDGET_DATA_KEY);
        if (stored) {
          data = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Error al leer AsyncStorage en widget', error);
      }

      Widget(<MiDiaWidget {...data} />);
      break;

    default:
      break;
  }
}
