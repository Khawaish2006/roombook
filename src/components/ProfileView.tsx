// Shared profile screen for both roles: identity, settings, demo tools, logout.
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Avatar, Button, Card, Dialog, Divider, List, Portal, SegmentedButtons, Snackbar, Switch, Text, useTheme } from 'react-native-paper';
import { isAIConfigured } from '../ai/gemini';
import { resetDatabase } from '../db/database';
import { useCurrentUser, useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { sendTestReminder } from '../services/notificationService';
import { RADIUS, SPACING } from '../theme';

export function ProfileView() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const theme = useTheme();
  const settings = useSettings();
  const [snack, setSnack] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const isStudent = user.role === 'student';

  const testReminder = async () => {
    const ok = await sendTestReminder();
    setSnack(ok ? 'Test reminder will arrive in 10 seconds' : 'Notifications are disabled in settings');
  };

  const doReset = async () => {
    setResetOpen(false);
    await resetDatabase();
    setSnack('Demo data restored');
  };

  const doLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.md, paddingBottom: SPACING.xl }}>
      <Card style={{ borderRadius: RADIUS }}>
        <Card.Content style={{ alignItems: 'center', gap: 4, paddingVertical: SPACING.lg }}>
          <Avatar.Text size={72} label={initials} />
          <Text variant="titleLarge" style={{ fontWeight: '700', marginTop: SPACING.sm }}>{user.name}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{user.email}</Text>
          <Text variant="labelMedium" style={{ color: theme.colors.primary, textTransform: 'uppercase' }}>{user.role}</Text>
        </Card.Content>
      </Card>

      {isStudent && (
        <Card style={{ borderRadius: RADIUS, marginTop: SPACING.md }}>
          <List.Item title="Favourites" left={(p) => <List.Icon {...p} icon="heart-outline" />} right={(p) => <List.Icon {...p} icon="chevron-right" />} onPress={() => router.push('/favorites')} />
          <Divider />
          <List.Item title="My activity" description="Stats and ✨ AI insight" left={(p) => <List.Icon {...p} icon="chart-bar" />} right={(p) => <List.Icon {...p} icon="chevron-right" />} onPress={() => router.push('/activity')} />
        </Card>
      )}

      <List.Subheader>Settings</List.Subheader>
      <Card style={{ borderRadius: RADIUS }}>
        {isStudent && (
          <View style={{ padding: SPACING.md }}>
            <Text variant="bodyLarge" style={{ marginBottom: SPACING.sm }}>Reminder before booking</Text>
            <SegmentedButtons
              value={String(settings.reminderMin)}
              onValueChange={(v) => settings.setReminderMin(Number(v))}
              buttons={[{ value: '15', label: '15 min' }, { value: '30', label: '30 min' }, { value: '60', label: '1 hour' }]}
            />
          </View>
        )}
        <List.Item
          title="Dark mode"
          left={(p) => <List.Icon {...p} icon="theme-light-dark" />}
          right={() => <Switch value={settings.darkMode ?? theme.dark} onValueChange={settings.setDarkMode} />}
        />
        <List.Item
          title="AI features"
          description={isAIConfigured() ? 'Gemini connected' : 'No API key. Fallbacks in use.'}
          left={(p) => <List.Icon {...p} icon="creation" />}
        />
      </Card>

      <List.Subheader>Developer / demo</List.Subheader>
      <Card style={{ borderRadius: RADIUS }}>
        <List.Item title="Send test reminder" description="Fires in 10 seconds" left={(p) => <List.Icon {...p} icon="bell-ring-outline" />} onPress={testReminder} />
        <Divider />
        <List.Item title="Reset demo data" description="Re-seed rooms and bookings" left={(p) => <List.Icon {...p} icon="database-refresh" />} onPress={() => setResetOpen(true)} />
      </Card>

      <Button mode="outlined" icon="logout" style={{ marginTop: SPACING.lg }} onPress={doLogout}>Log out</Button>

      <Portal>
        <Dialog visible={resetOpen} onDismiss={() => setResetOpen(false)}>
          <Dialog.Title>Reset demo data?</Dialog.Title>
          <Dialog.Content><Text>All rooms, bookings and favourites will be replaced with the original demo data.</Text></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResetOpen(false)}>Keep data</Button>
            <Button onPress={doReset}>Reset</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)}>{snack}</Snackbar>
    </ScrollView>
  );
}
