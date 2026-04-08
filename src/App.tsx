import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import styled from 'styled-components';
import { AppShellLayout, type MainTab } from './components/app-shell';
import {
  fetchActiveBudget,
  insertBudget,
  insertBudgetReplacingPrevious,
  numericValueToCents,
} from './lib/budgetsApi';
import {
  expenseRowToPurchase,
  fetchActiveExpenses,
  insertExpense,
  softDeleteAllActiveExpenses,
  softDeleteExpense,
  sumExpenseRowsCents,
} from './lib/expensesApi';
import { fetchUserSettings, upsertUserSettings } from './lib/settingsApi';
import { useDailyReminder } from './hooks/useDailyReminder';
import { isSpeechRecognitionSupported, useSpeechRecognition } from './hooks/useSpeechRecognition';
import { formatBRL, parseMoneyInputToCents } from './lib/money';
import { ensureNotificationPermission, notifySaldoDisponivel } from './lib/notifications';
import { parseAmountToCents } from './lib/parseAmount';
import type { PurchaseRow } from './types/purchase';
import { parseAmountToPerc, parseAmountToWidth } from './lib/helpers';
import { IconTrash } from './components/auth/icons/General';

export type AppProps = {
  userId: string;
  authEmail?: string | null;
  authFullname?: string | null;
  onSignOut?: () => void;
};

export default function App({ userId, authEmail, authFullname, onSignOut }: AppProps) {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [budgetRemoteId, setBudgetRemoteId] = useState<string | null>(null);
  const [budgetCents, setBudgetCents] = useState<number | null>(null);
  const [spentCents, setSpentCents] = useState(0);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [budgetInput, setBudgetInput] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>('home');
  const speechOk = useMemo(() => isSpeechRecognitionSupported(), []);

  const loadAll = useCallback(async () => {
    setBootError(null);

    const budgetRes = await fetchActiveBudget(userId);
    if (budgetRes.error) {
      setBootError(budgetRes.error);
      return;
    }

    let budgetVal: number | null = null;
    if (budgetRes.row) {
      const cents = numericValueToCents(budgetRes.row.value);
      if (cents <= 0) {
        setBootError('Valor de orçamento inválido no servidor.');
        return;
      }
      setBudgetRemoteId(budgetRes.row.id);
      setBudgetCents(cents);
      budgetVal = cents;
    } else {
      setBudgetRemoteId(null);
      setBudgetCents(null);
    }

    const expRes = await fetchActiveExpenses(userId);
    if (expRes.error) {
      setBootError(expRes.error);
      return;
    }
    setPurchases(expRes.rows.map(expenseRowToPurchase));
    const spent = sumExpenseRowsCents(expRes.rows);
    setSpentCents(spent);

    const settings = await fetchUserSettings(userId);
    setReminderEnabled(settings?.daily_reminder_enabled ?? false);

    return { budget: budgetVal, spent };
  }, [userId]);

  const bootstrap = useCallback(async () => {
    setReady(false);
    setBootError(null);
    await loadAll();
    setReady(true);
  }, [loadAll]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useDailyReminder(
    reminderEnabled && budgetCents !== null && budgetRemoteId !== null,
    userId
  );

  const restanteCents = budgetCents !== null ? budgetCents - spentCents : 0;

  const toggleDailyReminder = async (next: boolean) => {
    if (next) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        setStatus('Ative as notificações no navegador para receber o lembrete às 20:30.');
        return;
      }
    }
    const { error } = await upsertUserSettings(userId, { daily_reminder_enabled: next });
    if (error) {
      setStatus(`Não foi possível guardar a preferência: ${error}`);
      return;
    }
    setReminderEnabled(next);
    setStatus(next ? 'Lembrete diário às 20:30 ativo.' : 'Lembrete diário desligado.');
  };

  const aplicarCompra = useCallback(
    async (amountCents: number, transcript: string) => {
      if (amountCents <= 0 || !Number.isFinite(amountCents)) {
        setStatus('Valor inválido.');
        return;
      }
      const { error } = await insertExpense(userId, amountCents, transcript);
      if (error) {
        setStatus(error ?? 'Não foi possível guardar o gasto no servidor.');
        return;
      }
      const snap = await loadAll();
      const canNotify = await ensureNotificationPermission();
      if (canNotify && snap?.budget != null) {
        notifySaldoDisponivel(snap.budget - snap.spent);
      }
      setStatus(`Registrado ${formatBRL(amountCents)}.`);
    },
    [loadAll, userId]
  );

  const { start: startSpeech, stop: stopSpeech } = useSpeechRecognition({
    onFinal: async (text) => {
      if (!text) return;
      const cents = parseAmountToCents(text);
      if (cents === null) {
        setStatus('Não identifiquei o valor. Diga o número (ex.: trinta reais ou 45,90).');
        return;
      }
      await aplicarCompra(cents, text);
    },
    onEnded: () => setListening(false),
    onError: (msg) => {
      setListening(false);
      setStatus(msg);
    },
  });

  const toggleVoice = async () => {
    if (listening) {
      stopSpeech();
      setListening(false);
      return;
    }
    if (budgetCents === null || budgetCents <= 0) {
      setStatus('Defina o orçamento total antes.');
      return;
    }
    setStatus(null);
    setListening(true);
    const canNotify = await ensureNotificationPermission();
    if (!canNotify && 'Notification' in window && Notification.permission === 'denied') {
      setStatus('Notificações bloqueadas no navegador. Ative para receber alertas de saldo.');
    }
    startSpeech();
  };

  const salvarOrcamento = async () => {
    const cents = parseMoneyInputToCents(budgetInput);
    if (cents === null) {
      setStatus('Informe um valor válido para o orçamento.');
      return;
    }
    if (budgetRemoteId === null) {
      const { id, error } = await insertBudget(userId, cents);
      if (error || !id) {
        setStatus(error ?? 'Não foi possível criar o orçamento no servidor.');
        return;
      }
      setBudgetRemoteId(id);
    } else {
      const { id, error } = await insertBudgetReplacingPrevious(userId, cents, budgetRemoteId);
      if (error || !id) {
        setStatus(error ?? 'Não foi possível guardar o novo orçamento.');
        return;
      }
      setBudgetRemoteId(id);
    }
    await loadAll();
    setBudgetInput('');
    setStatus('Orçamento guardado no servidor.');
  };

  const registrarManual = async () => {
    const cents = parseMoneyInputToCents(manualInput);
    if (cents === null) {
      setStatus('Valor inválido.');
      return;
    }
    const canNotify = await ensureNotificationPermission();
    if (!canNotify && 'Notification' in window && Notification.permission === 'denied') {
      setStatus('Notificações bloqueadas no navegador. Ative para receber alertas de saldo.');
    }
    setManualInput('');
    await aplicarCompra(cents, `Manual: ${formatBRL(cents)}`);
  };

  const remover = async (expenseId: string) => {
    const { error } = await softDeleteExpense(expenseId);
    if (error) {
      setStatus(`Não foi possível remover o gasto no servidor: ${error}`);
      return;
    }
    const snap = await loadAll();
    if (snap?.budget != null) {
      notifySaldoDisponivel(snap.budget - snap.spent);
    }
    setStatus('Compra removida.');
  };

  const zerarCompras = async () => {
    if (!confirm('Zerar todas as compras deste período? O orçamento total permanece.')) return;
    const { error } = await softDeleteAllActiveExpenses(userId);
    if (error) {
      setStatus(`Erro ao limpar gastos no servidor: ${error}`);
      return;
    }
    const snap = await loadAll();
    if (snap?.budget != null) {
      notifySaldoDisponivel(snap.budget - snap.spent);
    }
    setStatus('Lista de compras zerada.');
  };

  const signOutTrailing: ReactNode =
    onSignOut != null ? (
      <>
        {authFullname != null && authFullname !== '' && (
          <UserEmail title={authFullname}>{authFullname}</UserEmail>
        )}
        <SignOutButton type="button" onClick={onSignOut}>
          Sair
        </SignOutButton>
      </>
    ) : null;

  if (!ready) {
    return (
      <>
        <AppShellLayout
          showBottomNav={false}
          header={{ title: 'Clara Wallet', subtitle: 'A carregar o seu orçamento…' }}
        >
          <Muted>A carregar…</Muted>
        </AppShellLayout>
        {status && (
          <Toast role="status" $aboveNav={false}>
            {status}
          </Toast>
        )}
      </>
    );
  }

  if (bootError) {
    return (
      <>
        <AppShellLayout
          showBottomNav={false}
          header={{
            title: 'Clara Wallet',
            subtitle: 'Não foi possível ler o orçamento no servidor',
            trailing: signOutTrailing,
          }}
        >
          <Card>
            <Help style={{ marginBottom: '0.75rem' }}>{bootError}</Help>
            <SecondaryButton type="button" onClick={() => void bootstrap()}>
              Tentar novamente
            </SecondaryButton>
          </Card>
        </AppShellLayout>
        {status && (
          <Toast role="status" $aboveNav={false}>
            {status}
          </Toast>
        )}
      </>
    );
  }

  const showSetup = budgetRemoteId === null;
  const showBottomNav = !showSetup;

  const setupBody = (
    <Card>
      <CardTitle>Quanto pode gastar no total?</CardTitle>
      <Help>
        Defina o teto uma vez no Supabase (tabela budgets). Depois regista compras por voz ou manualmente; os gastos ficam
        na tabela expenses.
      </Help>
      <Field
        type="text"
        inputMode="decimal"
        placeholder="Ex.: 2500 ou 1.500,00"
        value={budgetInput}
        onChange={(e) => setBudgetInput(e.target.value)}
      />
      <PrimaryButton type="button" onClick={salvarOrcamento}>
        Guardar orçamento
      </PrimaryButton>
    </Card>
  );

  const homeTab = (
    <>
      <SaldoCard>
        <SaldoLabel>{restanteCents < 0 ? 'Acima do orçamento' : 'Ainda pode gastar'}</SaldoLabel>
        <SaldoValor>{formatBRL(restanteCents)}</SaldoValor>
        <Meta>
          Teto {formatBRL(budgetCents!)} · Gasto acumulado {formatBRL(spentCents)}
        </Meta>
        <Indicator>
          <TabIndicatorBalance $px={parseAmountToWidth(restanteCents, budgetCents!)} />
          <TabIndicatorExpenses 
            $px={parseAmountToWidth(spentCents, budgetCents!)} 
            $base={parseAmountToWidth(restanteCents, budgetCents!)}
            $amountSpent={parseAmountToPerc(spentCents, budgetCents!)}
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
                <GhostButton type="button" onClick={() => remover(p.id)}>
                  <IconTrash />
                </GhostButton>
              </Li>
            ))}
          </List>
        )}
        <Toolbar>
          <PrimaryButton type="button" onClick={zerarCompras}>
            Zerar lista de compras
          </PrimaryButton>
        </Toolbar>
      </Card>
    </>
  );

  const createTab = (
    <>
      <Card>
        <CardTitle>Registar compra por áudio</CardTitle>
        <Help>
          {speechOk
            ? 'Toque no botão e diga o valor (ex.: “gastei cinquenta reais”). Recomendado: Chrome ou Edge.'
            : 'Este navegador não expõe reconhecimento de voz. Use Chrome ou Edge (desktop/Android) ou registe manualmente abaixo.'}
        </Help>
        <VoiceButton type="button" $active={listening} onClick={toggleVoice} disabled={!speechOk}>
          {listening ? 'A ouvir… (toque para cancelar)' : 'Falar uma compra'}
        </VoiceButton>
        {!speechOk && <Muted>Entrada manual continua disponível.</Muted>}
      </Card>

      <Card>
        <CardTitle>Registe o valor manualmente</CardTitle>
        <FieldRow>
          <Field
            type="text"
            inputMode="decimal"
            placeholder="Valor (R$)"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
          />
          <PrimaryButton type="button" onClick={registrarManual}>
            Adicionar
          </PrimaryButton>
        </FieldRow>
      </Card>
    </>
  );

  const reportsTab = (
    <Card>
      <CardTitle>Relatórios</CardTitle>
      <Help>Em breve: gráficos e resumo por período.</Help>
    </Card>
  );

  const profileTab = (
    <>
      <Card>
        <CardTitle>Orçamento</CardTitle>
        <Help>Alterar o teto total (mantém as compras já registadas).</Help>
        <FieldRow>
          <Field
            type="text"
            inputMode="decimal"
            placeholder="Novo teto (R$)"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
          />
          <SecondaryButton type="button" onClick={salvarOrcamento}>
            Atualizar teto
          </SecondaryButton>
        </FieldRow>
      </Card>

      <Card>
        <CardTitle>Lembrete às 20:30</CardTitle>
        <Help>
          Notificação do sistema com quanto ainda pode gastar. O horário é o relógio deste aparelho. Com o site totalmente
          fechado o navegador pode não disparar às 20:30; nesse caso, ao abrir o app depois dessa hora o lembrete do dia
          aparece uma vez.
        </Help>
        <ReminderLabel>
          <ReminderCheckbox
            type="checkbox"
            checked={reminderEnabled}
            onChange={(e) => void toggleDailyReminder(e.target.checked)}
          />
          Lembrar todos os dias às 20:30
        </ReminderLabel>
      </Card>

      {onSignOut != null && (
        <Card>
          <CardTitle>Conta</CardTitle>
          {authFullname != null && authFullname !== '' && (
            <Help style={{ marginBottom: '0.35rem' }}>{authFullname}</Help>
          )}
          {authEmail != null && authEmail !== '' && (
            <Muted style={{ marginBottom: '1rem', display: 'block' }}>{authEmail}</Muted>
          )}
          <SignOutWide type="button" onClick={onSignOut}>
            Sair da conta
          </SignOutWide>
        </Card>
      )}
    </>
  );

  const mainBody =
    showSetup ? (
      setupBody
    ) : mainTab === 'home' ? (
      homeTab
    ) : (
      mainTab === 'create' ? (
        createTab
      ) : mainTab === 'reports' ? (
        reportsTab
      ) : (
        profileTab
      )
    );

  const onMicPress = async () => {
    if (!showBottomNav) return;
    setMainTab('create');
    await toggleVoice();
  };

  return (
    <>
      <AppShellLayout
        showBottomNav={showBottomNav}
        activeTab={mainTab}
        onTabChange={showBottomNav ? setMainTab : undefined}
        onMicPress={showBottomNav ? () => void onMicPress() : undefined}
        micActive={listening}
        header={{
          title: 'Clara Wallet',
          subtitle: showSetup ? 'Defina o orçamento total' : 'PWA · dados no Supabase',
          trailing: showSetup ? signOutTrailing : undefined,
        }}
      >
        {mainBody}
      </AppShellLayout>
      {status && (
        <Toast role="status" $aboveNav={showBottomNav}>
          {status}
        </Toast>
      )}
    </>
  );
}

const UserEmail = styled.span`
  font-size: 0.78rem;
  color: rgba(253, 247, 223, 0.85);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SignOutButton = styled.button`
  padding: 0.4rem 0.65rem;
  border-radius: 8px;
  border: 1px solid rgba(253, 247, 223, 0.35);
  background: transparent;
  color: #fdf7df;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    border-color: #10b981;
    color: #fff;
  }
`;

const SignOutWide = styled.button`
  width: 100%;
  padding: 0.85rem 1rem;
  border: none;
  border-radius: 11px;
  background: ${(p) => p.theme.accent};
  color: #042109;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    background: ${(p) => p.theme.accentHover};
  }
`;

const Card = styled.section`
  border-radius: 14px;
  padding: 1.1rem 1rem;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h2`
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: ${(p) => p.theme.primary};
`;

const Help = styled.p`
  margin: 0 0 1rem;
  font-size: 0.88rem;
  line-height: 1.45;
  color: ${(p) => p.theme.primary};
`;

const Field = styled.input`
  width: 100%;
  padding: 0.75rem 0.85rem;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.secondary};
  color: ${(p) => p.theme.secondary};
  margin-bottom: 0.75rem;

  &:focus {
    outline: 2px solid ${(p) => p.theme.primary};
    outline-offset: 1px;
  }

  &::placeholder {
    color: ${(p) => p.theme.secondary};
  }
`;

const FieldRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
  flex-wrap: wrap;

  ${Field} {
    flex: 1;
    min-width: 120px;
    margin-bottom: 0;
  }
`;

const PrimaryButton = styled.button`
  width: 100%;
  padding: 0.85rem 1rem;
  border: none;
  border-radius: 11px;
  background: ${(p) => p.theme.primary};
  color: ${(p) => p.theme.secondary};
  font-weight: 600;
  font-size: 1rem;

  &:hover {
    background: ${(p) => p.theme.primary};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.border};
  background: transparent;
  color: ${(p) => p.theme.text};
  font-weight: 500;
  font-size: 0.9rem;

  &:hover {
    border-color: ${(p) => p.theme.accent};
    color: ${(p) => p.theme.accentHover};
  }
`;

const VoiceButton = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 0.95rem 1rem;
  border: none;
  border-radius: 11px;
  background: ${(p) => (p.$active ? p.theme.secondary : p.theme.primary)};
  color: ${(p) => (p.$active ? 'white' : p.theme.secondary)};
  font-weight: 600;
  font-size: 1rem;

  &:hover:not(:disabled) {
    filter: brightness(1.06);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const SaldoCard = styled.div`
  text-align: center;
  padding: 1.35rem 1rem;
  margin-bottom: 1rem;
  border-radius: 16px;
`;

const SaldoLabel = styled.p`
  margin: 0 0 0.35rem;
  font-size: 0.9rem;
  color: ${(p) => p.theme.primary};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const SaldoValor = styled.p`
  margin: 0;
  font-size: 2.1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: ${(p) => p.theme.primary};
`;

const Meta = styled.p`
  margin: 0.75rem 0 0;
  font-size: 0.82rem;
  color: ${(p) => p.theme.primary};
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  color: ${(p) => p.theme.primary};
`;

const Li = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 0;

  &:last-child {
    border-bottom: none;
  }
`;

const Amount = styled.div`
  font-weight: 700;
  font-size: 1.05rem;
  color: ${(p) => p.theme.primary};
`;

const Transcript = styled.div`
  font-size: 0.82rem;
  color: ${(p) => p.theme.primary};
  margin-top: 0.2rem;
  word-break: break-word;
  `;

const Time = styled.div`
  font-size: 0.75rem;
  color: ${(p) => p.theme.primary};
  margin-top: 0.25rem;
`;

const Toolbar = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.5rem;
`;

const GhostButton = styled.button`
  padding: 1rem 0.5rem;
  border: none;
  background: transparent;
  color: ${(p) => p.theme.primary};
  font-size: 0.85rem;
  text-underline-offset: 3px;

  &:hover {
    color: ${(p) => p.theme.text};
  }
`;

const Button = styled.button`
  padding: 1rem 0.5rem;
  border: none;
  background: transparent;
  color: ${(p) => p.theme.primary};
  font-size: 0.85rem;
  text-underline-offset: 3px;

  &:hover {
    color: ${(p) => p.theme.text};
  }
`;

const Muted = styled.p`
  margin: 0;
  font-size: 0.88rem;
  color: ${(p) => p.theme.textMuted};
`;

const Toast = styled.div<{ $aboveNav: boolean }>`
  position: fixed;
  bottom: ${(p) =>
    p.$aboveNav ? 'calc(5.85rem + env(safe-area-inset-bottom, 0px))' : '1rem'};
  left: 50%;
  transform: translateX(-50%);
  max-width: min(420px, calc(100% - 2rem));
  padding: 0.65rem 1rem;
  border-radius: 10px;
  background: #1a2e22;
  border: 1px solid ${(p) => p.theme.border};
  color: ${(p) => p.theme.warning};
  font-size: 0.88rem;
  z-index: 50;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
`;

const ReminderLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  cursor: pointer;
  font-size: 0.95rem;
  line-height: 1.4;
  color: ${(p) => p.theme.text};
`;

const ReminderCheckbox = styled.input`
  margin-top: 0.2rem;
  width: 1.1rem;
  height: 1.1rem;
  accent-color: ${(p) => p.theme.accent};
  flex-shrink: 0;
`;

const Indicator = styled.div`
  display: flex;
  width: 100%;
  margin-top: 10px;
`;
  
const TabIndicatorBalance = styled.div<{ $px: number | null }>`
  height: 20px;
  width: ${(p) => p.$px ?? 0}px;
  background-color: ${(p) => p.theme.primary};
  border-radius: 10px;
  position: absolute;
  z-index: 3;
`;
    
const TabIndicatorExpenses = styled.div<{ $px: number | null, $base: number | null, $amountSpent: number | null }>`
  height: 20px;
  width: ${(p) => ((p.$base ?? 0) + (p.$px ?? 0))}px;
  background-color: ${(p) => p.theme.secondary};
  border-radius: 10px;
  position: absolute;
  z-index: 2;
  &::after {
    content: "${(p) => p.$amountSpent}% Gasto";
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${(p) => p.theme.primary};
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    z-index: 3;
  }
`;
  
const TabIndicatorGeneral = styled.div`
  height: 20px;
  width: 310px;
  background-color: ${(p) => p.theme.muted};
  border-radius: 10px;
  position: absolute;
  z-index: 1;
`;

const PorcentageLabel = styled.p`
  color: ${(p) => p.theme.primary};
  font-size: 12px;
  font-weight: bold;
  margin-top: 20px;
`;