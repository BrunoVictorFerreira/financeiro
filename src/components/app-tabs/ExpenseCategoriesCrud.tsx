import { useEffect, useState } from 'react';
import type { ExpenseCategory } from '../../types/expenseCategory';
import {
  createExpenseCategoryInSupabase,
  deleteExpenseCategoryFromSupabase,
  readExpenseCategoriesByUserFromSupabase,
  updateExpenseCategoryInSupabase,
} from '../../lib/expenseCategoriesApi';
import {
  Card,
  CardTitle,
  Field,
  FieldRow,
  GhostButton,
  Help,
  List,
  Li,
  Muted,
  PrimaryButton,
} from './AppTabShared.styles';

type Props = {
  userId: string;
  onFeedback?: (message: string) => void;
};

export function ExpenseCategoriesCrud({ userId, onFeedback }: Props) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void reload();
  }, [userId]);

  const reload = async () => {
    const { categories: rows, error } = await readExpenseCategoriesByUserFromSupabase(userId);
    if (error) {
      onFeedback?.(`Erro ao carregar categorias: ${error}`);
      return;
    }
    setCategories(rows);
  };

  const resetForm = () => {
    setEditingId(null);
    setNameInput('');
    setKeyInput('');
  };

  const onSubmit = async () => {
    setLoading(true);
    if (editingId == null) {
      const { error } = await createExpenseCategoryInSupabase({
        userId,
        name: nameInput,
        keysCsv: keyInput,
      });
      if (error) {
        setLoading(false);
        onFeedback?.(error);
        return;
      }
      await reload();
      resetForm();
      onFeedback?.('Categoria criada.');
      setLoading(false);
      return;
    }

    const { error } = await updateExpenseCategoryInSupabase({
      id: editingId,
      userId,
      name: nameInput,
      keysCsv: keyInput,
    });
    if (error) {
      setLoading(false);
      onFeedback?.(error);
      return;
    }
    await reload();
    resetForm();
    onFeedback?.('Categoria atualizada.');
    setLoading(false);
  };

  const onEdit = (category: ExpenseCategory) => {
    setEditingId(category.id);
    setNameInput(category.name);
    setKeyInput(category.keys.join(', '));
  };

  const onDelete = async (category: ExpenseCategory) => {
    const { error } = await deleteExpenseCategoryFromSupabase({ id: category.id, userId });
    if (error) {
      onFeedback?.(error);
      return;
    }
    await reload();
    if (editingId === category.id) resetForm();
    onFeedback?.('Categoria removida.');
  };

  return (
    <Card>
      <CardTitle>Categorias de gastos</CardTitle>
      <Help>Cadastre nome e uma ou mais keys separadas por vírgula.</Help>

      <Field
        type="text"
        placeholder="Nome da categoria (ex.: Alimentação)"
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
      />
      <Field
        type="text"
        placeholder="Keys (ex.: alimentacao,mercado,comida)"
        value={keyInput}
        onChange={(e) => setKeyInput(e.target.value)}
      />
      <FieldRow>
        <PrimaryButton type="button" onClick={() => void onSubmit()} disabled={loading}>
          {editingId == null ? 'Adicionar categoria' : 'Salvar edição'}
        </PrimaryButton>
        {editingId != null && (
          <PrimaryButton type="button" onClick={resetForm}>
            Cancelar
          </PrimaryButton>
        )}
      </FieldRow>

      {categories.length === 0 ? (
        <Muted style={{ marginTop: '0.75rem' }}>Nenhuma categoria cadastrada.</Muted>
      ) : (
        <List>
          {categories.map((category) => (
            <Li key={category.id}>
              <div>
                <strong>{category.name}</strong>
                <Help style={{ margin: '0.2rem 0 0' }}>keys: {category.keys.join(', ')}</Help>
              </div>
              <div>
                <GhostButton type="button" onClick={() => onEdit(category)}>
                  Editar
                </GhostButton>
                <GhostButton type="button" onClick={() => onDelete(category)}>
                  Excluir
                </GhostButton>
              </div>
            </Li>
          ))}
        </List>
      )}
    </Card>
  );
}
