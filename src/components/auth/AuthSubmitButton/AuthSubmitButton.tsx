import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { PrimaryButton } from './AuthSubmitButton.styles';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function AuthSubmitButton({ children, type = 'submit', ...rest }: Props) {
  return (
    <PrimaryButton type={type} {...rest}>
      {children}
    </PrimaryButton>
  );
}
