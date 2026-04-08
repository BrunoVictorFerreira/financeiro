import { useEffect, useState } from 'react';
import { IconEdit, IconTrash } from '../auth/icons/General';
import type { PurchaseRow } from '../../types/purchase';
import type { ExpenseCategory } from '../../types/expenseCategory';
import { formatBRL, formatBRLInputFromDigits, parseBRLMaskedInputToCents } from '../../lib/money';
import { parseAmountToPerc, parseAmountToWidth } from '../../lib/helpers';
import {
  Amount,
  Card,
  CardTitle,
  CloseRoundButton,
  DetailLabel,
  DetailMapBody,
  DetailMapHeader,
  DetailMapIframe,
  DetailModalCard,
  DetailModalCardMap,
  DetailModalOverlay,
  DetailSection,
  DetailValue,
  EditedHint,
  Field,
  FormModalCard,
  FormModalTitle,
  GhostButton,
  Indicator,
  Li,
  List,
  EditModalOverlay,
  LocationModalClose,
  Meta,
  Muted,
  PrimaryButton,
  RowActions,
  SaldoCard,
  SaldoLabel,
  SaldoValor,
  SelectField,
  TabIndicatorBalance,
  TabIndicatorExpenses,
  TabIndicatorGeneral,
  Time,
  Toolbar,
  Transcript,
  TextPrimary,
  CancelButton,
  SelectButton,
  LocationMeta,
} from './AppTabShared.styles';

type Props = {
  restanteCents: number;
  budgetCents: number;
  spentCents: number;
  purchases: PurchaseRow[];
  expenseCategories: ExpenseCategory[];
  onRemoveExpense: (id: string) => void;
  onResetExpenses: () => void;
  onUpdateExpense: (
    id: string,
    input: { amountCents: number; transcript: string; categoryId: string }
  ) => Promise<boolean>;
  onFeedback: (message: string) => void;
};

function formatDetailDate(ms: number) {
  return new Date(ms).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function HomeTab({
  restanteCents,
  budgetCents,
  spentCents,
  purchases,
  expenseCategories,
  onRemoveExpense,
  onResetExpenses,
  onUpdateExpense,
  onFeedback,
}: Props) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailShowMap, setDetailShowMap] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edAmount, setEdAmount] = useState('');
  const [edTranscript, setEdTranscript] = useState('');
  const [edCategoryId, setEdCategoryId] = useState('');

  const sortedCategories = [...expenseCategories].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt')
  );

  const detailPurchase = purchases.find((p) => p.id === detailId) ?? null;
  const editingPurchase = purchases.find((p) => p.id === editingId) ?? null;

  useEffect(() => {
    setDetailShowMap(false);
  }, [detailId]);

  useEffect(() => {
    if (!detailShowMap || !detailPurchase) return;
    if (detailPurchase.latitude == null || detailPurchase.longitude == null) {
      setDetailShowMap(false);
    }
  }, [detailShowMap, detailPurchase]);

  const openDetail = (id: string) => {
    setEditingId(null);
    setDetailId(id);
  };

  const closeDetail = () => {
    setDetailShowMap(false);
    setDetailId(null);
  };

  const openEdit = (p: PurchaseRow) => {
    setDetailId(null);
    setEditingId(p.id);
    setEdAmount(formatBRLInputFromDigits(String(p.amountCents)));
    setEdTranscript(p.transcript === '—' ? '' : p.transcript);
    const fallbackCat = sortedCategories[0]?.id ?? '';
    setEdCategoryId(p.categoryId && sortedCategories.some((c) => c.id === p.categoryId) ? p.categoryId : fallbackCat);
  };

  const closeEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (sortedCategories.length === 0) {
      onFeedback('Sem categorias carregadas. Não é possível guardar.');
      return;
    }
    const cents = parseBRLMaskedInputToCents(edAmount);
    if (cents === null) {
      onFeedback('Informe um valor válido.');
      return;
    }
    const transcript = edTranscript.trim();
    if (!transcript) {
      onFeedback('Informe uma descrição.');
      return;
    }
    if (!edCategoryId) {
      onFeedback('Escolha uma categoria.');
      return;
    }
    const ok = await onUpdateExpense(editingId, {
      amountCents: cents,
      transcript,
      categoryId: edCategoryId,
    });
    if (ok) closeEdit();
  };

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
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openDetail(p.id);
                    }
                  }}
                  style={{ cursor: 'pointer', flex: 1, minWidth: 0, textAlign: 'left' }}
                >
                  <Amount>{formatBRL(p.amountCents)}</Amount>
                  <Transcript>
                    Categoria: {p.categoryName}
                    {' · '}
                    {p.transcript}
                    {p.isPendingSync ? ' · pendente de sincronização' : ''}
                  </Transcript>
                  <Time>
                    {!p.wasEdited ? (
                      <>
                        <br />
                        Registrado: {new Date(p.createdAt).toLocaleString('pt-BR')}
                      </>
                    ) : null}

                    {p.wasEdited ? (
                      <>
                        <br />
                        Atualizado: {new Date(p.updatedAt).toLocaleString('pt-BR')}
                      </>
                    ) : null}
                    {p.wasEdited ? <EditedHint>Editado</EditedHint> : null}
                  </Time>
                </div>
                <RowActions onClick={(e) => e.stopPropagation()}>
                  <SelectButton type="button" onClick={() => openEdit(p)} aria-label="Editar gasto">
                    <IconEdit />
                  </SelectButton>
                  <GhostButton type="button" onClick={() => onRemoveExpense(p.id)} aria-label="Remover gasto">
                    <IconTrash />
                  </GhostButton>
                </RowActions>
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

      {detailPurchase != null && (
        <DetailModalOverlay
          role="dialog"
          aria-modal="true"
          aria-label={detailShowMap ? 'Localização do gasto' : 'Detalhes do gasto'}
          onClick={closeDetail}
        >
          {!detailShowMap ? (
            <DetailModalCard onClick={(e) => e.stopPropagation()}>
              <LocationModalClose type="button" aria-label="Fechar detalhes" onClick={closeDetail}>
                ×
              </LocationModalClose>
              <FormModalTitle style={{ marginBottom: '1rem' }}>Detalhes do gasto</FormModalTitle>

              {detailPurchase.isPendingSync ? (
                <Muted style={{ marginBottom: '0.85rem' }}>Pendente de sincronização com o servidor.</Muted>
              ) : null}

              <DetailSection>
                <DetailLabel>Valor</DetailLabel>
                <DetailValue>{formatBRL(detailPurchase.amountCents)}</DetailValue>
              </DetailSection>

              <DetailSection>
                <DetailLabel>Categoria</DetailLabel>
                <DetailValue>{detailPurchase.categoryName}</DetailValue>
              </DetailSection>

              <DetailSection>
                <DetailLabel>Transcrição</DetailLabel>
                <DetailValue>{detailPurchase.transcript}</DetailValue>
              </DetailSection>

              <DetailSection>
                <DetailLabel>Criado em</DetailLabel>
                <DetailValue>{formatDetailDate(detailPurchase.createdAt)}</DetailValue>
              </DetailSection>

              <DetailSection>
                <DetailLabel>Atualizado em</DetailLabel>
                <DetailValue>{formatDetailDate(detailPurchase.updatedAt)}</DetailValue>
              </DetailSection>

              <DetailSection>
                <DetailLabel>Editado pelo utilizador</DetailLabel>
                <DetailValue>{detailPurchase.wasEdited ? 'Sim' : 'Não'}</DetailValue>
              </DetailSection>

              <DetailSection>
                <DetailLabel>Localização</DetailLabel>
                {detailPurchase.latitude != null && detailPurchase.longitude != null ? (
                  <PrimaryButton
                    type="button"
                    onClick={() => setDetailShowMap(true)}
                    style={{ width: 'auto', alignSelf: 'flex-start', marginTop: '0.15rem' }}
                  >
                    Mostrar localização
                  </PrimaryButton>
                ) : (
                  <DetailValue>Nenhuma localização registada para este gasto.</DetailValue>
                )}
              </DetailSection>
            </DetailModalCard>
          ) : detailPurchase.latitude != null && detailPurchase.longitude != null ? (
            <DetailModalCardMap onClick={(e) => e.stopPropagation()}>
              <DetailMapHeader>
                <GhostButton type="button" onClick={() => setDetailShowMap(false)}>
                  Voltar
                </GhostButton>
                <CloseRoundButton type="button" aria-label="Fechar" onClick={closeDetail}>
                  ×
                </CloseRoundButton>
              </DetailMapHeader>
              <DetailMapBody>
                <DetailMapIframe
                  title="Mapa do gasto"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${detailPurchase.latitude},${detailPurchase.longitude}&z=16&output=embed`}
                />
              </DetailMapBody>
              <LocationMeta>
                Lat: {detailPurchase.latitude.toFixed(6)} · Lng: {detailPurchase.longitude.toFixed(6)}
              </LocationMeta>
            </DetailModalCardMap>
          ) : null}
        </DetailModalOverlay>
      )}

      {editingPurchase != null && (
        <EditModalOverlay
          role="dialog"
          aria-modal="true"
          aria-label="Editar gasto"
          onClick={closeEdit}
        >
          <FormModalCard onClick={(e) => e.stopPropagation()}>
            <LocationModalClose type="button" aria-label="Fechar edição" onClick={closeEdit}>
              ×
            </LocationModalClose>
            <FormModalTitle>Editar gasto</FormModalTitle>
            <TextPrimary style={{ marginBottom: '0.75rem', fontSize: '0.82rem' }}>
              A localização deste registo não pode ser alterada.
            </TextPrimary>
            <Field
              type="text"
              placeholder="Descrição"
              value={edTranscript}
              onChange={(e) => setEdTranscript(e.target.value)}
            />
            {sortedCategories.length === 0 ? (
              <Muted style={{ marginBottom: '0.75rem' }}>
                Sem categorias carregadas. Não é possível mudar a categoria até carregarem.
              </Muted>
            ) : (
              <SelectField
                aria-label="Categoria"
                value={edCategoryId}
                onChange={(e) => setEdCategoryId(e.target.value)}
              >
                {sortedCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectField>
            )}
            <Field
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Valor (0,00)"
              value={edAmount}
              onChange={(e) => setEdAmount(formatBRLInputFromDigits(e.target.value))}
            />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              <CancelButton type="button" onClick={closeEdit}>
                Cancelar
              </CancelButton>
              <PrimaryButton
                type="button"
                onClick={() => void saveEdit()}
                disabled={sortedCategories.length === 0}
                style={{ flex: 1, minWidth: '140px' }}
              >
                Guardar
              </PrimaryButton>
            </div>
          </FormModalCard>
        </EditModalOverlay>
      )}
    </>
  );
}
