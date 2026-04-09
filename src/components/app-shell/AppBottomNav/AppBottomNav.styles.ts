import styled from 'styled-components';
import { claraColors } from '../../../theme/claraWallet';

export const NavWrap = styled.div`
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  z-index: 40;
  padding: 0 0.75rem calc(0.5rem + env(safe-area-inset-bottom, 0px));
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }
`;

export const NavBar = styled.nav`
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.25rem;
  min-height: 58px;
  padding: 0.65rem 0.5rem 0.55rem;
  background: #fff;
  border-radius: 22px 22px 18px 18px;
  box-shadow: 0 -4px 24px rgba(2, 52, 85, 0.12), 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid ${claraColors.creamBorder};
`;

export const NavSide = styled.div<{ $end?: boolean }>`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.35rem;
  flex: 1;
  min-width: 0;
`;

export const FabAnchor = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 3.9rem;
  display: flex;
  justify-content: center;
  align-items: flex-end;
`;

export const FabButton = styled.button<{ $active: boolean }>`
  position: absolute;
  bottom: 0.85rem;
  left: 50%;
  transform: translateX(-50%);
  width: 3.35rem;
  height: 3.35rem;
  border-radius: 50%;
  border: 3px solid #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    165deg,
    ${claraColors.primary} 0%,
    ${claraColors.primary} 100%
  );
  box-shadow: 0 6px 20px ${claraColors.primary};
  color: #fff;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateX(-50%) scale(1.04);
    box-shadow: 0 8px 26px ${claraColors.primary};
  }

  ${(p) =>
    p.$active &&
    `
    box-shadow: 0 0 0 2px ${claraColors.primary}, 0 6px 20px ${claraColors.primary};
  `}
`;

export const TabButton = styled.button<{ $active: boolean }>`
  flex: 0 1 3.35rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.2rem 0.25rem 0.05rem;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${(p) => (p.$active ? claraColors.primary : claraColors.textMuted)};

  &:hover {
    color: ${claraColors.primary};
  }
`;

export const TabLabel = styled.span`
  font-size: 0.52rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;
