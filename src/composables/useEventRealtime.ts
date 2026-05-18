import { onBeforeUnmount, ref, type Ref } from 'vue';
import { isSupabaseConfigured, supabase, SUPABASE_EVENTS_TABLE } from '@/lib/supabase';
import type { EventData } from '@/types/event';
import type { SupabaseEventRow } from '@/types/supabase';

export const useEventRealtime = (eventId: Ref<string>, onEventChanged: (event: EventData) => void) => {
  const isRealtimeConnected = ref(false);
  const realtimeError = ref<string | null>(null);
  let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;

  const subscribe = () => {
    if (!isSupabaseConfigured || !supabase || channel || !eventId.value) {
      return;
    }

    channel = supabase
      .channel(`sobiraemsya-event-${eventId.value}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: SUPABASE_EVENTS_TABLE,
          filter: `id=eq.${eventId.value}`,
        },
        (payload) => {
          const row = payload.new as SupabaseEventRow | null;
          if (row?.payload) {
            onEventChanged(row.payload);
          }
        },
      )
      .subscribe((status) => {
        isRealtimeConnected.value = status === 'SUBSCRIBED';
        if (status === 'CHANNEL_ERROR') {
          realtimeError.value = 'Realtime-канал не подключился. Проверь настройки Supabase Realtime.';
        }
      });
  };

  const unsubscribe = () => {
    if (!supabase || !channel) {
      return;
    }

    void supabase.removeChannel(channel);
    channel = null;
    isRealtimeConnected.value = false;
  };

  onBeforeUnmount(unsubscribe);

  return {
    isRealtimeConnected,
    realtimeError,
    subscribe,
    unsubscribe,
  };
};
