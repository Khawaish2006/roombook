// Sign in with email + password.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import { useAuth } from '../src/hooks/useAuth';
import { SPACING } from '../src/theme';

export default function Login() {
  const theme = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const err = await login(email, password);
    setBusy(false);
    if (err) setError(err);
    else router.replace('/');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="door-open" size={44} color="#fff" />
          </View>
          <Text variant="headlineMedium" style={{ fontWeight: '800', marginTop: SPACING.md }}>Welcome back</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Sign in to book campus spaces</Text>
        </View>

        <TextInput
          mode="outlined"
          label="Email"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(null); }}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          left={<TextInput.Icon icon="email-outline" />}
        />
        <TextInput
          mode="outlined"
          label="Password"
          value={password}
          onChangeText={(t) => { setPassword(t); setError(null); }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="password"
          onSubmitEditing={submit}
          style={{ marginTop: SPACING.sm }}
          left={<TextInput.Icon icon="lock-outline" />}
          right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword((v) => !v)} />}
        />
        <HelperText type="error" visible={!!error}>{error}</HelperText>

        <Button mode="contained" onPress={submit} loading={busy} disabled={busy} contentStyle={{ paddingVertical: 6 }}>
          Sign in
        </Button>
        <Button style={{ marginTop: SPACING.sm }} onPress={() => router.push('/signup')}>
          New here? Create an account
        </Button>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, padding: SPACING.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  logo: { width: 84, height: 84, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
