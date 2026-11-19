// Sign up: creates a new student account and logs it in.
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import { useAuth } from '../src/hooks/useAuth';
import { FieldErrors, MIN_PASSWORD_LENGTH, SignUpInput } from '../src/services/authRules';
import { SPACING } from '../src/theme';

export default function SignUp() {
  const theme = useTheme();
  const { register } = useAuth();
  const [form, setForm] = useState<SignUpInput>({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (field: keyof SignUpInput) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = async () => {
    setBusy(true);
    const result = await register(form);
    setBusy(false);
    if (result) setErrors(result);
    else router.replace('/'); // splash redirects to the student tabs
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <Text variant="headlineMedium" style={{ fontWeight: '800' }}>Create account</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: SPACING.lg }}>
          Student accounts can browse and book rooms.
        </Text>

        <TextInput mode="outlined" label="Full name" value={form.name} onChangeText={set('name')}
          autoComplete="name" left={<TextInput.Icon icon="account-outline" />} />
        <HelperText type="error" visible={!!errors.name}>{errors.name}</HelperText>

        <TextInput mode="outlined" label="Email" value={form.email} onChangeText={set('email')}
          autoCapitalize="none" keyboardType="email-address" autoComplete="email" left={<TextInput.Icon icon="email-outline" />} />
        <HelperText type="error" visible={!!errors.email}>{errors.email}</HelperText>

        <TextInput mode="outlined" label="Password" value={form.password} onChangeText={set('password')}
          secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="new-password"
          left={<TextInput.Icon icon="lock-outline" />}
          right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword((v) => !v)} />} />
        <HelperText type={errors.password ? 'error' : 'info'} visible>
          {errors.password ?? `At least ${MIN_PASSWORD_LENGTH} characters`}
        </HelperText>

        <TextInput mode="outlined" label="Confirm password" value={form.confirmPassword} onChangeText={set('confirmPassword')}
          secureTextEntry={!showPassword} autoCapitalize="none" onSubmitEditing={submit}
          left={<TextInput.Icon icon="lock-check-outline" />} />
        <HelperText type="error" visible={!!errors.confirmPassword}>{errors.confirmPassword}</HelperText>

        <Button mode="contained" onPress={submit} loading={busy} disabled={busy} contentStyle={{ paddingVertical: 6 }}>
          Sign up
        </Button>
        <Button style={{ marginTop: SPACING.sm }} onPress={() => router.back()}>
          Already have an account? Sign in
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, padding: SPACING.lg, justifyContent: 'center' },
});
