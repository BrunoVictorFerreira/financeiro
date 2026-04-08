# financeiro

Projeto Pessoal de controle de finanças por voz


DEPLOY
===========
npm run deploy


Esquema de Tabelas (Supabase)
===========

```sql
create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  value numeric(10,2) not null,
  ativo boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  value numeric(10,2) not null,
  transcript text,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_reminder_enabled boolean not null default false,
  last_daily_reminder_shown_day text,
  updated_at timestamptz default now()
);
```

Ative **RLS** e políticas para `budgets`, `expenses` e `user_settings` (utilizador só acede às próprias linhas).
