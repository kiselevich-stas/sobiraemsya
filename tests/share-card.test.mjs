import assert from 'node:assert/strict';

function getParticipantStats(participants) {
  return {
    going: participants.filter((participant) => participant.status === 'going').length,
    maybe: participants.filter((participant) => participant.status === 'maybe').length,
    notGoing: participants.filter((participant) => participant.status === 'not_going').length,
  };
}

function getPaidStats(participants) {
  const goingParticipants = participants.filter((participant) => participant.status === 'going');
  return {
    paid: goingParticipants.filter((participant) => participant.hasPaid).length,
    total: goingParticipants.length,
  };
}

function generateEventCard(event, eventUrl) {
  const participantStats = getParticipantStats(event.participants);
  const paidStats = getPaidStats(event.participants);
  const lines = [
    `Собираемся: ${event.title}`,
    '',
    `Идут: ${participantStats.going}`,
    `Возможно: ${participantStats.maybe}`,
  ];

  if (event.money.enabled && event.money.amount) {
    const moneyLabel = event.money.mode === 'per_person' ? 'с человека' : 'общий сбор';
    lines.push(`Сбор: ${event.money.amount} ${event.money.currency} ${moneyLabel}`);
    lines.push(`Скинулись: ${paidStats.paid}/${paidStats.total}`);
  }

  lines.push('', 'Кто что берёт:');
  event.items.forEach((item) => {
    const value = item.status === 'free' ? 'свободно' : item.status === 'done' ? 'готово' : item.assigneeName || 'взято';
    lines.push(`— ${item.title}: ${value}`);
  });
  lines.push('', `Открыть сбор: ${eventUrl}`, '', 'Сделано в Mini App “Собираемся?”');

  return lines.join('\n');
}

const event = {
  title: 'Шашлыки в субботу',
  money: { enabled: true, mode: 'per_person', amount: 700, currency: '₽' },
  participants: [
    { status: 'going', hasPaid: true },
    { status: 'going', hasPaid: true },
    { status: 'going', hasPaid: false },
    { status: 'maybe', hasPaid: false },
  ],
  items: [
    { title: 'Мясо', status: 'taken', assigneeName: 'Даша' },
    { title: 'Угли', status: 'taken', assigneeName: 'Миша' },
    { title: 'Напитки', status: 'free' },
    { title: 'Посуда', status: 'done' },
  ],
};

const card = generateEventCard(event, 'https://example.com/event/123');

assert.match(card, /Собираемся: Шашлыки в субботу/);
assert.match(card, /Идут: 3/);
assert.match(card, /Возможно: 1/);
assert.match(card, /Сбор: 700 ₽ с человека/);
assert.match(card, /Скинулись: 2\/3/);
assert.match(card, /— Напитки: свободно/);
assert.match(card, /Сделано в Mini App “Собираемся\?”/);

console.log('Logic test passed: итоговая карточка формируется корректно.');
