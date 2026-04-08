import { FormEvent, useState } from 'react';
import styled from 'styled-components';
import { supabase } from './lib/supabaseClient';

type Mode = 'signin' | 'signup';

export default function Login() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError('Preencha email e palavra-passe.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: trimmed,
          password,
        });
        if (err) setError(err.message);
      } else {
        const { error: err } = await supabase.auth.signUp({
          email: trimmed,
          password,
        });
        if (err) setError(err.message);
        else {
          setInfo(
            'Conta criada. Se o projeto exigir confirmação por email, verifique a caixa de entrada.'
          );
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <Header>
        <Title>Orçamento pessoal</Title>
        <Tag>Entrar com a sua conta Supabase</Tag>
      </Header>

      <Card>
        <ModeRow>
          <ModeTab type="button" $active={mode === 'signin'} onClick={() => setMode('signin')}>
            Entrar
          </ModeTab>
          <ModeTab type="button" $active={mode === 'signup'} onClick={() => setMode('signup')}>
            Registar
          </ModeTab>
        </ModeRow>

        <Form onSubmit={(e) => void onSubmit(e)}>
          <Field
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
          <Field
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder="Palavra-passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? 'A aguardar…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
          </PrimaryButton>
        </Form>

        {error && <Err role="alert">{error}</Err>}
        {info && <Info role="status">{info}</Info>}
      </Card>
    </Shell>
  );
}

const Shell = styled.main`
  max-width: 420px;
  margin: 0 auto;
  padding: 1.25rem 1rem 3rem;
  min-height: 100dvh;
`;

const Header = styled.header`
  margin-bottom: 1.5rem;
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
`;

const ModeRow = styled.div`
  display: flex;
  gap: 0.35rem;
  margin-bottom: 1rem;
`;

const ModeTab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  border: 1px solid ${(p) => (p.$active ? p.theme.accent : p.theme.border)};
  background: ${(p) => (p.$active ? 'rgba(46, 92, 56, 0.35)' : 'transparent')};
  color: ${(p) => p.theme.text};
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
    border-color: ${(p) => p.theme.accent};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Field = styled.input`
  width: 100%;
  padding: 0.75rem 0.85rem;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.border};
  background: ${(p) => p.theme.inputBg};
  color: ${(p) => p.theme.text};
  box-sizing: border-box;

  &::placeholder {
    color: #5d7a66;
  }

  &:focus {
    outline: 2px solid ${(p) => p.theme.accent};
    outline-offset: 1px;
  }

  &:disabled {
    opacity: 0.6;
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
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${(p) => p.theme.accentHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Err = styled.p`
  margin: 0.85rem 0 0;
  font-size: 0.88rem;
  color: ${(p) => p.theme.danger};
  line-height: 1.4;
`;

const Info = styled.p`
  margin: 0.85rem 0 0;
  font-size: 0.88rem;
  color: ${(p) => p.theme.textMuted};
  line-height: 1.45;
`;
