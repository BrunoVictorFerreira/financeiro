import type { ExpenseLocation } from './expensesApi';
import type { PurchaseRow } from '../types/purchase';

const OFFLINE_PENDING_EXPENSES_LOCALSTORAGE_KEY = 'clarawallet.pending-expenses.v1';

export type PendingExpenseLocalStorageItem = {
  localId: string;
  userId: string;
  amountCents: number;
  transcript: string;
  createdAt: number;
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
  transcript: string;
  location: ExpenseLocation | null;
}): PendingExpenseLocalStorageItem {
  const nextItem: PendingExpenseLocalStorageItem = {
    localId: createPendingExpenseLocalStorageId(),
    userId: input.userId,
    amountCents: input.amountCents,
    transcript: input.transcript,
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

export function clearAllPendingExpensesFromLocalStorageForUser(userId: string) {
  const current = readPendingExpensesFromLocalStorage();
  writePendingExpensesToLocalStorage(current.filter((item) => item.userId !== userId));
}

export function mapPendingExpenseToPurchaseRow(item: PendingExpenseLocalStorageItem): PurchaseRow {
  return {
    id: item.localId,
    amountCents: item.amountCents,
    transcript: item.transcript,
    createdAt: item.createdAt,
    latitude: item.latitude,
    longitude: item.longitude,
    isPendingSync: true,
  };
}
