import { Err, Info } from './AuthFeedback.styles';

type Props = {
  error: string | null;
  info: string | null;
};

export function AuthFeedback({ error, info }: Props) {
  return (
    <>
      {error && <Err role="alert">{error}</Err>}
      {info && <Info role="status">{info}</Info>}
    </>
  );
}
