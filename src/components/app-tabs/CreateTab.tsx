import type { ExpenseCategory } from '../../types/expenseCategory';
import {
  Card,
  CardTitle,
  Field,
  FieldRow,
  Help,
  Muted,
  PrimaryButton,
  SelectField,
  VoiceButton,
} from './AppTabShared.styles';

type Props = {
  speechOk: boolean;
  listening: boolean;
  expenseCategories: ExpenseCategory[];
  manualCategoryId: string;
  onManualCategoryIdChange: (id: string) => void;
  manualDescription: string;
  onManualDescriptionChange: (value: string) => void;
  manualInput: string;
  onManualInputChange: (value: string) => void;
  onToggleVoice: () => void;
  onSubmitManual: () => void;
};

export function CreateTab({
  speechOk,
  listening,
  expenseCategories,
  manualCategoryId,
  onManualCategoryIdChange,
  manualDescription,
  onManualDescriptionChange,
  manualInput,
  onManualInputChange,
  onToggleVoice,
  onSubmitManual,
}: Props) {
  const sortedCategories = [...expenseCategories].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt')
  );

  return (
    <>
      <Card>
        <CardTitle>Registar compra por áudio</CardTitle>
        <Help>
          {!speechOk && 'Este navegador não expõe reconhecimento de voz. Use Chrome ou Edge (desktop/Android) ou registe manualmente abaixo.'}
        </Help>
        <VoiceButton type="button" $active={listening} onClick={onToggleVoice} disabled={!speechOk}>
          {listening ? 'A ouvir… (toque para cancelar)' : 'Falar uma compra'}
        </VoiceButton>
        {!speechOk && <Muted>Entrada manual continua disponível.</Muted>}
      </Card>

      <Card>
        <CardTitle>ou registe o valor manualmente</CardTitle>
        <Help>Informe descrição, categoria e valor em reais.</Help>
        <Field
          type="text"
          placeholder="Descrição (ex.: almoço no trabalho)"
          value={manualDescription}
          onChange={(e) => onManualDescriptionChange(e.target.value)}
        />
        {sortedCategories.length === 0 ? (
          <Muted>Sem categorias carregadas. Com internet, elas aparecem ao abrir a app.</Muted>
        ) : (
          <SelectField
            aria-label="Categoria do gasto"
            value={manualCategoryId}
            onChange={(e) => onManualCategoryIdChange(e.target.value)}
          >
            <option value="">Categoria…</option>
            {sortedCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        )}
        <FieldRow>
          <Field
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0,00"
            value={manualInput}
            onChange={(e) => onManualInputChange(e.target.value)}
          />
          <PrimaryButton
            type="button"
            onClick={onSubmitManual}
            disabled={sortedCategories.length === 0}
          >
            Adicionar
          </PrimaryButton>
        </FieldRow>
      </Card>
    </>
  );
}
