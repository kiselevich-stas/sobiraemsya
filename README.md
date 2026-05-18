# Собираемся?

Telegram Mini App для организации встреч в групповых чатах: кто идёт, кто что берёт, кто скинулся и какую итоговую карточку отправить в Telegram.

## Стек

- Vue 3 + Vite
- TypeScript
- Pinia
- Vue Router
- SCSS
- localStorage как fallback
- Supabase как облачное хранилище для синхронизации участников

## Запуск

```bash
npm install
npm run dev
```

## Проверка

```bash
npm run build
npm run test:logic
```

## Режимы хранения

### Без Supabase

Если `.env.local` не заполнен, приложение работает только через localStorage. Это удобно для разработки интерфейса и демонстрации, но участники на разных устройствах не увидят изменения друг друга.

### С Supabase

После настройки Supabase событие сохраняется в таблицу `sobiraemsya_events`, а ссылка `/event/:id` открывает одну общую версию события для всех участников.

Быстрые шаги:

1. Создай проект в Supabase.
2. Выполни SQL из `supabase/schema.sql`.
3. Скопируй `.env.example` в `.env.local`.
4. Заполни `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Перезапусти dev-сервер.

Подробно: `docs/supabase.md`.

## Важно про безопасность MVP

Сейчас работает модель «любой, у кого есть ссылка, может редактировать сбор». Для бытовых чатов это хороший компромисс для MVP. Перед публичным запуском стоит добавить:

- `edit_token` в ссылке;
- проверку Telegram `initData` на сервере;
- отдельные таблицы участников и задач;
- защиту RLS по токену или авторизации.

## Архитектура

```text
src/
  assets/styles/       глобальные SCSS-стили
  components/          UI-блоки и секции события
  composables/         Telegram WebApp, Clipboard, Supabase Realtime
  data/                шаблоны сборов
  lib/                 клиенты внешних сервисов
  router/              маршруты
  services/            работа с Supabase
  stores/              Pinia store событий
  types/               TypeScript-модели
  utils/               форматирование, share-card, localStorage
  views/               страницы
supabase/
  schema.sql           схема БД и RLS-политики
```
