import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import { getDatabase } from '../database/db';

// Import diferido y a prueba de fallos: en Expo Go no existe el módulo nativo
// (ExpoTopicSubscriptionModule) y el import estático rompía la app al arrancar.
// En dev build/producción el require tiene éxito y todo funciona igual.
type NotificationsModule = typeof import('expo-notifications');
let Notifications: NotificationsModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications') as NotificationsModule;
} catch {
  Notifications = null;
}

// Configuración global del comportamiento de notificaciones locales
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const ANTICIPACION_MIN = 15;

// KILL SWITCH temporal: desactiva permisos y programación sin tocar llamadores.
// Para reactivar → poner en false.
export const NOTIF_DESHABILITADA = true;

export async function getPermissionStatus(): Promise<boolean> {
  if (NOTIF_DESHABILITADA || !Notifications) return false;
  if (!Device.isDevice) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function requestPermissionsConContexto(): Promise<boolean> {
  if (NOTIF_DESHABILITADA || !Notifications) return false;
  const granted = await getPermissionStatus();
  if (granted) return true;

  return new Promise((resolve) => {
    Alert.alert(
      'Notificaciones',
      'Activa las notificaciones para recibir recordatorios útiles sobre tus hábitos, actividades y registro personal.',
      [
        { text: 'Ahora no', style: 'cancel', onPress: () => resolve(false) },
        { 
          text: 'Activar', 
          onPress: async () => {
            const result = await requestPermissionsAsync();
            resolve(result);
          }
        }
      ]
    );
  });
}

export async function requestPermissionsAsync(): Promise<boolean> {
  if (NOTIF_DESHABILITADA || !Notifications) return false;
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

// Helpers para tabla notif_config
export async function getNotifConfig(clave: string, valorPorDefecto: string = '1'): Promise<string> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{valor: string}>('SELECT valor FROM notif_config WHERE clave = ?', [clave]);
  return row ? row.valor : valorPorDefecto;
}

export async function setNotifConfig(clave: string, valor: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT OR REPLACE INTO notif_config (clave, valor) VALUES (?, ?)', [clave, valor]);
}

/**
 * Programa la notificación para una actividad específica en un día y hora concretos.
 * Si ya existía, la sobreescribe (evita duplicados usando identificador único).
 * La notificación se programa ANTICIPACION_MIN antes de la hora de inicio.
 */
export async function scheduleActividadNotification(actividadId: number, titulo: string, fechaHoraIso: string) {
  if (NOTIF_DESHABILITADA || !Notifications) return;
  try {
    const enabled = await getNotifConfig('notif_actividad', '1');
    if (enabled !== '1') return;

    const targetDate = new Date(fechaHoraIso);
    targetDate.setMinutes(targetDate.getMinutes() - ANTICIPACION_MIN);
    
    if (targetDate <= new Date()) return; // Pasado

    const identifier = `act_${actividadId}`;
    
    // Primero intentamos cancelar si ya existe, por seguridad
    await cancelActividadNotification(actividadId);

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: 'Próxima actividad',
        body: `En ${ANTICIPACION_MIN} min: ${titulo}`,
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
  if (NOTIF_DESHABILITADA || !Notifications) return;
  try {
    const identifier = `act_${actividadId}`;
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    // Falla si no existía, ignoramos
  }
}

export async function syncHabitReminder(habitoId: number, titulo: string, completado: boolean) {
  if (NOTIF_DESHABILITADA || !Notifications) return;
  try {
    const identifier = `hab_${habitoId}`;
    await Notifications.cancelScheduledNotificationAsync(identifier);

    if (completado) return;

    const enabled = await getNotifConfig('notif_habito', '1');
    if (enabled !== '1') return;

    // Fixed evening check at 19:00 for habits without a specific time
    const targetDate = new Date();
    targetDate.setHours(19, 0, 0, 0);
    
    if (targetDate <= new Date()) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: 'Recordatorio de hábito',
        body: `No olvides tu hábito: ${titulo}`,
        data: { tipo: 'habito', id: habitoId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: targetDate,
      },
    });
  } catch (e) {
    console.error('Error en syncHabitReminder:', e);
  }
}

export async function cancelHabitReminder(habitoId: number) {
  if (NOTIF_DESHABILITADA || !Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(`hab_${habitoId}`);
  } catch (e) {}
}

export async function scheduleAvoidanceReminder(id: number) {
  if (NOTIF_DESHABILITADA || !Notifications) return;
  try {
    const enabled = await getNotifConfig('notif_evitar', '1');
    if (enabled !== '1') return;

    const identifier = `evit_${id}`;
    await Notifications.cancelScheduledNotificationAsync(identifier);

    const targetDate = new Date();
    targetDate.setHours(20, 0, 0, 0); // 20:00 as default check
    if (targetDate <= new Date()) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: 'Revisión personal',
        body: 'Tu seguimiento personal de hoy está pendiente',
        data: { tipo: 'evitar', id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: targetDate,
      },
    });
  } catch (e) {
    console.error('Error en scheduleAvoidanceReminder:', e);
  }
}

export async function scheduleDailySummary() {
  if (NOTIF_DESHABILITADA || !Notifications) return;
  try {
    const enabled = await getNotifConfig('notif_resumen', '1');
    if (enabled !== '1') return;

    const targetDate = new Date();
    targetDate.setHours(21, 0, 0, 0); // 21:00 summary
    if (targetDate <= new Date()) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    const fechaStr = targetDate.toISOString().split('T')[0];
    const identifier = `dia_${fechaStr}`;

    await Notifications.cancelScheduledNotificationAsync(identifier);

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: 'Cierre del día',
        body: 'Revisa tu progreso de hoy',
        data: { tipo: 'resumen' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: targetDate,
      },
    });
  } catch (e) {
    console.error('Error programando resumen diario:', e);
  }
}

/**
 * Recordatorio inteligente de comida
 * No programa si ya comió recientemente, o si es tarde en la noche
 */
export async function scheduleRecordatorioComida(yaRegistrado: boolean) {
  if (NOTIF_DESHABILITADA || !Notifications) return;
  try {
    const enabled = await getNotifConfig('notif_comida', '1');
    if (enabled !== '1') return;

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
