// Admin dashboard: tiles, utilisation today, top rooms this week, today's bookings.
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, ProgressBar, Text } from 'react-native-paper';
import { BookingCard } from '../../src/components/BookingCard';
import { StatBar, StatTile } from '../../src/components/StatBar';
import { EmptyState, SkeletonList } from '../../src/components/States';
import { useFocusData } from '../../src/hooks/useFocusData';
import { loadFreeNowIds } from '../../src/hooks/useRooms';
import { getConfirmedBetween, getConfirmedForDate } from '../../src/repositories/bookingRepo';
import { searchRooms } from '../../src/repositories/roomRepo';
import { computeUtilisation, topRooms } from '../../src/services/statsService';
import { RADIUS, SPACING, STATUS } from '../../src/theme';
import { addDays, todayStr } from '../../src/utils/time';

export default function AdminDashboard() {
  const { data, loading, refreshing, refresh } = useFocusData(async () => {
    const today = todayStr();
    const [allRooms, todays, week] = await Promise.all([
      searchRooms({ includeInactive: true }),
      getConfirmedForDate(today),
      getConfirmedBetween(addDays(today, -6), today),
    ]);
    const active = allRooms.filter((r) => r.isActive);
    const freeNow = await loadFreeNowIds(active);
    return {
      total: allRooms.length,
      active: active.length,
      todays,
      freeNow: freeNow.size,
      utilisation: computeUtilisation(active, todays),
      top: topRooms(week),
    };
  }, []);

  if (loading || !data) return <View style={{ padding: SPACING.md }}><SkeletonList count={5} /></View>;
  const maxTop = Math.max(...data.top.map((t) => t.count), 1);

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.md, paddingBottom: SPACING.xl }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <View style={styles.tiles}>
        <StatTile label="Total rooms" value={data.total} />
        <StatTile label="Active rooms" value={data.active} color={STATUS.available} />
        <StatTile label="Today's bookings" value={data.todays.length} color={STATUS.soon} />
        <StatTile label="Available now" value={data.freeNow} color={STATUS.available} />
      </View>

      <Card style={styles.card}>
        <Card.Title title="Utilisation today" subtitle="Booked hours across all active rooms" />
        <Card.Content>
          <Text variant="headlineMedium" style={{ fontWeight: '800' }}>{data.utilisation}%</Text>
          <ProgressBar progress={data.utilisation / 100} style={{ height: 10, borderRadius: 5, marginTop: 8 }} />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Top rooms this week" />
        <Card.Content>
          {data.top.length === 0 ? <Text>No bookings this week.</Text> : data.top.map((t) => (
            <StatBar key={t.roomName} label={t.roomName.replace('Study Room ', '')} value={t.count} max={maxTop} />
          ))}
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={{ fontWeight: '700', marginBottom: SPACING.sm }}>Today's bookings</Text>
      {data.todays.length === 0 ? (
        <EmptyState icon="calendar-blank-outline" title="No bookings today" />
      ) : (
        data.todays.map((b) => <BookingCard key={b.id} booking={b} showUser />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm + 4, marginBottom: SPACING.md },
  card: { borderRadius: RADIUS, marginBottom: SPACING.md },
});
