import type { ExpenseLocation } from './expensesApi';
import type { PurchaseRow } from '../types/purchase';

const OFFLINE_PENDING_EXPENSES_LOCALSTORAGE_KEY = 'clarawallet.pending-expenses.v1';

export type PendingExpenseLocalStorageItem = {
  localId: string;
  userId: string;
  amountCents: number;
  categoryId?: string;
  transcript: string;
  categoryName?: string;
  createdAt: number;
  /** Preenchido quando o utilizador edita o gasto pendente antes de sincronizar. */
  updatedAt?: number;
  latitude: number | null;
  longitude: number | null;
};

function createPendingExpenseLocalStorageId() {
  return `pending-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function readPendingExpensesFromLocalStorage(): PendingExpenseLocalStorageItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_PENDING_EXPENSES_LOCALSTORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PendingExpenseLocalStorageItem[];
  } catch {
    return [];
  }
}

export function writePendingExpensesToLocalStorage(items: PendingExpenseLocalStorageItem[]) {
  localStorage.setItem(OFFLINE_PENDING_EXPENSES_LOCALSTORAGE_KEY, JSON.stringify(items));
}

export function enqueuePendingExpenseToLocalStorage(input: {
  userId: string;
  amountCents: number;
  categoryId: string;
  transcript: string;
  categoryName: string;
  location: ExpenseLocation | null;
}): PendingExpenseLocalStorageItem {
  const nextItem: PendingExpenseLocalStorageItem = {
    localId: createPendingExpenseLocalStorageId(),
    userId: input.userId,
    amountCents: input.amountCents,
    categoryId: input.categoryId,
    transcript: input.transcript,
    categoryName: input.categoryName,
    createdAt: Date.now(),
    latitude: input.location?.latitude ?? null,
    longitude: input.location?.longitude ?? null,
  };
  const current = readPendingExpensesFromLocalStorage();
  writePendingExpensesToLocalStorage([nextItem, ...current]);
  return nextItem;
}

export function removePendingExpenseFromLocalStorage(localId: string) {
  const current = readPendingExpensesFromLocalStorage();
  writePendingExpensesToLocalStorage(current.filter((item) => item.localId !== localId));
}

export function updatePendingExpenseInLocalStorage(
  localId: string,
  patch: {
    amountCents: number;
    transcript: string;
    categoryId: string;
    categoryName: string;
  }
): boolean {
  const current = readPendingExpensesFromLocalStorage();
  const idx = current.findIndex((item) => item.localId === localId);
  if (idx < 0) return false;
  const prev = current[idx]!;
  current[idx] = {
    ...prev,
    amountCents: patch.amountCents,
    transcript: patch.transcript,
    categoryId: patch.categoryId,
    categoryName: patch.categoryName,
    updatedAt: Date.now(),
  };
  writePendingExpensesToLocalStorage(current);
  return true;
}

export function clearAllPendingExpensesFromLocalStorageForUser(userId: string) {
  const current = readPendingExpensesFromLocalStorage();
  writePendingExpensesToLocalStorage(current.filter((item) => item.userId !== userId));
}

export function mapPendingExpenseToPurchaseRow(item: PendingExpenseLocalStorageItem): PurchaseRow {
  const updatedAt = item.updatedAt ?? item.createdAt;
  return {
    id: item.localId,
    amountCents: item.amountCents,
    categoryId: item.categoryId ?? null,
    transcript: item.transcript,
    categoryName: item.categoryName ?? 'Outros',
    createdAt: item.createdAt,
    updatedAt,
    wasEdited: item.updatedAt != null && item.updatedAt > item.createdAt,
    latitude: item.latitude,
    longitude: item.longitude,
    isPendingSync: true,
  };
}
