// Explore: AI Smart Search (§6.1), text search, filter sheet, results list.
import { useLocalSearchParams } from 'expo-router';
import { ComponentRef, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Card, Chip, IconButton, Searchbar, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { parseSearchQuery } from '../../src/ai/parseSearchQuery';
import { FilterSheet } from '../../src/components/FilterSheet';
import { RoomCard } from '../../src/components/RoomCard';
import { EmptyState, ErrorState, SkeletonList } from '../../src/components/States';
import { useFavorites } from '../../src/hooks/useFavorites';
import { useRooms } from '../../src/hooks/useRooms';
import { RoomFilters, RoomType } from '../../src/models';
import { FACILITY_META, RADIUS, ROOM_TYPE_META, SPACING } from '../../src/theme';
import { formatDate, formatRange, nowMin, todayStr } from '../../src/utils/time';

/** Human-readable removable chips for the active filters. */
function filterChips(f: RoomFilters): { key: string; label: string; remove: (f: RoomFilters) => RoomFilters }[] {
  const chips: ReturnType<typeof filterChips> = [];
  f.types?.forEach((t) =>
    chips.push({ key: `t-${t}`, label: ROOM_TYPE_META[t].label, remove: (x) => ({ ...x, types: x.types?.filter((y) => y !== t) }) }),
  );
  if (f.minCapacity) chips.push({ key: 'cap', label: `${f.minCapacity}+ people`, remove: (x) => ({ ...x, minCapacity: undefined }) });
  f.facilities?.forEach((fa) =>
    chips.push({ key: `f-${fa}`, label: FACILITY_META[fa].label, remove: (x) => ({ ...x, facilities: x.facilities?.filter((y) => y !== fa) }) }),
  );
  if (f.date) {
    const isNow = f.date === todayStr() && f.startMin != null && f.endMin === f.startMin + 1;
    const label = isNow
      ? 'Free now'
      : f.startMin != null && f.endMin != null
        ? `${formatDate(f.date, true)} ${formatRange(f.startMin, f.endMin)}`
        : `Free ${formatDate(f.date, true).toLowerCase()}`;
    chips.push({ key: 'when', label, remove: (x) => ({ ...x, date: undefined, startMin: undefined, endMin: undefined }) });
  }
  return chips;
}

export default function Explore() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ type?: RoomType; focus?: string }>();
  const searchRef = useRef<ComponentRef<typeof Searchbar>>(null);

  const [filters, setFilters] = useState<RoomFilters>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  // Quick-access tiles on Home open Explore pre-filtered.
  useEffect(() => {
    if (params.type) { setFilters({ types: [params.type] }); setAiApplied(false); }
  }, [params.type]);
  useEffect(() => {
    // Arriving from the Home search bar: focus the text search.
    if (params.focus) setTimeout(() => (searchRef.current as { focus?: () => void } | null)?.focus?.(), 300);
  }, [params.focus]);

  const { data, loading, error, refreshing, refresh, reload } = useRooms(filters);
  const favs = useFavorites();

  const runSmartSearch = async () => {
    if (!aiQuery.trim()) return;
    setAiBusy(true);
    try {
      const parsed = await parseSearchQuery(aiQuery);
      // If the AI picked "today" with a time that already passed, drop the time so results aren't empty.
      const timePassed = parsed.date === todayStr() && parsed.endMin != null && parsed.endMin <= nowMin();
      setFilters({
        types: parsed.type ? [parsed.type] : undefined,
        minCapacity: parsed.minCapacity ?? undefined,
        facilities: parsed.facilities.length ? parsed.facilities : undefined,
        date: parsed.date ?? undefined,
        startMin: timePassed ? undefined : parsed.startMin ?? undefined,
        endMin: timePassed ? undefined : parsed.endMin ?? undefined,
      });
      setAiApplied(true);
    } catch {
      // Graceful degradation: tell the user and open the manual filters instead.
      setSnack('Smart search unavailable, use filters instead');
      setSheetOpen(true);
    } finally {
      setAiBusy(false);
    }
  };

  const chips = filterChips(filters);
  const count = data?.rooms.length ?? 0;

  const header = (
    <View>
      <Card style={styles.aiCard} mode="contained">
        <Card.Content>
          <Text variant="titleSmall" style={{ fontWeight: '700', marginBottom: 6 }}>✨ Ask RoomBook</Text>
          <TextInput
            mode="outlined"
            dense
            placeholder="e.g. quiet room for 6 with a whiteboard tomorrow 3–5 pm"
            value={aiQuery}
            onChangeText={setAiQuery}
            onSubmitEditing={runSmartSearch}
            returnKeyType="search"
            right={<TextInput.Icon icon="send" onPress={runSmartSearch} disabled={aiBusy} />}
          />
          {aiBusy && <Text variant="bodySmall" style={{ marginTop: 6 }}>Understanding your request…</Text>}
        </Card.Content>
      </Card>

      <View style={styles.searchRow}>
        <Searchbar
          ref={searchRef}
          placeholder="Room name or block"
          value={filters.text ?? ''}
          onChangeText={(text) => setFilters((f) => ({ ...f, text }))}
          style={{ flex: 1, borderRadius: RADIUS }}
        />
        <IconButton icon="tune-variant" mode="contained-tonal" size={26} onPress={() => setSheetOpen(true)} accessibilityLabel="Filters" />
      </View>

      {chips.length > 0 && (
        <View style={styles.chips}>
          {aiApplied && <Text variant="labelSmall" style={{ width: '100%', color: theme.colors.primary }}>AI understood:</Text>}
          {chips.map((c) => (
            <Chip key={c.key} compact onClose={() => setFilters(c.remove)}>{c.label}</Chip>
          ))}
        </View>
      )}
      {!loading && <Text variant="labelLarge" style={{ marginVertical: SPACING.sm }}>{count} {count === 1 ? 'space' : 'spaces'} found</Text>}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        contentContainerStyle={{ padding: SPACING.md }}
        data={loading ? [] : data?.rooms ?? []}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        renderItem={({ item }) => (
          <RoomCard room={item} freeNow={data?.freeNow.has(item.id)} isFavorite={favs.isFavorite(item.id)} onToggleFavorite={() => favs.toggle(item.id)} />
        )}
        ListEmptyComponent={
          loading ? <SkeletonList /> : error ? <ErrorState message={error} onRetry={reload} /> : (
            <EmptyState icon="magnify-close" title="No spaces match" message="Try removing a filter or picking another time."
              actionLabel="Clear filters" onAction={() => { setFilters({}); setAiApplied(false); }} />
          )
        }
      />
      <FilterSheet visible={sheetOpen} onDismiss={() => setSheetOpen(false)} value={filters} onApply={(f) => { setFilters(f); setAiApplied(false); }} />
      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={3500}>{snack}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  aiCard: { borderRadius: RADIUS, marginBottom: SPACING.md },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm },
});
