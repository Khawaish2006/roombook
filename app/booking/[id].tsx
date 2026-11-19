// Booking Details with cancel flow (student for own bookings, admin for any).
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Dialog, List, Portal, Snackbar, Text } from 'react-native-paper';
import { ErrorState, SkeletonList } from '../../src/components/States';
import { StatusBadge } from '../../src/components/StatusBadge';
import { useAuth } from '../../src/hooks/useAuth';
import { useBooking } from '../../src/hooks/useBookings';
import { cancelBooking } from '../../src/services/bookingService';
import { deriveStatus } from '../../src/services/statusService';
import { RADIUS, ROOM_TYPE_META, SPACING, STATUS } from '../../src/theme';
import { formatDate, formatRange } from '../../src/utils/time';

export default function BookingDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data, loading, error, reload } = useBooking(id);
  const [dialog, setDialog] = useState(false);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  if (loading) return <View style={{ padding: SPACING.md }}><SkeletonList count={3} /></View>;
  if (error || !data?.booking) return <ErrorState message={error ?? 'Booking not found'} onRetry={reload} />;

  const { booking: b, room } = data;
  const status = deriveStatus(b);
  const canCancel = status === 'upcoming' && (user?.role === 'admin' || user?.id === b.userId);

  const doCancel = async () => {
    setBusy(true);
    await cancelBooking(b.id);
    setBusy(false);
    setDialog(false);
    setSnack('Booking cancelled. The slot is free again.');
    reload();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: SPACING.md }}>
        <Card style={{ borderRadius: RADIUS }}>
          <Card.Content style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="labelLarge">{b.id}</Text>
              <StatusBadge booking={b} />
            </View>
            <Text variant="headlineSmall" style={{ fontWeight: '800' }}>{b.roomName}</Text>
          </Card.Content>
          <List.Item title={formatDate(b.date)} description="Date" left={(x) => <List.Icon {...x} icon="calendar" />} />
          <List.Item title={formatRange(b.startMin, b.endMin)} description="Time" left={(x) => <List.Icon {...x} icon="clock-outline" />} />
          <List.Item title={b.purpose ?? 'Not specified'} description="Purpose" left={(x) => <List.Icon {...x} icon="text-box-outline" />} />
          <List.Item title={b.attendees ? String(b.attendees) : 'Not specified'} description="Attendees" left={(x) => <List.Icon {...x} icon="account-group" />} />
          {user?.role === 'admin' && <List.Item title={b.userName} description="Booked by" left={(x) => <List.Icon {...x} icon="account" />} />}
          {b.cancelledAt && (
            <List.Item title={new Date(b.cancelledAt).toLocaleString()} description="Cancelled at" left={(x) => <List.Icon {...x} icon="close-circle" color={STATUS.booked} />} />
          )}
        </Card>

        {room && (
          <Card style={{ borderRadius: RADIUS, marginTop: SPACING.md }} onPress={() => router.push(`/room/${room.id}`)}>
            <List.Item
              title={room.name}
              description={`${ROOM_TYPE_META[room.type].label} · ${room.block} · ${room.capacity} seats`}
              left={(x) => <List.Icon {...x} icon={ROOM_TYPE_META[room.type].icon} />}
              right={() => <Text style={{ alignSelf: 'center' }}>View room ›</Text>}
            />
          </Card>
        )}

        {canCancel && (
          <Button mode="outlined" textColor={STATUS.booked} style={{ marginTop: SPACING.lg, borderColor: STATUS.booked }} icon="close" onPress={() => setDialog(true)}>
            Cancel booking
          </Button>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={dialog} onDismiss={() => setDialog(false)}>
          <Dialog.Title>Cancel reservation?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{b.roomName} · {formatDate(b.date)} · {formatRange(b.startMin, b.endMin)}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialog(false)}>Keep booking</Button>
            <Button textColor={STATUS.booked} loading={busy} onPress={doCancel}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)}>{snack}</Snackbar>
    </View>
  );
}
