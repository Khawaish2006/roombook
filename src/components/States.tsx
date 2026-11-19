// Shared loading skeletons, empty states and error states.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import type { ComponentProps } from 'react';
import { RADIUS, SPACING } from '../theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function EmptyState({
  icon = 'inbox-outline', title, message, actionLabel, onAction,
}: { icon?: IconName; title: string; message?: string; actionLabel?: string; onAction?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <MaterialCommunityIcons name={icon} size={56} color={theme.colors.outline} />
      <Text variant="titleMedium" style={{ marginTop: SPACING.sm }}>{title}</Text>
      {message && <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}>{message}</Text>}
      {actionLabel && onAction && <Button mode="contained-tonal" style={{ marginTop: SPACING.md }} onPress={onAction}>{actionLabel}</Button>}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <EmptyState icon="alert-circle-outline" title="Something went wrong" message={message} actionLabel={onRetry ? 'Try again' : undefined} onAction={onRetry} />;
}

/** Pulsing grey placeholder cards shown while a list loads. */
export function SkeletonList({ count = 4, height = 72 }: { count?: number; height?: number }) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View key={i} style={[styles.skeleton, { height, opacity, backgroundColor: theme.colors.surfaceVariant }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  skeleton: { borderRadius: RADIUS, marginBottom: SPACING.sm + 4 },
});
