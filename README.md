# financeiro

Projeto Pessoal de controle de finanças por voz


DEPLOY
===========
npm run deploy

Configuração opcional ChatGPT (fallback de categorização)
===========
Adicionar em `.env`:

```
VITE_OPENAI_API_KEY=sua_chave_openai
```

Quando a fala não bater em nenhuma key cadastrada, o app pode usar o ChatGPT para escolher a categoria.


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
  category_id uuid references expense_categories(id),
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
  avatar_data text,
  updated_at timestamptz default now()
);

create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  keys text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
);
```

Ative **RLS** e políticas para `budgets`, `expenses`, `user_settings` e `expense_categories` (utilizador só acede às próprias linhas).

Foto de perfil (`user_settings.avatar_data`, base64 / data URL)
===========

A app grava a imagem como **data URL** (`data:image/jpeg;base64,...`) na coluna **`text`** `avatar_data` (sem Storage).

Se a tabela já existir sem a coluna:

```sql
alter table user_settings add column if not exists avatar_data text;
```

Se antes usava `avatar_url` com links do Storage, pode remover ou ignorar essa coluna; a app lê apenas `avatar_data`.

Adicionar policies
===================
create policy "{nome police}"
on {table_name}
for update
using (auth.uid() = user_id);
