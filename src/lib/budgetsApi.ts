import { supabase } from './supabaseClient';

/** Linha alinhada ao esquema `budgets` do README (Supabase). */
export type BudgetRow = {
  id: string;
  user_id: string;
  value: number | string;
  ativo: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export function numericValueToCents(value: number | string): number {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function centsToNumericValue(cents: number): number {
  return Math.round(cents) / 100;
}

/** Orçamento ativo: `ativo`, sem `deleted_at`, mais recente. */
export async function fetchActiveBudget(
  userId: string
): Promise<{ row: BudgetRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('budgets')
    .select('id, user_id, value, ativo, created_at, updated_at, deleted_at')
    .eq('user_id', userId)
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { row: null, error: error.message };
  return { row: data as BudgetRow | null, error: null };
}

export async function insertBudget(
  userId: string,
  cents: number
): Promise<{ id: string | null; error: string | null }> {
  const value = centsToNumericValue(cents);
  const { data, error } = await supabase
    .from('budgets')
    .insert({ user_id: userId, value, ativo: true })
    .select('id')
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data.id as string, error: null };
}

export async function updateBudgetRow(
  budgetId: string,
  cents: number
): Promise<{ error: string | null }> {
  const value = centsToNumericValue(cents);
  const { error } = await supabase
    .from('budgets')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('id', budgetId);

  return { error: error?.message ?? null };
}
