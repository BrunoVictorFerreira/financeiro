import { formatBRL } from './money';

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const r = await Notification.requestPermission();
  return r === 'granted';
}

function saldoBody(restanteCents: number): string {
  return restanteCents >= 0
    ? `Restam ${formatBRL(restanteCents)} para gastar.`
    : `Acima do orçamento em ${formatBRL(-restanteCents)}.`;
}

export function notifySaldoDisponivel(restanteCents: number): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return;
  }
  try {
    new Notification('Clara Wallet ', {
      body: saldoBody(restanteCents),
      icon: '/financeiro/favicon.ico',
      tag: 'saldo-orcamento',
    });
  } catch {
    /* Safari / contextos restritos */
  }
}

/** Lembrete fixo às 20:30 — tag separada para não substituir avisos após compras. */
export function notifyDailyReminder(restanteCents: number): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return;
  }
  try {
    new Notification('Clara Wallet — Lembrete das 20:30', {
      body: saldoBody(restanteCents),
      icon: '/financeiro/favicon.ico',
      tag: 'orcamento-lembrete-2030',
    });
  } catch {
    /* Safari / contextos restritos */
  }
}
