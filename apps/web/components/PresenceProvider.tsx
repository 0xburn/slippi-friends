'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';

export type PresenceStatus = 'online' | 'in-game' | 'offline';

export type PresenceEntry = {
  userId: string;
  status: PresenceStatus;
  currentCharacter: number | null;
  updatedAt: string;
};

type PresenceContextValue = {
  presenceByUserId: Record<string, PresenceEntry>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getPresence: (userId: string) => PresenceEntry | undefined;
  onlineEntries: PresenceEntry[];
};

const PresenceContext = createContext<PresenceContextValue | null>(null);

function normalizeStatus(raw: string | null | undefined): PresenceStatus {
  if (raw === 'in-game' || raw === 'online' || raw === 'offline') return raw;
  return 'offline';
}

export function PresenceProvider({ children }: { children: ReactNode }) {
  const [presenceByUserId, setPresenceByUserId] = useState<Record<string, PresenceEntry>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mergeRow = useCallback(
    (row: {
      user_id: string;
      status: string;
      current_character: number | null;
      updated_at: string;
    }) => {
      setPresenceByUserId((prev) => ({
        ...prev,
        [row.user_id]: {
          userId: row.user_id,
          status: normalizeStatus(row.status),
          currentCharacter: row.current_character,
          updatedAt: row.updated_at,
        },
      }));
    },
    []
  );

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data, error: qErr } = await supabase
      .from('presence_log')
      .select('user_id, status, current_character, updated_at')
      .in('status', ['online', 'in-game']);

    if (qErr) {
      setError(qErr.message);
      setLoading(false);
      return;
    }

    const next: Record<string, PresenceEntry> = {};
    for (const row of data ?? []) {
      next[row.user_id] = {
        userId: row.user_id,
        status: normalizeStatus(row.status),
        currentCharacter: row.current_character,
        updatedAt: row.updated_at,
      };
    }
    setPresenceByUserId(next);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('presence_log_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'presence_log' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as { user_id?: string } | null;
            if (oldRow?.user_id) {
              setPresenceByUserId((prev) => {
                const next = { ...prev };
                delete next[oldRow.user_id!];
                return next;
              });
            }
            return;
          }
          const row = payload.new as {
            user_id?: string;
            status?: string;
            current_character?: number | null;
            updated_at?: string;
          } | null;
          if (!row?.user_id) return;
          if (row.status === 'offline') {
            setPresenceByUserId((prev) => {
              const { [row.user_id!]: _, ...rest } = prev;
              return rest;
            });
            return;
          }
          mergeRow({
            user_id: row.user_id,
            status: row.status ?? 'offline',
            current_character: row.current_character ?? null,
            updated_at: row.updated_at ?? new Date().toISOString(),
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [mergeRow]);

  const getPresence = useCallback(
    (userId: string) => presenceByUserId[userId],
    [presenceByUserId]
  );

  const onlineEntries = useMemo(
    () => Object.values(presenceByUserId).filter((p) => p.status !== 'offline'),
    [presenceByUserId]
  );

  const value = useMemo(
    () => ({
      presenceByUserId,
      loading,
      error,
      refresh,
      getPresence,
      onlineEntries,
    }),
    [presenceByUserId, loading, error, refresh, getPresence, onlineEntries]
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) {
    throw new Error('usePresence must be used within PresenceProvider');
  }
  return ctx;
}
