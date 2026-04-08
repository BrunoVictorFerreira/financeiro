import { LogoImage, TopBand } from './AuthHeroBand.styles';

type Props = {
  logoSrc?: string;
  logoAlt?: string;
};

export function AuthHeroBand({ logoSrc = './icon.png', logoAlt = 'Clara Wallet' }: Props) {
  return (
    <TopBand>
      <LogoImage src={logoSrc} alt={logoAlt} />
    </TopBand>
  );
}
