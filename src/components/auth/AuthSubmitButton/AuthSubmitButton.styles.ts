import styled from 'styled-components';
import { authColors } from '../tokens';

export const PrimaryButton = styled.button`
  width: 100%;
  margin-top: 0.35rem;
  padding: 0.95rem 1rem;
  border: none;
  border-radius: 14px;
  background: ${authColors.primary};
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(2, 52, 85, 0.35);

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;
