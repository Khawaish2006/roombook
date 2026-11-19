// Bottom-sheet style filter panel for Explore.
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Modal, Portal, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { CONFIG } from '../config';
import { FACILITIES, Facility, ROOM_TYPES, RoomFilters, RoomType } from '../models';
import { FACILITY_META, ROOM_TYPE_META, SPACING } from '../theme';
import { addDays, formatDate, formatMin, nowMin, todayStr } from '../utils/time';

export type AvailabilityMode = 'any' | 'now' | 'today' | 'specific';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  value: RoomFilters;
  onApply: (f: RoomFilters) => void;
}

const CAPACITIES = [10, 20, 30, 50];

export function availabilityModeOf(f: RoomFilters): AvailabilityMode {
  if (!f.date) return 'any';
  if (f.startMin == null) return 'today';
  return 'specific';
}

export function FilterSheet({ visible, onDismiss, value, onApply }: Props) {
  const theme = useTheme();
  const [draft, setDraft] = useState<RoomFilters>(value);
  const [mode, setMode] = useState<AvailabilityMode>(availabilityModeOf(value));

  useEffect(() => {
    if (visible) { setDraft(value); setMode(availabilityModeOf(value)); }
  }, [visible, value]);

  const toggle = <T,>(list: T[] | undefined, item: T) =>
    list?.includes(item) ? list.filter((x) => x !== item) : [...(list ?? []), item];

  const hourOptions: number[] = [];
  for (let m = CONFIG.dayStartMin; m < CONFIG.dayEndMin; m += 60) hourOptions.push(m);
  const dateOptions = [0, 1, 2, 3, 4, 5, 6].map((d) => addDays(todayStr(), d));

  const apply = () => {
    const next: RoomFilters = { ...draft };
    const today = todayStr();
    if (mode === 'any') { next.date = undefined; next.startMin = undefined; next.endMin = undefined; }
    if (mode === 'now') {
      const m = nowMin();
      next.date = today; next.startMin = m; next.endMin = m + 1;
    }
    if (mode === 'today') {
      // "Available today" = at least one free hour remaining; handled as a date-only filter.
      next.date = today; next.startMin = undefined; next.endMin = undefined;
    }
    if (mode === 'specific') {
      next.date = next.date ?? today;
      next.startMin = next.startMin ?? CONFIG.dayStartMin;
      next.endMin = next.endMin && next.endMin > next.startMin ? next.endMin : next.startMin + 60;
    }
    onApply(next);
    onDismiss();
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
        <ScrollView>
          <Text variant="titleLarge" style={styles.h}>Filters</Text>

          <Text variant="labelLarge" style={styles.label}>Type</Text>
          <View style={styles.wrap}>
            {ROOM_TYPES.map((t: RoomType) => (
              <Chip key={t} icon={ROOM_TYPE_META[t].icon} selected={!!draft.types?.includes(t)} showSelectedOverlay
                onPress={() => setDraft({ ...draft, types: toggle(draft.types, t) })}>
                {ROOM_TYPE_META[t].label}
              </Chip>
            ))}
          </View>

          <Text variant="labelLarge" style={styles.label}>Min capacity</Text>
          <View style={styles.wrap}>
            {CAPACITIES.map((c) => (
              <Chip key={c} selected={draft.minCapacity === c} showSelectedOverlay
                onPress={() => setDraft({ ...draft, minCapacity: draft.minCapacity === c ? undefined : c })}>
                {c}+
              </Chip>
            ))}
          </View>

          <Text variant="labelLarge" style={styles.label}>Facilities</Text>
          <View style={styles.wrap}>
            {FACILITIES.map((f: Facility) => (
              <Chip key={f} icon={FACILITY_META[f].icon} selected={!!draft.facilities?.includes(f)} showSelectedOverlay
                onPress={() => setDraft({ ...draft, facilities: toggle(draft.facilities, f) })}>
                {FACILITY_META[f].label}
              </Chip>
            ))}
          </View>

          <Text variant="labelLarge" style={styles.label}>Availability</Text>
          <SegmentedButtons
            value={mode}
            onValueChange={(v) => setMode(v as AvailabilityMode)}
            density="small"
            buttons={[
              { value: 'any', label: 'Any' },
              { value: 'now', label: 'Now' },
              { value: 'today', label: 'Today' },
              { value: 'specific', label: 'Pick' },
            ]}
          />

          {mode === 'specific' && (
            <View>
              <Text variant="labelMedium" style={styles.label}>Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {dateOptions.map((d) => (
                  <Chip key={d} selected={(draft.date ?? todayStr()) === d} showSelectedOverlay onPress={() => setDraft({ ...draft, date: d })}>
                    {formatDate(d, true)}
                  </Chip>
                ))}
              </ScrollView>
              <Text variant="labelMedium" style={styles.label}>From</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {hourOptions.map((m) => (
                  <Chip key={m} selected={draft.startMin === m} showSelectedOverlay
                    onPress={() => setDraft({ ...draft, startMin: m, endMin: Math.max(draft.endMin ?? 0, m + 60) })}>
                    {formatMin(m)}
                  </Chip>
                ))}
              </ScrollView>
              <Text variant="labelMedium" style={styles.label}>To</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {hourOptions.map((m) => m + 60).filter((m) => m > (draft.startMin ?? 0)).map((m) => (
                  <Chip key={m} selected={draft.endMin === m} showSelectedOverlay onPress={() => setDraft({ ...draft, endMin: m })}>
                    {formatMin(m)}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.actions}>
            <Button onPress={() => { setDraft({ text: draft.text }); setMode('any'); }}>Reset</Button>
            <Button mode="contained" onPress={apply}>Show results</Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '85%', padding: SPACING.md, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  h: { marginBottom: SPACING.sm, fontWeight: '700' },
  label: { marginTop: SPACING.md, marginBottom: SPACING.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.lg },
});
