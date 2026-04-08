import styled from 'styled-components';
import { authColors } from '../tokens';

export const SheetOverlap = styled.div`
  flex: 1;
  margin-top: -1.75rem;
  display: flex;
  flex-direction: column;
`;

export const SheetCard = styled.section`
  flex: 1;
  background: ${authColors.cream};
  border-radius: 28px 28px 0 0;
  padding: 1.75rem 1.35rem 2.25rem;
  box-shadow: 0 -12px 40px rgba(2, 52, 85, 0.18);
  min-height: min(68vh, 100%);
`;

export const CardTitle = styled.h1`
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: ${authColors.textDark};
  letter-spacing: -0.02em;
`;

export const CardSubtitle = styled.p`
  margin: 0.4rem 0 1.35rem;
  font-size: 0.88rem;
  color: ${authColors.textMuted};
  line-height: 1.45;
`;
