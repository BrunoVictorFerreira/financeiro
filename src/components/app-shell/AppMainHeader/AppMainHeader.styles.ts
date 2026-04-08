import styled from 'styled-components';
import { claraColors } from '../../../theme/claraWallet';

export const Band = styled.header`
  flex-shrink: 0;
  padding: calc(1rem + env(safe-area-inset-top, 0px)) 1.25rem 1.35rem;
  background: linear-gradient(165deg, ${claraColors.primary} 0%, ${claraColors.primary} 100%);
  color: #fff;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem 1rem;
`;

export const TextBlock = styled.div`
  min-width: 0;
  flex: 1;
`;

export const Title = styled.label`
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  display: block;
`;

export const Subtitle = styled.label`
  font-size: .7rem;
  font-weight: 400;
  color: #fff;
`;

export const Trailing = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
`;
