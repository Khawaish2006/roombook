// Pure sign-in / sign-up validation (no database, no crypto). Unit-tested in __tests__/authRules.test.ts.

/** Emails on this domain belong to admins and can't be created from the Sign up screen. */
export const ADMIN_EMAIL_DOMAIN = '@admin.ac';
export const MIN_PASSWORD_LENGTH = 6;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type FieldErrors = Partial<Record<keyof SignUpInput, string>>;

/** Returns an error per field; an empty object means the form is valid. */
export function validateSignUp(input: SignUpInput): FieldErrors {
  const errors: FieldErrors = {};
  const email = normalizeEmail(input.email);

  if (input.name.trim().length < 2) errors.name = 'Enter your full name.';
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  else if (email.endsWith(ADMIN_EMAIL_DOMAIN)) errors.email = "Admin accounts can't be created from the app.";
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (input.confirmPassword !== input.password) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

export function validateSignIn(email: string, password: string): string | null {
  if (!EMAIL_RE.test(normalizeEmail(email))) return 'Enter a valid email address.';
  if (!password) return 'Enter your password.';
  return null;
}
