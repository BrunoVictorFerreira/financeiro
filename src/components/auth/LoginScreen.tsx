import { FormEvent, useState } from 'react';
import { cpfDigitsOnly, formatCpfDisplay, isValidCpf } from '../../lib/cpf';
import { supabase } from '../../lib/supabaseClient';
import { AuthFeedback } from './AuthFeedback/AuthFeedback';
import { AuthForm } from './AuthForm/AuthForm';
import { AuthHeroBand } from './AuthHeroBand/AuthHeroBand';
import type { AuthMode } from './AuthModeFooter/AuthModeFooter';
import { AuthModeFooter } from './AuthModeFooter/AuthModeFooter';
import { AuthPasswordField } from './AuthPasswordField/AuthPasswordField';
import { AuthShell } from './AuthShell/AuthShell';
import { AuthSheet } from './AuthSheet/AuthSheet';
import { AuthSignInExtras } from './AuthSignInExtras/AuthSignInExtras';
import { AuthSubmitButton } from './AuthSubmitButton/AuthSubmitButton';
import { AuthTextField } from './AuthTextField/AuthTextField';

export default function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const trimmedEmail = email.trim();

    if (mode === 'signin') {
      if (!trimmedEmail || !password) {
        setError('Preencha email e palavra-passe.');
        return;
      }
      setBusy(true);
      try {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (err) setError(err.message);
      } finally {
        setBusy(false);
      }
      return;
    }

    const nameTrim = fullName.trim();
    const cpfClean = cpfDigitsOnly(cpf);
    if (!nameTrim) {
      setError('Informe o nome completo.');
      return;
    }
    if (cpfClean.length !== 11 || !isValidCpf(cpfClean)) {
      setError('CPF inválido. Verifique os 11 dígitos.');
      return;
    }
    if (!trimmedEmail || !password) {
      setError('Preencha email e palavra-passe.');
      return;
    }

    setBusy(true);
    try {
      const { error: err } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: nameTrim,
            cpf: cpfClean,
          },
        },
      });
      if (err) setError(err.message);
      else {
        setInfo(
          'Conta criada. Se o projeto exigir confirmação por email, verifique a caixa de entrada.'
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setShowPassword(false);
    setError(null);
    setInfo(null);
    if (next === 'signin') {
      setFullName('');
      setCpf('');
    }
  };

  const title = mode === 'signin' ? 'Iniciar sessão' : 'Criar conta';
  const subtitle =
    mode === 'signin'
      ? 'Entre com o seu email e palavra-passe.'
      : 'Preencha os seus dados para criar a conta.';

  return (
    <AuthShell>
      <AuthHeroBand />

      <AuthSheet title={title} subtitle={subtitle}>
        <AuthForm onSubmit={(e) => void onSubmit(e)}>
          {mode === 'signup' && (
            <>
              <AuthTextField
                id="auth-fullname"
                label="Nome completo"
                type="text"
                autoComplete="name"
                placeholder="Insira o seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={busy}
              />
              <AuthTextField
                id="auth-cpf"
                label="CPF"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCpfDisplay(e.target.value))}
                disabled={busy}
                maxLength={14}
              />
            </>
          )}

          <AuthTextField
            id="auth-email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="nome@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
          <AuthPasswordField
            id="auth-password"
            label="Senha"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            visible={showPassword}
            onToggleVisible={() => setShowPassword((v) => !v)}
          />

          {mode === 'signin' && (
            <AuthSignInExtras
              remember={remember}
              onRememberChange={setRemember}
              disabled={busy}
              onForgotPassword={() =>
                setInfo(
                  'Recuperação de palavra-passe: use o fluxo de email do Supabase (Authentication) ou contacte o administrador.'
                )
              }
            />
          )}

          <AuthSubmitButton disabled={busy}>
            {busy ? 'A aguardar…' : mode === 'signin' ? 'Entrar' : 'Registar'}
          </AuthSubmitButton>
        </AuthForm>

        <AuthFeedback error={error} info={info} />

        <AuthModeFooter mode={mode} busy={busy} onSwitchMode={switchMode} />
      </AuthSheet>
    </AuthShell>
  );
}
