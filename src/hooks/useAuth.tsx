// Mock authentication: the user is looked up by email, and the session is kept in AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '../models';
import { findUserByEmail, findUserById } from '../repositories/userRepo';

const SESSION_KEY = 'session:userId';

interface AuthState {
  user: User | null;
  loading: boolean;
  /** Returns an error message, or null on success. */
  login: (email: string) => Promise<string | null>;
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

  const login = useCallback(async (email: string) => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Enter a valid email address.';
    const found = await findUserByEmail(email);
    if (!found) return 'No account found for this email.';
    await AsyncStorage.setItem(SESSION_KEY, found.id);
    setUser(found);
    return null;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
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
