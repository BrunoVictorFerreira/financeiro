/** Extrai valor monetário de texto (voz ou digitado), em centavos. */

const PT_WORDS: Record<string, number> = {
  zero: 0,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  três: 3,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  quatorze: 14,
  catorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezasseis: 16,
  dezessete: 17,
  dezassete: 17,
  dezoito: 18,
  dezenove: 19,
  dezanove: 19,
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
  cem: 100,
  cento: 100,
  mil: 1000,
  duzentos: 200,
  trezentos: 300,
  quatrocentos: 400,
  quinhentos: 500,
  seiscentos: 600,
  setecentos: 700,
  oitocentos: 800,
  novecentos: 900,
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/r\$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDigits(text: string): number | null {
  let t = text;
  if (t.includes(',')) {
    t = t.replace(/\./g, '');
  }
  const re = /(\d{1,12})(?:[.,](\d{1,2}))?\b/;
  const m = t.match(re);
  if (!m) return null;
  const int = m[1];
  const dec = m[2];
  const n =
    dec !== undefined
      ? parseFloat(`${int}.${dec.padEnd(2, '0').slice(0, 2)}`)
      : parseFloat(int);
  if (Number.isFinite(n) && n > 0) return n;
  return null;
}

function parseWordsChunk(t: string): number | null {
  const parts = t
    .split(/\s+e\s+/i)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;

  let total = 0;
  for (const part of parts) {
    const w = part.split(/\s+/);
    let chunk = 0;
    for (const token of w) {
      const v = PT_WORDS[token];
      if (v === undefined) continue;
      if (v === 100 && chunk > 0 && chunk < 10) {
        chunk = chunk * 100;
      } else if (v === 1000) {
        chunk = (chunk || 1) * 1000;
      } else {
        chunk += v;
      }
    }
    if (chunk > 0) total += chunk;
  }
  return total > 0 ? total : null;
}

/** Retorna centavos (inteiro) ou null. */
export function parseAmountToCents(raw: string): number | null {
  const text = normalize(raw);
  if (!text) return null;

  const fromDigits = parseDigits(text);
  if (fromDigits !== null) {
    return Math.round(fromDigits * 100);
  }

  const fromWords = parseWordsChunk(text.replace(/\b(reais?|real)\b/gi, '').trim());
  if (fromWords !== null) {
    return Math.round(fromWords * 100);
  }
  return null;
}
