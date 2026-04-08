import { supabase } from './supabaseClient';
import type { ExpenseCategory } from '../types/expenseCategory';

type ExpenseCategoryRow = {
  id: string;
  user_id: string;
  name: string;
  keys: string;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

function normalizeSingleExpenseCategoryKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}_-]/gu, '');
}

function parseAndNormalizeExpenseCategoryKeysCsv(keysCsv: string) {
  const keys = keysCsv
    .split(',')
    .map((k) => normalizeSingleExpenseCategoryKey(k))
    .filter((k) => k.length > 0);
  return [...new Set(keys)];
}

function keysArrayToCsv(keys: string[]) {
  return keys.join(', ');
}

function mapExpenseCategoryRow(row: ExpenseCategoryRow): ExpenseCategory {
  const keys = parseAndNormalizeExpenseCategoryKeysCsv(row.keys ?? '');
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    keys,
    createdAt: new Date(row.created_at ?? Date.now()).getTime(),
    updatedAt: new Date(row.updated_at ?? Date.now()).getTime(),
  };
}

export async function readExpenseCategoriesByUserFromSupabase(userId: string): Promise<{
  categories: ExpenseCategory[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('id, user_id, name, keys, created_at, updated_at, deleted_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) return { categories: [], error: error.message };
  const rows = (data ?? []) as ExpenseCategoryRow[];
  return { categories: rows.map(mapExpenseCategoryRow), error: null };
}

export async function createExpenseCategoryInSupabase(input: {
  userId: string;
  name: string;
  keysCsv: string;
}): Promise<{ category: ExpenseCategory | null; error: string | null }> {
  const name = input.name.trim();
  const keys = parseAndNormalizeExpenseCategoryKeysCsv(input.keysCsv);
  if (!name) return { category: null, error: 'Informe o nome da categoria.' };
  if (keys.length === 0) {
    return { category: null, error: 'Informe ao menos uma key válida (separe por vírgula).' };
  }

  const { data, error } = await supabase
    .from('expense_categories')
    .insert({ user_id: input.userId, name, keys: keysArrayToCsv(keys) })
    .select('id, user_id, name, keys, created_at, updated_at, deleted_at')
    .single();

  if (error) return { category: null, error: error.message };
  return { category: mapExpenseCategoryRow(data as ExpenseCategoryRow), error: null };
}

export async function updateExpenseCategoryInSupabase(input: {
  id: string;
  userId: string;
  name: string;
  keysCsv: string;
}): Promise<{ category: ExpenseCategory | null; error: string | null }> {
  const name = input.name.trim();
  const keys = parseAndNormalizeExpenseCategoryKeysCsv(input.keysCsv);
  if (!name) return { category: null, error: 'Informe o nome da categoria.' };
  if (keys.length === 0) {
    return { category: null, error: 'Informe ao menos uma key válida (separe por vírgula).' };
  }

  const { data, error } = await supabase
    .from('expense_categories')
    .update({ name, keys: keysArrayToCsv(keys), updated_at: new Date().toISOString() })
    .eq('id', input.id)
    .eq('user_id', input.userId)
    .is('deleted_at', null)
    .select('id, user_id, name, keys, created_at, updated_at, deleted_at')
    .single();

  if (error) return { category: null, error: error.message };
  return { category: mapExpenseCategoryRow(data as ExpenseCategoryRow), error: null };
}

export async function deleteExpenseCategoryFromSupabase(input: {
  id: string;
  userId: string;
}): Promise<{ error: string | null }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('expense_categories')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', input.id)
    .eq('user_id', input.userId)
    .is('deleted_at', null);

  return { error: error?.message ?? null };
}

export async function ensureOutrosCategoryInSupabase(
  userId: string
): Promise<{ category: ExpenseCategory | null; error: string | null }> {
  const { categories, error } = await readExpenseCategoriesByUserFromSupabase(userId);
  if (error) return { category: null, error };

  const existing = categories.find((c) => c.name.trim().toLowerCase() === 'outros');
  if (existing) return { category: existing, error: null };

  return await createExpenseCategoryInSupabase({
    userId,
    name: 'Outros',
    keysCsv: 'outros',
  });
}
