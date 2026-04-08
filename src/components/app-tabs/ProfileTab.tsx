import {
  Card,
  CardTitle,
  Field,
  FieldRow,
  Help,
  ItemListProfile,
  ListProfile,
  Muted,
  ProfileCPF,
  ProfileImage,
  ProfileName,
  ReminderCheckbox,
  ReminderLabel,
  SecondaryButton,
  SignOutWide,
} from './AppTabShared.styles';

type Props = {
  budgetInput: string;
  reminderEnabled: boolean;
  authFullname?: string | null;
  authEmail?: string | null;
  onBudgetInputChange: (value: string) => void;
  onSaveBudget: () => void;
  onToggleReminder: (next: boolean) => void;
  onSignOut?: () => void;
};

export function ProfileTab({
  budgetInput,
  reminderEnabled,
  authFullname,
  authEmail,
  onBudgetInputChange,
  onSaveBudget,
  onToggleReminder,
  onSignOut,
}: Props) {
  return (
    <>
      <Card>
        <ProfileImage src="/financeiro/profile.jpeg" alt="Logo" />
        <ProfileName>{authFullname}</ProfileName>
        <ProfileCPF>CPF: XXX.XXX.XXX-XX</ProfileCPF>
        {/* <CardTitle>Orçamento</CardTitle>
        <Help>Alterar o teto total (mantém as compras já registadas).</Help>
        <FieldRow>
          <Field
            type="text"
            inputMode="decimal"
            placeholder="Novo teto (R$)"
            value={budgetInput}
            onChange={(e) => onBudgetInputChange(e.target.value)}
          />
          <SecondaryButton type="button" onClick={onSaveBudget}>
            Atualizar teto
          </SecondaryButton>
        </FieldRow> */}
      </Card>

      <Card>
        <ListProfile>
          <ItemListProfile>Resetar Senha <span>&gt;</span></ItemListProfile>
          <ItemListProfile>Alterar Teto de Gastos <span>&gt;</span></ItemListProfile>
          <ItemListProfile>Criar Lembretes <span>&gt;</span></ItemListProfile>
        </ListProfile>
      </Card>
      <Card>
        {/* <CardTitle>Lembrete às 20:30</CardTitle>
        <Help>
          Notificação do sistema com quanto ainda pode gastar. O horário é o relógio deste aparelho. Com o site totalmente
          fechado o navegador pode não disparar às 20:30; nesse caso, ao abrir o app depois dessa hora o lembrete do dia
          aparece uma vez.
        </Help>
        <ReminderLabel>
          <ReminderCheckbox
            type="checkbox"
            checked={reminderEnabled}
            onChange={(e) => onToggleReminder(e.target.checked)}
          />
          Lembrar todos os dias às 20:30
        </ReminderLabel> */}
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
    </>
  );
}
