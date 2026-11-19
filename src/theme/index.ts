// Colours, spacing and the react-native-paper themes (light + dark).
import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import { Facility, RoomType } from '../models';

export const PRIMARY = '#4F46E5';

export const STATUS = {
  available: '#16A34A',
  booked: '#DC2626',
  soon: '#F59E0B',
  past: '#9CA3AF',
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const RADIUS = 14;

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const ROOM_TYPE_META: Record<RoomType, { label: string; plural: string; icon: IconName; color: string }> = {
  study_room: { label: 'Study room', plural: 'Study Rooms', icon: 'book-open-variant', color: '#0EA5E9' },
  classroom: { label: 'Classroom', plural: 'Classrooms', icon: 'google-classroom', color: '#4F46E5' },
  seminar_hall: { label: 'Seminar hall', plural: 'Seminar Halls', icon: 'presentation', color: '#DB2777' },
  lab: { label: 'Lab', plural: 'Labs', icon: 'desktop-classic', color: '#059669' },
};

export const FACILITY_META: Record<Facility, { label: string; icon: IconName }> = {
  projector: { label: 'Projector', icon: 'projector' },
  whiteboard: { label: 'Whiteboard', icon: 'draw' },
  wifi: { label: 'Wi-Fi', icon: 'wifi' },
  ac: { label: 'AC', icon: 'snowflake' },
  computers: { label: 'Computers', icon: 'monitor' },
  smart_board: { label: 'Smart board', icon: 'television-guide' },
  mic: { label: 'Mic', icon: 'microphone' },
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: PRIMARY,
    primaryContainer: '#E0E7FF',
    onPrimaryContainer: '#1E1B4B',
    secondaryContainer: '#E0E7FF',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 3,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#A5B4FC',
    primaryContainer: '#3730A3',
    onPrimaryContainer: '#E0E7FF',
    secondaryContainer: '#312E81',
    background: '#0B1120',
    surface: '#111827',
    surfaceVariant: '#1F2937',
  },
};
