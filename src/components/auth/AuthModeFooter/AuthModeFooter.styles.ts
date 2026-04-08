import styled from 'styled-components';
import { authColors } from '../tokens';

export const FooterBlock = styled.div`
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid ${authColors.creamBorder};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

export const FooterText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${authColors.textMuted};
`;

export const OutlineButton = styled.button`
  width: 100%;
  max-width: 280px;
  padding: 0.75rem 1.25rem;
  border-radius: 14px;
  border: 2px solid ${authColors.primary};
  background: transparent;
  color: ${authColors.primary};
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  font-family: inherit;

  &:hover:not(:disabled) {
    background: rgba(2, 52, 85, 0.06);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
