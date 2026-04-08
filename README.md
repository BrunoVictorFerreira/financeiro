# financeiro
Projeto Pessoal de controle de finanças por voz


DEPLOY
===========
npm run deploy


Esquema de Tabelas
===========
create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  value numeric(10,2) not null,
  ativo boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
  deleted_at timestamp
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  value numeric(10,2) not null,
  created_at timestamp default now(),
  updated_at timestamp default now()
  deleted_at timestamp
);