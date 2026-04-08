import type { InputHTMLAttributes } from 'react';
import { IconEye, IconEyeOff } from '../icons/PasswordVisibilityIcons';
import { FieldBlock, FieldLabel, PasswordField, PasswordWrap, TogglePassword } from './AuthPasswordField.styles';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> & {
  id: string;
  label: string;
  visible: boolean;
  onToggleVisible: () => void;
};

export function AuthPasswordField({
  id,
  label,
  visible,
  onToggleVisible,
  disabled,
  ...inputProps
}: Props) {
  return (
    <FieldBlock>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <PasswordWrap>
        <PasswordField
          id={id}
          type={visible ? 'text' : 'password'}
          disabled={disabled}
          spellCheck={false}
          {...inputProps}
        />
        <TogglePassword
          type="button"
          disabled={disabled}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          onClick={onToggleVisible}
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </TogglePassword>
      </PasswordWrap>
    </FieldBlock>
  );
}
