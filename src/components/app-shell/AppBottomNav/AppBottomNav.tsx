import type { MainTab } from '../mainTab';
import {
  FabAnchor,
  FabButton,
  NavBar,
  NavSide,
  NavWrap,
  TabButton,
  TabLabel,
} from './AppBottomNav.styles';
import { IconChart, IconHome, IconMic, IconPlus, IconUser } from './AppBottomNav.icons';

export type AppBottomNavProps = {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onMicPress: () => void;
  micActive: boolean;
};

export function AppBottomNav({ activeTab, onTabChange, onMicPress, micActive }: AppBottomNavProps) {
  return (
    <NavWrap>
      <NavBar aria-label="Navegação principal">
        <NavSide>
          <TabButton
            type="button"
            $active={activeTab === 'home'}
            onClick={() => onTabChange('home')}
            aria-current={activeTab === 'home' ? 'page' : undefined}
          >
            <IconHome />
            <TabLabel>Início</TabLabel>
          </TabButton>
          <TabButton
            type="button"
            $active={activeTab === 'create'}
            onClick={() => onTabChange('create')}
            aria-current={activeTab === 'create' ? 'page' : undefined}
          >
            <IconPlus />
            <TabLabel>Criar</TabLabel>
          </TabButton>
        {/* </NavSide> */}

        <FabAnchor>
          <FabButton
            type="button"
            $active={micActive}
            aria-label={micActive ? 'A ouvir… toque para cancelar' : 'Falar um gasto'}
            onClick={onMicPress}
          >
            <IconMic />
          </FabButton>
        </FabAnchor>

        {/* <NavSide $end> */}
          <TabButton
            type="button"
            $active={activeTab === 'reports'}
            onClick={() => onTabChange('reports')}
            aria-current={activeTab === 'reports' ? 'page' : undefined}
          >
            <IconChart />
            <TabLabel>Relatórios</TabLabel>
          </TabButton>
          <TabButton
            type="button"
            $active={activeTab === 'profile'}
            onClick={() => onTabChange('profile')}
            aria-current={activeTab === 'profile' ? 'page' : undefined}
          >
            <IconUser />
            <TabLabel>Perfil</TabLabel>
          </TabButton>
        </NavSide>
      </NavBar>
    </NavWrap>
  );
}
