create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  description text,
  priority text not null default 'medium',
  status text not null default 'pending',
  due_date date,
  duration_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  category text not null default 'Notes',
  description text,
  content text,
  created_at timestamptz not null default now()
);
create table public.threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  ui_id text not null,
  role text not null,
  parts jsonb not null,
  created_at timestamptz not null default now()
);
create index on public.messages(thread_id, created_at);
grant select, insert, update, delete on public.tasks, public.resources, public.threads, public.messages to authenticated;
grant all on public.tasks, public.resources, public.threads, public.messages to service_role;
alter table public.tasks enable row level security;
alter table public.resources enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
create policy "own tasks" on public.tasks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own resources" on public.resources for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own threads" on public.threads for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own messages" on public.messages for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and exists (select 1 from public.threads t where t.id = thread_id and t.user_id = auth.uid()));