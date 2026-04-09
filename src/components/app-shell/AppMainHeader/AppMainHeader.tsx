import type { ReactNode } from 'react';
import { Band, HeaderAvatar, Subtitle, TextBlock, Title, Trailing } from './AppMainHeader.styles';

const DEFAULT_HEADER_AVATAR = '/financeiro/profile.jpeg';

export type AppMainHeaderProps = {
  title: string;
  subtitle: string;
  trailing?: ReactNode;
  /** Mesma foto da aba Perfil (`user_settings.avatar_data`); se vazio, usa a imagem por defeito. */
  avatarSrc?: string | null;
  /** Incrementar quando a foto mudar (ex.: `profileAvatarCacheKey` no App). */
  avatarKey?: number;
};

export function AppMainHeader({ title, subtitle, trailing, avatarSrc, avatarKey = 0 }: AppMainHeaderProps) {
  const src =
    avatarSrc != null && avatarSrc.trim() !== '' ? avatarSrc : DEFAULT_HEADER_AVATAR;

  return (
    <Band>
      <TextBlock>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flexShrink: 0, marginRight: '10px' }}>
            <HeaderAvatar key={avatarKey} src={src} alt="Foto de perfil" />
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
