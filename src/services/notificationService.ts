// Local, scheduled booking reminders. No remote push.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Booking } from '../models';
import { toDateTime } from '../utils/time';

const KEY = (bookingId: string) => `notif:${bookingId}`;

/** Show reminders even while the app is open. Called once from the root layout. */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('reminders', {
      name: 'Booking reminders',
      importance: Notifications.AndroidImportance.HIGH,
    }).catch(() => {});
  }
}

/** Asks for permission the first time it's needed. Returns true if allowed. */
export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Schedules "starts in N minutes" and remembers the notification id for cancelling. */
export async function scheduleReminder(booking: Booking, roomName: string, offsetMin: number): Promise<void> {
  const fireAt = new Date(toDateTime(booking.date, booking.startMin).getTime() - offsetMin * 60_000);
  if (fireAt.getTime() <= Date.now()) return; // too late for a reminder
  if (!(await ensurePermission())) return;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Upcoming reservation',
      body: `Your booking for ${roomName} starts in ${offsetMin} minutes.`,
      data: { bookingId: booking.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt, channelId: 'reminders' },
  });
  await AsyncStorage.setItem(KEY(booking.id), id);
}

export async function cancelReminder(bookingId: string): Promise<void> {
  const id = await AsyncStorage.getItem(KEY(bookingId));
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(KEY(bookingId));
  }
}

/** Profile → Demo → "Send test reminder". Fires in 10 seconds. */
export async function sendTestReminder(): Promise<boolean> {
  if (!(await ensurePermission())) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: '🔔 Upcoming reservation', body: 'Your booking for A-204 starts in 30 minutes. (test)' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10, channelId: 'reminders' },
  });
  return true;
}
