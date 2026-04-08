/** Compra/gasto vindo da tabela `expenses` (id = UUID do Supabase). */
export type PurchaseRow = {
  id: string;
  amountCents: number;
  categoryId: string | null;
  transcript: string;
  categoryName: string;
  createdAt: number;
  latitude: number | null;
  longitude: number | null;
  isPendingSync?: boolean;
};
