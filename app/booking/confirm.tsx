// Review before booking. On conflict, shows the warning plus Smart Alternatives (§6.3).
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, List, Text, useTheme } from 'react-native-paper';
import { AlternativesList } from '../../src/components/AlternativesList';
import { useCurrentUser } from '../../src/hooks/useAuth';
import { useSettings } from '../../src/hooks/useSettings';
import { Room } from '../../src/models';
import { getRoomById } from '../../src/repositories/roomRepo';
import { Alternative, getAlternatives } from '../../src/services/alternativesService';
import { BookingConflictError, BookingValidationError, createBooking } from '../../src/services/bookingService';
import { RADIUS, SPACING, STATUS } from '../../src/theme';
import { formatDate, formatRange } from '../../src/utils/time';

export default function ConfirmBooking() {
  const p = useLocalSearchParams<{ roomId: string; date: string; start: string; end: string; purpose?: string; attendees?: string }>();
  const user = useCurrentUser();
  const theme = useTheme();
  const { reminderMin } = useSettings();

  const startMin = Number(p.start);
  const endMin = Number(p.end);
  const attendees = p.attendees ? Number(p.attendees) : null;

  const [room, setRoom] = useState<Room | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<Alternative[] | null>(null);

  useEffect(() => {
    getRoomById(p.roomId).then(setRoom);
    setError(null);
    setAlternatives(null);
  }, [p.roomId, p.date, p.start, p.end]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    setAlternatives(null);
    try {
      const booking = await createBooking(
        { roomId: p.roomId, userId: user.id, date: p.date, startMin, endMin, purpose: p.purpose || null, attendees },
        reminderMin,
      );
      router.replace(`/booking/success/${booking.id}`);
    } catch (e) {
      if (e instanceof BookingConflictError) {
        setError(e.message);
        // Only suggest other rooms/times when the ROOM is taken (not when the student is double-booked).
        setAlternatives(e.kind === 'room' ? await getAlternatives(p.roomId, p.date, startMin, endMin, attendees) : null);
      } else if (e instanceof BookingValidationError) {
        setError(e.message);
      } else {
        setError('Could not save booking. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.md }}>
      <Card style={{ borderRadius: RADIUS }}>
        <Card.Title title={room?.name ?? p.roomId} subtitle={room ? `${room.block} · capacity ${room.capacity}` : undefined} titleVariant="titleLarge" />
        <List.Item title={formatDate(p.date)} description="Date" left={(x) => <List.Icon {...x} icon="calendar" />} />
        <List.Item title={formatRange(startMin, endMin)} description="Time" left={(x) => <List.Icon {...x} icon="clock-outline" />} />
        <List.Item title={p.purpose || 'Not specified'} description="Purpose" left={(x) => <List.Icon {...x} icon="text-box-outline" />} />
        <List.Item title={attendees ? String(attendees) : 'Not specified'} description="Attendees" left={(x) => <List.Icon {...x} icon="account-group" />} />
        <List.Item title={`${reminderMin} min before`} description="Reminder" left={(x) => <List.Icon {...x} icon="bell-outline" />} />
      </Card>

      {error && (
        <Card style={{ borderRadius: RADIUS, marginTop: SPACING.md, backgroundColor: STATUS.booked + '18' }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: STATUS.booked, fontWeight: '700' }}>⚠️ Time slot unavailable</Text>
            <Text variant="bodyMedium" style={{ marginTop: 4 }}>{error}</Text>
          </Card.Content>
        </Card>
      )}
      {error && alternatives && (
        <AlternativesList alternatives={alternatives} purpose={p.purpose} attendees={p.attendees} />
      )}

      <View style={{ marginTop: SPACING.lg, gap: SPACING.sm }}>
        <Button mode="contained" onPress={confirm} loading={busy} disabled={busy || !room} contentStyle={{ paddingVertical: 6 }} icon="check">
          Confirm booking
        </Button>
        <Button onPress={() => router.back()} textColor={theme.colors.onSurfaceVariant}>Change time</Button>
      </View>
    </ScrollView>
  );
}
