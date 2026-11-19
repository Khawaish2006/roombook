import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Card, IconButton, Text, useTheme } from 'react-native-paper';
import { Room } from '../models';
import { RADIUS, ROOM_TYPE_META, SPACING, STATUS } from '../theme';
import { FacilityIconRow } from './FacilityIcon';

interface Props {
  room: Room;
  freeNow?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  compact?: boolean; // for horizontal lists on Home
}

export function RoomCard({ room, freeNow, isFavorite, onToggleFavorite, compact }: Props) {
  const theme = useTheme();
  const meta = ROOM_TYPE_META[room.type];

  return (
    <Card
      style={[styles.card, compact && styles.compact]}
      mode="elevated"
      onPress={() => router.push(`/room/${room.id}`)}
    >
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: meta.color + '1A' }]}>
          <MaterialCommunityIcons name={meta.icon} size={26} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text variant="titleMedium" numberOfLines={1} style={{ flexShrink: 1 }}>
              {room.name}
            </Text>
            {freeNow !== undefined && (
              <View style={[styles.dot, { backgroundColor: freeNow ? STATUS.available : STATUS.booked }]} />
            )}
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
            {meta.label} · {room.block} · 👥 {room.capacity}
          </Text>
          {!compact && (
            <View style={{ marginTop: 6 }}>
              <FacilityIconRow facilities={room.facilities} />
            </View>
          )}
        </View>
        {onToggleFavorite && (
          <IconButton
            icon={isFavorite ? 'heart' : 'heart-outline'}
            iconColor={isFavorite ? STATUS.booked : theme.colors.onSurfaceVariant}
            onPress={onToggleFavorite}
            accessibilityLabel={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS, marginBottom: SPACING.sm + 4 },
  compact: { width: 240, marginRight: SPACING.sm + 4, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm + 4, gap: SPACING.sm + 4 },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
