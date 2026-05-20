import type { Currency, ItemStatus, ParticipantStatus } from '@/types/event';

export const MOSCOW_TIME_ZONE = 'Europe/Moscow';

export const participantStatusLabels: Record<ParticipantStatus, string> = {
  going: 'Иду',
  maybe: 'Возможно',
  not_going: 'Не иду',
};

export const itemStatusLabels: Record<ItemStatus, string> = {
  free: 'свободно',
  taken: 'взято',
  done: 'готово',
};

export const currencyOptions: Currency[] = ['₽', '$', '€', 'TON', 'USDT'];

export const formatMskDateTime = (value?: string) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const formattedDate = new Intl.DateTimeFormat('ru-RU', {
    timeZone: MOSCOW_TIME_ZONE,
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return `${formattedDate} МСК`;
};

export const formatDateTime = formatMskDateTime;

export const normalizeDateTimeLocalToMskIso = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  if (trimmedValue.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(trimmedValue)) {
    const date = new Date(trimmedValue);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  const valueWithSeconds = trimmedValue.length === 16 ? `${trimmedValue}:00` : trimmedValue;
  const mskDate = new Date(`${valueWithSeconds}+03:00`);

  return Number.isNaN(mskDate.getTime()) ? undefined : mskDate.toISOString();
};

export const formatDateTimeLocalInputMsk = (value?: string) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: MOSCOW_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return formatter.format(date).replace(' ', 'T');
};