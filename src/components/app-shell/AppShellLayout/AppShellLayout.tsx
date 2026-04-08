import type { ReactNode } from 'react';
import { AppBottomNav } from '../AppBottomNav/AppBottomNav';
import type { AppMainHeaderProps } from '../AppMainHeader/AppMainHeader';
import { AppMainHeader } from '../AppMainHeader/AppMainHeader';
import type { MainTab } from '../mainTab';
import { LayoutRoot, MainScroll } from './AppShellLayout.styles';

export type AppShellLayoutProps = {
  header: AppMainHeaderProps;
  showBottomNav: boolean;
  activeTab?: MainTab;
  onTabChange?: (tab: MainTab) => void;
  onMicPress?: () => void;
  micActive?: boolean;
  children: ReactNode;
};

export function AppShellLayout({
  header,
  showBottomNav,
  activeTab = 'home',
  onTabChange,
  onMicPress,
  micActive = false,
  children,
}: AppShellLayoutProps) {
  return (
    <LayoutRoot id="layout-root">
      <AppMainHeader {...header} />
      <MainScroll $reserveNav={showBottomNav}>{children}</MainScroll>
      {showBottomNav && onTabChange != null && onMicPress != null && (
        <AppBottomNav
          activeTab={activeTab}
          onTabChange={onTabChange}
          onMicPress={onMicPress}
          micActive={micActive}
        />
      )}
    </LayoutRoot>
  );
}
