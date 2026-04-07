export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Aceita ex.: 1500 / 1500,50 / 1.500,00 */
export function parseMoneyInputToCents(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, '');
  if (!t) return null;
  let s = t;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/\./g, '');
  }
  const v = parseFloat(s);
  if (!Number.isFinite(v) || v <= 0) return null;
  return Math.round(v * 100);
}
