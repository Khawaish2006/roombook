import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Returns a tabBarIcon renderer for the given MaterialCommunityIcons name. */
export const tabIcon =
  (name: IconName) =>
  ({ color, size }: { color: ColorValue; size: number }) => (
    <MaterialCommunityIcons name={name} color={color as string} size={size} />
  );
