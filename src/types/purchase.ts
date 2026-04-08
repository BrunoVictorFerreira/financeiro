/** Compra/gasto vindo da tabela `expenses` (id = UUID do Supabase). */
export type PurchaseRow = {
  id: string;
  amountCents: number;
  transcript: string;
  createdAt: number;
};
