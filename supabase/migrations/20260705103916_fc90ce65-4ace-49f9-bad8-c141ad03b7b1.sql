
-- extend profiles
alter table public.profiles
  add column if not exists age int,
  add column if not exists gender text,
  add column if not exists state text,
  add column if not exists district text,
  add column if not exists occupation text,
  add column if not exists monthly_income numeric,
  add column if not exists education text,
  add column if not exists marital_status text,
  add column if not exists category text,
  add column if not exists has_disability boolean not null default false,
  add column if not exists household_size int,
  add column if not exists household_type text,
  add column if not exists profile_completeness int not null default 0,
  add column if not exists onboarding_done boolean not null default false;

-- schemes catalog (public read)
create table if not exists public.schemes (
  id text primary key,
  name text not null,
  short_name text,
  category text not null,
  level text not null default 'central',
  state text,
  summary text not null,
  benefits jsonb not null default '[]'::jsonb,
  eligibility jsonb not null default '{}'::jsonb,
  required_documents jsonb not null default '[]'::jsonb,
  next_step text not null,
  official_url text not null,
  ministry text,
  tags text[] not null default '{}',
  trust_note text,
  updated_at timestamptz not null default now()
);

grant select on public.schemes to anon, authenticated;
grant all on public.schemes to service_role;

alter table public.schemes enable row level security;

create policy "Public read schemes" on public.schemes
  for select to anon, authenticated using (true);

-- family_members
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relationship text not null,
  age int,
  gender text,
  occupation text,
  monthly_income numeric,
  has_disability boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.family_members to authenticated;
grant all on public.family_members to service_role;
alter table public.family_members enable row level security;
create policy "Own family" on public.family_members for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_type text not null,
  label text not null,
  status text not null default 'missing',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.documents to authenticated;
grant all on public.documents to service_role;
alter table public.documents enable row level security;
create policy "Own documents" on public.documents for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- applications
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scheme_id text not null references public.schemes(id) on delete cascade,
  status text not null default 'saved',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, scheme_id)
);

grant select, insert, update, delete on public.applications to authenticated;
grant all on public.applications to service_role;
alter table public.applications enable row level security;
create policy "Own applications" on public.applications for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- saved_schemes (bookmarks separate from applications)
create table if not exists public.saved_schemes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scheme_id text not null references public.schemes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, scheme_id)
);

grant select, insert, update, delete on public.saved_schemes to authenticated;
grant all on public.saved_schemes to service_role;
alter table public.saved_schemes enable row level security;
create policy "Own saved" on public.saved_schemes for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- conversations
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.conversations to authenticated;
grant all on public.conversations to service_role;
alter table public.conversations enable row level security;
create policy "Own conversations" on public.conversations for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- chat_messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.chat_messages to authenticated;
grant all on public.chat_messages to service_role;
alter table public.chat_messages enable row level security;
create policy "Own messages" on public.chat_messages for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_chat_messages_conv on public.chat_messages(conversation_id, created_at);

-- updated_at triggers
do $$ begin
  create trigger family_members_updated_at before update on public.family_members
    for each row execute function public.update_updated_at_column();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger documents_updated_at before update on public.documents
    for each row execute function public.update_updated_at_column();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger applications_updated_at before update on public.applications
    for each row execute function public.update_updated_at_column();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger conversations_updated_at before update on public.conversations
    for each row execute function public.update_updated_at_column();
exception when duplicate_object then null; end $$;
