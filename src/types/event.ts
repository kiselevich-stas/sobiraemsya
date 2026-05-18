export type ParticipantStatus = 'going' | 'maybe' | 'not_going';
export type ItemStatus = 'free' | 'taken' | 'done';
export type Currency = '₽' | '$' | '€' | 'TON' | 'USDT';
export type MoneyMode = 'total' | 'per_person';

export interface EventTemplate {
  id: string;
  title: string;
  emoji: string;
  description: string;
  items: string[];
}

export interface EventItem {
  id: string;
  title: string;
  status: ItemStatus;
  assigneeId?: string;
  assigneeName?: string;
  completedAt?: string;
}

export interface EventParticipant {
  id: string;
  telegramId?: number;
  name: string;
  status: ParticipantStatus;
  hasPaid: boolean;
  joinedAt: string;
  updatedAt: string;
}

export interface EventMoneySettings {
  enabled: boolean;
  mode: MoneyMode;
  amount: number | null;
  currency: Currency;
}

export interface EventData {
  id: string;
  title: string;
  templateId?: string;
  startsAt?: string;
  place?: string;
  description?: string;
  money: EventMoneySettings;
  items: EventItem[];
  participants: EventParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventPayload {
  title: string;
  templateId?: string;
  startsAt?: string;
  place?: string;
  description?: string;
  money: EventMoneySettings;
  items: string[];
}

export interface CurrentUser {
  id: string;
  telegramId?: number;
  name: string;
}
