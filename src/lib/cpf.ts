/** Apenas dígitos, máx. 11. */
export function cpfDigitsOnly(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 11);
}

/** Máscara visual 000.000.000-00 */
export function formatCpfDisplay(digits: string): string {
  const d = cpfDigitsOnly(digits);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function cpfCheckDigit(base: string, factor: number): number {
  let sum = 0;
  for (let i = 0; i < base.length; i++) {
    sum += parseInt(base[i]!, 10) * factor--;
  }
  const mod = (sum * 10) % 11;
  return mod === 10 ? 0 : mod;
}

/** Valida dígitos verificadores (rejeita sequências óbvias inválidas). */
export function isValidCpf(digits11: string): boolean {
  if (digits11.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits11)) return false;
  const d1 = cpfCheckDigit(digits11.slice(0, 9), 10);
  const d2 = cpfCheckDigit(digits11.slice(0, 10), 11);
  return d1 === parseInt(digits11[9]!, 10) && d2 === parseInt(digits11[10]!, 10);
}
