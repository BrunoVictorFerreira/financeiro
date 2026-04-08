import { IconTrash } from '../auth/icons/General';
import type { PurchaseRow } from '../../types/purchase';
import { formatBRL } from '../../lib/money';
import { parseAmountToPerc, parseAmountToWidth } from '../../lib/helpers';
import {
  Amount,
  Card,
  CardTitle,
  GhostButton,
  Indicator,
  Li,
  List,
  Meta,
  Muted,
  PrimaryButton,
  SaldoCard,
  SaldoLabel,
  SaldoValor,
  TabIndicatorBalance,
  TabIndicatorExpenses,
  TabIndicatorGeneral,
  Time,
  Toolbar,
  Transcript,
} from './AppTabShared.styles';

type Props = {
  restanteCents: number;
  budgetCents: number;
  spentCents: number;
  purchases: PurchaseRow[];
  onRemoveExpense: (id: string) => void;
  onResetExpenses: () => void;
};

export function HomeTab({
  restanteCents,
  budgetCents,
  spentCents,
  purchases,
  onRemoveExpense,
  onResetExpenses,
}: Props) {
  return (
    <>
      <SaldoCard>
        <SaldoLabel>{restanteCents < 0 ? 'Acima do orçamento' : 'Ainda pode gastar'}</SaldoLabel>
        <SaldoValor>{formatBRL(restanteCents)}</SaldoValor>
        <Meta>
          Teto {formatBRL(budgetCents)} · Gasto acumulado {formatBRL(spentCents)}
        </Meta>
        <Indicator>
          <TabIndicatorBalance $px={parseAmountToWidth(restanteCents, budgetCents)} />
          <TabIndicatorExpenses
            $px={parseAmountToWidth(spentCents, budgetCents)}
            $base={parseAmountToWidth(restanteCents, budgetCents)}
            $amountSpent={parseAmountToPerc(spentCents, budgetCents)}
          />
          <TabIndicatorGeneral />
        </Indicator>
      </SaldoCard>

      <Card>
        <CardTitle>Gastos registados</CardTitle>
        {purchases.length === 0 ? (
          <Muted>Nenhuma compra ainda.</Muted>
        ) : (
          <List>
            {purchases.map((p) => (
              <Li key={p.id}>
                <div>
                  <Amount>{formatBRL(p.amountCents)}</Amount>
                  <Transcript>{p.transcript}</Transcript>
                  <Time>{new Date(p.createdAt).toLocaleString('pt-BR')}</Time>
                </div>
                <GhostButton type="button" onClick={() => onRemoveExpense(p.id)}>
                  <IconTrash />
                </GhostButton>
              </Li>
            ))}
          </List>
        )}
        <Toolbar>
          <PrimaryButton type="button" onClick={onResetExpenses}>
            Zerar lista de compras
          </PrimaryButton>
        </Toolbar>
      </Card>
    </>
  );
}
