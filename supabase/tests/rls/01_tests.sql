\set ON_ERROR_STOP on
\set QUIET on
-- RLS isolation suite. Any failed assertion aborts with a non-zero exit.
create schema test;
create table test.results (n serial, name text, ok boolean);

create function test.login(uid uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', uid::text, true); execute 'set local role authenticated'; end $$;
create function test.logout() returns void language plpgsql as $$
begin execute 'reset role'; perform set_config('request.jwt.claim.sub', '', true); end $$;
create function test.check(p_name text, p_ok boolean) returns void language plpgsql as $$
begin
  insert into test.results (name, ok) values (p_name, coalesce(p_ok, false));
  if not coalesce(p_ok, false) then raise exception 'FAILED: %', p_name; end if;
end $$;
-- scalar count as a user
create function test.cnt(uid uuid, q text) returns bigint language plpgsql as $$
declare n bigint;
begin perform test.login(uid); execute 'select count(*) from (' || q || ') s' into n; perform test.logout(); return n; end $$;
-- true if statement raises
create function test.denied(uid uuid, stmt text) returns boolean language plpgsql as $$
begin
  perform test.login(uid);
  begin execute stmt; perform test.logout(); return false;
  exception when others then perform test.logout(); return true; end;
end $$;
-- rows touched by a DML as a user (RLS filters silently)
create function test.rows(uid uuid, stmt text) returns bigint language plpgsql as $$
declare n bigint;
begin perform test.login(uid); execute stmt; get diagnostics n = row_count; perform test.logout(); return n; end $$;

-- ------------------------------------------------------------ fixtures (as superuser)
do $$ begin
  insert into auth.users (id, email) values
   ('00000000-0000-0000-0000-000000000001','admin@m'), ('00000000-0000-0000-0000-000000000002','mgr@m'),
   ('00000000-0000-0000-0000-000000000003','rm@m'),     ('00000000-0000-0000-0000-000000000004','cadmin@ng'),
   ('00000000-0000-0000-0000-000000000005','cmgr@ng'),  ('00000000-0000-0000-0000-000000000006','cuser@ng'),
   ('00000000-0000-0000-0000-000000000007','cview@ng'), ('00000000-0000-0000-0000-000000000008','pmgr@partner'),
   ('00000000-0000-0000-0000-000000000009','nobody@x');
  insert into public.agencies (id, name, slug, is_default) values
   ('a0000000-0000-0000-0000-000000000001','Mygyaan','mygyaan',true),
   ('a0000000-0000-0000-0000-000000000002','Partner','partner',false);
  insert into public.companies (id, agency_id, name, slug, status) values
   ('c0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','Nandan GSE','nandangse','active'),
   ('c0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','Fabro','fabro','active'),
   ('c0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000002','Acme','acme','active');
  insert into public.memberships (user_id, scope_type, scope_id, role, allocated_company_ids) values
   ('00000000-0000-0000-0000-000000000001','platform',null,'mygyaan_admin','{}'),
   ('00000000-0000-0000-0000-000000000002','agency','a0000000-0000-0000-0000-000000000001','agency_manager','{}'),
   ('00000000-0000-0000-0000-000000000003','agency','a0000000-0000-0000-0000-000000000001','agency_rm','{c0000000-0000-0000-0000-000000000002}'),
   ('00000000-0000-0000-0000-000000000004','company','c0000000-0000-0000-0000-000000000001','client_admin','{}'),
   ('00000000-0000-0000-0000-000000000005','company','c0000000-0000-0000-0000-000000000001','client_manager','{}'),
   ('00000000-0000-0000-0000-000000000006','company','c0000000-0000-0000-0000-000000000001','client_user','{}'),
   ('00000000-0000-0000-0000-000000000007','company','c0000000-0000-0000-0000-000000000001','client_viewer','{}'),
   ('00000000-0000-0000-0000-000000000008','agency','a0000000-0000-0000-0000-000000000002','agency_manager','{}');
end $$;

create table public.test_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  body text,
  created_by uuid default auth.uid(),
  updated_at timestamptz not null default now()
);
select app.apply_company_policies('public.test_records');
grant all on schema test to authenticated;
grant all on all tables in schema test to authenticated;
grant execute on all functions in schema test to authenticated;

insert into public.test_records (company_id, body, created_by) values
 ('c0000000-0000-0000-0000-000000000001','ng-1','00000000-0000-0000-0000-000000000005'),
 ('c0000000-0000-0000-0000-000000000001','ng-2','00000000-0000-0000-0000-000000000006'),
 ('c0000000-0000-0000-0000-000000000002','fabro-1','00000000-0000-0000-0000-000000000002'),
 ('c0000000-0000-0000-0000-000000000003','acme-1','00000000-0000-0000-0000-000000000008');

-- shorthand
\set admin    '''00000000-0000-0000-0000-000000000001'''
\set mgr      '''00000000-0000-0000-0000-000000000002'''
\set rm       '''00000000-0000-0000-0000-000000000003'''
\set cadmin   '''00000000-0000-0000-0000-000000000004'''
\set cmgr     '''00000000-0000-0000-0000-000000000005'''
\set cuser    '''00000000-0000-0000-0000-000000000006'''
\set cview    '''00000000-0000-0000-0000-000000000007'''
\set pmgr     '''00000000-0000-0000-0000-000000000008'''
\set nobody   '''00000000-0000-0000-0000-000000000009'''
\set ng       '''c0000000-0000-0000-0000-000000000001'''
\set fabro    '''c0000000-0000-0000-0000-000000000002'''
\set acme     '''c0000000-0000-0000-0000-000000000003'''

-- ------------------------------------------------------------ visibility
select test.check('admin sees all 3 companies', test.cnt(:admin, 'select 1 from public.companies') = 3);
select test.check('admin sees all records', test.cnt(:admin, 'select 1 from public.test_records') = 4);
select test.check('agency manager sees own 2 companies only', test.cnt(:mgr, 'select 1 from public.companies') = 2);
select test.check('agency manager cannot see other agency records', test.cnt(:mgr, $$select 1 from public.test_records where body='acme-1'$$) = 0);
select test.check('partner manager sees only acme', test.cnt(:pmgr, 'select 1 from public.companies') = 1);
select test.check('RM allocated to fabro sees one company', test.cnt(:rm, 'select 1 from public.companies') = 1);
select test.check('RM sees fabro, not nandangse', test.cnt(:rm, $$select 1 from public.companies where slug='nandangse'$$) = 0);
select test.check('RM sees only fabro records', test.cnt(:rm, 'select 1 from public.test_records') = 1);
select test.check('RM cannot read nandangse records by id', test.cnt(:rm, format('select 1 from public.test_records where company_id=%L', 'c0000000-0000-0000-0000-000000000001')) = 0);
select test.check('RM write into nandangse denied', test.denied(:rm, format('insert into public.test_records (company_id, body) values (%L, ''x'')', 'c0000000-0000-0000-0000-000000000001')));
select test.check('RM write into fabro allowed', not test.denied(:rm, format('insert into public.test_records (company_id, body) values (%L, ''rm-1'')', 'c0000000-0000-0000-0000-000000000002')));
select test.check('user with no membership sees nothing', test.cnt(:nobody, 'select 1 from public.companies') = 0 and test.cnt(:nobody, 'select 1 from public.test_records') = 0);
do $$ begin
  begin set local role anon; perform 1 from public.companies limit 1; perform test.check('anon denied on companies', false);
  exception when insufficient_privilege then perform test.logout(); perform test.check('anon denied on companies', true); end;
end $$;

-- ------------------------------------------------------------ client admin: settings only
select test.check('client admin sees own company', test.cnt(:cadmin, 'select 1 from public.companies') = 1);
select test.check('client admin sees NO data by default', test.cnt(:cadmin, 'select 1 from public.test_records') = 0);
select test.check('client admin cannot write data', test.denied(:cadmin, format('insert into public.test_records (company_id, body) values (%L, ''x'')', 'c0000000-0000-0000-0000-000000000001')));
select test.check('client admin can edit company name', test.rows(:cadmin, $$update public.companies set name='Nandan GSE Ltd' where slug='nandangse'$$) = 1);
select test.check('client admin cannot change slug', test.denied(:cadmin, $$update public.companies set slug='nandan2' where slug='nandangse'$$));
select test.check('client admin cannot flip data toggle', test.denied(:cadmin, $$update public.companies set client_admin_can_view_data=true where slug='nandangse'$$));
select test.check('client admin cannot change status', test.denied(:cadmin, $$update public.companies set status='archived' where slug='nandangse'$$));
update public.companies set client_admin_can_view_data = true where slug = 'nandangse';
select test.check('toggle on: client admin reads data', test.cnt(:cadmin, 'select 1 from public.test_records') = 2);
select test.check('toggle on: client admin still cannot write', test.denied(:cadmin, format('insert into public.test_records (company_id, body) values (%L, ''x'')', 'c0000000-0000-0000-0000-000000000001')));
update public.companies set client_admin_can_view_data = false where slug = 'nandangse';

-- ------------------------------------------------------------ client manager / user / viewer
select test.check('client manager reads own data', test.cnt(:cmgr, 'select 1 from public.test_records') = 2);
select test.check('client manager writes', not test.denied(:cmgr, format('insert into public.test_records (company_id, body) values (%L, ''m-1'')', 'c0000000-0000-0000-0000-000000000001')));
select test.check('client manager cannot see fabro', test.cnt(:cmgr, $$select 1 from public.companies where slug='fabro'$$) = 0);
select test.check('client user writes', not test.denied(:cuser, format('insert into public.test_records (company_id, body) values (%L, ''u-1'')', 'c0000000-0000-0000-0000-000000000001')));
select test.check('client user deletes own record', test.rows(:cuser, $$delete from public.test_records where body='u-1'$$) = 1);
select test.check('client user cannot delete others', test.rows(:cuser, $$delete from public.test_records where body='ng-1'$$) = 0);
select test.check('client manager can delete others', test.rows(:cmgr, $$delete from public.test_records where body='ng-2'$$) = 1);
insert into public.test_records (company_id, body, created_by) values ('c0000000-0000-0000-0000-000000000001','ng-2','00000000-0000-0000-0000-000000000006');
select test.check('viewer reads', test.cnt(:cview, 'select 1 from public.test_records') = 3);
select test.check('viewer cannot insert', test.denied(:cview, format('insert into public.test_records (company_id, body) values (%L, ''x'')', 'c0000000-0000-0000-0000-000000000001')));
select test.check('viewer cannot update', test.rows(:cview, $$update public.test_records set body='h'$$) = 0);
select test.check('viewer cannot delete', test.rows(:cview, $$delete from public.test_records$$) = 0);
select test.check('cannot spoof created_by', test.denied(:cuser, format('insert into public.test_records (company_id, body, created_by) values (%L, ''x'', %L)', 'c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005')));
select test.check('company_id immutable', test.denied(:cmgr, format('update public.test_records set company_id=%L where body=''ng-1''', 'c0000000-0000-0000-0000-000000000002')));
select test.check('cannot move row into another company', test.denied(:cmgr, format('insert into public.test_records (company_id, body) values (%L, ''x'')', 'c0000000-0000-0000-0000-000000000002')));

-- ------------------------------------------------------------ privilege escalation
select test.check('client user cannot grant membership', test.denied(:cuser, format('insert into public.memberships (user_id, scope_type, scope_id, role) values (%L,''company'',%L,''client_viewer'')', '00000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001')));
select test.check('user cannot make self platform admin', test.denied(:cadmin, format('insert into public.memberships (user_id, scope_type, role) values (%L,''platform'',''mygyaan_admin'')', '00000000-0000-0000-0000-000000000004')));
select test.check('agency manager cannot grant platform admin', test.denied(:mgr, format('insert into public.memberships (user_id, scope_type, role) values (%L,''platform'',''mygyaan_admin'')', '00000000-0000-0000-0000-000000000009')));
select test.check('agency manager cannot grant agency manager', test.denied(:mgr, format('insert into public.memberships (user_id, scope_type, scope_id, role) values (%L,''agency'',%L,''agency_manager'')', '00000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001')));
select test.check('agency manager cannot grant into other agency', test.denied(:mgr, format('insert into public.memberships (user_id, scope_type, scope_id, role) values (%L,''company'',%L,''client_viewer'')', '00000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000003')));
select test.check('agency manager grants client viewer', not test.denied(:mgr, format('insert into public.memberships (user_id, scope_type, scope_id, role) values (%L,''company'',%L,''client_viewer'')', '00000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001')));
delete from public.memberships where user_id = '00000000-0000-0000-0000-000000000009';
select test.check('client manager cannot grant client admin', test.denied(:cmgr, format('insert into public.memberships (user_id, scope_type, scope_id, role) values (%L,''company'',%L,''client_admin'')', '00000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001')));
select test.check('client admin grants client manager', not test.denied(:cadmin, format('insert into public.memberships (user_id, scope_type, scope_id, role) values (%L,''company'',%L,''client_manager'')', '00000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001')));
delete from public.memberships where user_id = '00000000-0000-0000-0000-000000000009';
select test.check('RM cannot widen own allocation', test.rows(:rm, format('update public.memberships set allocated_company_ids = %L::uuid[] where user_id=%L', '{c0000000-0000-0000-0000-000000000001,c0000000-0000-0000-0000-000000000002}', '00000000-0000-0000-0000-000000000003')) = 0);
select test.check('agency manager allocates RM', test.rows(:mgr, format('update public.memberships set allocated_company_ids = %L::uuid[] where user_id=%L', '{c0000000-0000-0000-0000-000000000001,c0000000-0000-0000-0000-000000000002}', '00000000-0000-0000-0000-000000000003')) = 1);
select test.check('RM now sees 2 after allocation', test.cnt(:rm, 'select 1 from public.companies') = 2);
select test.check('allocation outside agency rejected', test.denied(:mgr, format('update public.memberships set allocated_company_ids = %L::uuid[] where user_id=%L', '{c0000000-0000-0000-0000-000000000003}', '00000000-0000-0000-0000-000000000003')));
update public.memberships set allocated_company_ids = '{c0000000-0000-0000-0000-000000000002}' where user_id = '00000000-0000-0000-0000-000000000003';

-- ------------------------------------------------------------ additive memberships never cross scope
insert into public.memberships (user_id, scope_type, scope_id, role) values ('00000000-0000-0000-0000-000000000003','company','c0000000-0000-0000-0000-000000000001','client_viewer');
select test.check('RM + viewer: sees both companies', test.cnt(:rm, 'select 1 from public.companies') = 2);
select test.check('RM + viewer: reads nandangse data', test.cnt(:rm, $$select 1 from public.test_records where body like 'ng-%'$$) = 2);
select test.check('RM + viewer: cannot write nandangse', test.denied(:rm, format('insert into public.test_records (company_id, body) values (%L, ''x'')', 'c0000000-0000-0000-0000-000000000001')));
select test.check('RM + viewer: still cannot see acme', test.cnt(:rm, $$select 1 from public.test_records where body='acme-1'$$) = 0);
delete from public.memberships where user_id = '00000000-0000-0000-0000-000000000003' and scope_type = 'company';

-- ------------------------------------------------------------ slug, status, lock, destructive actions
select test.check('reserved slug rejected', test.denied(:admin, format('insert into public.companies (agency_id, name, slug) values (%L,''X'',''admin'')', 'a0000000-0000-0000-0000-000000000001')));
select test.check('bad slug rejected', test.denied(:admin, format('insert into public.companies (agency_id, name, slug) values (%L,''X'',''Bad Slug'')', 'a0000000-0000-0000-0000-000000000001')));
select test.check('agency manager creates company in own agency', not test.denied(:mgr, format('insert into public.companies (agency_id, name, slug) values (%L,''New Co'',''newco'')', 'a0000000-0000-0000-0000-000000000001')));
select test.check('agency manager cannot create in other agency', test.denied(:mgr, format('insert into public.companies (agency_id, name, slug) values (%L,''Evil'',''evil'')', 'a0000000-0000-0000-0000-000000000002')));
select test.check('agency manager cannot change slug', test.denied(:mgr, $$update public.companies set slug='newco2' where slug='newco'$$));
select test.check('platform admin can change slug', not test.denied(:admin, $$update public.companies set slug='newco2' where slug='newco'$$));
select test.check('only platform admin deletes company', test.rows(:mgr, $$delete from public.companies where slug='newco2'$$) = 0);
select test.check('admin deletes company', test.rows(:admin, $$delete from public.companies where slug='newco2'$$) = 1);
update public.companies set status = 'locked' where slug = 'nandangse';
select test.check('locked: reads still work', test.cnt(:cmgr, 'select 1 from public.test_records') = 3);
select test.check('locked: writes blocked', test.denied(:cmgr, format('insert into public.test_records (company_id, body) values (%L, ''x'')', 'c0000000-0000-0000-0000-000000000001')));
update public.companies set status = 'active' where slug = 'nandangse';
select test.check('feature flags are platform-admin only', test.denied(:mgr, format('insert into public.feature_flags (company_id, flag, enabled) values (%L,''outbound'',true)', 'c0000000-0000-0000-0000-000000000001')));
select test.check('platform admin sets flag', not test.denied(:admin, format('insert into public.feature_flags (company_id, flag, enabled) values (%L,''outbound'',true)', 'c0000000-0000-0000-0000-000000000001')));
select test.check('client sees own flags', test.cnt(:cview, 'select 1 from public.feature_flags') = 1);
select test.check('client cannot see other company flags', test.cnt(:rm, 'select 1 from public.feature_flags') = 0);
select test.check('agency manager cannot create agency', test.denied(:mgr, $$insert into public.agencies (name, slug) values ('Hack','hack')$$));
select test.check('agency manager cannot flip default flag', test.denied(:mgr, $$update public.agencies set is_default=false where slug='mygyaan'$$));

-- ------------------------------------------------------------ audit
select test.check('audit has rows', (select count(*) from public.audit_log) > 10);
select test.check('audit captured actor', exists (select 1 from public.audit_log where actor_id = '00000000-0000-0000-0000-000000000004' and resource_type = 'companies'));
select test.check('admin reads audit', test.cnt(:admin, 'select 1 from public.audit_log') > 10);
select test.check('agency manager reads only own agency audit', test.cnt(:mgr, 'select 1 from public.audit_log') > 0
  and test.cnt(:mgr, format('select 1 from public.audit_log where agency_id=%L', 'a0000000-0000-0000-0000-000000000002')) = 0);
select test.check('RM cannot read audit', test.cnt(:rm, 'select 1 from public.audit_log') = 0);
select test.check('client cannot read audit', test.cnt(:cmgr, 'select 1 from public.audit_log') = 0);
select test.check('audit cannot be written by users', test.denied(:admin, $$insert into public.audit_log (action, resource_type) values ('x','y')$$));
select test.check('audit is append-only', test.denied(:admin, $$delete from public.audit_log$$));
select test.check('data table writes are audited', exists (select 1 from public.audit_log where resource_type = 'test_records'));

-- ------------------------------------------------------------ profiles
select test.check('profile auto-created', (select count(*) from public.profiles) = 9);
select test.check('user sees own profile only', test.cnt(:nobody, 'select 1 from public.profiles') = 1);
select test.check('company manager sees member profiles', test.cnt(:cadmin, 'select 1 from public.profiles') >= 4);

\set QUIET off
select count(*) filter (where ok) as passed, count(*) as total from test.results;
