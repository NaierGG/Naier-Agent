create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  gemini_api_key text,
  dart_api_key text,
  telegram_bot_token text,
  telegram_chat_id text,
  discord_webhook_url text,
  email_smtp_host text,
  email_smtp_port integer check (email_smtp_port is null or email_smtp_port between 1 and 65535),
  email_smtp_user text,
  email_smtp_pass text,
  email_to text,
  updated_at timestamptz not null default now()
);

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default false,
  schedule_cron text,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  last_executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflow_executions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('running', 'success', 'failed')),
  trigger_type text not null check (trigger_type in ('schedule', 'manual', 'webhook')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  logs jsonb not null default '[]'::jsonb,
  error_message text
);

alter table public.profiles enable row level security;
alter table public.user_api_keys enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_executions enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles
  for delete
  using (auth.uid() = id);

create policy "user_api_keys_select_own"
  on public.user_api_keys
  for select
  using (auth.uid() = user_id);

create policy "user_api_keys_insert_own"
  on public.user_api_keys
  for insert
  with check (auth.uid() = user_id);

create policy "user_api_keys_update_own"
  on public.user_api_keys
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_api_keys_delete_own"
  on public.user_api_keys
  for delete
  using (auth.uid() = user_id);

create policy "workflows_select_own"
  on public.workflows
  for select
  using (auth.uid() = user_id);

create policy "workflows_insert_own"
  on public.workflows
  for insert
  with check (auth.uid() = user_id);

create policy "workflows_update_own"
  on public.workflows
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "workflows_delete_own"
  on public.workflows
  for delete
  using (auth.uid() = user_id);

create policy "workflow_executions_select_own"
  on public.workflow_executions
  for select
  using (auth.uid() = user_id);

create policy "workflow_executions_insert_own"
  on public.workflow_executions
  for insert
  with check (auth.uid() = user_id);

create policy "workflow_executions_update_own"
  on public.workflow_executions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "workflow_executions_delete_own"
  on public.workflow_executions
  for delete
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workflows_set_updated_at on public.workflows;

create trigger workflows_set_updated_at
  before update on public.workflows
  for each row execute procedure public.update_updated_at_column();

create index if not exists idx_workflows_user_id
  on public.workflows (user_id);

create index if not exists idx_workflows_is_active
  on public.workflows (is_active);

create index if not exists idx_workflow_executions_workflow_id
  on public.workflow_executions (workflow_id);

create index if not exists idx_workflow_executions_user_id
  on public.workflow_executions (user_id);

create index if not exists idx_workflow_executions_started_at_desc
  on public.workflow_executions (started_at desc);
