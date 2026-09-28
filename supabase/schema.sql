create extension if not exists pgcrypto;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 60),
  normalized_name text,
  questionnaire_version text not null default '',
  answers jsonb not null default '{}'::jsonb
);

alter table public.submissions add column if not exists updated_at timestamptz not null default now();
alter table public.submissions add column if not exists normalized_name text;
alter table public.submissions add column if not exists questionnaire_version text not null default '';
alter table public.submissions add column if not exists answers jsonb not null default '{}'::jsonb;

-- 兼容首版表结构：旧字段保留用于历史数据，但不再参与新问卷提交。
do $$
declare legacy_column text;
begin
  foreach legacy_column in array array['contact','identity','subjects','goal','availability','mode','notes'] loop
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='submissions' and column_name=legacy_column) then
      execute format('alter table public.submissions alter column %I drop not null', legacy_column);
    end if;
  end loop;
end $$;

update public.submissions set normalized_name = lower(trim(name)) where normalized_name is null;

-- 若旧表里已经有同名记录，仅保留最近一次，随后建立唯一约束。
delete from public.submissions older
using public.submissions newer
where older.normalized_name = newer.normalized_name
  and (older.submitted_at, older.id) < (newer.submitted_at, newer.id);

create unique index if not exists submissions_normalized_name_key on public.submissions(normalized_name);

alter table public.submissions enable row level security;
revoke all on table public.submissions from anon, authenticated;
grant select, insert, update, delete on table public.submissions to service_role;

-- 浏览器不能直接访问该表；所有读写均经过服务端 API。
