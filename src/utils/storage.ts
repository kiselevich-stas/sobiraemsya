import type { EventData } from '@/types/event';

const STORAGE_KEY = 'sobiraemsya.events.v1';

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
