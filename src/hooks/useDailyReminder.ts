import { useCallback, useEffect, useRef } from 'react';
import { fetchActiveBudget, numericValueToCents } from '../lib/budgetsApi';
import { fetchActiveExpenses, sumExpenseRowsCents } from '../lib/expensesApi';
import { notifyDailyReminder } from '../lib/notifications';
import { fetchUserSettings, upsertUserSettings } from '../lib/settingsApi';

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function msUntilNext2030(from: Date = new Date()): number {
  const next = new Date(from);
  next.setHours(20, 30, 0, 0);
  if (from.getTime() >= next.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - from.getTime();
}

function isPastToday2030(now: Date = new Date()): boolean {
  const cutoff = new Date(now);
  cutoff.setHours(20, 30, 0, 0);
  return now.getTime() >= cutoff.getTime();
}

/**
 * Lembrete às 20:30 — estado em `user_settings` no Supabase.
 */
export function useDailyReminder(enabled: boolean, userId: string | null): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);

  const deliverReminderIfDue = useCallback(async (): Promise<boolean> => {
    if (!userId || inFlightRef.current) return false;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return false;
    }
    inFlightRef.current = true;
    try {
      const todayKey = localDateKey(new Date());
      const settings = await fetchUserSettings(userId);
      if (settings?.last_daily_reminder_shown_day === todayKey) {
        return false;
      }
      const { row: budgetRow } = await fetchActiveBudget(userId);
      if (!budgetRow) return false;
      const budget = numericValueToCents(budgetRow.value);
      if (budget <= 0) return false;

      const { rows, error } = await fetchActiveExpenses(userId);
      if (error) return false;
      const spent = sumExpenseRowsCents(rows);
      const rest = budget - spent;
      notifyDailyReminder(rest);
      await upsertUserSettings(userId, { last_daily_reminder_shown_day: todayKey });
      return true;
    } finally {
      inFlightRef.current = false;
    }
  }, [userId]);

  const tryCatchUp = useCallback(async () => {
    if (!enabled || !userId) return;
    if (!isPastToday2030()) return;
    await deliverReminderIfDue();
  }, [enabled, userId, deliverReminderIfDue]);

  useEffect(() => {
    void tryCatchUp();
  }, [tryCatchUp]);

  useEffect(() => {
    const onVis = () => {
      void tryCatchUp();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [tryCatchUp]);

  useEffect(() => {
    if (!enabled || !userId) {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return;
    }

    const schedule = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      const ms = msUntilNext2030();
      timerRef.current = setTimeout(() => {
        void (async () => {
          await deliverReminderIfDue();
          schedule();
        })();
      }, ms);
    };

    schedule();
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, userId, deliverReminderIfDue]);
}
