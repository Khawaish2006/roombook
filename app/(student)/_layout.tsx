// Student bottom tabs. Redirects away if not logged in as a student.
import { Redirect, Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { tabIcon as icon } from '../../src/components/TabIcon';
import { useAuth } from '../../src/hooks/useAuth';

export default function StudentLayout() {
  const { user } = useAuth();
  const theme = useTheme();
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'student') return <Redirect href="/(admin)/dashboard" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', headerShown: false, tabBarIcon: icon('home-variant') }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: icon('magnify') }} />
      <Tabs.Screen name="bookings" options={{ title: 'My Bookings', tabBarLabel: 'Bookings', tabBarIcon: icon('calendar-check') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('account-circle') }} />
    </Tabs>
  );
}
