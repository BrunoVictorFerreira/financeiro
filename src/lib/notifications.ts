import { formatBRL } from './money';

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const r = await Notification.requestPermission();
  return r === 'granted';
}

export function notifySaldoDisponivel(restanteCents: number): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return;
  }
  const body =
    restanteCents >= 0
      ? `Restam ${formatBRL(restanteCents)} para gastar.`
      : `Acima do orçamento em ${formatBRL(-restanteCents)}.`;
  try {
    new Notification('Orçamento', {
      body,
      icon: '/favicon.svg',
      tag: 'saldo-orcamento',
    });
  } catch {
    /* Safari / contextos restritos */
  }
}
