import { defineStore } from 'pinia';

import {
  deleteRemoteEvent,
  fetchRemoteEventById,
  fetchRemoteEventsByCreator,
  fetchRemoteLatestEvents,
  isRemoteStorageEnabled,
  saveRemoteEvent,
} from '@/services/events.repository';
import { syncTelegramEventCard } from '@/services/telegram.repository';
import type {
  CreateEventPayload,
  CurrentUser,
  EventData,
  EventItem,
  EventParticipant,
  ItemStatus,
  ParticipantStatus,
} from '@/types/event';
import { createId } from '@/utils/id';
import { loadEventsFromStorage, saveEventsToStorage } from '@/utils/storage';

interface EventsState {
  events: EventData[];
  isHydrated: boolean;
  isSyncing: boolean;
  syncError: string | null;
  lastSyncedAt: string | null;
}

type SyncEventOptions = {
  syncTelegramCard?: boolean;
};

const createEventItems = (items: string[], existingItems: EventItem[] = []): EventItem[] => {
  const existingItemsByTitle = new Map(
      existingItems.map((item) => [item.title.trim().toLowerCase(), item]),
  );

  return items
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const existingItem = existingItemsByTitle.get(item.toLowerCase());

        if (existingItem) {
          return {
            ...existingItem,
            title: item,
          };
        }

        return {
          id: createId('item'),
          title: item,
          status: 'free' as ItemStatus,
          assignees: [],
        };
      });
};

const createParticipant = (user: CurrentUser, status: ParticipantStatus): EventParticipant => {
  const now = new Date().toISOString();

  return {
    id: user.id,
    telegramId: user.telegramId,
    name: user.name,
    avatarEmoji: user.avatarEmoji,
    status,
    hasPaid: false,
    paidAmount: 0,
    joinedAt: now,
    updatedAt: now,
  };
};

const sortEventsByUpdatedAt = (events: EventData[]) => {
  return [...events].sort((firstEvent, secondEvent) => {
    return new Date(secondEvent.updatedAt).getTime() - new Date(firstEvent.updatedAt).getTime();
  });
};

const getCreatorTelegramUserId = (user?: CurrentUser | null) => {
  if (!user) {
    return undefined;
  }

  return user.telegramId ? String(user.telegramId) : user.id;
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

    getEventsByCreator: (state) => {
      return (user?: CurrentUser | null) => {
        const creatorTelegramUserId = getCreatorTelegramUserId(user);

        if (!creatorTelegramUserId) {
          return [];
        }

        return sortEventsByUpdatedAt(
            state.events.filter((event) => {
              return event.creatorTelegramUserId === creatorTelegramUserId;
            }),
        );
      };
    },

    latestEvents: (state) => {
      return [...state.events]
          .sort((firstEvent, secondEvent) => {
            return new Date(secondEvent.createdAt).getTime() - new Date(firstEvent.createdAt).getTime();
          })
          .slice(0, 6);
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

    isEventCreator(eventId: string, user?: CurrentUser | null) {
      const event = this.getEventById(eventId);
      const creatorTelegramUserId = getCreatorTelegramUserId(user);

      if (!event || !creatorTelegramUserId) {
        return false;
      }

      return event.creatorTelegramUserId === creatorTelegramUserId;
    },

    async createEvent(payload: CreateEventPayload, creator?: CurrentUser | null) {
      const now = new Date().toISOString();
      const creatorTelegramUserId = getCreatorTelegramUserId(creator);

      const event: EventData = {
        id: createId('event'),
        title: payload.title.trim(),
        templateId: payload.templateId,
        startsAt: payload.startsAt || undefined,
        place: payload.place?.trim() || undefined,
        description: payload.description?.trim() || undefined,

        creatorTelegramUserId,
        creatorTelegramUsername: creator?.username,
        creatorName: creator?.name,

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

    async updateEvent(
        eventId: string,
        payload: CreateEventPayload,
        editor?: CurrentUser | null,
    ) {
      const event = this.getEventById(eventId);

      if (!event) {
        return {
          data: null,
          error: 'Событие не найдено.',
        };
      }

      if (!this.isEventCreator(eventId, editor)) {
        return {
          data: null,
          error: 'Редактировать событие может только создатель карточки.',
        };
      }

      const now = new Date().toISOString();

      event.title = payload.title.trim();
      event.templateId = payload.templateId;
      event.startsAt = payload.startsAt || undefined;
      event.place = payload.place?.trim() || undefined;
      event.description = payload.description?.trim() || undefined;
      event.money = {
        enabled: payload.money.enabled,
        mode: payload.money.mode,
        amount: payload.money.enabled ? payload.money.amount : null,
        currency: payload.money.currency,
      };
      event.items = createEventItems(payload.items, event.items);
      event.updatedAt = now;

      this.persist();

      await this.syncEvent(event.id, {
        syncTelegramCard: true,
      });

      return {
        data: event,
        error: null,
      };
    },

    importEvent(event: EventData, options: { persistRemote?: boolean } = {}) {
      const existingEventIndex = this.events.findIndex((savedEvent) => {
        return savedEvent.id === event.id;
      });

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

    async loadMyEvents(user?: CurrentUser | null) {
      this.hydrate();

      const creatorTelegramUserId = getCreatorTelegramUserId(user);

      if (!creatorTelegramUserId) {
        return [];
      }

      if (!isRemoteStorageEnabled()) {
        return this.getEventsByCreator(user);
      }

      this.isSyncing = true;
      this.syncError = null;

      const result = await fetchRemoteEventsByCreator(creatorTelegramUserId);

      this.isSyncing = false;

      if (result.error) {
        this.syncError = result.error;
        return this.getEventsByCreator(user);
      }

      result.data?.forEach((event) => {
        this.importEvent(event);
      });

      this.lastSyncedAt = new Date().toISOString();

      return this.getEventsByCreator(user);
    },

    async loadLatestEvents(limit = 6) {
      this.hydrate();

      if (!isRemoteStorageEnabled()) {
        return this.latestEvents;
      }

      this.isSyncing = true;
      this.syncError = null;

      const result = await fetchRemoteLatestEvents(limit);

      this.isSyncing = false;

      if (result.error) {
        this.syncError = result.error;
        return this.latestEvents;
      }

      result.data?.forEach((event) => {
        this.importEvent(event);
      });

      this.lastSyncedAt = new Date().toISOString();

      return this.latestEvents;
    },

    async syncEvent(eventId: string, options: SyncEventOptions = {}) {
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

      if (options.syncTelegramCard) {
        void syncTelegramEventCard(eventId);
      }
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

      const existingParticipant = event.participants.find((participant) => {
        return participant.id === user.id;
      });

      const now = new Date().toISOString();

      if (existingParticipant) {
        existingParticipant.name = user.name;
        existingParticipant.avatarEmoji = user.avatarEmoji;
        existingParticipant.status = status;
        existingParticipant.updatedAt = now;
      } else {
        event.participants.push(createParticipant(user, status));
      }

      event.updatedAt = now;
      this.persist();

      void this.syncEvent(event.id, {
        syncTelegramCard: true,
      });
    },

    syncUserProfile(eventId: string, user: CurrentUser) {
      const event = this.getEventById(eventId);

      if (!event) {
        return;
      }

      const participant = event.participants.find((item) => {
        return item.id === user.id;
      });

      let hasChanges = false;

      if (participant && (participant.name !== user.name || participant.avatarEmoji !== user.avatarEmoji)) {
        participant.name = user.name;
        participant.avatarEmoji = user.avatarEmoji;
        participant.updatedAt = new Date().toISOString();
        hasChanges = true;
      }

      event.items.forEach((item) => {
        let shouldRefreshLegacyAssigneeName = false;

        item.assignees?.forEach((assignee) => {
          if (assignee.id !== user.id) {
            return;
          }

          if (assignee.name !== user.name || assignee.avatarEmoji !== user.avatarEmoji) {
            assignee.name = user.name;
            assignee.avatarEmoji = user.avatarEmoji;
            shouldRefreshLegacyAssigneeName = true;
            hasChanges = true;
          }
        });

        if (item.assigneeId === user.id && item.assigneeName !== user.name && !item.assignees?.length) {
          item.assigneeName = user.name;
          hasChanges = true;
        }

        if (shouldRefreshLegacyAssigneeName && item.assignees?.length) {
          item.assigneeName = item.assignees.map((assignee) => assignee.name).join(', ');
        }
      });

      if (!hasChanges) {
        return;
      }

      event.updatedAt = new Date().toISOString();
      this.persist();

      void this.syncEvent(event.id, {
        syncTelegramCard: true,
      });
    },

    toggleParticipantPayment(eventId: string, participantId: string) {
      const event = this.getEventById(eventId);
      const participant = event?.participants.find((item) => {
        return item.id === participantId;
      });

      if (!event || !participant) {
        return;
      }

      participant.hasPaid = !participant.hasPaid;
      participant.updatedAt = new Date().toISOString();
      event.updatedAt = participant.updatedAt;

      this.persist();

      void this.syncEvent(event.id, {
        syncTelegramCard: true,
      });
    },

    setParticipantPaidAmount(eventId: string, participantId: string, paidAmount: number) {
      const event = this.getEventById(eventId);
      const participant = event?.participants.find((item) => {
        return item.id === participantId;
      });

      if (!event || !participant) {
        return;
      }

      const normalizedAmount = Math.max(0, Math.round(paidAmount));

      participant.paidAmount = normalizedAmount;
      participant.hasPaid = normalizedAmount > 0;
      participant.updatedAt = new Date().toISOString();
      event.updatedAt = participant.updatedAt;

      this.persist();

      void this.syncEvent(event.id, {
        syncTelegramCard: true,
      });
    },

    assignItem(eventId: string, itemId: string, user: CurrentUser) {
      const event = this.getEventById(eventId);
      const item = event?.items.find((eventItem) => {
        return eventItem.id === itemId;
      });

      if (!event || !item) {
        return;
      }

      const assignees = item.assignees ?? [];
      const isAlreadyAssigned = assignees.some((assignee) => assignee.id === user.id);

      if (!isAlreadyAssigned) {
        assignees.push({
          id: user.id,
          name: user.name,
          avatarEmoji: user.avatarEmoji,
        });
      }

      item.assignees = assignees;
      item.status = item.status === 'done' ? 'done' : 'taken';
      item.assigneeId = assignees[0]?.id;
      item.assigneeName = assignees.map((assignee) => assignee.name).join(', ');
      item.completedAt = undefined;
      event.updatedAt = new Date().toISOString();

      this.persist();

      void this.syncEvent(event.id, {
        syncTelegramCard: true,
      });
    },

    unassignItem(eventId: string, itemId: string, userId: string) {
      const event = this.getEventById(eventId);
      const item = event?.items.find((eventItem) => {
        return eventItem.id === itemId;
      });

      if (!event || !item) {
        return;
      }

      const assignees = (item.assignees ?? []).filter((assignee) => assignee.id !== userId);

      item.assignees = assignees;
      item.assigneeId = assignees[0]?.id;
      item.assigneeName = assignees.map((assignee) => assignee.name).join(', ') || undefined;

      if (assignees.length === 0) {
        item.status = 'free';
        item.completedAt = undefined;
      }

      event.updatedAt = new Date().toISOString();

      this.persist();

      void this.syncEvent(event.id, {
        syncTelegramCard: true,
      });
    },

    setItemStatus(eventId: string, itemId: string, status: ItemStatus) {
      const event = this.getEventById(eventId);
      const item = event?.items.find((eventItem) => {
        return eventItem.id === itemId;
      });

      if (!event || !item) {
        return;
      }

      item.status = status;
      item.completedAt = status === 'done' ? new Date().toISOString() : undefined;

      if (status === 'free') {
        item.assigneeId = undefined;
        item.assigneeName = undefined;
        item.assignees = [];
      }

      event.updatedAt = new Date().toISOString();

      this.persist();

      void this.syncEvent(event.id, {
        syncTelegramCard: true,
      });
    },
  },
});
