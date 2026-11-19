// My Bookings: Upcoming | Completed | Cancelled with counts and pull-to-refresh.
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { BookingCard } from '../../src/components/BookingCard';
import { EmptyState, ErrorState, SkeletonList } from '../../src/components/States';
import { useCurrentUser } from '../../src/hooks/useAuth';
import { useMyBookings } from '../../src/hooks/useBookings';
import { DisplayStatus } from '../../src/models';
import { SPACING } from '../../src/theme';

export default function MyBookings() {
  const user = useCurrentUser();
  const [tab, setTab] = useState<DisplayStatus>('upcoming');
  const { data, loading, error, refreshing, refresh, reload } = useMyBookings(user.id);
  const g = data?.groups;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: SPACING.md, paddingBottom: 0 }}>
        <SegmentedButtons
          value={tab}
          onValueChange={(v) => setTab(v as DisplayStatus)}
          buttons={[
            { value: 'upcoming', label: `Upcoming (${g?.upcoming.length ?? 0})` },
            { value: 'completed', label: `Done (${g?.completed.length ?? 0})` },
            { value: 'cancelled', label: `Cancelled (${g?.cancelled.length ?? 0})` },
          ]}
        />
      </View>
      <FlatList
        contentContainerStyle={{ padding: SPACING.md }}
        data={loading ? [] : g?.[tab] ?? []}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <BookingCard booking={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          loading ? <SkeletonList /> : error ? <ErrorState message={error} onRetry={reload} /> : (
            <EmptyState
              icon="calendar-blank-outline"
              title={`No ${tab} bookings`}
              message={tab === 'upcoming' ? 'Reserve a room and it will show up here.' : undefined}
              actionLabel={tab === 'upcoming' ? 'Find a space' : undefined}
              onAction={() => router.push('/(student)/explore')}
            />
          )
        }
      />
    </View>
  );
}
