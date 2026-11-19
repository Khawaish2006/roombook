// Mock login: email only, plus one-tap demo account chips.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import { useAuth } from '../src/hooks/useAuth';
import { SPACING } from '../src/theme';

const DEMO = [
  { label: 'Student: Khushi', email: 'khushi@college.edu', icon: 'school' },
  { label: 'Student: Riya', email: 'riya@college.edu', icon: 'school' },
  { label: 'Admin', email: 'admin@college.edu', icon: 'shield-account' },
];

export default function Login() {
  const theme = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (value = email) => {
    setBusy(true);
    const err = await login(value);
    setBusy(false);
    if (err) setError(err);
    else router.replace('/');
  };

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: theme.colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
          <MaterialCommunityIcons name="door-open" size={44} color="#fff" />
        </View>
        <Text variant="headlineMedium" style={{ fontWeight: '800', marginTop: SPACING.md }}>Welcome to RoomBook</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Find and reserve campus spaces in seconds</Text>
      </View>

      <TextInput
        mode="outlined"
        label="College email"
        value={email}
        onChangeText={(t) => { setEmail(t); setError(null); }}
        autoCapitalize="none"
        keyboardType="email-address"
        left={<TextInput.Icon icon="email-outline" />}
      />
      <HelperText type="error" visible={!!error}>{error}</HelperText>
      <Button mode="contained" onPress={() => submit()} loading={busy} disabled={busy} contentStyle={{ paddingVertical: 6 }}>
        Sign in
      </Button>

      <Text variant="labelLarge" style={{ marginTop: SPACING.xl, marginBottom: SPACING.sm, color: theme.colors.onSurfaceVariant }}>
        Demo accounts
      </Text>
      <View style={styles.chips}>
        {DEMO.map((d) => (
          <Chip key={d.email} icon={d.icon} onPress={() => { setEmail(d.email); setError(null); }}>
            {d.label}
          </Chip>
        ))}
      </View>
      <Text variant="bodySmall" style={{ marginTop: SPACING.md, color: theme.colors.onSurfaceVariant }}>
        Mock sign-in for the lab demo. No password needed.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: SPACING.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  logo: { width: 84, height: 84, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
