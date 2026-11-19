// App settings (dark mode, reminder offset) persisted in AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { CONFIG } from '../config';

interface Settings {
  /** null = follow the phone's setting. */
  darkMode: boolean | null;
  reminderMin: number;
}

interface SettingsState extends Settings {
  setDarkMode: (v: boolean) => void;
  setReminderMin: (v: number) => void;
}

const KEY = 'settings';
const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({ darkMode: null, reminderMin: CONFIG.defaultReminderMin });

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) setSettings((s) => ({ ...s, ...JSON.parse(raw) }));
    });
  }, []);

  const update = (patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setDarkMode: (darkMode) => update({ darkMode }),
        setReminderMin: (reminderMin) => update({ reminderMin }),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
