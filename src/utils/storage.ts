import type { EventData } from '@/types/event';
import type { UserProfile } from '@/types/profile';

const STORAGE_KEY = 'sobiraemsya.events.v1';
const PROFILE_STORAGE_KEY = 'sobiraemsya.profile.v1';

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const loadEventsFromStorage = (): EventData[] => {
  if (!isBrowser()) {
    return [];
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as EventData[];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

export const saveEventsToStorage = (events: EventData[]) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
};

export const loadProfileFromStorage = (): UserProfile | null => {
  if (!isBrowser()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<UserProfile>;

    if (!parsedValue || typeof parsedValue !== 'object') {
      return null;
    }

    return {
      displayName: typeof parsedValue.displayName === 'string' ? parsedValue.displayName : '',
      avatarEmoji: typeof parsedValue.avatarEmoji === 'string' ? parsedValue.avatarEmoji : '🙂',
    };
  } catch {
    return null;
  }
};

export const saveProfileToStorage = (profile: UserProfile) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
};
