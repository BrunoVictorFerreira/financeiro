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

const MAX_MONEY_DIGITS = 14;

/**
 * Formata entrada manual como moeda pt-BR a partir só de dígitos (estilo caixa: cada dígito entra nos centavos).
 * Ex.: "1" → "0,01", "1234" → "12,34".
 */
export function formatBRLInputFromDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, MAX_MONEY_DIGITS);
  if (!digits) return '';
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n)) return '';
  return (n / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Interpreta valor mascarado (ou só dígitos) como centavos totais. */
export function parseBRLMaskedInputToCents(value: string): number | null {
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;
  const cents = parseInt(digits, 10);
  if (!Number.isFinite(cents) || cents <= 0) return null;
  return cents;
}
