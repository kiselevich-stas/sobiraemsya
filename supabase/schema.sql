-- SQL для проекта «Собираемся?»
-- Запусти этот файл в Supabase Dashboard → SQL Editor.

create table if not exists public.sobiraemsya_events (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_sobiraemsya_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_sobiraemsya_events_updated_at on public.sobiraemsya_events;
create trigger set_sobiraemsya_events_updated_at
before update on public.sobiraemsya_events
for each row
execute function public.set_sobiraemsya_updated_at();

alter table public.sobiraemsya_events enable row level security;

drop policy if exists "sobiraemsya events are readable by link" on public.sobiraemsya_events;
create policy "sobiraemsya events are readable by link"
on public.sobiraemsya_events
for select
to anon
using (true);

drop policy if exists "sobiraemsya events can be created from mini app" on public.sobiraemsya_events;
create policy "sobiraemsya events can be created from mini app"
on public.sobiraemsya_events
for insert
to anon
with check (true);

drop policy if exists "sobiraemsya events can be updated by link holders" on public.sobiraemsya_events;
create policy "sobiraemsya events can be updated by link holders"
on public.sobiraemsya_events
for update
to anon
using (true)
with check (true);

-- Для Realtime нужно добавить таблицу в публикацию.
-- Если команда упадёт из-за дубликата, это не критично: таблица уже добавлена.
do $$
begin
  alter publication supabase_realtime add table public.sobiraemsya_events;
exception
  when duplicate_object then null;
end $$;
