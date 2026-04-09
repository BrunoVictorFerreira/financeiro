import { ExpenseCategoriesCrud } from './ExpenseCategoriesCrud';

type Props = {
  userId: string;
  onFeedback?: (message: string) => void;
  /** Chamado após criar, editar ou remover uma categoria (atualiza listas noutras abas). */
  onCategoriesChanged?: () => void;
};

export function CategoriesTab({ userId, onFeedback, onCategoriesChanged }: Props) {
  return (
    <ExpenseCategoriesCrud
      userId={userId}
      onFeedback={onFeedback}
      onCategoriesChanged={onCategoriesChanged}
    />
  );
}
