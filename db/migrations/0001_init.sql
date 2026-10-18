-- RootDB 0001 — initial schema (devices, catalog, community UGC, guide block system)
-- Applied via Supabase Management API migration. RLS on every exposed table.

create extension if not exists pg_trgm;

create schema if not exists private;

-- ---------- enums ----------
create type rootability_verdict as enum ('rootable','partially','not_rootable','unknown');
create type bootloader_status as enum ('official','limited','locked','unknown');
create type difficulty_level as enum ('easy','moderate','advanced','expert');
create type catalog_status as enum ('active','discontinued','archived','unknown');
create type provenance_kind as enum ('official_verified','community','link_submission');
create type software_kind as enum ('app','module');
create type module_framework as enum ('magisk','kernelsu','apatch','lsposed','xposed','vector','other');
create type artifact_type as enum ('zip','apk','other');
create type guide_kind as enum ('root','unlock_bootloader','flash_recovery','install_rom','unbrick','other');
create type guide_source as enum ('admin','community');
create type issue_severity as enum ('low','medium','high','critical');
create type issue_status as enum ('open','confirmed','fixed','wontfix','duplicate');
create type question_status as enum ('open','answered','solved','closed');
create type submission_type as enum ('new_device','rom','root_method','app','module','guide','correction','broken_link');
create type submission_status as enum ('pending','approved','rejected','withdrawn');
create type update_kind as enum ('device_added','rom_added','rom_updated','method_added','software_added','guide_added','verdict_changed','confirmed_milestone');
create type profile_role as enum ('user','moderator','admin');
create type guide_block_type as enum ('content','question','embed','recommendation');

-- ---------- helpers (private, hardened) ----------
create or replace function private.is_admin() returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  return exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
end $$;

create or replace function private.is_mod() returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  return exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator','admin'));
end $$;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ---------- profiles & linked accounts ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text,
  avatar_url text,
  role profile_role not null default 'user',
  is_verified_dev boolean not null default false,
  theme text not null default 'catppuccin-mocha',
  analytics_opt_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.linked_accounts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('github','gitlab')),
  provider_user_id text not null,
  username text not null,
  verified_at timestamptz not null default now(),
  primary key (provider, provider_user_id),
  unique (user_id, provider)
);

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (new.id,
          'user_' || substr(replace(new.id::text, '-', ''), 1, 12),
          coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'user_name'),
          new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.guard_profile_role() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role and not private.is_admin() then
    if auth.uid() is not null then
      raise exception 'only admins can change roles';
    end if;
  end if;
  return new;
end $$;
create trigger trg_profiles_role_guard before update on public.profiles
  for each row execute function private.guard_profile_role();

-- ---------- devices ----------
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  brand text not null,
  name text not null,
  model text,
  codename text,
  aliases text[] not null default '{}',
  release_year int,
  android_versions text[] not null default '{}',
  soc text,
  ram_options text[],
  specs jsonb not null default '{}',
  variant_notes text,
  popularity int not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_text text -- maintained by trg_devices_search (array_to_string isn't immutable enough for a generated col)
);
create trigger trg_devices_updated before update on public.devices
  for each row execute function public.set_updated_at();

create or replace function public.devices_fill_search() returns trigger
language plpgsql as $$
begin
  new.search_text := new.brand || ' ' || new.name || ' ' || coalesce(new.model,'')
    || ' ' || coalesce(new.codename,'') || ' ' || coalesce(array_to_string(new.aliases,' '),'');
  return new;
end $$;
create trigger trg_devices_search before insert or update on public.devices
  for each row execute function public.devices_fill_search();
create index devices_search_trgm on public.devices using gin (search_text gin_trgm_ops);
create index devices_brand_idx on public.devices (brand);

create table public.device_rootability (
  device_id uuid primary key references public.devices(id) on delete cascade,
  verdict rootability_verdict not null default 'unknown',
  bootloader bootloader_status not null default 'unknown',
  recommended_method_id uuid,
  unlock_url text,
  unlock_wait_hours int,
  anti_rollback boolean not null default false,
  warnings text[] not null default '{}',
  notes text,
  updated_at timestamptz not null default now()
);
create trigger trg_rootability_updated before update on public.device_rootability
  for each row execute function public.set_updated_at();

-- variants: carrier/region/SoC flavors with their own rootability
-- (Verizon S23 = locked, international Exynos = rootable)
create table public.device_variants (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  label text not null, -- 'Verizon (SM-S918U)', 'International Exynos (SM-S918B)'
  model_numbers text[] not null default '{}',
  verdict rootability_verdict, -- null = inherit device-level rootability
  bootloader bootloader_status,
  bootloader_notes text,
  unlock_url text,
  warnings text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index device_variants_device_idx on public.device_variants (device_id, sort_order);

-- universal methods allowed: device_id null (Magisk, KernelSU, KernelSU Next…)
-- variant_id null = applies to all variants of the device
create table public.root_methods (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.devices(id) on delete cascade,
  variant_id uuid references public.device_variants(id) on delete cascade,
  name text not null,
  weight int not null default 0, -- global recommendation ranking
  difficulty difficulty_level not null default 'moderate',
  summary text,
  body_md text,
  requires text[] not null default '{}',
  links jsonb not null default '[]', -- [{label,url}]
  play_integrity_notes text,
  admin_curated boolean not null default false,
  provenance provenance_kind not null default 'community',
  submitted_by uuid references public.profiles(id),
  confirmed_count int not null default 0,
  last_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_methods_updated before update on public.root_methods
  for each row execute function public.set_updated_at();
create index root_methods_device_idx on public.root_methods (device_id);

alter table public.device_rootability
  add constraint fk_recommended_method foreign key (recommended_method_id)
  references public.root_methods(id) on delete set null;

create table public.roms (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  variant_id uuid references public.device_variants(id) on delete cascade, -- null = all variants
  name text not null,
  android_version text,
  official boolean not null default false,
  status catalog_status not null default 'unknown',
  download_url text not null,
  notes text,
  maintainers jsonb not null default '[]', -- [{name,url,profile_id?}]
  provenance provenance_kind not null default 'link_submission',
  source_repo_url text,
  build_config_url text,
  submitted_by uuid references public.profiles(id),
  confirmed_count int not null default 0,
  last_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rom_unofficial_needs_source check (
    official or provenance = 'link_submission'
    or (source_repo_url is not null and build_config_url is not null)
  )
);
create trigger trg_roms_updated before update on public.roms
  for each row execute function public.set_updated_at();
create index roms_device_idx on public.roms (device_id);

create table public.tools (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  variant_id uuid references public.device_variants(id) on delete cascade, -- null = all variants
  kind text not null check (kind in ('recovery','kernel','magisk','firmware','other')),
  name text not null,
  version text,
  url text not null,
  notes text,
  provenance provenance_kind not null default 'link_submission',
  submitted_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index tools_device_idx on public.tools (device_id);

-- ---------- apps & modules ----------
create table public.software (
  id uuid primary key default gen_random_uuid(),
  kind software_kind not null,
  framework module_framework, -- modules only; null for apps
  artifact artifact_type not null default 'other',
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text,
  author_name text,
  author_profile uuid references public.profiles(id),
  source_repo_url text,
  download_url text not null,
  version text,
  requires_root boolean not null default false,
  min_framework_version text,
  android_range text,
  status catalog_status not null default 'unknown',
  provenance provenance_kind not null default 'link_submission',
  submitted_by uuid references public.profiles(id),
  confirmed_count int not null default 0,
  last_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint module_has_framework check (
    (kind = 'module' and framework is not null) or (kind = 'app' and framework is null)
  )
);
create trigger trg_software_updated before update on public.software
  for each row execute function public.set_updated_at();
create index software_kind_fw_idx on public.software (kind, framework);

create table public.software_devices (
  software_id uuid not null references public.software(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  primary key (software_id, device_id)
);
create index software_devices_device_idx on public.software_devices (device_id);

-- ---------- guides (block system) ----------
create table public.guides (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.devices(id) on delete cascade, -- null = generic, embeddable
  kind guide_kind not null default 'other',
  title text not null,
  summary text,
  difficulty difficulty_level not null default 'moderate',
  source guide_source not null default 'community',
  author_id uuid references public.profiles(id),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_guides_updated before update on public.guides
  for each row execute function public.set_updated_at();
create index guides_device_idx on public.guides (device_id);

create table public.guide_blocks (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guides(id) on delete cascade,
  position int not null,
  block_type guide_block_type not null,
  content_md text,
  config jsonb not null default '{}', -- question: {prompt, answers:[{label, goto_block_id?|embed_guide_id?}]}; recommendation: {subject:'root_method', fallback:'global_weight'}
  embed_guide_id uuid references public.guides(id) on delete restrict,
  unique (guide_id, position)
);
create index guide_blocks_guide_idx on public.guide_blocks (guide_id, position);

create or replace function private.guard_embed_block() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  target_device uuid;
  parent_device uuid;
begin
  if new.block_type = 'embed' then
    if new.embed_guide_id is null then raise exception 'embed block needs embed_guide_id'; end if;
    if new.embed_guide_id = new.guide_id then raise exception 'a guide cannot embed itself'; end if;
    select device_id into target_device from public.guides where id = new.embed_guide_id;
    if not found then raise exception 'embed target not found'; end if;
    select device_id into parent_device from public.guides where id = new.guide_id;
    if target_device is not null and target_device is distinct from parent_device then
      raise exception 'phone-specific guides cannot be embedded into another devices guide';
    end if;
  end if;
  return new;
end $$;
create trigger trg_guard_embed before insert or update on public.guide_blocks
  for each row execute function private.guard_embed_block();

-- ---------- questions / answers / issues ----------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  rom_id uuid references public.roms(id) on delete cascade,
  root_method_id uuid references public.root_methods(id) on delete cascade,
  variant_id uuid references public.device_variants(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  title text not null,
  body_md text,
  status question_status not null default 'open',
  upvotes int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint one_scope check (num_nonnulls(rom_id, root_method_id, variant_id) <= 1)
);
create trigger trg_questions_updated before update on public.questions
  for each row execute function public.set_updated_at();
create index questions_device_idx on public.questions (device_id, status);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body_md text not null,
  is_accepted boolean not null default false,
  upvotes int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_answers_updated before update on public.answers
  for each row execute function public.set_updated_at();
create index answers_question_idx on public.answers (question_id);

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  rom_id uuid references public.roms(id) on delete cascade,
  root_method_id uuid references public.root_methods(id) on delete cascade,
  variant_id uuid references public.device_variants(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  title text not null,
  body_md text,
  severity issue_severity not null default 'medium',
  status issue_status not null default 'open',
  resolution_note text,
  upvotes int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint one_scope check (num_nonnulls(rom_id, root_method_id, variant_id) <= 1)
);
create trigger trg_issues_updated before update on public.issues
  for each row execute function public.set_updated_at();
create index issues_device_idx on public.issues (device_id, status);

-- status guards: only mods/admins move lifecycle states
create or replace function private.guard_lifecycle_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status
     and auth.uid() is not null
     and auth.uid() is distinct from old.author_id
     and coalesce(current_setting('rootdb.allow_status_change', true), '') <> '1'
     and not private.is_mod() then
    raise exception 'only the author or moderators can change status';
  end if;
  return new;
end $$;
create trigger trg_questions_status before update on public.questions
  for each row execute function private.guard_lifecycle_status();
create trigger trg_issues_status before update on public.issues
  for each row execute function private.guard_lifecycle_status();

-- ---------- votes / confirmations / saved ----------
create table public.votes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('question','answer','issue')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);
create index votes_target_idx on public.votes (target_type, target_id);

create or replace function private.apply_vote() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  t text; id uuid; delta int;
begin
  if tg_op = 'INSERT' then t := new.target_type; id := new.target_id; delta := 1;
  else t := old.target_type; id := old.target_id; delta := -1; end if;
  execute format('update public.%I set upvotes = upvotes + $1 where id = $2',
                 case t when 'question' then 'questions' when 'answer' then 'answers' else 'issues' end)
  using delta, id;
  return coalesce(new, old);
end $$;
create trigger trg_vote_counter after insert or delete on public.votes
  for each row execute function private.apply_vote();

create table public.confirmations (
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('rom','root_method','software')),
  target_id uuid not null,
  android_version text,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create or replace function private.apply_confirmation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  t text; id uuid; delta int;
begin
  if tg_op = 'INSERT' then t := new.target_type; id := new.target_id; delta := 1;
  else t := old.target_type; id := old.target_id; delta := -1; end if;
  execute format(
    'update public.%I set confirmed_count = confirmed_count + $1,
       last_confirmed_at = case when $1 > 0 then now() else last_confirmed_at end
     where id = $2',
    case t when 'rom' then 'roms' when 'root_method' then 'root_methods' else 'software' end)
  using delta, id;
  return coalesce(new, old);
end $$;
create trigger trg_confirmation_counter after insert or delete on public.confirmations
  for each row execute function private.apply_confirmation();

create table public.saved_devices (
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, device_id)
);

-- ---------- submissions (moderation) ----------
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  type submission_type not null,
  payload jsonb not null,
  status submission_status not null default 'pending',
  reviewer_id uuid references public.profiles(id),
  reviewer_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index submissions_queue_idx on public.submissions (status, created_at);
create index submissions_user_idx on public.submissions (user_id);

create or replace function private.guard_submission_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_mod() and auth.uid() is not null then
    if old.status <> 'pending' then raise exception 'submission already reviewed'; end if;
    if new.status <> 'withdrawn' then raise exception 'only moderators review submissions'; end if;
  end if;
  return new;
end $$;
create trigger trg_submission_guard before update on public.submissions
  for each row execute function private.guard_submission_update();

-- ---------- updates feed ----------
create table public.device_updates (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.devices(id) on delete cascade,
  software_id uuid references public.software(id) on delete cascade,
  kind update_kind not null,
  title text not null,
  body text,
  created_at timestamptz not null default now()
);
create index updates_device_idx on public.device_updates (device_id, created_at desc);
create index updates_site_idx on public.device_updates (created_at desc);

create or replace function private.emit_device_updates() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- nested IFs: plpgsql AND does not short-circuit, so cross-table field access
  -- inside a compound condition can evaluate NEW.<column> for the wrong table
  if tg_table_name = 'devices' and tg_op = 'INSERT' then
    insert into public.device_updates (device_id, kind, title)
    values (new.id, 'device_added', 'Device added: ' || new.brand || ' ' || new.name);
  elsif tg_table_name = 'roms' then
    if tg_op = 'INSERT' then
      insert into public.device_updates (device_id, kind, title)
      values (new.device_id, 'rom_added', new.name || ' added'
        || coalesce(' (Android ' || new.android_version || ')', ''));
    elsif new.status is distinct from old.status then
      insert into public.device_updates (device_id, kind, title)
      values (new.device_id, 'rom_updated', new.name || ' status: ' || new.status);
    end if;
  elsif tg_table_name = 'root_methods' and tg_op = 'INSERT' then
    insert into public.device_updates (device_id, kind, title)
    values (new.device_id, 'method_added', 'Root method added: ' || new.name);
  elsif tg_table_name = 'software' and tg_op = 'INSERT' then
    insert into public.device_updates (software_id, kind, title)
    values (new.id, 'software_added', 'New ' || new.kind || ': ' || new.name);
  elsif tg_table_name = 'guides' then
    if tg_op = 'INSERT' then
      if new.published then
        insert into public.device_updates (device_id, kind, title)
        values (new.device_id, 'guide_added', 'Guide published: ' || new.title);
      end if;
    elsif new.published and not old.published then
      insert into public.device_updates (device_id, kind, title)
      values (new.device_id, 'guide_added', 'Guide published: ' || new.title);
    end if;
  elsif tg_table_name = 'device_rootability' then
    if tg_op = 'INSERT' then
      insert into public.device_updates (device_id, kind, title)
      values (new.device_id, 'verdict_changed', 'Root verdict: ' || new.verdict);
    elsif new.verdict is distinct from old.verdict then
      insert into public.device_updates (device_id, kind, title)
      values (new.device_id, 'verdict_changed', 'Root verdict: ' || new.verdict);
    end if;
  end if;
  return new;
end $$;

create trigger trg_updates_devices after insert on public.devices
  for each row execute function private.emit_device_updates();
create trigger trg_updates_roms after insert or update on public.roms
  for each row execute function private.emit_device_updates();
create trigger trg_updates_methods after insert on public.root_methods
  for each row execute function private.emit_device_updates();
create trigger trg_updates_software after insert on public.software
  for each row execute function private.emit_device_updates();
create trigger trg_updates_guides after insert or update on public.guides
  for each row execute function private.emit_device_updates();
create trigger trg_updates_verdict after insert or update on public.device_rootability
  for each row execute function private.emit_device_updates();

-- confirmed-milestone updates
create or replace function private.emit_milestones() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.confirmed_count in (10,50,100,500) and new.confirmed_count > old.confirmed_count then
    if tg_table_name = 'software' then
      insert into public.device_updates (software_id, kind, title)
      values (new.id, 'confirmed_milestone', new.name || ': ' || new.confirmed_count || ' reported working');
    else
      insert into public.device_updates (device_id, kind, title)
      values (new.device_id, 'confirmed_milestone', new.name || ': ' || new.confirmed_count || ' reported working');
    end if;
  end if;
  return new;
end $$;
create trigger trg_milestones_roms after update of confirmed_count on public.roms
  for each row execute function private.emit_milestones();
create trigger trg_milestones_methods after update of confirmed_count on public.root_methods
  for each row execute function private.emit_milestones();
create trigger trg_milestones_software after update of confirmed_count on public.software
  for each row execute function private.emit_milestones();

-- accept answer (question author or mods)
create or replace function public.accept_answer(p_answer_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  qid uuid; qauthor uuid;
begin
  select a.question_id, q.author_id into qid, qauthor
  from public.answers a join public.questions q on q.id = a.question_id
  where a.id = p_answer_id;
  if qid is null then raise exception 'answer not found'; end if;
  if auth.uid() is distinct from qauthor and not private.is_mod() then
    raise exception 'only the question author or moderators can accept answers';
  end if;
  perform set_config('rootdb.allow_status_change', '1', true);
  update public.answers set is_accepted = (id = p_answer_id) where question_id = qid;
  update public.questions set status = 'solved' where id = qid; -- guarded trigger bypassed via flag
end $$;
revoke all on function public.accept_answer(uuid) from public, anon;
grant execute on function public.accept_answer(uuid) to authenticated;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.linked_accounts enable row level security;
alter table public.devices enable row level security;
alter table public.device_rootability enable row level security;
alter table public.device_variants enable row level security;
alter table public.root_methods enable row level security;
alter table public.roms enable row level security;
alter table public.tools enable row level security;
alter table public.software enable row level security;
alter table public.software_devices enable row level security;
alter table public.guides enable row level security;
alter table public.guide_blocks enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.issues enable row level security;
alter table public.votes enable row level security;
alter table public.confirmations enable row level security;
alter table public.saved_devices enable row level security;
alter table public.submissions enable row level security;
alter table public.device_updates enable row level security;

-- profiles
create policy profiles_read on public.profiles for select using (true);
create policy profiles_insert on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy profiles_update on public.profiles for update to authenticated
  using ((select auth.uid()) = id or private.is_mod())
  with check ((select auth.uid()) = id or private.is_mod());
-- linked accounts
create policy linked_read on public.linked_accounts for select using (true);
create policy linked_write on public.linked_accounts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy linked_delete on public.linked_accounts for delete to authenticated
  using ((select auth.uid()) = user_id);
-- public catalog reads
create policy devices_read on public.devices for select using (true);
create policy rootability_read on public.device_rootability for select using (true);
create policy variants_read on public.device_variants for select using (true);
create policy methods_read on public.root_methods for select using (true);
create policy roms_read on public.roms for select using (true);
create policy tools_read on public.tools for select using (true);
create policy software_read on public.software for select using (true);
create policy software_devices_read on public.software_devices for select using (true);
create policy updates_read on public.device_updates for select using (true);
-- catalog writes: mods/admins (community enters via submissions)
create policy devices_write on public.devices for insert to authenticated with check (private.is_mod());
create policy devices_update on public.devices for update to authenticated using (private.is_mod()) with check (private.is_mod());
create policy devices_delete on public.devices for delete to authenticated using (private.is_admin());
create policy rootability_write on public.device_rootability for insert to authenticated with check (private.is_mod());
create policy rootability_update on public.device_rootability for update to authenticated using (private.is_mod()) with check (private.is_mod());
create policy variants_write on public.device_variants for insert to authenticated with check (private.is_mod());
create policy variants_update on public.device_variants for update to authenticated using (private.is_mod()) with check (private.is_mod());
create policy variants_delete on public.device_variants for delete to authenticated using (private.is_admin());
create policy methods_write on public.root_methods for insert to authenticated with check (private.is_mod());
create policy methods_update on public.root_methods for update to authenticated using (private.is_mod()) with check (private.is_mod());
create policy methods_delete on public.root_methods for delete to authenticated using (private.is_admin());
create policy roms_write on public.roms for insert to authenticated with check (private.is_mod());
create policy roms_update on public.roms for update to authenticated using (private.is_mod()) with check (private.is_mod());
create policy roms_delete on public.roms for delete to authenticated using (private.is_admin());
create policy tools_write on public.tools for insert to authenticated with check (private.is_mod());
create policy tools_update on public.tools for update to authenticated using (private.is_mod()) with check (private.is_mod());
create policy tools_delete on public.tools for delete to authenticated using (private.is_admin());
create policy software_write on public.software for insert to authenticated with check (private.is_mod());
create policy software_update on public.software for update to authenticated using (private.is_mod()) with check (private.is_mod());
create policy software_delete on public.software for delete to authenticated using (private.is_admin());
create policy software_devices_write on public.software_devices for all to authenticated using (private.is_mod()) with check (private.is_mod());
-- guides: public sees published; authors see their drafts; mods see all
create policy guides_read on public.guides for select
  using (published or (select auth.uid()) = author_id or private.is_mod());
create policy guides_insert on public.guides for insert to authenticated
  with check ((source = 'community' and (select auth.uid()) = author_id and published = false) or private.is_mod());
create policy guides_update on public.guides for update to authenticated
  using (((select auth.uid()) = author_id and published = false) or private.is_mod())
  with check (((select auth.uid()) = author_id) or private.is_mod());
create policy guides_delete on public.guides for delete to authenticated
  using (((select auth.uid()) = author_id and published = false) or private.is_mod());
-- blocks: read when parent guide visible; write with parent-guide permission
create policy blocks_read on public.guide_blocks for select using (
  exists (select 1 from public.guides g where g.id = guide_id
          and (g.published or (select auth.uid()) = g.author_id or private.is_mod())));
create policy blocks_write on public.guide_blocks for insert to authenticated with check (
  exists (select 1 from public.guides g where g.id = guide_id
          and (((select auth.uid()) = g.author_id and g.published = false) or private.is_mod())));
create policy blocks_update on public.guide_blocks for update to authenticated using (
  exists (select 1 from public.guides g where g.id = guide_id
          and (((select auth.uid()) = g.author_id and g.published = false) or private.is_mod())));
create policy blocks_delete on public.guide_blocks for delete to authenticated using (
  exists (select 1 from public.guides g where g.id = guide_id
          and (((select auth.uid()) = g.author_id and g.published = false) or private.is_mod())));
-- questions / answers / issues
create policy questions_read on public.questions for select using (true);
create policy questions_insert on public.questions for insert to authenticated with check ((select auth.uid()) = author_id);
create policy questions_update on public.questions for update to authenticated using ((select auth.uid()) = author_id or private.is_mod());
create policy questions_delete on public.questions for delete to authenticated using ((select auth.uid()) = author_id or private.is_mod());
create policy answers_read on public.answers for select using (true);
create policy answers_insert on public.answers for insert to authenticated with check ((select auth.uid()) = author_id);
create policy answers_update on public.answers for update to authenticated using ((select auth.uid()) = author_id or private.is_mod());
create policy answers_delete on public.answers for delete to authenticated using ((select auth.uid()) = author_id or private.is_mod());
create policy issues_read on public.issues for select using (true);
create policy issues_insert on public.issues for insert to authenticated with check ((select auth.uid()) = author_id);
create policy issues_update on public.issues for update to authenticated using ((select auth.uid()) = author_id or private.is_mod());
create policy issues_delete on public.issues for delete to authenticated using ((select auth.uid()) = author_id or private.is_mod());
-- votes / confirmations / saved
create policy votes_read on public.votes for select using (true);
create policy votes_insert on public.votes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy votes_delete on public.votes for delete to authenticated using ((select auth.uid()) = user_id);
create policy confirmations_read on public.confirmations for select using (true);
create policy confirmations_insert on public.confirmations for insert to authenticated with check ((select auth.uid()) = user_id);
create policy confirmations_delete on public.confirmations for delete to authenticated using ((select auth.uid()) = user_id);
create policy saved_read on public.saved_devices for select to authenticated using ((select auth.uid()) = user_id);
create policy saved_insert on public.saved_devices for insert to authenticated with check ((select auth.uid()) = user_id);
create policy saved_delete on public.saved_devices for delete to authenticated using ((select auth.uid()) = user_id);
create policy saved_update on public.saved_devices for update to authenticated using ((select auth.uid()) = user_id);
-- submissions
create policy submissions_read on public.submissions for select to authenticated
  using ((select auth.uid()) = user_id or private.is_mod());
create policy submissions_insert on public.submissions for insert to authenticated with check (
  (select auth.uid()) = user_id
  and (select count(*) from public.submissions s
        where s.user_id = (select auth.uid()) and s.status = 'pending') < 10);
create policy submissions_update on public.submissions for update to authenticated
  using ((select auth.uid()) = user_id or private.is_mod());

-- ---------- grants (Data API) ----------
grant select on public.profiles, public.linked_accounts, public.devices,
  public.device_rootability, public.device_variants, public.root_methods, public.roms, public.tools,
  public.software, public.software_devices, public.guides, public.guide_blocks,
  public.questions, public.answers, public.issues, public.votes,
  public.confirmations, public.device_updates to anon, authenticated;
grant insert, update, delete on public.profiles, public.linked_accounts,
  public.questions, public.answers, public.issues, public.votes,
  public.confirmations, public.saved_devices, public.submissions,
  public.guides, public.guide_blocks to authenticated;
grant insert, update, delete on public.devices, public.device_rootability,
  public.device_variants, public.root_methods, public.roms, public.tools, public.software,
  public.software_devices to authenticated;
-- device_updates: no direct user writes (trigger-owned) — select only, granted above.
grant select on public.saved_devices to authenticated; -- already covered by insert above; explicit for clarity
