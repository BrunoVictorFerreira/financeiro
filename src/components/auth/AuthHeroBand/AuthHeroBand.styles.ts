import styled from 'styled-components';

export const TopBand = styled.header`
  flex: 0 0 min(22vh, 220px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1.25rem 2.5rem;
  color: #fff;
`;

export const LogoImage = styled.img`
  max-height: 100px;
  max-width: 100px;
  object-fit: contain;
`;
