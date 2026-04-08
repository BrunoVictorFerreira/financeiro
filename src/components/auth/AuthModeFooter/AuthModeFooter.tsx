import { FooterBlock, FooterText, OutlineButton } from './AuthModeFooter.styles';

export type AuthMode = 'signin' | 'signup';

type Props = {
  mode: AuthMode;
  busy?: boolean;
  onSwitchMode: (mode: AuthMode) => void;
};

export function AuthModeFooter({ mode, busy, onSwitchMode }: Props) {
  return (
    <FooterBlock>
      {mode === 'signin' ? (
        <>
          <FooterText>Não tem uma conta?</FooterText>
          <OutlineButton type="button" disabled={busy} onClick={() => onSwitchMode('signup')}>
            Criar conta
          </OutlineButton>
        </>
      ) : (
        <>
          <FooterText>Já tem conta?</FooterText>
          <OutlineButton type="button" disabled={busy} onClick={() => onSwitchMode('signin')}>
            Entrar
          </OutlineButton>
        </>
      )}
    </FooterBlock>
  );
}
