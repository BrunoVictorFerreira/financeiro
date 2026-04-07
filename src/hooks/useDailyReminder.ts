import { useCallback, useEffect, useRef } from 'react';
import {
  getBudgetTotalCents,
  getConfig,
  setLastDailyReminderShownDay,
  sumPurchasesCents,
} from '../db';
import { notifyDailyReminder } from '../lib/notifications';

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
 * Dispara notificação com saldo às 20:30 (timer com aba aberta) ou ao abrir o app depois das 20:30
 * se ainda não tiver mostrado o lembrete desse dia.
 */
export function useDailyReminder(enabled: boolean): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);

  const deliverReminderIfDue = useCallback(async (): Promise<boolean> => {
    if (inFlightRef.current) return false;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return false;
    }
    inFlightRef.current = true;
    try {
      const todayKey = localDateKey(new Date());
      const cfg = await getConfig();
      if (cfg?.lastDailyReminderShownDay === todayKey) {
        return false;
      }
      const budget = await getBudgetTotalCents();
      if (budget === null) {
        return false;
      }
      const spent = await sumPurchasesCents();
      const rest = budget - spent;
      notifyDailyReminder(rest);
      await setLastDailyReminderShownDay(todayKey);
      return true;
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const tryCatchUp = useCallback(async () => {
    if (!enabled) return;
    if (!isPastToday2030()) return;
    await deliverReminderIfDue();
  }, [enabled, deliverReminderIfDue]);

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
    if (!enabled) {
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
  }, [enabled, deliverReminderIfDue]);
}
