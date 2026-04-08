import type { InputHTMLAttributes } from 'react';
import { FieldBlock, FieldInput, FieldLabel } from './AuthTextField.styles';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id: string;
  label: string;
};

export function AuthTextField({ id, label, ...inputProps }: Props) {
  return (
    <FieldBlock>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <FieldInput id={id} {...inputProps} />
    </FieldBlock>
  );
}
