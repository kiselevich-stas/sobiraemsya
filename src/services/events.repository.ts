import { isSupabaseConfigured, supabase, SUPABASE_EVENTS_TABLE } from '@/lib/supabase';
import type { EventData } from '@/types/event';
import type { SupabaseEventRow } from '@/types/supabase';

export interface RepositoryResult<T> {
  data: T | null;
  error: string | null;
}

const getMissingConfigError = () => {
  return 'Supabase не настроен: приложение работает только через localStorage.';
};

export const isRemoteStorageEnabled = () => {
  return isSupabaseConfigured && Boolean(supabase);
};

const normalizeRemoteEvent = (row: SupabaseEventRow): EventData => {
  const event = row.payload;

  return {
    ...event,
    id: row.id,
    startsAt: event.startsAt ?? row.starts_at ?? undefined,
    creatorTelegramUserId:
        event.creatorTelegramUserId ?? row.creator_telegram_user_id ?? undefined,
    creatorTelegramUsername:
        event.creatorTelegramUsername ?? row.creator_telegram_username ?? undefined,
    sourceChatId: event.sourceChatId ?? row.source_chat_id ?? undefined,
    sourceChatTitle: event.sourceChatTitle ?? row.source_chat_title ?? undefined,
    money: event.money,
    items: event.items.map((item) => ({
      ...item,
      assignees:
          item.assignees ??
          (item.assigneeId && item.assigneeName
              ? [
                {
                  id: item.assigneeId,
                  name: item.assigneeName,
                },
              ]
              : []),
    })),
    participants: event.participants.map((participant) => ({
      ...participant,
      paidAmount: participant.paidAmount ?? 0,
    })),
    createdAt: event.createdAt ?? row.created_at,
    updatedAt: event.updatedAt ?? row.updated_at,
  };
};

export const saveRemoteEvent = async (
    event: EventData,
): Promise<RepositoryResult<EventData>> => {
  if (!supabase) {
    return {
      data: null,
      error: getMissingConfigError(),
    };
  }

  const now = new Date().toISOString();

  const eventToSave: EventData = {
    ...event,
    updatedAt: event.updatedAt || now,
  };

  const { data, error } = await supabase
      .from(SUPABASE_EVENTS_TABLE)
      .upsert(
          {
            id: eventToSave.id,
            payload: eventToSave,
            creator_telegram_user_id: eventToSave.creatorTelegramUserId ?? null,
            creator_telegram_username: eventToSave.creatorTelegramUsername ?? null,
            source_chat_id: eventToSave.sourceChatId ?? null,
            source_chat_title: eventToSave.sourceChatTitle ?? null,
            starts_at: eventToSave.startsAt ?? null,
            updated_at: now,
          },
          {
            onConflict: 'id',
          },
      )
      .select(
          'id,payload,creator_telegram_user_id,creator_telegram_username,source_chat_id,source_chat_title,starts_at,created_at,updated_at',
      )
      .single();

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  return {
    data: data ? normalizeRemoteEvent(data as SupabaseEventRow) : eventToSave,
    error: null,
  };
};

export const fetchRemoteEventById = async (
    eventId: string,
): Promise<RepositoryResult<EventData>> => {
  if (!supabase) {
    return {
      data: null,
      error: getMissingConfigError(),
    };
  }

  const { data, error } = await supabase
      .from(SUPABASE_EVENTS_TABLE)
      .select(
          'id,payload,creator_telegram_user_id,creator_telegram_username,source_chat_id,source_chat_title,starts_at,created_at,updated_at',
      )
      .eq('id', eventId)
      .maybeSingle();

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  return {
    data: data ? normalizeRemoteEvent(data as SupabaseEventRow) : null,
    error: null,
  };
};

export const fetchRemoteEventsByCreator = async (
    creatorTelegramUserId: string,
): Promise<RepositoryResult<EventData[]>> => {
  if (!supabase) {
    return {
      data: null,
      error: getMissingConfigError(),
    };
  }

  const { data, error } = await supabase
      .from(SUPABASE_EVENTS_TABLE)
      .select(
          'id,payload,creator_telegram_user_id,creator_telegram_username,source_chat_id,source_chat_title,starts_at,created_at,updated_at',
      )
      .eq('creator_telegram_user_id', creatorTelegramUserId)
      .order('created_at', {
        ascending: false,
      });

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  return {
    data: (data ?? []).map((row) => normalizeRemoteEvent(row as SupabaseEventRow)),
    error: null,
  };
};

export const deleteRemoteEvent = async (
    eventId: string,
): Promise<RepositoryResult<boolean>> => {
  if (!supabase) {
    return {
      data: null,
      error: getMissingConfigError(),
    };
  }

  const { error } = await supabase.from(SUPABASE_EVENTS_TABLE).delete().eq('id', eventId);

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  return {
    data: true,
    error: null,
  };
};

export const fetchRemoteLatestEvents = async (
    limit = 6,
): Promise<RepositoryResult<EventData[]>> => {
  if (!supabase) {
    return {
      data: null,
      error: getMissingConfigError(),
    };
  }

  const { data, error } = await supabase
      .from(SUPABASE_EVENTS_TABLE)
      .select(
          'id,payload,creator_telegram_user_id,creator_telegram_username,source_chat_id,source_chat_title,starts_at,created_at,updated_at',
      )
      .order('created_at', {
        ascending: false,
      })
      .limit(limit);

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  return {
    data: (data ?? []).map((row) => normalizeRemoteEvent(row as SupabaseEventRow)),
    error: null,
  };
};
