// Admin bottom tabs. Redirects away if not logged in as admin.
import { Redirect, Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { AccountButton } from '../../src/components/AccountButton';
import { tabIcon as icon } from '../../src/components/TabIcon';
import { useAuth } from '../../src/hooks/useAuth';

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const theme = useTheme();
  if (loading) return null; // wait for the saved session before deciding (matters for web deep links)
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'admin') return <Redirect href="/(student)/home" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant, // default is dark grey, invisible in dark mode
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: theme.colors.background },
        // Account avatar on every admin tab: tap → Log out / Switch account.
        headerRight: () => <AccountButton />,
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: icon('view-dashboard') }} />
      <Tabs.Screen name="rooms" options={{ title: 'Manage rooms', tabBarLabel: 'Rooms', tabBarIcon: icon('door') }} />
      <Tabs.Screen name="bookings" options={{ title: 'All bookings', tabBarLabel: 'Bookings', tabBarIcon: icon('calendar-multiple') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('account-circle') }} />
    </Tabs>
  );
}
