import { useRef, useState } from 'react';
import { cpfDigitsOnly, formatCpfDisplay } from '../../lib/cpf';
import { formatBRLInputFromDigits } from '../../lib/money';
import {
  Card,
  CardTitle,
  CancelButton,
  EditModalOverlay,
  Field,
  FormModalCard,
  FormModalTitle,
  Help,
  ItemListProfile,
  ListProfile,
  LocationModalClose,
  PrimaryButton,
  ProfileCPF,
  ProfileImage,
  ProfileName,
  SignOutWide,
} from './AppTabShared.styles';

const DEFAULT_PROFILE_IMAGE = '/financeiro/profile.jpeg';

type Props = {
  userId: string;
  /** Orçamento atual em centavos (para pré-preencher o modal). */
  budgetCents: number | null;
  reminderEnabled: boolean;
  authFullname?: string | null;
  /** Metadado `cpf` do Supabase (registo). */
  authCpf?: string | null;
  authEmail?: string | null;
  profileAvatarData: string | null;
  profileAvatarCacheKey: number;
  onProfilePhotoUpload: (file: File) => Promise<void>;
  /** Grava o teto a partir do texto do campo (mesma regra que o setup inicial). */
  onSaveBudgetValue: (raw: string) => Promise<boolean>;
  onToggleReminder: (next: boolean) => void;
  onFeedback?: (message: string) => void;
  onSignOut?: () => void;
};

export function ProfileTab({
  userId: _userId,
  budgetCents,
  reminderEnabled: _reminderEnabled,
  authFullname,
  authCpf,
  authEmail,
  profileAvatarData,
  profileAvatarCacheKey,
  onProfilePhotoUpload,
  onSaveBudgetValue,
  onToggleReminder: _onToggleReminder,
  onFeedback: _onFeedback,
  onSignOut,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [modalBudgetInput, setModalBudgetInput] = useState('');
  const [budgetSaving, setBudgetSaving] = useState(false);

  const imageSrc =
    profileAvatarData != null && profileAvatarData.trim() !== ''
      ? profileAvatarData
      : DEFAULT_PROFILE_IMAGE;

  const cpfDigits = cpfDigitsOnly(authCpf ?? '');
  const cpfDisplay =
    cpfDigits.length > 0 ? formatCpfDisplay(cpfDigits) : null;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    try {
      await onProfilePhotoUpload(file);
    } finally {
      setPhotoBusy(false);
    }
  };

  const openBudgetModal = () => {
    const initial =
      budgetCents != null && budgetCents > 0
        ? formatBRLInputFromDigits(String(budgetCents))
        : '';
    setModalBudgetInput(initial);
    setBudgetModalOpen(true);
  };

  const closeBudgetModal = () => {
    setBudgetModalOpen(false);
    setModalBudgetInput('');
  };

  const handleSaveBudget = async () => {
    setBudgetSaving(true);
    try {
      const ok = await onSaveBudgetValue(modalBudgetInput);
      if (ok) closeBudgetModal();
    } finally {
      setBudgetSaving(false);
    }
  };

  return (
    <>
      <Card>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          hidden
          onChange={(e) => void handlePhotoChange(e)}
        />
        <ProfileImage key={profileAvatarCacheKey} src={imageSrc} alt="Foto de perfil" />
        <PrimaryButton
          type="button"
          disabled={photoBusy}
          onClick={() => fileInputRef.current?.click()}
          style={{ display: 'block', margin: '0 auto 12px', width: 'auto' }}
        >
          {photoBusy ? 'A enviar…' : 'Alterar foto de perfil'}
        </PrimaryButton>
        <ProfileName>{authFullname}</ProfileName>
        <ProfileCPF>
          CPF: {cpfDisplay ?? 'não registado nesta conta'}
        </ProfileCPF>
      </Card>

      <Card>
        <ListProfile>
          <ItemListProfile>Resetar Senha <span>&gt;</span></ItemListProfile>
          <ItemListProfile
            role="button"
            tabIndex={0}
            onClick={openBudgetModal}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openBudgetModal();
              }
            }}
          >
            Alterar Teto de Gastos <span>&gt;</span>
          </ItemListProfile>
          <ItemListProfile>Criar Lembretes <span>&gt;</span></ItemListProfile>
        </ListProfile>
      </Card>

      {onSignOut != null && (
        <Card>
          <CardTitle>Conta</CardTitle>
          {authFullname != null && authFullname !== '' && (
            <Help style={{ marginBottom: '0.35rem' }}>{authFullname}</Help>
          )}
          {authEmail != null && authEmail !== '' && (
            <Help style={{ marginBottom: '1rem', display: 'block' }}>{authEmail}</Help>
          )}
          <SignOutWide type="button" onClick={onSignOut}>
            Sair da conta
          </SignOutWide>
        </Card>
      )}

      {budgetModalOpen && (
        <EditModalOverlay
          role="dialog"
          aria-modal="true"
          aria-label="Alterar teto de gastos"
          onClick={closeBudgetModal}
        >
          <FormModalCard onClick={(e) => e.stopPropagation()}>
            <LocationModalClose type="button" aria-label="Fechar" onClick={closeBudgetModal}>
              ×
            </LocationModalClose>
            <FormModalTitle>Teto de gastos</FormModalTitle>
            <Help style={{ marginBottom: '0.85rem' }}>
              Novo valor total do orçamento. Os gastos já registados mantêm-se; o saldo é recalculado.
            </Help>
            <Field
              type="text"
              inputMode="numeric"
              placeholder="0,00"
              value={modalBudgetInput}
              onChange={(e) => setModalBudgetInput(formatBRLInputFromDigits(e.target.value))}
            />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              <CancelButton type="button" onClick={closeBudgetModal}>
                Cancelar
              </CancelButton>
              <PrimaryButton
                type="button"
                onClick={() => void handleSaveBudget()}
                disabled={budgetSaving}
                style={{ flex: 1, minWidth: '140px' }}
              >
                {budgetSaving ? 'A guardar…' : 'Guardar teto'}
              </PrimaryButton>
            </div>
          </FormModalCard>
        </EditModalOverlay>
      )}
    </>
  );
}
