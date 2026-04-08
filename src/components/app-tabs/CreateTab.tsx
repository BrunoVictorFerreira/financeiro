import {
  Card,
  CardTitle,
  Field,
  FieldRow,
  Help,
  Muted,
  PrimaryButton,
  VoiceButton,
} from './AppTabShared.styles';

type Props = {
  speechOk: boolean;
  listening: boolean;
  manualInput: string;
  onManualInputChange: (value: string) => void;
  onToggleVoice: () => void;
  onSubmitManual: () => void;
};

export function CreateTab({
  speechOk,
  listening,
  manualInput,
  onManualInputChange,
  onToggleVoice,
  onSubmitManual,
}: Props) {
  return (
    <>
      <Card>
        <CardTitle>Registar compra por áudio</CardTitle>
        <Help>
          {speechOk
            ? 'Toque no botão e diga o valor (ex.: “gastei cinquenta reais”). Recomendado: Chrome ou Edge.'
            : 'Este navegador não expõe reconhecimento de voz. Use Chrome ou Edge (desktop/Android) ou registe manualmente abaixo.'}
        </Help>
        <VoiceButton type="button" $active={listening} onClick={onToggleVoice} disabled={!speechOk}>
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
            onChange={(e) => onManualInputChange(e.target.value)}
          />
          <PrimaryButton type="button" onClick={onSubmitManual}>
            Adicionar
          </PrimaryButton>
        </FieldRow>
      </Card>
    </>
  );
}
