import styled from 'styled-components';
import { authColors } from '../tokens';

export const OptionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 0.75rem;
  margin-top: -0.15rem;
`;

export const RememberLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.86rem;
  color: ${authColors.textDark};
  cursor: pointer;
  user-select: none;
`;

export const Checkbox = styled.input`
  width: 1.05rem;
  height: 1.05rem;
  accent-color: ${authColors.emerald};
  cursor: pointer;
`;

export const GhostLink = styled.button`
  border: none;
  background: none;
  padding: 0;
  font-size: 0.86rem;
  font-weight: 600;
  color: ${authColors.emeraldDark};
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    color: ${authColors.emerald};
  }
`;
