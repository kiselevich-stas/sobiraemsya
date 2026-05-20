import type { EventData } from '@/types/event';
import { formatMskDateTime } from '@/utils/format';

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

export const getMoneyProgress = (event: EventData) => {
  const targetAmount = event.money.amount ?? 0;
  const collectedAmount = event.participants.reduce((sum, participant) => {
    const perPersonAmount = participant.hasPaid && event.money.mode === 'per_person' ? targetAmount : 0;

    return sum + (participant.paidAmount ?? perPersonAmount);
  }, 0);

  return {
    collectedAmount,
    targetAmount,
    progressPercent: targetAmount > 0 ? Math.min(100, Math.round((collectedAmount / targetAmount) * 100)) : 0,
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
    const paddedSnapshot = normalizedSnapshot.padEnd(
        Math.ceil(normalizedSnapshot.length / 4) * 4,
        '=',
    );

    const jsonValue = decodeURIComponent(atob(paddedSnapshot));

    return JSON.parse(jsonValue) as EventData;
  } catch {
    return null;
  }
};

export const createSiteEventUrl = (eventId: string) => {
  return `${window.location.origin}/#/event/${eventId}`;
};

export const createTelegramEventUrl = (eventId: string) => {
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME?.trim();
  const appShortName = import.meta.env.VITE_TELEGRAM_APP_SHORT_NAME?.trim();

  if (!botUsername || !appShortName) {
    return createSiteEventUrl(eventId);
  }

  const normalizedBotUsername = botUsername.replace('@', '');

  return `https://t.me/${normalizedBotUsername}/${appShortName}?startapp=${encodeURIComponent(
      eventId,
  )}`;
};

export const createShareUrl = (
    event: EventData,
    options: { includeSnapshot?: boolean; telegram?: boolean } = {},
) => {
  if (options.includeSnapshot) {
    const snapshot = encodeEventSnapshot(event);

    return `${createSiteEventUrl(event.id)}?data=${snapshot}`;
  }

  if (options.telegram) {
    return createTelegramEventUrl(event.id);
  }

  return createSiteEventUrl(event.id);
};

export const generateEventCard = (event: EventData, eventUrl: string) => {
  const participantStats = getParticipantStats(event.participants);
  const paidStats = getPaidStats(event.participants);

  const lines = [`Собираемся: ${event.title}`];

  if (event.startsAt || event.place) {
    lines.push('');
  }

  if (event.startsAt) {
    lines.push(`Когда: ${formatMskDateTime(event.startsAt)}`);
  }

  if (event.place) {
    lines.push(`Где: ${event.place}`);
  }

  lines.push('', `Идут: ${participantStats.going}`, `Возможно: ${participantStats.maybe}`);

  if (event.money.enabled && event.money.amount) {
    const moneyLabel = event.money.mode === 'per_person' ? 'с человека' : 'общий сбор';

    lines.push(`Сбор: ${event.money.amount} ${event.money.currency} ${moneyLabel}`);

    if (event.money.mode === 'total') {
      const moneyProgress = getMoneyProgress(event);
      lines.push(`Собрано: ${moneyProgress.collectedAmount}/${moneyProgress.targetAmount} ${event.money.currency}`);
    } else {
      lines.push(`Скинулись: ${paidStats.paid}/${paidStats.total}`);
    }
  }

  lines.push('', 'Кто что берёт:');

  if (event.items.length === 0) {
    lines.push('— пока список пуст');
  } else {
    event.items.forEach((item) => {
      const assigneeNames = item.assignees?.map((assignee) => assignee.name).join(', ');
      const value =
          item.status === 'free'
              ? 'свободно'
              : item.status === 'done'
                  ? 'готово'
                  : assigneeNames || item.assigneeName || 'взято';

      lines.push(`— ${item.title}: ${value}`);
    });
  }

  lines.push('', `Открыть сбор: ${eventUrl}`, '', 'Сделано в Mini App “Собираемся?”');

  return lines.join('\n');
};
