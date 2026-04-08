import { supabase } from './supabaseClient';
import { centsToNumericValue, numericValueToCents } from './budgetsApi';
import type { PurchaseRow } from '../types/purchase';

export type ExpenseRow = {
  id: string;
  user_id: string;
  value: number | string;
  transcript: string | null;
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

export function expenseRowToPurchase(e: ExpenseRow): PurchaseRow {
  return {
    id: e.id,
    amountCents: numericValueToCents(e.value),
    transcript: (e.transcript ?? '').trim() || '—',
    createdAt: new Date(e.created_at ?? Date.now()).getTime(),
    latitude: e.latitude == null ? null : Number(e.latitude),
    longitude: e.longitude == null ? null : Number(e.longitude),
  };
}

export async function insertExpense(
  userId: string,
  cents: number,
  transcript: string,
  location: ExpenseLocation | null
): Promise<{ id: string | null; error: string | null }> {
  const value = centsToNumericValue(cents);
  const payload = {
    user_id: userId,
    value,
    transcript,
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
    .select('id, user_id, value, transcript, latitude, longitude, created_at, updated_at, deleted_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as ExpenseRow[], error: null };
}

export function sumExpenseRowsCents(rows: ExpenseRow[]): number {
  return rows.reduce((s, r) => s + numericValueToCents(r.value), 0);
}
