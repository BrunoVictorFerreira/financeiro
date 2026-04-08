import type { ReactNode } from 'react';
import { Shell } from './AuthShell.styles';

type Props = { children: ReactNode };

export function AuthShell({ children }: Props) {
  return <Shell>{children}</Shell>;
}
