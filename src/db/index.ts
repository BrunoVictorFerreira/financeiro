import Dexie, { type EntityTable } from 'dexie';

const CONFIG_KEY = 'main';

export type PurchaseRow = {
  id: string;
  amountCents: number;
  transcript: string;
  createdAt: number;
};

export type ConfigRow = {
  key: typeof CONFIG_KEY;
  budgetTotalCents: number;
  updatedAt: number;
  /** Lembrete diário às 20:30 (notificação do sistema). */
  dailyReminderEnabled?: boolean;
  /** Data local `YYYY-MM-DD` em que o lembrete já foi mostrado. */
  lastDailyReminderShownDay?: string;
};

export type BackupPayload = {
  v: 1;
  exportedAt: number;
  config: ConfigRow | null;
  purchases: PurchaseRow[];
};

const db = new Dexie('OrcamentoPWA_v1') as Dexie & {
  config: EntityTable<ConfigRow, 'key'>;
  purchases: EntityTable<PurchaseRow, 'id'>;
};

db.version(1).stores({
  config: 'key',
  purchases: 'id, createdAt',
});

export { db };

export async function getConfig(): Promise<ConfigRow | undefined> {
  return db.config.get(CONFIG_KEY);
}

export async function getBudgetTotalCents(): Promise<number | null> {
  const row = await db.config.get(CONFIG_KEY);
  return row?.budgetTotalCents ?? null;
}

export async function setBudgetTotalCents(cents: number): Promise<void> {
  const prev = await db.config.get(CONFIG_KEY);
  await db.config.put({
    key: CONFIG_KEY,
    budgetTotalCents: cents,
    updatedAt: Date.now(),
    dailyReminderEnabled: prev?.dailyReminderEnabled,
    lastDailyReminderShownDay: prev?.lastDailyReminderShownDay,
  });
}

export async function setDailyReminderEnabled(enabled: boolean): Promise<void> {
  const prev = await db.config.get(CONFIG_KEY);
  if (!prev) return;
  await db.config.put({ ...prev, dailyReminderEnabled: enabled, updatedAt: Date.now() });
}

export async function setLastDailyReminderShownDay(dayKey: string): Promise<void> {
  const prev = await db.config.get(CONFIG_KEY);
  if (!prev) return;
  await db.config.put({ ...prev, lastDailyReminderShownDay: dayKey, updatedAt: Date.now() });
}

export async function addPurchase(row: Omit<PurchaseRow, 'id' | 'createdAt'>): Promise<PurchaseRow> {
  const rec: PurchaseRow = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    ...row,
  };
  await db.purchases.add(rec);
  return rec;
}

export async function deletePurchase(id: string): Promise<void> {
  await db.purchases.delete(id);
}

export async function listPurchasesDesc(): Promise<PurchaseRow[]> {
  return db.purchases.orderBy('createdAt').reverse().toArray();
}

export async function sumPurchasesCents(): Promise<number> {
  const all = await db.purchases.toArray();
  return all.reduce((s, p) => s + p.amountCents, 0);
}

export async function clearPurchasesOnly(): Promise<void> {
  await db.purchases.clear();
}

export async function exportBackup(): Promise<BackupPayload> {
  const config = (await db.config.get(CONFIG_KEY)) ?? null;
  const purchases = await db.purchases.toArray();
  return {
    v: 1,
    exportedAt: Date.now(),
    config,
    purchases,
  };
}

export async function importBackup(payload: BackupPayload): Promise<void> {
  await db.transaction('rw', db.config, db.purchases, async () => {
    await db.purchases.clear();
    await db.config.clear();
    if (payload.config) {
      await db.config.put(payload.config);
    }
    if (payload.purchases.length > 0) {
      await db.purchases.bulkAdd(payload.purchases);
    }
  });
}
