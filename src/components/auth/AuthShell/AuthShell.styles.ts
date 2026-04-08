import styled from 'styled-components';
import { authColors } from '../tokens';

export const Shell = styled.main`
  min-height: 100dvh;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background: ${authColors.primary};
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
`;
