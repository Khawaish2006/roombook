import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Slot } from '../services/slotService';
import { PRIMARY, STATUS } from '../theme';
import { formatMin } from '../utils/time';

const COLORS = { available: STATUS.available, booked: STATUS.booked, past: STATUS.past };

/** Hourly slot chip for the availability grid. */
export function SlotChip({ slot, selected, onPress }: { slot: Slot; selected: boolean; onPress: () => void }) {
  const color = selected ? PRIMARY : COLORS[slot.state];
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { borderColor: color, backgroundColor: selected ? PRIMARY : color + '18' }]}
      accessibilityLabel={`${formatMin(slot.startMin)} ${slot.state}${selected ? ', selected' : ''}`}
    >
      <Text style={{ color: selected ? '#fff' : color, fontWeight: '600', fontSize: 13 }}>{formatMin(slot.startMin)}</Text>
    </Pressable>
  );
}

/** One row of the "Today's timeline" on Room Details. */
export function TimelineRow({ slot }: { slot: Slot }) {
  const theme = useTheme();
  const color = COLORS[slot.state];
  const label = { available: 'Available', booked: 'Booked', past: 'Past' }[slot.state];
  return (
    <View style={[styles.timelineRow, { borderBottomColor: theme.colors.outlineVariant }]}>
      <Text style={{ width: 90 }}>{formatMin(slot.startMin)}</Text>
      <View style={[styles.bar, { backgroundColor: color + '33', borderLeftColor: color }]}>
        <Text style={{ color, fontWeight: '600', fontSize: 12 }}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { width: '30%', paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  timelineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  bar: { flex: 1, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderLeftWidth: 4 },
});
