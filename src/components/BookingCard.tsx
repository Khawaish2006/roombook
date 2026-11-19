import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { BookingWithRoom } from '../models';
import { RADIUS, ROOM_TYPE_META, SPACING } from '../theme';
import { formatDate, formatRange } from '../utils/time';
import { StatusBadge } from './StatusBadge';

export function BookingCard({ booking, showUser }: { booking: BookingWithRoom; showUser?: boolean }) {
  const theme = useTheme();
  const meta = ROOM_TYPE_META[booking.roomType];
  return (
    <Card style={styles.card} onPress={() => router.push(`/booking/${booking.id}`)}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: meta.color + '1A' }]}>
          <MaterialCommunityIcons name={meta.icon} size={22} color={meta.color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="titleMedium">{booking.roomName}</Text>
          <Text variant="bodyMedium">
            {formatDate(booking.date, true)} · {formatRange(booking.startMin, booking.endMin)}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {[showUser ? booking.userName : null, booking.purpose].filter(Boolean).join(' · ') || ' '}
          </Text>
        </View>
        <StatusBadge booking={booking} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS, marginBottom: SPACING.sm + 4 },
  row: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm + 4, gap: SPACING.sm + 4 },
  iconBox: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
