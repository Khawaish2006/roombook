import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Facility } from '../models';
import { FACILITY_META } from '../theme';

export function FacilityIcon({ facility, size = 16 }: { facility: Facility; size?: number }) {
  const theme = useTheme();
  return <MaterialCommunityIcons name={FACILITY_META[facility].icon} size={size} color={theme.colors.onSurfaceVariant} />;
}

export function FacilityIconRow({ facilities }: { facilities: Facility[] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {facilities.map((f) => (
        <FacilityIcon key={f} facility={f} />
      ))}
    </View>
  );
}
