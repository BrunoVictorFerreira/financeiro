import { formatBRLInputFromDigits } from '../../lib/money';
import { Card, CardTitle, Field, Help, PrimaryButton } from './AppTabShared.styles';

type Props = {
  budgetInput: string;
  onBudgetInputChange: (value: string) => void;
  onSaveBudget: () => void;
};

export function SetupTab({ budgetInput, onBudgetInputChange, onSaveBudget }: Props) {
  return (
    <Card>
      <CardTitle>Quanto pode gastar no total?</CardTitle>
      <Help>
        Defina o teto uma vez no Supabase (tabela budgets). Depois regista compras por voz ou manualmente; os gastos ficam
        na tabela expenses.
      </Help>
      <Field
        type="text"
        inputMode="numeric"
        placeholder="0,00"
        value={budgetInput}
        onChange={(e) => onBudgetInputChange(formatBRLInputFromDigits(e.target.value))}
      />
      <PrimaryButton type="button" onClick={onSaveBudget}>
        Guardar orçamento
      </PrimaryButton>
    </Card>
  );
}
