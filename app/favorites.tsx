// Favourites list with unfavourite action and empty state.
import { router } from 'expo-router';
import { FlatList } from 'react-native';
import { RoomCard } from '../src/components/RoomCard';
import { EmptyState, SkeletonList } from '../src/components/States';
import { useFavorites } from '../src/hooks/useFavorites';
import { useFocusData } from '../src/hooks/useFocusData';
import { loadFreeNowIds } from '../src/hooks/useRooms';
import { searchRooms } from '../src/repositories/roomRepo';
import { SPACING } from '../src/theme';

export default function Favorites() {
  const favs = useFavorites();
  const { data, loading } = useFocusData(async () => {
    const rooms = await searchRooms();
    return { rooms, freeNow: await loadFreeNowIds(rooms) };
  }, []);
  const rooms = data?.rooms.filter((r) => favs.ids.has(r.id)) ?? [];

  return (
    <FlatList
      contentContainerStyle={{ padding: SPACING.md }}
      data={rooms}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => (
        <RoomCard room={item} freeNow={data?.freeNow.has(item.id)} isFavorite onToggleFavorite={() => favs.toggle(item.id)} />
      )}
      ListEmptyComponent={
        loading ? <SkeletonList /> : (
          <EmptyState icon="heart-outline" title="No favourites yet" message="Tap ❤️ on a room to save it here."
            actionLabel="Explore rooms" onAction={() => router.push('/(student)/explore')} />
        )
      }
    />
  );
}
