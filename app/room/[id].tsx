// Room Details: header, info, facilities, today's timeline and a sticky "Book now" button.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Banner, Button, Card, IconButton, List, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TimelineRow } from '../../src/components/SlotChip';
import { ErrorState, SkeletonList } from '../../src/components/States';
import { useAuth } from '../../src/hooks/useAuth';
import { useFavorites } from '../../src/hooks/useFavorites';
import { useRoom } from '../../src/hooks/useRooms';
import { FACILITY_META, RADIUS, ROOM_TYPE_META, SPACING, STATUS } from '../../src/theme';

export default function RoomDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { user } = useAuth();
  const favs = useFavorites();
  const { data, loading, error, reload } = useRoom(id);

  if (loading) return <View style={{ padding: SPACING.md }}><SkeletonList count={5} /></View>;
  if (error || !data?.room) return <ErrorState message={error ?? 'Room not found'} onRetry={reload} />;

  const { room, slots } = data;
  const meta = ROOM_TYPE_META[room.type];
  const isStudent = user?.role === 'student';

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <Stack.Screen options={{ title: room.name }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[styles.header, { backgroundColor: meta.color }]}>
          <MaterialCommunityIcons name={meta.icon} size={56} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text variant="headlineSmall" style={styles.headerTitle}>{room.name}</Text>
            <Text style={{ color: '#ffffffcc' }}>{meta.label}</Text>
          </View>
          {isStudent && (
            <IconButton icon={favs.isFavorite(room.id) ? 'heart' : 'heart-outline'} iconColor="#fff" size={28} onPress={() => favs.toggle(room.id)} />
          )}
        </View>

        <Banner visible={!room.isActive} icon="wrench">
          Temporarily unavailable. This room is under maintenance and can't be booked.
        </Banner>

        <View style={{ padding: SPACING.md }}>
          <Card style={styles.card}>
            <List.Item title={`${room.block}${room.floor != null ? `, Floor ${room.floor}` : ''}`} left={(p) => <List.Icon {...p} icon="map-marker" />} />
            <List.Item title={`Capacity: ${room.capacity} people`} left={(p) => <List.Icon {...p} icon="account-group" />} />
            <List.Item title={meta.label} left={(p) => <List.Icon {...p} icon={meta.icon} />} />
          </Card>

          <Text variant="titleMedium" style={styles.section}>Facilities</Text>
          <Card style={styles.card}>
            <View style={styles.facilities}>
              {room.facilities.map((f) => (
                <View key={f} style={styles.facility}>
                  <MaterialCommunityIcons name="check-circle" size={18} color={STATUS.available} />
                  <MaterialCommunityIcons name={FACILITY_META[f].icon} size={18} color={theme.colors.onSurfaceVariant} />
                  <Text>{FACILITY_META[f].label}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Text variant="titleMedium" style={styles.section}>Today's timeline</Text>
          <Card style={[styles.card, { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }]}>
            {slots.map((s) => <TimelineRow key={s.startMin} slot={s} />)}
          </Card>
        </View>
      </ScrollView>

      {isStudent && (
        <View style={[styles.sticky, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
          <Button mode="contained" icon="calendar-plus" disabled={!room.isActive} contentStyle={{ paddingVertical: 6 }}
            onPress={() => router.push(`/room/${room.id}/availability`)}>
            {room.isActive ? 'Book now' : 'Unavailable'}
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, paddingVertical: SPACING.xl },
  headerTitle: { color: '#fff', fontWeight: '800' },
  card: { borderRadius: RADIUS },
  section: { marginTop: SPACING.lg, marginBottom: SPACING.sm, fontWeight: '700' },
  facilities: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.md, rowGap: 12 },
  facility: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '50%' },
  sticky: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth },
});
