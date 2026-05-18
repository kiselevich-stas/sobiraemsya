import { isSupabaseConfigured, supabase, SUPABASE_EVENTS_TABLE } from '@/lib/supabase';
import type { EventData } from '@/types/event';
import type { SupabaseEventRow } from '@/types/supabase';

export interface RepositoryResult<T> {
  data: T | null;
  error: string | null;
}

const getMissingConfigError = () => 'Supabase не настроен: приложение работает только через localStorage.';

export const isRemoteStorageEnabled = () => isSupabaseConfigured && Boolean(supabase);

export const saveRemoteEvent = async (event: EventData): Promise<RepositoryResult<EventData>> => {
  if (!supabase) {
    return { data: null, error: getMissingConfigError() };
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(SUPABASE_EVENTS_TABLE)
    .upsert(
      {
        id: event.id,
        payload: event,
        updated_at: now,
      },
      { onConflict: 'id' },
    )
    .select('payload')
    .single<SupabaseEventRow>();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data?.payload ?? event, error: null };
};

export const fetchRemoteEventById = async (eventId: string): Promise<RepositoryResult<EventData>> => {
  if (!supabase) {
    return { data: null, error: getMissingConfigError() };
  }

  const { data, error } = await supabase
    .from(SUPABASE_EVENTS_TABLE)
    .select('payload')
    .eq('id', eventId)
    .maybeSingle<SupabaseEventRow>();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data?.payload ?? null, error: null };
};

export const deleteRemoteEvent = async (eventId: string): Promise<RepositoryResult<boolean>> => {
  if (!supabase) {
    return { data: null, error: getMissingConfigError() };
  }

  const { error } = await supabase.from(SUPABASE_EVENTS_TABLE).delete().eq('id', eventId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: true, error: null };
};
