import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import styled from 'styled-components';
import App from './App';
import Login from './Login';
import { supabase } from './lib/supabaseClient';

export default function Root() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!cancelled) {
        setSession(s);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <BootShell>
        <BootText>A verificar sessão…</BootText>
      </BootShell>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <App
      authEmail={session.user.email ?? null}
      onSignOut={() => void supabase.auth.signOut()}
    />
  );
}

const BootShell = styled.main`
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const BootText = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: ${(p) => p.theme.textMuted};
`;
