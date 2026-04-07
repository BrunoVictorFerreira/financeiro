import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html {
    -webkit-text-size-adjust: 100%;
  }

  body {
    margin: 0;
    min-height: 100dvh;
    font-family: ${(p) => p.theme.font};
    background: ${(p) => p.theme.bg};
    color: ${(p) => p.theme.text};
  }

  #root {
    min-height: 100dvh;
  }

  button {
    font: inherit;
    cursor: pointer;
  }

  input {
    font: inherit;
  }
`;
