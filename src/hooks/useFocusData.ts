// Small helper used by every ViewModel hook: load data when the screen gains focus,
// expose loading / error / refreshing state, and allow manual reload (pull-to-refresh).
import { useFocusEffect } from 'expo-router';
import { DependencyList, useCallback, useRef, useState } from 'react';

export interface FocusData<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useFocusData<T>(loader: () => Promise<T>, deps: DependencyList): FocusData<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
    try {
      setError(null);
      setData(await loaderRef.current());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { reload(); }, [reload, ...deps]));

  return { data, loading, refreshing, error, reload, refresh };
}
