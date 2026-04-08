import { supabase } from './supabaseClient';
import { centsToNumericValue, numericValueToCents } from './budgetsApi';
import type { PurchaseRow } from '../types/purchase';

export type ExpenseRow = {
  id: string;
  user_id: string;
  value: number | string;
  transcript: string | null;
  category_id: string | null;
  category: { id: string; name: string } | { id: string; name: string }[] | null;
  latitude: number | string | null;
  longitude: number | string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export type ExpenseLocation = {
  latitude: number;
  longitude: number;
};

/** Evita marcar como editado no insert: `updated_at` costuma ser alguns ms depois de `created_at`. */
function wasEditedAfterCreate(createdAt: string | null, updatedAt: string | null): boolean {
  if (!createdAt || !updatedAt) return false;
  const c = Math.floor(new Date(createdAt).getTime() / 1000);
  const u = Math.floor(new Date(updatedAt).getTime() / 1000);
  return u > c;
}

export function expenseRowToPurchase(e: ExpenseRow): PurchaseRow {
  const categoryFromJoin = Array.isArray(e.category)
    ? e.category[0] ?? null
    : e.category ?? null;
  const createdMs = new Date(e.created_at ?? Date.now()).getTime();
  const updatedMs = new Date(e.updated_at ?? e.created_at ?? Date.now()).getTime();
  return {
    id: e.id,
    amountCents: numericValueToCents(e.value),
    categoryId: e.category_id ?? null,
    transcript: (e.transcript ?? '').trim() || '—',
    categoryName: (categoryFromJoin?.name ?? '').trim() || 'Outros',
    createdAt: createdMs,
    updatedAt: updatedMs,
    wasEdited: wasEditedAfterCreate(e.created_at, e.updated_at),
    latitude: e.latitude == null ? null : Number(e.latitude),
    longitude: e.longitude == null ? null : Number(e.longitude),
    isPendingSync: false,
  };
}

export async function insertExpense(
  userId: string,
  cents: number,
  transcript: string,
  location: ExpenseLocation | null,
  categoryId: string
): Promise<{ id: string | null; error: string | null }> {
  const value = centsToNumericValue(cents);
  const payload = {
    user_id: userId,
    value,
    transcript,
    category_id: categoryId,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
  };
  const { data, error } = await supabase
    .from('expenses')
    .insert(payload)
    .select('id')
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data.id as string, error: null };
}

export async function updateExpense(
  expenseId: string,
  input: { cents: number; transcript: string; categoryId: string }
): Promise<{ error: string | null }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('expenses')
    .update({
      value: centsToNumericValue(input.cents),
      transcript: input.transcript.trim(),
      category_id: input.categoryId,
      updated_at: now,
    })
    .eq('id', expenseId)
    .is('deleted_at', null);

  return { error: error?.message ?? null };
}

export async function softDeleteExpense(expenseId: string): Promise<{ error: string | null }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', expenseId);

  return { error: error?.message ?? null };
}

/** Marca todos os gastos ativos do utilizador como apagados (soft delete). */
export async function softDeleteAllActiveExpenses(userId: string): Promise<{ error: string | null }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: now, updated_at: now })
    .eq('user_id', userId)
    .is('deleted_at', null);

  return { error: error?.message ?? null };
}

/** Gastos com `deleted_at` nulo. */
export async function fetchActiveExpenses(
  userId: string
): Promise<{ rows: ExpenseRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('expenses')
    .select(
      'id, user_id, value, transcript, category_id, category:expense_categories(id, name), latitude, longitude, created_at, updated_at, deleted_at'
    )
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as ExpenseRow[], error: null };
}

export function sumExpenseRowsCents(rows: ExpenseRow[]): number {
  return rows.reduce((s, r) => s + numericValueToCents(r.value), 0);
}
