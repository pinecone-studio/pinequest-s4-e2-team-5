create table if not exists student_recordings (
  id uuid primary key default gen_random_uuid(),
  child_id text not null,
  r2_bucket text not null,
  r2_key text not null,
  r2_url text,
  content_type text not null,
  size_bytes bigint not null,
  duration_ms int default 0,
  etag text,
  created_at timestamptz default now()
);

create index if not exists student_recordings_child_id_idx
  on student_recordings(child_id);

create index if not exists student_recordings_created_at_idx
  on student_recordings(created_at desc);
