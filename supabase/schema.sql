-- ================================
-- LOM Portal Database Schema
-- ================================

-- profiles (auth.users を拡張)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  phone text,
  role text not null default 'member' check (role in ('admin', 'member')),
  department text,
  join_year integer,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_update_admin" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- announcements (お知らせ)
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  author_id uuid references public.profiles(id) on delete set null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "announcements_select" on public.announcements
  for select using (auth.role() = 'authenticated');

create policy "announcements_insert_admin" on public.announcements
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "announcements_update_admin" on public.announcements
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "announcements_delete_admin" on public.announcements
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- events (スケジュール)
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "events_select" on public.events
  for select using (auth.role() = 'authenticated');

create policy "events_insert_admin" on public.events
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "events_update_admin" on public.events
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "events_delete_admin" on public.events
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- attendance (出欠)
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'undecided' check (status in ('attending', 'absent', 'undecided')),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, user_id)
);

alter table public.attendance enable row level security;

create policy "attendance_select" on public.attendance
  for select using (auth.role() = 'authenticated');

create policy "attendance_insert_own" on public.attendance
  for insert with check (auth.uid() = user_id);

create policy "attendance_update_own" on public.attendance
  for update using (auth.uid() = user_id);

create policy "attendance_delete_own" on public.attendance
  for delete using (auth.uid() = user_id);

-- ================================
-- Functions & Triggers
-- ================================

-- 新規ユーザー登録時に profiles を自動作成
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at 自動更新
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger announcements_updated_at before update on public.announcements
  for each row execute procedure public.handle_updated_at();

create trigger events_updated_at before update on public.events
  for each row execute procedure public.handle_updated_at();

create trigger attendance_updated_at before update on public.attendance
  for each row execute procedure public.handle_updated_at();
