// Availability: month calendar → hourly slot grid with consecutive multi-select → purpose/attendees.
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Button, Card, HelperText, Menu, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlternativesList } from '../../../src/components/AlternativesList';
import { SlotChip } from '../../../src/components/SlotChip';
import { Alternative, getAlternatives } from '../../../src/services/alternativesService';
import { SkeletonList } from '../../../src/components/States';
import { CONFIG } from '../../../src/config';
import { useRoom } from '../../../src/hooks/useRooms';
import { PURPOSES } from '../../../src/models';
import { selectionToRange, toggleSlot } from '../../../src/services/slotService';
import { RADIUS, SPACING, STATUS } from '../../../src/theme';
import { addDays, formatDate, formatRange, todayStr } from '../../../src/utils/time';

export default function Availability() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const today = todayStr();

  const [date, setDate] = useState(today);
  const [selected, setSelected] = useState<number[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [attendees, setAttendees] = useState('');

  const { data, loading } = useRoom(id, date);
  const range = selectionToRange(selected);
  const attendeeCount = parseInt(attendees, 10);
  const overCapacity = !!data?.room && attendeeCount > data.room.capacity;

  const [takenAlts, setTakenAlts] = useState<Alternative[] | null>(null);

  const pickDate = (d: string) => { setDate(d); setSelected([]); setHint(null); setTakenAlts(null); };

  const onSlotPress = async (start: number) => {
    if (!data) return;
    const result = toggleSlot(data.slots, selected, start);
    setSelected(result.selected);
    setHint(result.hint ?? null);
    // Tapping a booked slot shows Smart Alternatives (§6.3) for that hour.
    const tapped = data.slots.find((s) => s.startMin === start);
    setTakenAlts(
      tapped?.state === 'booked'
        ? await getAlternatives(id, date, tapped.startMin, tapped.endMin, attendeeCount || null)
        : null,
    );
  };

  const goConfirm = () => {
    if (!range) return;
    router.push({
      pathname: '/booking/confirm',
      params: { roomId: id, date, start: String(range.startMin), end: String(range.endMin), purpose, attendees },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <Stack.Screen options={{ title: data?.room ? `Book ${data.room.name}` : 'Pick a time' }} />
      <ScrollView contentContainerStyle={{ padding: SPACING.md, paddingBottom: 110 }} keyboardShouldPersistTaps="handled">
        <Card style={{ borderRadius: RADIUS }}>
          {/* Clip the calendar's corners in an inner View; clipping the Card itself breaks its shadow. */}
          <View style={{ borderRadius: RADIUS, overflow: 'hidden' }}>
          <Calendar
            key={theme.dark ? 'dark' : 'light'}
            minDate={today}
            maxDate={addDays(today, CONFIG.bookingWindowDays)}
            onDayPress={(d) => pickDate(d.dateString)}
            markedDates={{ [date]: { selected: true, selectedColor: theme.colors.primary } }}
            firstDay={1}
            theme={{
              calendarBackground: theme.colors.surface,
              dayTextColor: theme.colors.onSurface,
              monthTextColor: theme.colors.onSurface,
              textDisabledColor: theme.colors.outline,
              todayTextColor: theme.colors.primary,
              arrowColor: theme.colors.primary,
            }}
          />
          </View>
        </Card>

        <Text variant="titleMedium" style={styles.section}>{formatDate(date, true)}: choose time</Text>
        <View style={styles.legend}>
          {[['Available', STATUS.available], ['Booked', STATUS.booked], ['Past', STATUS.past]].map(([l, c]) => (
            <View key={l} style={styles.legendItem}><View style={[styles.dot, { backgroundColor: c }]} /><Text variant="bodySmall">{l}</Text></View>
          ))}
        </View>

        {loading || !data ? (
          <SkeletonList count={2} height={48} />
        ) : (
          <View style={styles.grid}>
            {data.slots.map((s) => (
              <SlotChip key={s.startMin} slot={s} selected={selected.includes(s.startMin)} onPress={() => onSlotPress(s.startMin)} />
            ))}
          </View>
        )}
        <HelperText type="info" visible={!!hint || !range}>
          {hint ?? 'Tap a slot, then tap neighbouring slots to extend the booking.'}
        </HelperText>
        {range && <Text variant="titleSmall" style={{ color: theme.colors.primary }}>Selected: {formatRange(range.startMin, range.endMin)}</Text>}
        {takenAlts && <AlternativesList alternatives={takenAlts} purpose={purpose} attendees={attendees} navigate="push" />}

        <Text variant="titleMedium" style={styles.section}>Details (optional)</Text>
        <Menu
          visible={menuOpen}
          onDismiss={() => setMenuOpen(false)}
          anchor={
            <Button mode="outlined" icon="chevron-down" contentStyle={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }} onPress={() => setMenuOpen(true)}>
              {purpose || 'Purpose'}
            </Button>
          }
        >
          {PURPOSES.map((p) => <Menu.Item key={p} title={p} onPress={() => { setPurpose(p); setMenuOpen(false); }} />)}
        </Menu>
        <TextInput mode="outlined" label="Number of attendees" keyboardType="number-pad" value={attendees}
          onChangeText={(t) => setAttendees(t.replace(/[^0-9]/g, ''))} style={{ marginTop: SPACING.sm }} />
        <HelperText type="error" visible={overCapacity}>
          ⚠️ {attendeeCount} people exceeds this room's capacity of {data?.room?.capacity}.
        </HelperText>
      </ScrollView>

      <View style={[styles.sticky, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
        <Button mode="contained" disabled={!range} onPress={goConfirm} contentStyle={{ paddingVertical: 6 }}>
          {range ? `Continue · ${formatRange(range.startMin, range.endMin)}` : 'Select a time slot'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACING.lg, marginBottom: SPACING.sm, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  legend: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sticky: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth },
});
