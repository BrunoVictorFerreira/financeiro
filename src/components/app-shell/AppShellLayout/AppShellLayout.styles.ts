import styled from 'styled-components';
import { claraColors } from '../../../theme/claraWallet';

export const LayoutRoot = styled.div`
  min-height: 100dvh;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background: ${claraColors.primary};
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  `;
  
export const MainScroll = styled.div<{ $reserveNav: boolean; $isProfileTab: boolean }>`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  background: ${claraColors.cream};
  border-radius: ${(p) => (p.$isProfileTab ? '0' : '40px 40px 0 0')};
  padding: 1rem 1rem
    ${(p) =>
      p.$reserveNav
        ? 'calc(5.75rem + env(safe-area-inset-bottom, 0px))'
        : '1.5rem'};
`;
