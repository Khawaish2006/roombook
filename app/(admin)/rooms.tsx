// Manage rooms: search, status, occupancy, active toggle, add (FAB), edit, delete.
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { Button, Card, Dialog, FAB, IconButton, Portal, Searchbar, Snackbar, Switch, Text, useTheme } from 'react-native-paper';
import { EmptyState, SkeletonList } from '../../src/components/States';
import { useRooms } from '../../src/hooks/useRooms';
import { Room } from '../../src/models';
import { countUpcomingForRoom } from '../../src/repositories/bookingRepo';
import { deleteRoom, setRoomActive } from '../../src/repositories/roomRepo';
import { RADIUS, ROOM_TYPE_META, SPACING, STATUS } from '../../src/theme';
import { nowMin, todayStr } from '../../src/utils/time';

export default function ManageRooms() {
  const theme = useTheme();
  const [text, setText] = useState('');
  const { data, loading, reload } = useRooms({ text, includeInactive: true });
  const [toDelete, setToDelete] = useState<Room | null>(null);
  const [blocked, setBlocked] = useState<number>(0);
  const [snack, setSnack] = useState<string | null>(null);

  const askDelete = async (room: Room) => {
    setBlocked(await countUpcomingForRoom(room.id, todayStr(), nowMin()));
    setToDelete(room);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    if (blocked > 0) {
      await setRoomActive(toDelete.id, false);
      setSnack(`${toDelete.name} disabled`);
    } else {
      await deleteRoom(toDelete.id);
      setSnack(`${toDelete.name} deleted`);
    }
    setToDelete(null);
    reload();
  };

  const toggleActive = async (room: Room) => {
    await setRoomActive(room.id, !room.isActive);
    reload();
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100 }}
        ListHeaderComponent={<Searchbar placeholder="Search rooms" value={text} onChangeText={setText} style={{ marginBottom: SPACING.md, borderRadius: RADIUS }} />}
        data={loading ? [] : data?.rooms ?? []}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => {
          const free = data?.freeNow.has(item.id);
          return (
            <Card style={{ borderRadius: RADIUS, marginBottom: SPACING.sm + 4, opacity: item.isActive ? 1 : 0.7 }} onPress={() => router.push(`/room/${item.id}`)}>
              <Card.Title
                title={item.name}
                subtitle={`${ROOM_TYPE_META[item.type].label} · ${item.block} · ${item.capacity} seats`}
                right={() => <Switch value={item.isActive} onValueChange={() => toggleActive(item)} style={{ marginRight: 12 }} />}
              />
              <Card.Content style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text variant="bodySmall">
                  <Text style={{ color: item.isActive ? STATUS.available : STATUS.past }}>● {item.isActive ? 'Active' : 'Disabled'}</Text>
                  {'   '}
                  {item.isActive && <Text style={{ color: free ? STATUS.available : STATUS.booked }}>● {free ? 'Free' : 'Occupied'}</Text>}
                </Text>
                <View style={{ flexDirection: 'row' }}>
                  <IconButton icon="pencil" size={20} onPress={() => router.push({ pathname: '/admin/room-form', params: { id: item.id } })} />
                  <IconButton icon="delete-outline" size={20} iconColor={STATUS.booked} onPress={() => askDelete(item)} />
                </View>
              </Card.Content>
            </Card>
          );
        }}
        ListEmptyComponent={loading ? <SkeletonList /> : <EmptyState icon="door-closed" title="No rooms found" />}
      />
      <FAB icon="plus" label="Add room" style={{ position: 'absolute', right: 16, bottom: 16, backgroundColor: theme.colors.primaryContainer }}
        onPress={() => router.push('/admin/room-form')} />

      <Portal>
        <Dialog visible={!!toDelete} onDismiss={() => setToDelete(null)}>
          <Dialog.Title>{blocked > 0 ? "Can't delete room" : `Delete ${toDelete?.name}?`}</Dialog.Title>
          <Dialog.Content>
            <Text>
              {blocked > 0
                ? `${toDelete?.name} has ${blocked} upcoming booking(s). Disable it instead so students can't book it.`
                : 'This permanently removes the room and its booking history.'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setToDelete(null)}>Cancel</Button>
            <Button textColor={STATUS.booked} onPress={confirmDelete}>{blocked > 0 ? 'Disable instead' : 'Delete'}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)}>{snack}</Snackbar>
    </View>
  );
}
