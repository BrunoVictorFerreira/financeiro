import styled from 'styled-components';
import { authColors } from '../tokens';

export const FieldBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const FieldLabel = styled.label`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${authColors.textDark};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const FieldInput = styled.input`
  width: 100%;
  padding: 0.85rem 1rem;
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
