import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Booking } from '../models';
import { deriveStatus, isStartingSoon } from '../services/statusService';
import { STATUS } from '../theme';

/** 🟢 Confirmed · 🟡 Starting soon · ⚪ Completed · 🔴 Cancelled */
export function StatusBadge({ booking }: { booking: Booking }) {
  const status = deriveStatus(booking);
  const soon = isStartingSoon(booking);
  const { label, color } =
    status === 'cancelled'
      ? { label: 'Cancelled', color: STATUS.booked }
      : status === 'completed'
        ? { label: 'Completed', color: STATUS.past }
        : soon
          ? { label: 'Starting soon', color: STATUS.soon }
          : { label: 'Confirmed', color: STATUS.available };

  return (
    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  text: { fontSize: 12, fontWeight: '600' },
});
