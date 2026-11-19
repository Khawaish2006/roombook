// Simple bar chart rows built from plain Views (no chart library needed).
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { RADIUS, SPACING } from '../theme';

export function StatBar({ label, value, max, color, suffix = '' }: { label: string; value: number; max: number; color?: string; suffix?: string }) {
  const theme = useTheme();
  const pct = max > 0 ? Math.max(value / max, value > 0 ? 0.04 : 0) : 0;
  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <View style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color ?? theme.colors.primary }]} />
      </View>
      <Text style={styles.value}>{value}{suffix}</Text>
    </View>
  );
}

export function StatTile({ label, value, color }: { label: string; value: number | string; color?: string }) {
  const theme = useTheme();
  return (
    <Card style={styles.tile}>
      <Card.Content style={{ paddingVertical: SPACING.sm + 4 }}>
        <Text variant="headlineSmall" style={{ fontWeight: '700', color: color ?? theme.colors.primary }}>{value}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  label: { width: 90, fontSize: 13 },
  track: { flex: 1, height: 14, borderRadius: 7, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 7 },
  value: { width: 40, textAlign: 'right', fontSize: 13, fontWeight: '600' },
  tile: { flexGrow: 1, flexBasis: '45%', borderRadius: RADIUS },
});
