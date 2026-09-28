create extension if not exists pgcrypto;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 60),
  contact text not null check (char_length(contact) between 1 and 120),
  identity text not null check (char_length(identity) between 1 and 30),
  subjects text not null check (char_length(subjects) between 1 and 200),
  goal text not null check (char_length(goal) between 1 and 1200),
  availability text not null check (char_length(availability) between 1 and 500),
  mode text not null check (char_length(mode) between 1 and 30),
  notes text not null default '' check (char_length(notes) <= 1200)
);

alter table public.submissions enable row level security;
revoke all on table public.submissions from anon, authenticated;
grant select, insert, delete on table public.submissions to service_role;

-- 浏览器无法直接读取或写入该表；所有请求必须经过本项目的服务端 API。
