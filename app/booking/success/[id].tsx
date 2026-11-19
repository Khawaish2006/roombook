// Booking confirmed: animated tick, details and the booking ID.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBooking } from '../../../src/hooks/useBookings';
import { useSettings } from '../../../src/hooks/useSettings';
import { RADIUS, SPACING, STATUS } from '../../../src/theme';
import { formatDate, formatRange } from '../../../src/utils/time';

export default function BookingSuccess() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { reminderMin } = useSettings();
  const { data } = useBooking(id);
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }).start();
  }, [scale]);

  const b = data?.booking;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={{ alignItems: 'center' }}>
        <Animated.View style={[styles.circle, { transform: [{ scale }] }]}>
          <MaterialCommunityIcons name="check" size={64} color="#fff" />
        </Animated.View>
        <Text variant="headlineMedium" style={{ fontWeight: '800', marginTop: SPACING.lg }}>Booking confirmed</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
          We'll remind you {reminderMin} minutes before it starts.
        </Text>
      </View>

      {b && (
        <Card style={{ borderRadius: RADIUS, marginTop: SPACING.xl }}>
          <Card.Content style={{ gap: 6 }}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>BOOKING ID</Text>
            <Text variant="titleLarge" style={{ fontWeight: '800', letterSpacing: 1, color: theme.colors.primary }}>{b.id}</Text>
            <Text variant="titleMedium" style={{ marginTop: 8 }}>{b.roomName}</Text>
            <Text variant="bodyLarge">{formatDate(b.date, true)} · {formatRange(b.startMin, b.endMin)}</Text>
            {b.purpose && <Text variant="bodyMedium">{b.purpose}{b.attendees ? ` · ${b.attendees} people` : ''}</Text>}
          </Card.Content>
        </Card>
      )}

      <View style={{ marginTop: SPACING.xl, gap: SPACING.sm }}>
        <Button mode="contained" onPress={() => router.replace(`/booking/${id}`)} contentStyle={{ paddingVertical: 6 }}>View booking</Button>
        <Button mode="outlined" onPress={() => router.dismissTo('/(student)/home')}>Back to home</Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: SPACING.lg, justifyContent: 'center' },
  circle: { width: 120, height: 120, borderRadius: 60, backgroundColor: STATUS.available, alignItems: 'center', justifyContent: 'center' },
});
