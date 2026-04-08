import type { FormEventHandler, ReactNode } from 'react';
import { Form } from './AuthForm.styles';

type Props = {
  children: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function AuthForm({ children, onSubmit }: Props) {
  return <Form onSubmit={onSubmit}>{children}</Form>;
}
