// Admin: all bookings, filterable by date, room and status. Tap a card to view or cancel.
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';
import { Chip, Searchbar, SegmentedButtons } from 'react-native-paper';
import { BookingCard } from '../../src/components/BookingCard';
import { EmptyState, SkeletonList } from '../../src/components/States';
import { useFocusData } from '../../src/hooks/useFocusData';
import { DisplayStatus } from '../../src/models';
import { getAllBookings } from '../../src/repositories/bookingRepo';
import { deriveStatus } from '../../src/services/statusService';
import { RADIUS, SPACING } from '../../src/theme';
import { addDays, formatDate, todayStr } from '../../src/utils/time';

export default function AdminBookings() {
  const [date, setDate] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<DisplayStatus | 'all'>('all');
  const [roomText, setRoomText] = useState('');
  const { data, loading, refreshing, refresh } = useFocusData(() => getAllBookings({ date }), [date]);

  const filtered = useMemo(
    () =>
      (data ?? []).filter(
        (b) =>
          (status === 'all' || deriveStatus(b) === status) &&
          (!roomText || b.roomName.toLowerCase().includes(roomText.toLowerCase()) || b.roomId.toLowerCase().includes(roomText.toLowerCase())),
      ),
    [data, status, roomText],
  );

  const today = todayStr();
  const dates = [-2, -1, 0, 1, 2, 3, 4, 5, 6].map((d) => addDays(today, d));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: SPACING.md, gap: SPACING.sm }}>
        <Searchbar placeholder="Filter by room" value={roomText} onChangeText={setRoomText} style={{ borderRadius: RADIUS }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <Chip selected={!date} showSelectedOverlay onPress={() => setDate(undefined)}>All dates</Chip>
          {dates.map((d) => (
            <Chip key={d} selected={date === d} showSelectedOverlay onPress={() => setDate(d)}>{formatDate(d, true)}</Chip>
          ))}
        </ScrollView>
        <SegmentedButtons
          value={status}
          onValueChange={(v) => setStatus(v as DisplayStatus | 'all')}
          density="small"
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'completed', label: 'Done' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
      </View>
      <FlatList
        contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl }}
        data={loading ? [] : filtered}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <BookingCard booking={item} showUser />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={loading ? <SkeletonList /> : <EmptyState icon="calendar-search" title="No bookings match" />}
      />
    </View>
  );
}
