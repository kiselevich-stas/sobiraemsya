import type { EventData } from '@/types/event';

export interface SupabaseEventRow {
  id: string;
  payload: EventData;
  creator_telegram_user_id?: string | null;
  creator_telegram_username?: string | null;
  source_chat_id?: string | null;
  source_chat_title?: string | null;
  starts_at?: string | null;
  created_at: string;
  updated_at: string;
}