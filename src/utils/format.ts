import type { Currency, ItemStatus, ParticipantStatus } from '@/types/event';

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

export const formatDateTime = (value?: string) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
