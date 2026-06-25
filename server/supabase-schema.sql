

create table sessions (
  id uuid primary key default gen_random_uuid(),
  child_id text not null,
  problem text not null,
  skill text,
  difficulty text,
  correct_answer int,
  solved boolean default false,
  attempt_count int default 0,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  child_id text not null,
  skill text,
  answer_given text,
  is_correct boolean,
  created_at timestamptz default now()
);

create or replace function increment_attempt_count(session_id uuid)
returns void language sql as $$
  update sessions
  set attempt_count = attempt_count + 1
  where id = session_id;
$$;

create index on sessions(child_id);
create index on attempts(child_id);
create index on attempts(session_id);
