import {
    isSupabaseConfigured,
    supabase,
    SUPABASE_USER_PROFILES_TABLE,
} from '@/lib/supabase';
import type { CurrentUser } from '@/types/event';
import type { UserProfile } from '@/types/profile';
import type { SupabaseUserProfileRow } from '@/types/supabase';

export interface RepositoryResult<T> {
    data: T | null;
    error: string | null;
}

const USER_PROFILE_SELECT = `
  telegram_user_id,
  telegram_username,
  telegram_name,
  avatar_emoji,
  created_at,
  updated_at
`;

const getMissingConfigError = () => {
    return 'Supabase не настроен: профиль сохранён только локально.';
};

const getUserStorageId = (user: CurrentUser) => {
    return user.telegramId ? String(user.telegramId) : user.id;
};

const normalizeRemoteProfile = (row: SupabaseUserProfileRow): UserProfile => {
    return {
        displayName: row.telegram_name ?? '',
        avatarEmoji: row.avatar_emoji,
    };
};

export const fetchRemoteUserProfile = async (
    user: CurrentUser,
): Promise<RepositoryResult<UserProfile>> => {
    if (!isSupabaseConfigured || !supabase) {
        return {
            data: null,
            error: getMissingConfigError(),
        };
    }

    const { data, error } = await supabase
        .from(SUPABASE_USER_PROFILES_TABLE)
        .select(USER_PROFILE_SELECT)
        .eq('telegram_user_id', getUserStorageId(user))
        .maybeSingle();

    if (error) {
        return {
            data: null,
            error: error.message,
        };
    }

    return {
        data: data ? normalizeRemoteProfile(data as SupabaseUserProfileRow) : null,
        error: null,
    };
};

export const upsertRemoteUserProfile = async (
    user: CurrentUser,
    profile: UserProfile,
): Promise<RepositoryResult<UserProfile>> => {
    if (!isSupabaseConfigured || !supabase) {
        return {
            data: null,
            error: getMissingConfigError(),
        };
    }

    const { data, error } = await supabase
        .from(SUPABASE_USER_PROFILES_TABLE)
        .upsert(
            {
                telegram_user_id: getUserStorageId(user),
                telegram_username: user.username ?? null,
                telegram_name: profile.displayName.trim() || user.name,
                avatar_emoji: profile.avatarEmoji,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: 'telegram_user_id',
            },
        )
        .select(USER_PROFILE_SELECT)
        .single();

    if (error) {
        return {
            data: null,
            error: error.message,
        };
    }

    return {
        data: data ? normalizeRemoteProfile(data as SupabaseUserProfileRow) : profile,
        error: null,
    };
};