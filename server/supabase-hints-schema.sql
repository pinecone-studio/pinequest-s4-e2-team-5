-- Hints: skill+difficulty тус бүрт нэг л удаа AI үүсгэж хадгална
create table hints (
  id uuid primary key default gen_random_uuid(),
  skill text not null,
  difficulty text not null,
  strategy text,
  hint_text text not null,
  created_at timestamptz default now(),
  unique(skill, difficulty, strategy)
);

-- Practice problems: сан болгон хадгална
create table practice_problems (
  id uuid primary key default gen_random_uuid(),
  skill text not null,
  difficulty text not null,
  problem text not null,
  answer int not null,
  created_at timestamptz default now()
);

create index on hints(skill, difficulty);
create index on practice_problems(skill, difficulty);
