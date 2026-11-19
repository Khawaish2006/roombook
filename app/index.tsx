// Splash: shows the logo briefly, then redirects based on the saved session and role.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useAuth } from '../src/hooks/useAuth';

export default function Splash() {
  const { user, loading } = useAuth();
  const theme = useTheme();
  const [minTimeDone, setMinTimeDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeDone(true), 900);
    return () => clearTimeout(t);
  }, []);

  if (!loading && minTimeDone) {
    if (!user) return <Redirect href="/login" />;
    return <Redirect href={user.role === 'admin' ? '/(admin)/dashboard' : '/(student)/home'} />;
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary }}>
      <MaterialCommunityIcons name="door-open" size={84} color="#fff" />
      <Text variant="displaySmall" style={{ color: '#fff', fontWeight: '800', marginTop: 8 }}>RoomBook</Text>
      <Text style={{ color: '#E0E7FF', marginTop: 4 }}>Campus space booking</Text>
    </View>
  );
}
