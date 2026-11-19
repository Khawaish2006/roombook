// Local authentication: passwords are checked against salted hashes in SQLite,
// and the logged-in user id is kept in AsyncStorage so the session survives restarts.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '../models';
import { findUserById } from '../repositories/userRepo';
import { FieldErrors, SignUpInput } from '../services/authRules';
import { signIn, signUp } from '../services/authService';

// "v2" because the user list changed with passwords; older saved sessions are ignored.
const SESSION_KEY = 'session:v2:userId';

interface AuthState {
  user: User | null;
  loading: boolean;
  /** Returns an error message, or null on success. */
  login: (email: string, password: string) => Promise<string | null>;
  /** Returns field errors, or null on success (the new user is logged in). */
  register: (input: SignUpInput) => Promise<FieldErrors | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the saved session on launch.
  useEffect(() => {
    (async () => {
      try {
        const id = await AsyncStorage.getItem(SESSION_KEY);
        if (id) setUser(await findUserById(id));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const startSession = useCallback(async (u: User) => {
    await AsyncStorage.setItem(SESSION_KEY, u.id);
    setUser(u);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (!result.ok) return result.error;
    await startSession(result.user);
    return null;
  }, [startSession]);

  const register = useCallback(async (input: SignUpInput) => {
    const result = await signUp(input);
    if (!result.ok) return result.errors;
    await startSession(result.user);
    return null;
  }, [startSession]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** For screens that are only reachable when logged in. */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('No logged-in user');
  return user;
}
