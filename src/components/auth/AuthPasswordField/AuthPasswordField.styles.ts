import styled from 'styled-components';
import { authColors } from '../tokens';

export { FieldBlock, FieldLabel } from '../AuthTextField/AuthTextField.styles';

export const PasswordWrap = styled.div`
  position: relative;
  display: flex;
  align-items: stretch;
`;

export const PasswordField = styled.input`
  width: 100%;
  padding: 0.85rem 3rem 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid ${authColors.creamBorder};
  background: #fff;
  color: ${authColors.textDark};
  font-size: 1rem;
  box-sizing: border-box;

  &::placeholder {
    color: #94a3b8;
  }

  &:focus {
    outline: 2px solid ${authColors.emerald};
    outline-offset: 0;
    border-color: ${authColors.emerald};
  }

  &:disabled {
    opacity: 0.65;
  }
`;

export const TogglePassword = styled.button`
  position: absolute;
  right: 0.35rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: ${authColors.primary};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(2, 52, 85, 0.08);
    color: ${authColors.primary};
  }

  &:focus-visible {
    outline: 2px solid ${authColors.primary};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
