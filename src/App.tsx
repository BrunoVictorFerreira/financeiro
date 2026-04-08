import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import type { ChangeEventHandler } from 'react';
import {
  addPurchase,
  clearPurchasesOnly,
  deletePurchase,
  exportBackup,
  getBudgetTotalCents,
  getConfig,
  importBackup,
  listPurchasesDesc,
  setBudgetTotalCents,
  setDailyReminderEnabled,
  sumPurchasesCents,
  type BackupPayload,
  type PurchaseRow,
} from './db';
import { useDailyReminder } from './hooks/useDailyReminder';
import { isSpeechRecognitionSupported, useSpeechRecognition } from './hooks/useSpeechRecognition';
import { formatBRL, parseMoneyInputToCents } from './lib/money';
import { ensureNotificationPermission, notifySaldoDisponivel } from './lib/notifications';
import { parseAmountToCents } from './lib/parseAmount';
import { supabase } from './lib/supabaseClient';

function isBackupPayload(x: unknown): x is BackupPayload {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return o.v === 1 && Array.isArray(o.purchases);
}

export type AppProps = {
  authEmail?: string | null;
  onSignOut?: () => void;
};

export default function App({ authEmail, onSignOut }: AppProps = {}) {
  const [ready, setReady] = useState(false);
  const [budgetCents, setBudgetCents] = useState<number | null>(null);
  const [spentCents, setSpentCents] = useState(0);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [budgetInput, setBudgetInput] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const speechOk = useMemo(() => isSpeechRecognitionSupported(), []);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadAll = useCallback(async () => {
    const b = await getBudgetTotalCents();
    setBudgetCents(b);
    const cfg = await getConfig();
    setReminderEnabled(cfg?.dailyReminderEnabled ?? false);
    const list = await listPurchasesDesc();
    setPurchases(list);
    setSpentCents(await sumPurchasesCents());
  }, []);

  useEffect(() => {
    void (async () => {
      await loadAll();
      setReady(true);
    })();
  }, [loadAll]);

  useDailyReminder(reminderEnabled && budgetCents !== null);

  const restanteCents = budgetCents !== null ? budgetCents - spentCents : 0;

  const toggleDailyReminder = async (next: boolean) => {
    if (next) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        setStatus('Ative as notificações no navegador para receber o lembrete às 20:30.');
        return;
      }
    }
    await setDailyReminderEnabled(next);
    setReminderEnabled(next);
    setStatus(next ? 'Lembrete diário às 20:30 ativo.' : 'Lembrete diário desligado.');
  };

  const aplicarCompra = useCallback(
    async (amountCents: number, transcript: string) => {
      if (amountCents <= 0 || !Number.isFinite(amountCents)) {
        setStatus('Valor inválido.');
        return;
      }
      await addPurchase({ amountCents, transcript });
      await loadAll();
      const newSpent = await sumPurchasesCents();
      const b = await getBudgetTotalCents();
      const rest = b !== null ? b - newSpent : 0;
      notifySaldoDisponivel(rest);
      setStatus(`Registrado ${formatBRL(amountCents)}.`);
    },
    [loadAll]
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

  const toggleVoice = () => {
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
    void ensureNotificationPermission();
    startSpeech();
  };

  const salvarOrcamento = async () => {
    const cents = parseMoneyInputToCents(budgetInput);
    if (cents === null) {
      setStatus('Informe um valor válido para o orçamento.');
      return;
    }
    await setBudgetTotalCents(cents);
    await loadAll();
    setBudgetInput('');
    setStatus('Orçamento salvo no navegador (IndexedDB).');
  };

  const registrarManual = async () => {
    const cents = parseMoneyInputToCents(manualInput);
    if (cents === null) {
      setStatus('Valor inválido.');
      return;
    }
    setManualInput('');
    await aplicarCompra(cents, `Manual: ${formatBRL(cents)}`);
  };

  const remover = async (id: string) => {
    await deletePurchase(id);
    await loadAll();
    const b = await getBudgetTotalCents();
    const s = await sumPurchasesCents();
    if (b !== null) notifySaldoDisponivel(b - s);
    setStatus('Compra removida.');
  };

  const zerarCompras = async () => {
    if (!confirm('Zerar todas as compras deste período? O orçamento total permanece.')) return;
    await clearPurchasesOnly();
    await loadAll();
    const b = await getBudgetTotalCents();
    if (b !== null) notifySaldoDisponivel(b);
    setStatus('Lista de compras zerada.');
  };

  const baixarBackup = async () => {
    const data = await exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `orcamento-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus('Backup baixado. Guarde este ficheiro em local seguro.');
  };

  const onPickBackup: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    try {
      const parsed: unknown = JSON.parse(text);
      if (!isBackupPayload(parsed)) {
        setStatus('Ficheiro de backup inválido.');
        return;
      }
      if (!confirm('Substituir todos os dados locais pelo conteúdo deste backup?')) return;
      await importBackup(parsed);
      await loadAll();
      setStatus('Backup restaurado.');
    } catch {
      setStatus('Não foi possível ler o backup.');
    }
  };

  if (!ready) {
    return (
      <Shell>
        <Muted>A carregar dados locais…</Muted>
      </Shell>
    );
  }

  const showSetup = budgetCents === null;

  return (
    <Shell>
      <Header>
        <HeaderMain>
          <Title>Orçamento pessoal</Title>
          <Tag>PWA · dados no seu navegador</Tag>
        </HeaderMain>
        {onSignOut != null && (
          <UserBar>
            {authEmail != null && authEmail !== '' && (
              <UserEmail title={authEmail}>{authEmail}</UserEmail>
            )}
            <SignOutButton type="button" onClick={onSignOut}>
              Sair
            </SignOutButton>
          </UserBar>
        )}
      </Header>

      {showSetup ? (
        <Card>
          <CardTitle>Quanto pode gastar no total?</CardTitle>
          <Help>Defina uma vez. Depois regista compras por voz ou manualmente. Tudo fica guardado em IndexedDB neste dispositivo.</Help>
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
      ) : (
        <>
          <SaldoCard $neg={restanteCents < 0}>
            <SaldoLabel>{restanteCents < 0 ? 'Acima do orçamento' : 'Ainda pode gastar'}</SaldoLabel>
            <SaldoValor>{formatBRL(restanteCents)}</SaldoValor>
            <Meta>
              Teto {formatBRL(budgetCents!)} · Gasto acumulado {formatBRL(spentCents)}
            </Meta>
          </SaldoCard>

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
            <CardTitle>Ou registe o valor</CardTitle>
            <FieldRow>
              <Field
                type="text"
                inputMode="decimal"
                placeholder="Valor (R$)"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
              <SecondaryButton type="button" onClick={registrarManual}>
                Adicionar
              </SecondaryButton>
            </FieldRow>
          </Card>

          <Card>
            <CardTitle>Compras registadas</CardTitle>
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
                      Apagar
                    </GhostButton>
                  </Li>
                ))}
              </List>
            )}
            <Toolbar>
              <GhostButton type="button" onClick={zerarCompras}>
                Zerar lista de compras
              </GhostButton>
            </Toolbar>
          </Card>

          <Card>
            <CardTitle>Cópia de segurança (não perca os dados)</CardTitle>
            <Help>
              Exporte um JSON para guardar noutro disco ou nuvem. Para recuperar, use Restaurar. Os dados vivem só no
              IndexedDB deste navegador até criar cópias.
            </Help>
            <BackupRow>
              <SecondaryButton type="button" onClick={baixarBackup}>
                Exportar backup (.json)
              </SecondaryButton>
              <SecondaryButton type="button" onClick={() => fileRef.current?.click()}>
                Restaurar backup
              </SecondaryButton>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onPickBackup} />
            </BackupRow>
          </Card>

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
              Notificação do sistema com quanto ainda pode gastar. O horário é o relógio deste aparelho.
              Com o site totalmente fechado o navegador pode não disparar às 20:30; nesse caso, ao abrir o
              app depois dessa hora o lembrete do dia aparece uma vez.
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
        </>
      )}

      {status && <Toast role="status">{status}</Toast>}
    </Shell>
  );
}

const Shell = styled.main`
  max-width: 480px;
  margin: 0 auto;
  padding: 1.25rem 1rem 3rem;
  min-height: 100dvh;
`;

const Header = styled.header`
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem 1rem;
`;

const HeaderMain = styled.div`
  min-width: 0;
  flex: 1;
`;

const UserBar = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
  flex-shrink: 0;
`;

const UserEmail = styled.span`
  font-size: 0.78rem;
  color: ${(p) => p.theme.textMuted};
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SignOutButton = styled.button`
  padding: 0.4rem 0.65rem;
  border-radius: 8px;
  border: 1px solid ${(p) => p.theme.border};
  background: transparent;
  color: ${(p) => p.theme.text};
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    border-color: ${(p) => p.theme.accent};
    color: ${(p) => p.theme.accentHover};
  }
`;

const Title = styled.h1`
  margin: 0 0 0.35rem;
  font-size: 1.65rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const Tag = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: ${(p) => p.theme.textMuted};
`;

const Card = styled.section`
  background: ${(p) => p.theme.bgElevated};
  border: 1px solid ${(p) => p.theme.border};
  border-radius: 14px;
  padding: 1.1rem 1rem;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h2`
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
  font-weight: 600;
`;

const Help = styled.p`
  margin: 0 0 1rem;
  font-size: 0.88rem;
  line-height: 1.45;
  color: ${(p) => p.theme.textMuted};
`;

const Field = styled.input`
  width: 100%;
  padding: 0.75rem 0.85rem;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.border};
  background: ${(p) => p.theme.inputBg};
  color: ${(p) => p.theme.text};
  margin-bottom: 0.75rem;

  &::placeholder {
    color: #5d7a66;
  }

  &:focus {
    outline: 2px solid ${(p) => p.theme.accent};
    outline-offset: 1px;
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
  background: ${(p) => p.theme.accent};
  color: #042109;
  font-weight: 600;
  font-size: 1rem;

  &:hover {
    background: ${(p) => p.theme.accentHover};
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
  background: ${(p) => (p.$active ? '#2e5c38' : p.theme.accent)};
  color: #fff;
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

const SaldoCard = styled.div<{ $neg: boolean }>`
  text-align: center;
  padding: 1.35rem 1rem;
  margin-bottom: 1rem;
  border-radius: 16px;
  background: linear-gradient(160deg, #163524 0%, ${(p) => p.theme.bgElevated} 100%);
  border: 1px solid ${(p) => (p.$neg ? p.theme.danger : p.theme.accent)};
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
`;

const SaldoLabel = styled.p`
  margin: 0 0 0.35rem;
  font-size: 0.9rem;
  color: ${(p) => p.theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const SaldoValor = styled.p`
  margin: 0;
  font-size: 2.1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
`;

const Meta = styled.p`
  margin: 0.75rem 0 0;
  font-size: 0.82rem;
  color: ${(p) => p.theme.textMuted};
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Li = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${(p) => p.theme.border};

  &:last-child {
    border-bottom: none;
  }
`;

const Amount = styled.div`
  font-weight: 700;
  font-size: 1.05rem;
`;

const Transcript = styled.div`
  font-size: 0.82rem;
  color: ${(p) => p.theme.textMuted};
  margin-top: 0.2rem;
  word-break: break-word;
`;

const Time = styled.div`
  font-size: 0.75rem;
  color: #6b8f72;
  margin-top: 0.25rem;
`;

const Toolbar = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.5rem;
`;

const GhostButton = styled.button`
  padding: 0.35rem 0.5rem;
  border: none;
  background: transparent;
  color: ${(p) => p.theme.warning};
  font-size: 0.85rem;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover {
    color: ${(p) => p.theme.text};
  }
`;

const BackupRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Muted = styled.p`
  margin: 0;
  font-size: 0.88rem;
  color: ${(p) => p.theme.textMuted};
`;

const Toast = styled.div`
  position: fixed;
  bottom: 1rem;
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
