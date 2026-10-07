-- v1.0.1 Tenancy spine: agencies, companies, memberships, audit, feature flags, RLS.
-- Every permission is enforced here in Postgres. The app helper can(user, action, resource) is never the only gate.

create schema if not exists app;
grant usage on schema app to authenticated;

create type public.scope_type as enum ('platform', 'agency', 'company');
create type public.role_type as enum (
  'mygyaan_admin', 'agency_manager', 'agency_rm',
  'client_admin', 'client_manager', 'client_user', 'client_viewer'
);

create function app.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------- tables
create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  is_default boolean not null default false,
  branding jsonb not null default '{}',
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);
create unique index agencies_one_default on public.agencies (is_default) where is_default;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id),
  name text not null,
  slug text not null unique
    check (slug ~ '^[a-z0-9-]{2,40}$'
       and slug not in ('admin','agency','agencies','api','auth','login','logout','signup','settings',
                        'platform','app','static','www','help','support','billing','dashboard','changelog')),
  status text not null default 'trial' check (status in ('active', 'trial', 'locked', 'archived')),
  plan_id uuid,
  settings jsonb not null default '{}',
  client_admin_can_view_data boolean not null default false,
  icp_sentence text,
  strategy_status text not null default 'none',
  sending_identity_email text,
  whatsapp_number text,
  lock_reason text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);
create index companies_agency_idx on public.companies (agency_id);

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text,
  phone text,
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scope_type public.scope_type not null,
  scope_id uuid,
  role public.role_type not null,
  allocated_company_ids uuid[] not null default '{}',
  granted_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  constraint memberships_scope_role check (
    (scope_type = 'platform' and scope_id is null and role = 'mygyaan_admin')
    or (scope_type = 'agency' and scope_id is not null and role in ('agency_manager', 'agency_rm'))
    or (scope_type = 'company' and scope_id is not null
        and role in ('client_admin', 'client_manager', 'client_user', 'client_viewer'))
  ),
  constraint memberships_alloc_rm_only check (role = 'agency_rm' or cardinality(allocated_company_ids) = 0)
);
create unique index memberships_unique
  on public.memberships (user_id, scope_type, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid), role);
create index memberships_user_idx on public.memberships (user_id);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  actor_id uuid,
  company_id uuid,   -- no FK: history outlives the row
  agency_id uuid,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  before jsonb,
  after jsonb
);
create index audit_company_idx on public.audit_log (company_id, at desc);
create index audit_agency_idx on public.audit_log (agency_id, at desc);

create table public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  flag text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  unique (company_id, flag)
);

create trigger agencies_updated before update on public.agencies for each row execute function app.set_updated_at();
create trigger companies_updated before update on public.companies for each row execute function app.set_updated_at();
create trigger profiles_updated before update on public.profiles for each row execute function app.set_updated_at();
create trigger memberships_updated before update on public.memberships for each row execute function app.set_updated_at();
create trigger flags_updated before update on public.feature_flags for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------- access resolution
-- Not exposed to API roles; read only through the SECURITY DEFINER helpers below.
create view app.v_user_company_access as
select
  m.user_id,
  c.id as company_id,
  m.role,
  (m.role <> 'client_admin' or c.client_admin_can_view_data) as can_read,
  (m.role in ('mygyaan_admin', 'agency_manager', 'agency_rm', 'client_manager', 'client_user')
     and c.status not in ('locked', 'archived')) as can_write,
  (m.role in ('mygyaan_admin', 'agency_manager', 'agency_rm', 'client_admin', 'client_manager')) as can_manage
from public.memberships m
join public.companies c on
     (m.scope_type = 'platform')
  or (m.scope_type = 'agency' and m.role = 'agency_manager' and c.agency_id = m.scope_id)
  or (m.scope_type = 'agency' and m.role = 'agency_rm' and c.agency_id = m.scope_id
      and c.id = any (m.allocated_company_ids))
  or (m.scope_type = 'company' and c.id = m.scope_id);
revoke all on app.v_user_company_access from public, anon, authenticated;

create function app.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships where user_id = auth.uid() and scope_type = 'platform');
$$;

create function app.is_agency_manager(p_agency uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships
    where user_id = auth.uid() and scope_type = 'agency' and role = 'agency_manager' and scope_id = p_agency);
$$;

create function app.can_see(p_company uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from app.v_user_company_access where user_id = auth.uid() and company_id = p_company);
$$;
create function app.can_read(p_company uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from app.v_user_company_access where user_id = auth.uid() and company_id = p_company and can_read);
$$;
create function app.can_write(p_company uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from app.v_user_company_access where user_id = auth.uid() and company_id = p_company and can_write);
$$;
create function app.can_manage(p_company uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from app.v_user_company_access where user_id = auth.uid() and company_id = p_company and can_manage);
$$;
-- Client user may delete only what they created; every other write role may delete.
create function app.can_delete(p_company uuid, p_created_by uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from app.v_user_company_access
    where user_id = auth.uid() and company_id = p_company and can_write
      and (role <> 'client_user' or p_created_by = auth.uid()));
$$;

create function app.agency_visible(p_agency uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.is_platform_admin()
    or exists (select 1 from public.memberships where user_id = auth.uid() and scope_type = 'agency' and scope_id = p_agency)
    or exists (select 1 from public.companies c where c.agency_id = p_agency and app.can_see(c.id));
$$;

create function app.can_manage_scope(p_scope public.scope_type, p_scope_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.is_platform_admin()
    or (p_scope = 'agency' and app.is_agency_manager(p_scope_id))
    or (p_scope = 'company' and app.can_manage(p_scope_id));
$$;

-- Who may create, change or remove a membership. Closes privilege escalation:
-- only Mygyaan admin makes admins or agency managers; agency manager makes RMs and client roles in own agency;
-- client admin / RM make client roles in their company; client manager makes only user and viewer.
create function app.can_grant(p_scope public.scope_type, p_scope_id uuid, p_role public.role_type) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when app.is_platform_admin() then true
    when p_scope = 'platform' then false
    when p_scope = 'agency' then p_role = 'agency_rm' and app.is_agency_manager(p_scope_id)
    else exists (select 1 from app.v_user_company_access a
      where a.user_id = auth.uid() and a.company_id = p_scope_id
        and (a.role in ('agency_manager', 'agency_rm', 'client_admin')
             or (a.role = 'client_manager' and p_role in ('client_user', 'client_viewer'))))
  end;
$$;

create function app.can_see_profile(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user = auth.uid() or app.is_platform_admin()
    or exists (select 1 from public.memberships m
               where m.user_id = p_user and app.can_manage_scope(m.scope_type, m.scope_id));
$$;

create function app.can_audit(p_company uuid, p_agency uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.is_platform_admin()
    or (p_agency is not null and app.is_agency_manager(p_agency))
    or (p_company is not null and exists (select 1 from public.companies c
         where c.id = p_company and app.is_agency_manager(c.agency_id)));
$$;

-- ---------------------------------------------------------------- guards
create function app.guard_company() returns trigger language plpgsql security definer set search_path = '' as $$
declare privileged boolean;
begin
  if auth.uid() is null then return new; end if;   -- service role / migrations
  if new.slug is distinct from old.slug or new.agency_id is distinct from old.agency_id then
    if not app.is_platform_admin() then
      raise exception 'slug and agency can only be changed by a Mygyaan admin' using errcode = '42501';
    end if;
  end if;
  privileged := app.is_platform_admin() or app.is_agency_manager(old.agency_id);
  if not privileged and (
       new.status is distinct from old.status or new.plan_id is distinct from old.plan_id
    or new.lock_reason is distinct from old.lock_reason or new.locked_at is distinct from old.locked_at
    or new.client_admin_can_view_data is distinct from old.client_admin_can_view_data) then
    raise exception 'status, plan, lock and data-view toggle are agency/platform controlled' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger companies_guard before update on public.companies for each row execute function app.guard_company();

create function app.guard_agency() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or app.is_platform_admin() then return new; end if;
  if new.is_default is distinct from old.is_default or new.status is distinct from old.status
     or new.slug is distinct from old.slug then
    raise exception 'agency slug, status and default flag are Mygyaan-admin only' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger agencies_guard before update on public.agencies for each row execute function app.guard_agency();

create function app.guard_membership() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then new.granted_by := coalesce(auth.uid(), new.granted_by); end if;
  if new.role = 'agency_rm' and exists (
       select 1 from unnest(new.allocated_company_ids) cid
       where not exists (select 1 from public.companies c where c.id = cid and c.agency_id = new.scope_id)) then
    raise exception 'allocated companies must belong to the RM''s agency' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception 'membership user cannot be changed' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger memberships_guard before insert or update on public.memberships for each row execute function app.guard_membership();

create function app.lock_company_id() returns trigger language plpgsql as $$
begin
  if new.company_id is distinct from old.company_id then
    raise exception 'company_id is immutable' using errcode = '42501';
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------- audit
create function app.audit_write() returns trigger language plpgsql security definer set search_path = '' as $$
declare r jsonb := to_jsonb(coalesce(new, old)); cid uuid; aid uuid;
begin
  if tg_table_name = 'companies' then
    cid := (r ->> 'id')::uuid; aid := (r ->> 'agency_id')::uuid;
  elsif tg_table_name = 'agencies' then
    aid := (r ->> 'id')::uuid;
  elsif tg_table_name = 'memberships' then
    if r ->> 'scope_type' = 'company' then
      cid := (r ->> 'scope_id')::uuid;
      select agency_id into aid from public.companies where id = cid;
    elsif r ->> 'scope_type' = 'agency' then
      aid := (r ->> 'scope_id')::uuid;
    end if;
  else
    cid := (r ->> 'company_id')::uuid;
    if cid is not null then select agency_id into aid from public.companies where id = cid; end if;
  end if;
  insert into public.audit_log (actor_id, company_id, agency_id, action, resource_type, resource_id, before, after)
  values (auth.uid(), cid, aid, lower(tg_op), tg_table_name, (r ->> 'id')::uuid,
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

create function app.audit_immutable() returns trigger language plpgsql as $$
begin raise exception 'audit_log is append-only' using errcode = '42501'; end $$;
create trigger audit_no_change before update or delete on public.audit_log
  for each row execute function app.audit_immutable();

create trigger agencies_audit after insert or update or delete on public.agencies for each row execute function app.audit_write();
create trigger companies_audit after insert or update or delete on public.companies for each row execute function app.audit_write();
create trigger memberships_audit after insert or update or delete on public.memberships for each row execute function app.audit_write();
create trigger flags_audit after insert or update or delete on public.feature_flags for each row execute function app.audit_write();

-- ---------------------------------------------------------------- reusable pattern for every company-scoped data table
-- Table must have: company_id uuid not null, created_by uuid default auth.uid(), updated_at.
create function app.apply_company_policies(p_table regclass) returns void language plpgsql as $$
declare t text := p_table::text; n text := replace(t, '.', '_');
begin
  execute format('alter table %s enable row level security', t);
  execute format('revoke all on %s from anon', t);
  execute format('grant select, insert, update, delete on %s to authenticated', t);
  execute format('create policy %I on %s for select using (app.can_read(company_id))', n || '_select', t);
  execute format('create policy %I on %s for insert with check (app.can_write(company_id) and created_by = auth.uid())', n || '_insert', t);
  execute format('create policy %I on %s for update using (app.can_write(company_id)) with check (app.can_write(company_id))', n || '_update', t);
  execute format('create policy %I on %s for delete using (app.can_delete(company_id, created_by))', n || '_delete', t);
  execute format('create trigger %I before update on %s for each row execute function app.lock_company_id()', n || '_lock_cid', t);
  execute format('create trigger %I after insert or update or delete on %s for each row execute function app.audit_write()', n || '_audit', t);
end $$;

-- ---------------------------------------------------------------- RLS on tenancy tables
alter table public.agencies enable row level security;
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.audit_log enable row level security;
alter table public.feature_flags enable row level security;

revoke all on public.agencies, public.companies, public.profiles, public.memberships,
              public.audit_log, public.feature_flags from anon;
grant select, insert, update, delete on public.agencies, public.companies, public.profiles,
              public.memberships, public.feature_flags to authenticated;
grant select on public.audit_log to authenticated;

create policy agencies_select on public.agencies for select using (app.agency_visible(id));
create policy agencies_insert on public.agencies for insert with check (app.is_platform_admin());
create policy agencies_update on public.agencies for update
  using (app.is_platform_admin() or app.is_agency_manager(id))
  with check (app.is_platform_admin() or app.is_agency_manager(id));
create policy agencies_delete on public.agencies for delete using (app.is_platform_admin());

create policy companies_select on public.companies for select using (app.can_see(id));
create policy companies_insert on public.companies for insert
  with check (app.is_platform_admin() or app.is_agency_manager(agency_id));
create policy companies_update on public.companies for update
  using (app.can_manage(id)) with check (app.can_manage(id));
create policy companies_delete on public.companies for delete using (app.is_platform_admin());

create policy profiles_select on public.profiles for select using (app.can_see_profile(user_id));
create policy profiles_insert on public.profiles for insert with check (user_id = auth.uid());
create policy profiles_update on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy memberships_select on public.memberships for select
  using (user_id = auth.uid() or app.can_manage_scope(scope_type, scope_id));
create policy memberships_insert on public.memberships for insert
  with check (app.can_grant(scope_type, scope_id, role));
create policy memberships_update on public.memberships for update
  using (app.can_grant(scope_type, scope_id, role))
  with check (app.can_grant(scope_type, scope_id, role));
create policy memberships_delete on public.memberships for delete
  using (app.can_grant(scope_type, scope_id, role));

create policy audit_select on public.audit_log for select using (app.can_audit(company_id, agency_id));

create policy flags_select on public.feature_flags for select using (app.can_see(company_id));
create policy flags_insert on public.feature_flags for insert with check (app.is_platform_admin());
create policy flags_update on public.feature_flags for update using (app.is_platform_admin()) with check (app.is_platform_admin());
create policy flags_delete on public.feature_flags for delete using (app.is_platform_admin());

-- Every new auth user gets a profile.
create function app.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, name) values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function app.handle_new_user();

revoke all on all functions in schema app from public, anon;
grant execute on all functions in schema app to authenticated;
