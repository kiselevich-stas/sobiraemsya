import { defineStore } from 'pinia';
import type { CreateEventPayload, CurrentUser, EventData, EventItem, EventParticipant, ItemStatus, ParticipantStatus } from '@/types/event';
import { createId } from '@/utils/id';
import { loadEventsFromStorage, saveEventsToStorage } from '@/utils/storage';
import { deleteRemoteEvent, fetchRemoteEventById, isRemoteStorageEnabled, saveRemoteEvent } from '@/services/events.repository';

interface EventsState {
  events: EventData[];
  isHydrated: boolean;
  isSyncing: boolean;
  syncError: string | null;
  lastSyncedAt: string | null;
}

const createEventItems = (items: string[]): EventItem[] => {
  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({
      id: createId('item'),
      title: item,
      status: 'free' as ItemStatus,
    }));
};

const createParticipant = (user: CurrentUser, status: ParticipantStatus): EventParticipant => {
  const now = new Date().toISOString();

  return {
    id: user.id,
    telegramId: user.telegramId,
    name: user.name,
    status,
    hasPaid: false,
    joinedAt: now,
    updatedAt: now,
  };
};

const sortEventsByUpdatedAt = (events: EventData[]) => {
  return [...events].sort((firstEvent, secondEvent) => {
    return new Date(secondEvent.updatedAt).getTime() - new Date(firstEvent.updatedAt).getTime();
  });
};

export const useEventsStore = defineStore('events', {
  state: (): EventsState => ({
    events: [],
    isHydrated: false,
    isSyncing: false,
    syncError: null,
    lastSyncedAt: null,
  }),

  getters: {
    getEventById: (state) => {
      return (eventId: string) => state.events.find((event) => event.id === eventId) ?? null;
    },
    isRemoteEnabled: () => isRemoteStorageEnabled(),
  },

  actions: {
    hydrate() {
      if (this.isHydrated) {
        return;
      }

      this.events = sortEventsByUpdatedAt(loadEventsFromStorage());
      this.isHydrated = true;
    },

    persist() {
      this.events = sortEventsByUpdatedAt(this.events);
      saveEventsToStorage(this.events);
    },

    async createEvent(payload: CreateEventPayload) {
      const now = new Date().toISOString();
      const event: EventData = {
        id: createId('event'),
        title: payload.title.trim(),
        templateId: payload.templateId,
        startsAt: payload.startsAt || undefined,
        place: payload.place?.trim() || undefined,
        description: payload.description?.trim() || undefined,
        money: {
          enabled: payload.money.enabled,
          mode: payload.money.mode,
          amount: payload.money.enabled ? payload.money.amount : null,
          currency: payload.money.currency,
        },
        items: createEventItems(payload.items),
        participants: [],
        createdAt: now,
        updatedAt: now,
      };

      this.events.unshift(event);
      this.persist();
      await this.syncEvent(event.id);

      return event;
    },

    importEvent(event: EventData, options: { persistRemote?: boolean } = {}) {
      const existingEventIndex = this.events.findIndex((savedEvent) => savedEvent.id === event.id);

      if (existingEventIndex >= 0) {
        this.events[existingEventIndex] = event;
      } else {
        this.events.unshift(event);
      }

      this.persist();

      if (options.persistRemote) {
        void this.syncEvent(event.id);
      }
    },

    async loadEvent(eventId: string) {
      this.hydrate();

      if (!isRemoteStorageEnabled()) {
        return this.getEventById(eventId);
      }

      this.isSyncing = true;
      this.syncError = null;

      const result = await fetchRemoteEventById(eventId);
      this.isSyncing = false;

      if (result.error) {
        this.syncError = result.error;
        return this.getEventById(eventId);
      }

      if (result.data) {
        this.importEvent(result.data);
        this.lastSyncedAt = new Date().toISOString();
        return result.data;
      }

      return this.getEventById(eventId);
    },

    async syncEvent(eventId: string) {
      if (!isRemoteStorageEnabled()) {
        return;
      }

      const event = this.getEventById(eventId);
      if (!event) {
        return;
      }

      this.isSyncing = true;
      this.syncError = null;

      const result = await saveRemoteEvent(event);
      this.isSyncing = false;

      if (result.error) {
        this.syncError = result.error;
        return;
      }

      if (result.data) {
        this.importEvent(result.data);
      }

      this.lastSyncedAt = new Date().toISOString();
    },

    async deleteEvent(eventId: string) {
      this.events = this.events.filter((event) => event.id !== eventId);
      this.persist();

      if (isRemoteStorageEnabled()) {
        const result = await deleteRemoteEvent(eventId);
        if (result.error) {
          this.syncError = result.error;
        }
      }
    },

    upsertParticipant(eventId: string, user: CurrentUser, status: ParticipantStatus) {
      const event = this.getEventById(eventId);
      if (!event) {
        return;
      }

      const existingParticipant = event.participants.find((participant) => participant.id === user.id);
      const now = new Date().toISOString();

      if (existingParticipant) {
        existingParticipant.name = user.name;
        existingParticipant.status = status;
        existingParticipant.updatedAt = now;
      } else {
        event.participants.push(createParticipant(user, status));
      }

      event.updatedAt = now;
      this.persist();
      void this.syncEvent(event.id);
    },

    toggleParticipantPayment(eventId: string, participantId: string) {
      const event = this.getEventById(eventId);
      const participant = event?.participants.find((item) => item.id === participantId);

      if (!event || !participant) {
        return;
      }

      participant.hasPaid = !participant.hasPaid;
      participant.updatedAt = new Date().toISOString();
      event.updatedAt = participant.updatedAt;
      this.persist();
      void this.syncEvent(event.id);
    },

    assignItem(eventId: string, itemId: string, user: CurrentUser) {
      const event = this.getEventById(eventId);
      const item = event?.items.find((eventItem) => eventItem.id === itemId);

      if (!event || !item) {
        return;
      }

      item.status = 'taken';
      item.assigneeId = user.id;
      item.assigneeName = user.name;
      item.completedAt = undefined;
      event.updatedAt = new Date().toISOString();
      this.persist();
      void this.syncEvent(event.id);
    },

    setItemStatus(eventId: string, itemId: string, status: ItemStatus) {
      const event = this.getEventById(eventId);
      const item = event?.items.find((eventItem) => eventItem.id === itemId);

      if (!event || !item) {
        return;
      }

      item.status = status;
      item.completedAt = status === 'done' ? new Date().toISOString() : undefined;

      if (status === 'free') {
        item.assigneeId = undefined;
        item.assigneeName = undefined;
      }

      event.updatedAt = new Date().toISOString();
      this.persist();
      void this.syncEvent(event.id);
    },
  },
});
