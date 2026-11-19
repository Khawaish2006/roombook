// Root layout: initialises the database, theme, notifications and auth before any screen renders.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { ActivityIndicator, PaperProvider, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from '../src/db/database';
import { AuthProvider } from '../src/hooks/useAuth';
import { SettingsProvider, useSettings } from '../src/hooks/useSettings';
import { configureNotifications } from '../src/services/notificationService';
import { darkTheme, lightTheme } from '../src/theme';

configureNotifications();

function ThemedApp() {
  const system = useColorScheme();
  const { darkMode } = useSettings();
  const isDark = darkMode ?? system === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((e) => setDbError(String(e)));
  }, []);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {!dbReady ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
          {dbError ? <Text>Database error: {dbError}</Text> : <ActivityIndicator size="large" />}
        </View>
      ) : (
        <AuthProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: theme.colors.surface },
              headerTintColor: theme.colors.onSurface,
              contentStyle: { backgroundColor: theme.colors.background },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ title: '', headerTransparent: true }} />
            <Stack.Screen name="(student)" options={{ headerShown: false }} />
            <Stack.Screen name="(admin)" options={{ headerShown: false }} />
            <Stack.Screen name="room/[id]" options={{ title: 'Room details' }} />
            <Stack.Screen name="room/[id]/availability" options={{ title: 'Pick a time' }} />
            <Stack.Screen name="booking/confirm" options={{ title: 'Review booking' }} />
            <Stack.Screen name="booking/success/[id]" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="booking/[id]" options={{ title: 'Booking details' }} />
            <Stack.Screen name="favorites" options={{ title: 'Favourites' }} />
            <Stack.Screen name="activity" options={{ title: 'My activity' }} />
            <Stack.Screen name="admin/room-form" options={{ title: 'Room' }} />
          </Stack>
        </AuthProvider>
      )}
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ThemedApp />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
