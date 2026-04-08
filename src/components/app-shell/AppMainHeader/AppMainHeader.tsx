import type { ReactNode } from 'react';
import { Band, Subtitle, TextBlock, Title, Trailing } from './AppMainHeader.styles';

export type AppMainHeaderProps = {
  title: string;
  subtitle: string;
  trailing?: ReactNode;
};

export function AppMainHeader({ title, subtitle, trailing }: AppMainHeaderProps) {
  return (
    <Band>
      <TextBlock>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, width: '40px', height: '40px', marginRight: '10px' }}>
            <img src="/financeiro/profile.jpeg" alt="Clara Wallet" width={40} height={40} style={{ borderRadius: '100%' }} />
          </div>
          <div style={{ flex: 10, display: 'flex', flexDirection: 'column' }}>
            <Title>{title}</Title>
            <Subtitle>{subtitle}</Subtitle>
          </div>
        </div>
      </TextBlock>
      {trailing != null && <Trailing>{trailing}</Trailing>}
    </Band>
  );
}
