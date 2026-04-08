import type { ReactNode } from 'react';
import { CardSubtitle, CardTitle, SheetCard, SheetOverlap } from './AuthSheet.styles';

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthSheet({ title, subtitle, children }: Props) {
  return (
    <SheetOverlap>
      <SheetCard>
        <CardTitle>{title}</CardTitle>
        <CardSubtitle>{subtitle}</CardSubtitle>
        {children}
      </SheetCard>
    </SheetOverlap>
  );
}
