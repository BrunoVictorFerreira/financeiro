import { Checkbox, GhostLink, OptionsRow, RememberLabel } from './AuthSignInExtras.styles';

type Props = {
  remember: boolean;
  onRememberChange: (checked: boolean) => void;
  onForgotPassword: () => void;
  disabled?: boolean;
};

export function AuthSignInExtras({
  remember,
  onRememberChange,
  onForgotPassword,
  disabled,
}: Props) {
  return (
    <OptionsRow>
      <RememberLabel>
        <Checkbox
          type="checkbox"
          checked={remember}
          disabled={disabled}
          onChange={(e) => onRememberChange(e.target.checked)}
        />
        Lembrar-me
      </RememberLabel>
      <GhostLink type="button" disabled={disabled} onClick={onForgotPassword}>
        Esqueceu a palavra-passe?
      </GhostLink>
    </OptionsRow>
  );
}
