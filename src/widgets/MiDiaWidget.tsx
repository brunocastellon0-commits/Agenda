import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface WidgetData {
  rachas: { nombre: string; dias: number }[];
  mensaje: string;
}

export function MiDiaWidget({ rachas = [], mensaje = 'Tu día sigue en marcha.' }: WidgetData) {
  return (
    <FlexWidget
      style={{
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        backgroundColor: '#FAF9F7',
        borderRadius: 16,
        padding: 16,
        height: 'match_parent',
        width: 'match_parent',
      }}
    >
      <TextWidget
        text="RACHAS"
        style={{
          fontSize: 12,
          fontWeight: 'bold',
          color: '#1E293B',
          letterSpacing: 1,
          marginBottom: 12,
        }}
      />
      
      {rachas.length > 0 ? (
        rachas.map((r, i) => (
          <FlexWidget key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <TextWidget text="◉" style={{ fontSize: 14, color: '#16876A', marginRight: 8 }} />
            <TextWidget text={`${r.dias} días`} style={{ fontSize: 14, fontWeight: 'bold', color: '#16876A', marginRight: 8, width: 55 }} />
            <TextWidget text={r.nombre} style={{ fontSize: 14, color: '#1E293B' }} />
          </FlexWidget>
        ))
      ) : (
        <TextWidget text="Sin rachas activas" style={{ fontSize: 14, color: '#55606E', marginBottom: 6 }} />
      )}

      <FlexWidget style={{ marginTop: 16, paddingTop: 8 }}>
        <TextWidget text={mensaje} style={{ fontSize: 12, color: '#55606E', fontStyle: 'italic' }} />
      </FlexWidget>
    </FlexWidget>
  );
}
