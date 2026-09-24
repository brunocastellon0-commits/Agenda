import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { toISODate } from '../utils/semana';

// Configuración global del comportamiento de notificaciones locales
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissionsAsync(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Actividades y Hábitos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#16876A',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } else {
    // En el simulador iOS puede fallar
    return false;
  }
}

/**
 * Programa la notificación para una actividad específica en un día y hora concretos.
 * Si ya existía, la sobreescribe (evita duplicados usando identificador único).
 */
export async function scheduleActividadNotification(actividadId: number, titulo: string, fechaHoraIso: string) {
  try {
    const targetDate = new Date(fechaHoraIso);
    if (targetDate <= new Date()) return; // Pasado

    const identifier = `act_${actividadId}`;
    
    // Primero intentamos cancelar si ya existe, por seguridad
    await cancelActividadNotification(actividadId);

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: 'Próxima actividad',
        body: `Es hora de: ${titulo}`,
        data: { tipo: 'actividad', id: actividadId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: targetDate,
      },
    });
  } catch (error) {
    console.error(`Error programando notificación para act ${actividadId}:`, error);
  }
}

/**
 * Cancela la notificación de una actividad si el usuario la elimina o completa
 */
export async function cancelActividadNotification(actividadId: number) {
  try {
    const identifier = `act_${actividadId}`;
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    // Falla si no existía, ignoramos
  }
}

/**
 * Recordatorio inteligente de comida
 * No programa si ya comió recientemente, o si es tarde en la noche
 */
export async function scheduleRecordatorioComida(yaRegistrado: boolean) {
  try {
    const identifier = `comida_recordatorio`;
    await Notifications.cancelScheduledNotificationAsync(identifier);

    // Solo un recordatorio diario a las 14:00
    const targetDate = new Date();
    targetDate.setHours(14, 0, 0, 0);
    
    // Si ya registró hoy, no le avisamos hoy; o si ya pasaron las 14:00
    if (yaRegistrado || targetDate <= new Date()) {
      targetDate.setDate(targetDate.getDate() + 1); // Mañana
    }

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: '¿Ya comiste?',
        body: 'Registra tu almuerzo para mantener el seguimiento de tu alimentación.',
        data: { tipo: 'comida' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: targetDate,
      },
    });
  } catch (e) {
    console.error('Error programando recordatorio de comida:', e);
  }
}
