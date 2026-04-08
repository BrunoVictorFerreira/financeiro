import { useState } from 'react';
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
  LocationFrame,
  LocationModalCard,
  LocationModalClose,
  LocationModalOverlay,
  LocationMeta,
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
  const [expandedLocationId, setExpandedLocationId] = useState<string | null>(null);

  const toggleLocation = (purchaseId: string) => {
    setExpandedLocationId((prev) => (prev === purchaseId ? null : purchaseId));
  };

  const selectedPurchase = purchases.find((p) => p.id === expandedLocationId) ?? null;

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
                  <Transcript>
                    {p.transcript}
                    {p.isPendingSync ? ' · pendente de sincronização' : ''}
                  </Transcript>
                  <Time>{new Date(p.createdAt).toLocaleString('pt-BR')}</Time>
                  {p.latitude != null && p.longitude != null && (
                    <>
                      <GhostButton type="button" onClick={() => toggleLocation(p.id)}>
                        {expandedLocationId === p.id ? 'Ocultar localização' : 'Mostrar localização'}
                      </GhostButton>
                    </>
                  )}
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

      {selectedPurchase != null &&
        selectedPurchase.latitude != null &&
        selectedPurchase.longitude != null && (
          <LocationModalOverlay
            role="dialog"
            aria-modal="true"
            aria-label="Localização do gasto"
            onClick={() => setExpandedLocationId(null)}
          >
            <LocationModalCard onClick={(e) => e.stopPropagation()}>
              <LocationModalClose
                type="button"
                aria-label="Fechar localização"
                onClick={() => setExpandedLocationId(null)}
              >
                ×
              </LocationModalClose>
              <LocationFrame
                title={`Localização do gasto ${selectedPurchase.id}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${selectedPurchase.latitude},${selectedPurchase.longitude}&z=16&output=embed`}
              />
              <LocationMeta>
                Lat: {selectedPurchase.latitude.toFixed(6)} · Lng: {selectedPurchase.longitude.toFixed(6)}
              </LocationMeta>
            </LocationModalCard>
          </LocationModalOverlay>
        )}
    </>
  );
}
