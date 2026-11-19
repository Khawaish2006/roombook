// Student dashboard: greeting, search, quick access, next booking, available now, favourites.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Searchbar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoomCard } from '../../src/components/RoomCard';
import { SkeletonList } from '../../src/components/States';
import { StatusBadge } from '../../src/components/StatusBadge';
import { useCurrentUser } from '../../src/hooks/useAuth';
import { useFavorites } from '../../src/hooks/useFavorites';
import { useFocusData } from '../../src/hooks/useFocusData';
import { loadFreeNowIds } from '../../src/hooks/useRooms';
import { ROOM_TYPES } from '../../src/models';
import { getBookingsForUser } from '../../src/repositories/bookingRepo';
import { searchRooms } from '../../src/repositories/roomRepo';
import { deriveStatus } from '../../src/services/statusService';
import { RADIUS, ROOM_TYPE_META, SPACING } from '../../src/theme';
import { formatDate, formatRange, greeting } from '../../src/utils/time';

export default function Home() {
  const user = useCurrentUser();
  const theme = useTheme();
  const favs = useFavorites();

  const { data, loading, refreshing, refresh } = useFocusData(async () => {
    const [bookings, rooms] = await Promise.all([getBookingsForUser(user.id), searchRooms()]);
    const upcoming = bookings
      .filter((b) => deriveStatus(b) === 'upcoming')
      .sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin);
    const freeNow = await loadFreeNowIds(rooms);
    return { next: upcoming[0] ?? null, rooms, freeNow };
  }, [user.id]);

  const favoriteRooms = data?.rooms.filter((r) => favs.ids.has(r.id)) ?? [];
  const availableNow = data?.rooms.filter((r) => data.freeNow.has(r.id)).slice(0, 10) ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
          {greeting()}, {user.name.split(' ')[0]} 👋
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: SPACING.md }}>
          Where would you like to work today?
        </Text>

        <Pressable onPress={() => router.push({ pathname: '/(student)/explore', params: { focus: '1' } })}>
          <View pointerEvents="none">
            <Searchbar placeholder="Search rooms or ask RoomBook…" value="" editable={false} style={{ borderRadius: RADIUS }} />
          </View>
        </Pressable>

        <Text variant="titleMedium" style={styles.section}>Quick access</Text>
        <View style={styles.grid}>
          {ROOM_TYPES.map((t) => {
            const meta = ROOM_TYPE_META[t];
            return (
              <Card key={t} style={styles.quick} onPress={() => router.push({ pathname: '/(student)/explore', params: { type: t } })}>
                <View style={styles.quickInner}>
                  <View style={[styles.quickIcon, { backgroundColor: meta.color + '1A' }]}>
                    <MaterialCommunityIcons name={meta.icon} size={24} color={meta.color} />
                  </View>
                  <Text variant="labelLarge">{meta.plural}</Text>
                </View>
              </Card>
            );
          })}
        </View>

        <Text variant="titleMedium" style={styles.section}>Your next booking</Text>
        {loading ? (
          <SkeletonList count={1} height={90} />
        ) : data?.next ? (
          <Card style={{ borderRadius: RADIUS }} onPress={() => router.push(`/booking/${data.next!.id}`)}>
            <Card.Content style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="titleLarge" style={{ fontWeight: '700' }}>{data.next.roomName}</Text>
                <StatusBadge booking={data.next} />
              </View>
              <Text variant="bodyLarge">
                {formatDate(data.next.date, true)} · {formatRange(data.next.startMin, data.next.endMin)}
              </Text>
              {data.next.purpose && <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{data.next.purpose}</Text>}
            </Card.Content>
          </Card>
        ) : (
          <Card style={{ borderRadius: RADIUS }}>
            <Card.Content style={{ alignItems: 'center', gap: 8 }}>
              <Text variant="bodyMedium">No upcoming bookings</Text>
              <Button mode="contained-tonal" onPress={() => router.push('/(student)/explore')}>Find a space</Button>
            </Card.Content>
          </Card>
        )}

        <Text variant="titleMedium" style={styles.section}>Available now</Text>
        {loading ? (
          <SkeletonList count={1} />
        ) : availableNow.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Nothing free right now (outside hours or fully booked).</Text>
        ) : (
          <FlatList horizontal data={availableNow} keyExtractor={(r) => r.id} showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <RoomCard room={item} compact freeNow />} />
        )}

        {favoriteRooms.length > 0 && (
          <>
            <Text variant="titleMedium" style={styles.section}>Your favourites</Text>
            <FlatList horizontal data={favoriteRooms} keyExtractor={(r) => r.id} showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => <RoomCard room={item} compact freeNow={data?.freeNow.has(item.id)} />} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  section: { marginTop: SPACING.lg, marginBottom: SPACING.sm, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm + 4 },
  quick: { flexBasis: '47%', flexGrow: 1, borderRadius: RADIUS },
  quickInner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: SPACING.sm + 4 },
  quickIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
