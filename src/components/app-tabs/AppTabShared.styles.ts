import styled from 'styled-components';

export const Card = styled.section`
  border-radius: 14px;
  padding: 1.1rem 1rem;
  margin-bottom: 1rem;
`;

export const CardTitle = styled.h2`
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: ${(p) => p.theme.primary};
`;

export const Help = styled.p`
  margin: 0 0 1rem;
  font-size: 0.88rem;
  line-height: 1.45;
  color: ${(p) => p.theme.primary};
`;

export const Field = styled.input`
  width: 100%;
  padding: 0.75rem 0.85rem;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.secondary};
  color: ${(p) => p.theme.secondary};
  margin-bottom: 0.75rem;

  &:focus {
    outline: 2px solid ${(p) => p.theme.primary};
    outline-offset: 1px;
  }

  &::placeholder {
    color: ${(p) => p.theme.secondary};
  }
`;

export const SelectField = styled.select`
  width: 100%;
  padding: 0.75rem 0.85rem;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.secondary};
  color: ${(p) => p.theme.secondary};
  background: white;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  font-family: inherit;
  height: 50px;
  &:focus {
    outline: 2px solid ${(p) => p.theme.primary};
    outline-offset: 1px;
  }
`;

export const FieldRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
  flex-wrap: wrap;

  ${Field} {
    flex: 1;
    min-width: 120px;
    margin-bottom: 0;
  }

  ${SelectField} {
    flex: 1;
    min-width: 140px;
    margin-bottom: 0;
  }
`;

export const PrimaryButton = styled.button`
  width: 100%;
  padding: 0.85rem 1rem;
  border: none;
  border-radius: 11px;
  background: ${(p) => p.theme.primary};
  color: ${(p) => p.theme.secondary};
  font-weight: 600;
  font-size: 1rem;

  &:hover {
    background: ${(p) => p.theme.primary};
  }
`;

export const SecondaryButton = styled.button`
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.border};
  background: transparent;
  color: ${(p) => p.theme.text};
  font-weight: 500;
  font-size: 0.9rem;
`;

export const CancelButton = styled.button`
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.border};
  background: transparent;
  color: ${(p) => p.theme.primary};
  font-weight: 500;
  font-size: 0.9rem;
`;

export const VoiceButton = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 0.95rem 1rem;
  border: none;
  border-radius: 11px;
  background: ${(p) => (p.$active ? p.theme.secondary : p.theme.primary)};
  color: ${(p) => (p.$active ? 'white' : p.theme.secondary)};
  font-weight: 600;
  font-size: 1rem;
`;

export const SaldoCard = styled.div`
  text-align: center;
  padding: 1.35rem 1rem;
  margin-bottom: 1rem;
  border-radius: 16px;
`;

export const SaldoLabel = styled.p`
  margin: 0 0 0.35rem;
  font-size: 0.9rem;
  color: ${(p) => p.theme.primary};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

export const SaldoValor = styled.p`
  margin: 0;
  font-size: 2.1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: ${(p) => p.theme.primary};
`;

export const Meta = styled.p`
  margin: 0.75rem 0 0;
  font-size: 0.82rem;
  color: ${(p) => p.theme.primary};
`;

export const Indicator = styled.div`
  position: relative;
  height: 20px;
  width: min(310px, 100%);
  margin: 10px auto 0;
`;

export const TabIndicatorBalance = styled.div<{ $px: number | null }>`
  height: 20px;
  width: ${(p) => p.$px ?? 0}px;
  background-color: ${(p) => p.theme.primary};
  border-radius: 10px;
  position: absolute;
  left: 0;
  z-index: 3;
`;

export const TabIndicatorExpenses = styled.div<{
  $px: number | null;
  $base: number | null;
  $amountSpent: number | null;
}>`
  height: 20px;
  width: ${(p) => ((p.$base ?? 0) + (p.$px ?? 0))}px;
  background-color: ${(p) => p.theme.secondary};
  border-radius: 10px;
  position: absolute;
  left: 0;
  z-index: 2;

  &::after {
    content: "${(p) => p.$amountSpent}% Gasto";
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${(p) => p.theme.primary};
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    z-index: 3;
  }
`;

export const TabIndicatorGeneral = styled.div`
  height: 20px;
  width: 100%;
  background-color: ${(p) => p.theme.muted};
  border-radius: 10px;
  position: absolute;
  left: 0;
  z-index: 1;
`;

export const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  color: ${(p) => p.theme.primary};
`;

export const Li = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  margin-bottom: 5px;
  border-radius: 10px;
  max-height: 100px;
`;

export const Amount = styled.div`
  font-weight: 700;
  font-size: 1.05rem;
  color: ${(p) => p.theme.primary};
`;

export const Transcript = styled.div`
  font-size: 0.82rem;
  color: ${(p) => p.theme.primary};
  margin-top: 0.2rem;
  word-break: break-word;
`;

export const Time = styled.div`
  font-size: 0.6rem;
  color: ${(p) => p.theme.primary};
  margin-top: 0.25rem;
`;

export const Toolbar = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.5rem;
`;

export const GhostButton = styled.button`
  padding: 1rem 0.5rem;
  border: none;
  background: transparent;
  color: ${(p) => p.theme.primary};
  font-size: 0.85rem;
`;

export const SelectButton = styled.button`
  padding: 5px;
  border: none;
  background: ${(p) => p.theme.primary};
  color: white;
  font-size: 0.4rem;
  border-radius: 100%;
`;

export const LocationPreview = styled.div`
  margin-top: 0.45rem;
  border: 1px solid ${(p) => p.theme.border};
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
`;

export const LocationModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(2, 52, 85, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

/** Acima do mapa de localização para o formulário de edição não ficar por baixo. */
export const EditModalOverlay = styled(LocationModalOverlay)`
  z-index: 85;
`;

/** Detalhe do gasto (lista); abaixo do modal de edição. */
export const DetailModalOverlay = styled(LocationModalOverlay)`
  z-index: 82;
`;

export const DetailModalCard = styled.div`
  position: relative;
  width: min(480px, calc(100vw - 1.5rem));
  max-height: min(90dvh, 720px);
  overflow-y: auto;
  border-radius: 16px;
  padding: 1.35rem 1.1rem 1.1rem;
  background: white;
  box-shadow: 0 14px 50px rgba(0, 0, 0, 0.35);
`;

export const DetailSection = styled.div`
  margin-bottom: 0.9rem;
`;

export const DetailLabel = styled.div`
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${(p) => p.theme.primary};
  margin-bottom: 0.25rem;
  font-weight: 600;
`;

export const DetailValue = styled.div`
  font-size: 0.95rem;
  color: ${(p) => p.theme.primary};
  word-break: break-word;
  line-height: 1.4;
`;

/** Vista de mapa a ocupar o cartão do modal de detalhes (largura maior que a ficha). */
export const DetailModalCardMap = styled.div`
  position: relative;
  width: min(960px, calc(100vw - 1.5rem));
  height: min(86dvh, 760px);
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  background: white !important;
  box-shadow: 0 14px 50px rgba(0, 0, 0, 0.35);
`;

export const DetailMapHeader = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.65rem;
  background: white;
`;

export const DetailMapBody = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  background: #e8eef2;
`;

export const DetailMapIframe = styled.iframe`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
`;

export const CloseRoundButton = styled.button`
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border: none;
  border-radius: 999px;
  background: rgba(2, 52, 85, 0.9);
  color: #fff;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
`;

export const FormModalCard = styled.div`
  position: relative;
  width: min(420px, calc(100vw - 1.5rem));
  max-height: min(88dvh, 560px);
  overflow-y: auto;
  border-radius: 16px;
  padding: 1.35rem 1.1rem 1.1rem;
  background: ${(p) => p.theme.secondary};
  border: 1px solid ${(p) => p.theme.secondary};
  box-shadow: 0 14px 50px rgba(0, 0, 0, 0.35);
`;

export const FormModalTitle = styled.h3`
  margin: 0 0 1rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: ${(p) => p.theme.primary};
  padding-right: 2rem;
`;

export const EditedHint = styled.span`
  display: inline-block;
  margin-top: 0.25rem;
  font-size: 0.72rem;
  font-style: italic;
  background: #dbe7fc;
  padding: 2px 5px;
  border-radius: 10px;
  color: ${(p) => p.theme.primary};
  font-weight: 700;
  margin-left: 20px;
`;

export const RowActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: 100px;
`;

export const LocationModalCard = styled.div`
  position: relative;
  width: min(960px, calc(100vw - 1.5rem));
  height: min(86dvh, 760px);
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  border: 1px solid ${(p) => p.theme.border};
  box-shadow: 0 14px 50px rgba(0, 0, 0, 0.35);
`;

export const LocationModalClose = styled.button`
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  z-index: 2;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: rgba(2, 52, 85, 0.9);
  color: #fff;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
`;

export const LocationFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
`;

export const LocationMeta = styled.p`
  margin: 0;
  padding: 0.5rem 0.65rem;
  font-size: 0.72rem;
  color: ${(p) => p.theme.primary};
  background: white;
`;

export const Muted = styled.p`
  margin: 0;
  font-size: 0.88rem;
  color: ${(p) => p.theme.textMuted};
`;

export const TextPrimary = styled.p`
  margin: 0;
  font-size: 0.88rem;
  color: ${(p) => p.theme.primary};
`;

export const ReminderLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  cursor: pointer;
  font-size: 0.95rem;
  line-height: 1.4;
  color: ${(p) => p.theme.text};
`;

export const ReminderCheckbox = styled.input`
  margin-top: 0.2rem;
  width: 1.1rem;
  height: 1.1rem;
  accent-color: ${(p) => p.theme.accent};
  flex-shrink: 0;
`;

export const UserEmail = styled.span`
  font-size: 0.78rem;
  color: rgba(253, 247, 223, 0.85);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const SignOutButton = styled.button`
  padding: 0.4rem 0.65rem;
  border-radius: 8px;
  border: 1px solid rgba(253, 247, 223, 0.35);
  background: transparent;
  color: #fdf7df;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
`;

export const SignOutWide = styled.button`
  width: 100%;
  padding: 0.85rem 1rem;
  border: none;
  border-radius: 11px;
  background: ${(p) => p.theme.primary};
  color: ${(p) => p.theme.secondary};
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
`;

export const Toast = styled.div<{ $aboveNav: boolean }>`
  position: fixed;
  bottom: ${(p) =>
    p.$aboveNav ? 'calc(5.85rem + env(safe-area-inset-bottom, 0px))' : '1rem'};
  left: 50%;
  transform: translateX(-50%);
  max-width: min(420px, calc(100% - 2rem));
  padding: 0.65rem 1rem;
  border-radius: 10px;
  background: #1a2e22;
  border: 1px solid ${(p) => p.theme.border};
  color: ${(p) => p.theme.warning};
  font-size: 0.88rem;
  z-index: 50;
`;

export const ProfileImage = styled.img`
  margin: auto;
  margin-bottom: 10px;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
  display: block;
  flex-shrink: 0;
`;

export const ProfileName = styled.span`
    text-align: center;
    display: block;
    font-size: 1.2rem; 
    font-weight: bold;
    color: ${(p) => p.theme.primary};
`;

export const ProfileCPF = styled.span`
    text-align: center;
    display: block;
    font-size: 0.8rem;
    color: ${(p) => p.theme.secondary};
`;

export const ListProfile = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: ${(p) => p.theme.primary};
  font-weight: 500;
`;

export const ItemListProfile = styled.span`
  flex: 1;
  width: 100%;
  padding: 20px;
  cursor: pointer;
  box-shadow: 0 0 100px 0 rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  span {
    float: right;
  }
`;

/** Segmented control (estilo cápsula): fundo escuro, opção ativa em destaque claro. */
export const SegmentedTrack = styled.div`
  display: flex;
  width: 100%;
  padding: 4px;
  border-radius: 999px;
  background: ${(p) => p.theme.primary};
  margin-bottom: 1rem;
  box-sizing: border-box;
`;

export const SegmentedOption = styled.button<{ $active: boolean }>`
  flex: 1;
  border: none;
  border-radius: 999px;
  padding: 0.55rem 0.65rem;
  font-size: 0.88rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease;
  background: ${(p) => (p.$active ? p.theme.secondary : 'transparent')};
  color: ${(p) => (p.$active ? p.theme.primary : p.theme.secondary)};

  &:focus-visible {
    outline: 2px solid ${(p) => p.theme.accent};
    outline-offset: 2px;
  }
`;