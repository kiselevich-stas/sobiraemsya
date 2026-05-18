import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type PublishTelegramCardPayload = {
    eventId: string;
    sessionId: string;
};

type RepositoryResult<T> = {
    data: T | null;
    error: string | null;
};

export const publishTelegramEventCard = async (
    payload: PublishTelegramCardPayload,
): Promise<RepositoryResult<boolean>> => {
    if (!isSupabaseConfigured || !supabase) {
        return {
            data: null,
            error: 'Supabase не настроен, поэтому бот не может опубликовать карточку.',
        };
    }

    const { data, error } = await supabase.functions.invoke('telegram-publish-card', {
        body: payload,
    });

    if (error) {
        return {
            data: null,
            error: error.message,
        };
    }

    if (!data?.ok) {
        return {
            data: null,
            error: data?.error ?? 'Не удалось опубликовать карточку в Telegram.',
        };
    }

    return {
        data: true,
        error: null,
    };
};