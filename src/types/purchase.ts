/** Compra/gasto vindo da tabela `expenses` (id = UUID do Supabase). */
export type PurchaseRow = {
  id: string;
  amountCents: number;
  categoryId: string | null;
  transcript: string;
  categoryName: string;
  createdAt: number;
  /** Última alteração conhecida (servidor: `updated_at`; pendente: última edição local). */
  updatedAt: number;
  /** `true` quando `updated_at` (ou edição local) é posterior à criação. */
  wasEdited: boolean;
  latitude: number | null;
  longitude: number | null;
  isPendingSync?: boolean;
};
