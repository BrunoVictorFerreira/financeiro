import styled from 'styled-components';
import { authColors } from '../tokens';

export const Err = styled.p`
  margin: 0.85rem 0 0;
  font-size: 0.88rem;
  color: #c2410c;
  line-height: 1.4;
`;

export const Info = styled.p`
  margin: 0.85rem 0 0;
  font-size: 0.88rem;
  color: ${authColors.textMuted};
  line-height: 1.45;
`;
