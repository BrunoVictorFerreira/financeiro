import type { ReactNode } from 'react';
import { AppBottomNav } from '../AppBottomNav/AppBottomNav';
import type { AppMainHeaderProps } from '../AppMainHeader/AppMainHeader';
import { AppMainHeader } from '../AppMainHeader/AppMainHeader';
import type { MainTab } from '../mainTab';
import { LayoutRoot, MainScroll } from './AppShellLayout.styles';

export type AppShellLayoutProps = {
  header: AppMainHeaderProps;
  showHeader?: boolean;
  showBottomNav: boolean;
  activeTab?: MainTab;
  onTabChange?: (tab: MainTab) => void;
  onMicPress?: () => void;
  micActive?: boolean;
  children: ReactNode;
};

export function AppShellLayout({
  header,
  showHeader = true,
  showBottomNav,
  activeTab = 'home',
  onTabChange,
  onMicPress,
  micActive = false,
  children,
}: AppShellLayoutProps) {
  return (
    <LayoutRoot id="layout-root">
      {showHeader && <AppMainHeader {...header} />}
      <MainScroll $reserveNav={showBottomNav} $isProfileTab={activeTab === 'profile'}>
        {children}
      </MainScroll>
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
