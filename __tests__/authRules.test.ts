import { normalizeEmail, validateSignIn, validateSignUp } from '../src/services/authRules';

const valid = { name: 'Kanika Debnath', email: 'kanika@college.edu', password: 'secret1', confirmPassword: 'secret1' };

describe('validateSignUp', () => {
  it('accepts a valid form', () => {
    expect(validateSignUp(valid)).toEqual({});
  });
  it('requires a name', () => {
    expect(validateSignUp({ ...valid, name: ' ' }).name).toBeDefined();
  });
  it('rejects malformed emails', () => {
    expect(validateSignUp({ ...valid, email: 'kanika@' }).email).toMatch(/valid email/);
  });
  it('blocks creating admin accounts from the app', () => {
    expect(validateSignUp({ ...valid, email: 'Someone@Admin.ac' }).email).toMatch(/Admin accounts/);
  });
  it('enforces minimum password length', () => {
    expect(validateSignUp({ ...valid, password: '123', confirmPassword: '123' }).password).toMatch(/at least 6/);
  });
  it('requires matching passwords', () => {
    expect(validateSignUp({ ...valid, confirmPassword: 'other1' }).confirmPassword).toMatch(/do not match/);
  });
});

describe('validateSignIn', () => {
  it('needs a valid email and a password', () => {
    expect(validateSignIn('khawaish@admin.ac', 'x')).toBeNull();
    expect(validateSignIn('nope', 'x')).toMatch(/valid email/);
    expect(validateSignIn('khawaish@admin.ac', '')).toMatch(/password/);
  });
  it('normalizes emails so sign-in is case-insensitive', () => {
    expect(normalizeEmail('  Khawaish@Admin.AC ')).toBe('khawaish@admin.ac');
  });
});
