import type { EventData } from '@/types/event';

export const getParticipantStats = (participants: EventData['participants']) => {
  return {
    going: participants.filter((participant) => participant.status === 'going').length,
    maybe: participants.filter((participant) => participant.status === 'maybe').length,
    notGoing: participants.filter((participant) => participant.status === 'not_going').length,
  };
};

export const getPaidStats = (participants: EventData['participants']) => {
  const goingParticipants = participants.filter((participant) => participant.status === 'going');

  return {
    paid: goingParticipants.filter((participant) => participant.hasPaid).length,
    total: goingParticipants.length,
  };
};

export const encodeEventSnapshot = (event: EventData) => {
  const jsonValue = JSON.stringify(event);
  const encodedValue = encodeURIComponent(jsonValue);

  return btoa(encodedValue).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

export const decodeEventSnapshot = (snapshot: string): EventData | null => {
  try {
    const normalizedSnapshot = snapshot.replaceAll('-', '+').replaceAll('_', '/');
    const paddedSnapshot = normalizedSnapshot.padEnd(Math.ceil(normalizedSnapshot.length / 4) * 4, '=');
    const jsonValue = decodeURIComponent(atob(paddedSnapshot));

    return JSON.parse(jsonValue) as EventData;
  } catch {
    return null;
  }
};

export const createShareUrl = (event: EventData, options: { includeSnapshot?: boolean } = {}) => {
  const origin = window.location.origin;
  const path = `/event/${event.id}`;

  if (!options.includeSnapshot) {
    return `${origin}${path}`;
  }

  const snapshot = encodeEventSnapshot(event);
  return `${origin}${path}?data=${snapshot}`;
};

export const generateEventCard = (event: EventData, eventUrl: string) => {
  const participantStats = getParticipantStats(event.participants);
  const paidStats = getPaidStats(event.participants);
  const lines = [`Собираемся: ${event.title}`];

  if (event.startsAt || event.place) {
    lines.push('');
  }

  if (event.startsAt) {
    lines.push(`Когда: ${new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(event.startsAt))}`);
  }

  if (event.place) {
    lines.push(`Где: ${event.place}`);
  }

  lines.push('', `Идут: ${participantStats.going}`, `Возможно: ${participantStats.maybe}`);

  if (event.money.enabled && event.money.amount) {
    const moneyLabel = event.money.mode === 'per_person' ? 'с человека' : 'общий сбор';
    lines.push(`Сбор: ${event.money.amount} ${event.money.currency} ${moneyLabel}`);
    lines.push(`Скинулись: ${paidStats.paid}/${paidStats.total}`);
  }

  lines.push('', 'Кто что берёт:');

  if (event.items.length === 0) {
    lines.push('— пока список пуст');
  } else {
    event.items.forEach((item) => {
      const value = item.status === 'free' ? 'свободно' : item.status === 'done' ? 'готово' : item.assigneeName || 'взято';
      lines.push(`— ${item.title}: ${value}`);
    });
  }

  lines.push('', `Открыть сбор: ${eventUrl}`, '', 'Сделано в Mini App “Собираемся?”');

  return lines.join('\n');
};
