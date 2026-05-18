import type { EventData } from '@/types/event';

export interface SupabaseEventRow {
  id: string;
  payload: EventData;
  created_at: string;
  updated_at: string;
}
