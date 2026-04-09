import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppShellLayout, type MainTab } from './components/app-shell';
import {
  Card,
  CategoriesTab,
  CreateTab,
  Help,
  HomeTab,
  ProfileTab,
  ReportsTab,
  SecondaryButton,
  SetupTab,
  SignOutButton,
  Toast,
  UserEmail,
} from './components/app-tabs';
import {
  fetchActiveBudget,
  insertBudget,
  insertBudgetReplacingPrevious,
  numericValueToCents,
} from './lib/budgetsApi';
import {
  type ExpenseLocation,
  expenseRowToPurchase,
  fetchActiveExpenses,
  insertExpense,
  softDeleteAllActiveExpenses,
  softDeleteExpense,
  sumExpenseRowsCents,
  updateExpense,
} from './lib/expensesApi';
import { saveProfileAvatarFromFile } from './lib/profileAvatarApi';
import { fetchUserSettings, upsertUserSettings } from './lib/settingsApi';
import { useDailyReminder } from './hooks/useDailyReminder';
import { isSpeechRecognitionSupported, useSpeechRecognition } from './hooks/useSpeechRecognition';
import {
  formatBRL,
  formatBRLInputFromDigits,
  parseBRLMaskedInputToCents,
  parseMoneyInputToCents,
} from './lib/money';
import { ensureNotificationPermission, notifySaldoDisponivel } from './lib/notifications';
import { parseAmountToCents } from './lib/parseAmount';
import type { PurchaseRow } from './types/purchase';
import type { ExpenseCategory } from './types/expenseCategory';
import {
  clearAllPendingExpensesFromLocalStorageForUser,
  enqueuePendingExpenseToLocalStorage,
  mapPendingExpenseToPurchaseRow,
  readPendingExpensesFromLocalStorage,
  removePendingExpenseFromLocalStorage,
  updatePendingExpenseInLocalStorage,
} from './lib/offlineExpensesLocalStorage';
import {
  ensureOutrosCategoryInSupabase,
  readExpenseCategoriesByUserFromSupabase,
} from './lib/expenseCategoriesApi';
import { classifyExpenseCategoryWithChatGpt } from './lib/expenseCategoryAi';

export type AppProps = {
  userId: string;
  authEmail?: string | null;
  authFullname?: string | null;
  onSignOut?: () => void;
};

function isProbablyOfflineNetworkError(message: string | null | undefined) {
  if (!message) return !navigator.onLine;
  const text = message.toLowerCase();
  return (
    !navigator.onLine ||
    text.includes('failed to fetch') ||
    text.includes('networkerror') ||
    text.includes('network request failed')
  );
}

function getPendingExpensesForUserFromLocalStorage(userId: string) {
  return readPendingExpensesFromLocalStorage().filter((item) => item.userId === userId);
}

function normalizeTranscriptForCategoryMatch(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function detectCategoryFromTranscript(
  transcript: string,
  categories: ExpenseCategory[]
): ExpenseCategory | null {
  const normalizedTranscript = normalizeTranscriptForCategoryMatch(transcript);
  for (const category of categories) {
    for (const key of category.keys) {
      const normalizedKey = normalizeTranscriptForCategoryMatch(key).trim();
      if (!normalizedKey) continue;
      const escaped = normalizedKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const boundaryMatch = new RegExp(`(^|\\W)${escaped}(\\W|$)`, 'u');
      if (boundaryMatch.test(normalizedTranscript) || normalizedTranscript.includes(normalizedKey)) {
        return category;
      }
    }
  }
  return null;
}

export default function App({ userId, authEmail, authFullname, onSignOut }: AppProps) {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [offlineBootMode, setOfflineBootMode] = useState(false);
  const [budgetRemoteId, setBudgetRemoteId] = useState<string | null>(null);
  const [budgetCents, setBudgetCents] = useState<number | null>(null);
  const [spentCents, setSpentCents] = useState(0);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [budgetInput, setBudgetInput] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualCategoryId, setManualCategoryId] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [profileAvatarData, setProfileAvatarData] = useState<string | null>(null);
  const [profileAvatarCacheKey, setProfileAvatarCacheKey] = useState(0);
  const [mainTab, setMainTab] = useState<MainTab>('home');
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const speechOk = useMemo(() => isSpeechRecognitionSupported(), []);

  const loadAll = useCallback(async () => {
    setBootError(null);

    const pendingFromLocalStorage = getPendingExpensesForUserFromLocalStorage(userId);
    const pendingRows = pendingFromLocalStorage.map(mapPendingExpenseToPurchaseRow);

    const budgetRes = await fetchActiveBudget(userId);
    if (budgetRes.error) {
      if (isProbablyOfflineNetworkError(budgetRes.error)) {
        setOfflineBootMode(true);
        setBudgetRemoteId(null);
        setBudgetCents(null);
        setPurchases(pendingRows);
        const pendingSpent = pendingFromLocalStorage.reduce((acc, item) => acc + item.amountCents, 0);
        setSpentCents(pendingSpent);
        setStatus('Sem internet: pode registar gastos offline; sincronizamos quando a rede voltar.');
        return { budget: null, spent: pendingSpent };
      }
      setBootError(budgetRes.error);
      return;
    }
    setOfflineBootMode(false);

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
      if (!isProbablyOfflineNetworkError(expRes.error)) {
        setBootError(expRes.error);
        return;
      }
      setPurchases((current) =>
        current.some((p) => p.isPendingSync) ? current : pendingRows
      );
      setStatus('Sem internet: novos gastos ficam pendentes e sincronizam quando a rede voltar.');
      return { budget: budgetVal, spent: spentCents };
    }
    setPurchases([...pendingRows, ...expRes.rows.map(expenseRowToPurchase)]);
    const spent =
      sumExpenseRowsCents(expRes.rows) +
      pendingFromLocalStorage.reduce((acc, item) => acc + item.amountCents, 0);
    setSpentCents(spent);

    const settings = await fetchUserSettings(userId);
    setReminderEnabled(settings?.daily_reminder_enabled ?? false);
    setProfileAvatarData(settings?.avatar_data ?? null);

    const categoriesRes = await readExpenseCategoriesByUserFromSupabase(userId);
    if (!categoriesRes.error) {
      const allCategories = categoriesRes.categories;
      const hasOutros = allCategories.some((c) => c.name.trim().toLowerCase() === 'outros');
      if (hasOutros) {
        setExpenseCategories(allCategories);
      } else {
        const { category } = await ensureOutrosCategoryInSupabase(userId);
        setExpenseCategories(category ? [...allCategories, category] : allCategories);
      }
    }

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

  const handleProfilePhotoUpload = useCallback(
    async (file: File) => {
      const { dataUrl, error } = await saveProfileAvatarFromFile(userId, file);
      if (error) {
        setStatus(error);
        return;
      }
      if (dataUrl) {
        setProfileAvatarData(dataUrl);
        setProfileAvatarCacheKey((k) => k + 1);
      }
      setStatus('Foto de perfil guardada.');
    },
    [userId]
  );

  const restanteCents = budgetCents !== null ? budgetCents - spentCents : 0;

  const getCurrentExpenseLocation = useCallback(async (): Promise<ExpenseLocation | null> => {
    if (!('geolocation' in navigator)) return null;
    return await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    });
  }, []);

  const syncPendingExpensesFromLocalStorage = useCallback(async () => {
    const pendingForUser = getPendingExpensesForUserFromLocalStorage(userId);
    if (pendingForUser.length === 0 || !navigator.onLine) return;
    const fallbackOutrosId =
      expenseCategories.find((c) => c.name.trim().toLowerCase() === 'outros')?.id ?? null;

    let syncedCount = 0;
    for (const pending of pendingForUser) {
      const resolvedCategoryId = pending.categoryId ?? fallbackOutrosId;
      if (!resolvedCategoryId) continue;
      const { error } = await insertExpense(
        pending.userId,
        pending.amountCents,
        pending.transcript,
        pending.latitude != null && pending.longitude != null
          ? { latitude: pending.latitude, longitude: pending.longitude }
          : null,
        resolvedCategoryId
      );

      if (error) {
        if (isProbablyOfflineNetworkError(error)) break;
        continue;
      }

      removePendingExpenseFromLocalStorage(pending.localId);
      syncedCount += 1;
    }

    if (syncedCount > 0) {
      await loadAll();
      setStatus(`${syncedCount} gasto(s) pendente(s) sincronizado(s).`);
    }
  }, [expenseCategories, loadAll, userId]);

  useEffect(() => {
    const onOnline = () => {
      void syncPendingExpensesFromLocalStorage();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [syncPendingExpensesFromLocalStorage]);

  useEffect(() => {
    if (!ready) return;
    void syncPendingExpensesFromLocalStorage();
  }, [ready, syncPendingExpensesFromLocalStorage]);

  const onManualMoneyInputChange = useCallback((value: string) => {
    setManualInput(formatBRLInputFromDigits(value));
  }, []);

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
    async (amountCents: number, transcript: string, forcedCategoryId?: string) => {
      if (amountCents <= 0 || !Number.isFinite(amountCents)) {
        setStatus('Valor inválido.');
        return;
      }
      let resolvedCategory: ExpenseCategory | null = null;
      if (forcedCategoryId) {
        resolvedCategory = expenseCategories.find((c) => c.id === forcedCategoryId) ?? null;
        if (!resolvedCategory) {
          setStatus('Categoria não encontrada. Atualize a página ou escolha outra.');
          return;
        }
      } else {
        const defaultOutrosCategory =
          expenseCategories.find((c) => c.name.trim().toLowerCase() === 'outros') ?? null;
        const matchedCategory = detectCategoryFromTranscript(transcript, expenseCategories);
        const aiCategory =
          matchedCategory == null && navigator.onLine
            ? await classifyExpenseCategoryWithChatGpt({
                transcript,
                categories: expenseCategories,
              })
            : null;
        resolvedCategory = matchedCategory ?? aiCategory ?? defaultOutrosCategory;
        if (!resolvedCategory) {
          setStatus('Cadastre categorias primeiro (incluindo "Outros").');
          return;
        }
      }
      const location = await getCurrentExpenseLocation();
      const { error } = await insertExpense(
        userId,
        amountCents,
        transcript,
        location,
        resolvedCategory.id
      );
      if (error) {
        if (isProbablyOfflineNetworkError(error)) {
          const pendingItem = enqueuePendingExpenseToLocalStorage({
            userId,
            amountCents,
            categoryId: resolvedCategory.id,
            transcript,
            categoryName: resolvedCategory.name,
            location,
          });
          setPurchases((current) => [mapPendingExpenseToPurchaseRow(pendingItem), ...current]);
          setSpentCents((current) => current + amountCents);
          setStatus('Sem internet: gasto guardado localmente e pendente de sincronização.');
          return;
        }
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
    [expenseCategories, getCurrentExpenseLocation, loadAll, userId]
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
    if (!offlineBootMode && (budgetCents === null || budgetCents <= 0)) {
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

  const saveBudgetValue = async (raw: string): Promise<boolean> => {
    const cents = parseBRLMaskedInputToCents(raw) ?? parseMoneyInputToCents(raw);
    if (cents === null) {
      setStatus('Informe um valor válido para o orçamento.');
      return false;
    }
    if (budgetRemoteId === null) {
      const { id, error } = await insertBudget(userId, cents);
      if (error || !id) {
        setStatus(error ?? 'Não foi possível criar o orçamento no servidor.');
        return false;
      }
      setBudgetRemoteId(id);
    } else {
      const { id, error } = await insertBudgetReplacingPrevious(userId, cents, budgetRemoteId);
      if (error || !id) {
        setStatus(error ?? 'Não foi possível guardar o novo orçamento.');
        return false;
      }
      setBudgetRemoteId(id);
    }
    await loadAll();
    setBudgetInput('');
    setStatus('Orçamento guardado no servidor.');
    return true;
  };

  const salvarOrcamento = async () => {
    await saveBudgetValue(budgetInput);
  };

  const atualizarGasto = useCallback(
    async (
      id: string,
      input: { amountCents: number; transcript: string; categoryId: string }
    ): Promise<boolean> => {
      const row = purchases.find((p) => p.id === id);
      if (!row) {
        setStatus('Gasto não encontrado.');
        return false;
      }
      const categoryName =
        expenseCategories.find((c) => c.id === input.categoryId)?.name?.trim() ||
        row.categoryName ||
        'Outros';

      if (row.isPendingSync) {
        const ok = updatePendingExpenseInLocalStorage(id, {
          amountCents: input.amountCents,
          transcript: input.transcript,
          categoryId: input.categoryId,
          categoryName,
        });
        if (!ok) {
          setStatus('Não foi possível atualizar o gasto pendente.');
          return false;
        }
        const updatedAt = Date.now();
        setSpentCents((s) => s - row.amountCents + input.amountCents);
        setPurchases((cur) =>
          cur.map((p) =>
            p.id === id
              ? {
                  ...p,
                  amountCents: input.amountCents,
                  transcript: input.transcript,
                  categoryId: input.categoryId,
                  categoryName,
                  updatedAt,
                  wasEdited: true,
                }
              : p
          )
        );
        setStatus('Gasto atualizado.');
        return true;
      }

      const { error } = await updateExpense(id, {
        cents: input.amountCents,
        transcript: input.transcript,
        categoryId: input.categoryId,
      });
      if (error) {
        setStatus(error);
        return false;
      }
      const snap = await loadAll();
      if (snap?.budget != null) {
        notifySaldoDisponivel(snap.budget - snap.spent);
      }
      setStatus('Gasto atualizado.');
      return true;
    },
    [expenseCategories, loadAll, purchases]
  );

  const registrarManual = async () => {
    const normalizedDescription = manualDescription.trim();
    if (!normalizedDescription) {
      setStatus('Descreva o gasto manualmente.');
      return;
    }
    if (!manualCategoryId) {
      setStatus('Escolha uma categoria para o gasto manual.');
      return;
    }
    const cents = parseBRLMaskedInputToCents(manualInput);
    if (cents === null) {
      setStatus('Valor inválido.');
      return;
    }
    const canNotify = await ensureNotificationPermission();
    if (!canNotify && 'Notification' in window && Notification.permission === 'denied') {
      setStatus('Notificações bloqueadas no navegador. Ative para receber alertas de saldo.');
    }
    setManualDescription('');
    setManualInput('');
    await aplicarCompra(cents, normalizedDescription, manualCategoryId);
  };

  const remover = async (expenseId: string) => {
    const pendingExpense = purchases.find((p) => p.id === expenseId && p.isPendingSync);
    if (pendingExpense) {
      removePendingExpenseFromLocalStorage(expenseId);
      setPurchases((current) => current.filter((p) => p.id !== expenseId));
      setSpentCents((current) => Math.max(0, current - pendingExpense.amountCents));
      setStatus('Gasto pendente removido.');
      return;
    }

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
    clearAllPendingExpensesFromLocalStorageForUser(userId);
    const { error } = await softDeleteAllActiveExpenses(userId);
    if (error && !isProbablyOfflineNetworkError(error)) {
      setStatus(`Erro ao limpar gastos no servidor: ${error}`);
      return;
    }
    if (error && isProbablyOfflineNetworkError(error)) {
      setPurchases([]);
      setSpentCents(0);
      setStatus('Sem internet: gastos pendentes limpos localmente.');
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
          header={{
            title: 'Clara Wallet',
            subtitle: 'A carregar o seu orçamento…',
            avatarSrc: profileAvatarData,
            avatarKey: profileAvatarCacheKey,
          }}
        >
          <Help style={{ textAlign: 'center', fontSize: '1.5rem'}}>A carregar…</Help>
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
            avatarSrc: profileAvatarData,
            avatarKey: profileAvatarCacheKey,
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

  const showSetup = budgetRemoteId === null && !offlineBootMode;
  const showBottomNav = !showSetup && !offlineBootMode;
  const showHeader = offlineBootMode || showSetup || mainTab !== 'profile';

  const mainBody = 
    offlineBootMode ? (
      <>
        <Card>
          <Help>
            Está sem internet no momento. Pode registar gastos normalmente; eles ficam guardados localmente e serão
            sincronizados quando a ligação voltar.
          </Help>
        </Card>
        <CreateTab
          speechOk={speechOk}
          listening={listening}
          expenseCategories={expenseCategories}
          manualCategoryId={manualCategoryId}
          onManualCategoryIdChange={setManualCategoryId}
          manualDescription={manualDescription}
          onManualDescriptionChange={setManualDescription}
          manualInput={manualInput}
          onManualInputChange={onManualMoneyInputChange}
          onToggleVoice={() => void toggleVoice()}
          onSubmitManual={() => void registrarManual()}
        />
      </>
    ) : showSetup ? (
      <SetupTab
        budgetInput={budgetInput}
        onBudgetInputChange={setBudgetInput}
        onSaveBudget={() => void salvarOrcamento()}
      />
    ) : mainTab === 'home' ? (
      <HomeTab
        restanteCents={restanteCents}
        budgetCents={budgetCents!}
        spentCents={spentCents}
        purchases={purchases}
        expenseCategories={expenseCategories}
        onRemoveExpense={(id) => void remover(id)}
        onResetExpenses={() => void zerarCompras()}
        onUpdateExpense={(id, data) => atualizarGasto(id, data)}
        onFeedback={(msg) => setStatus(msg)}
      />
    ) : (
      mainTab === 'create' ? (
        <CreateTab
          speechOk={speechOk}
          listening={listening}
          expenseCategories={expenseCategories}
          manualCategoryId={manualCategoryId}
          onManualCategoryIdChange={setManualCategoryId}
          manualDescription={manualDescription}
          onManualDescriptionChange={setManualDescription}
          manualInput={manualInput}
          onManualInputChange={onManualMoneyInputChange}
          onToggleVoice={() => void toggleVoice()}
          onSubmitManual={() => void registrarManual()}
        />
      ) : mainTab === 'reports' ? (
        <ReportsTab />
      ) : mainTab === 'categories' ? (
        <CategoriesTab
          userId={userId}
          onFeedback={setStatus}
          onCategoriesChanged={() => void loadAll()}
        />
      ) : (
        <ProfileTab
          userId={userId}
          budgetCents={budgetCents}
          reminderEnabled={reminderEnabled}
          authFullname={authFullname}
          authEmail={authEmail}
          profileAvatarData={profileAvatarData}
          profileAvatarCacheKey={profileAvatarCacheKey}
          onProfilePhotoUpload={handleProfilePhotoUpload}
          onSaveBudgetValue={saveBudgetValue}
          onToggleReminder={(next) => void toggleDailyReminder(next)}
          onFeedback={setStatus}
          onSignOut={onSignOut}
        />
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
        showHeader={showHeader}
        showBottomNav={showBottomNav}
        activeTab={mainTab}
        onTabChange={showBottomNav ? setMainTab : undefined}
        onMicPress={showBottomNav ? () => void onMicPress() : undefined}
        micActive={listening}
        header={{
          title: `Olá, ${authFullname?.split(' ')[0]}`,
          subtitle: offlineBootMode
            ? 'Modo offline ativo'
            : showSetup
              ? 'Defina o orçamento total'
              : 'Bem vindo de volta ao Clara Wallet',
          trailing: showSetup ? signOutTrailing : undefined,
          avatarSrc: profileAvatarData,
          avatarKey: profileAvatarCacheKey,
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
