import { useEffect, useState } from 'react';
import { IconEdit, IconTrash } from '../auth/icons/General';
import type { ExpenseCategory } from '../../types/expenseCategory';
import {
  createExpenseCategoryInSupabase,
  deleteExpenseCategoryFromSupabase,
  readExpenseCategoriesByUserFromSupabase,
  updateExpenseCategoryInSupabase,
} from '../../lib/expenseCategoriesApi';
import {
  Amount,
  Card,
  CardTitle,
  EditModalOverlay,
  Field,
  FormModalCard,
  FormModalTitle,
  GhostButton,
  Help,
  Li,
  List,
  LocationModalClose,
  Muted,
  PrimaryButton,
  RowActions,
  SelectButton,
  Toolbar,
  CancelButton,
  EditedHint,
} from './AppTabShared.styles';

type Props = {
  userId: string;
  onFeedback?: (message: string) => void;
  onCategoriesChanged?: () => void;
};

export function ExpenseCategoriesCrud({ userId, onFeedback, onCategoriesChanged }: Props) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
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

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setNameInput('');
    setKeyInput('');
  };

  const openAddModal = () => {
    setEditingId(null);
    setNameInput('');
    setKeyInput('');
    setModalOpen(true);
  };

  const openEditModal = (category: ExpenseCategory) => {
    setEditingId(category.id);
    setNameInput(category.name);
    setKeyInput(category.keys.join(', '));
    setModalOpen(true);
  };

  const handleModalSubmit = async () => {
    const name = nameInput.trim();
    if (!name) {
      onFeedback?.('Informe o nome da categoria.');
      return;
    }

    setLoading(true);
    if (editingId == null) {
      const { error } = await createExpenseCategoryInSupabase({
        userId,
        name,
        keysCsv: keyInput,
      });
      if (error) {
        setLoading(false);
        onFeedback?.(error);
        return;
      }
      await reload();
      onCategoriesChanged?.();
      closeModal();
      onFeedback?.('Categoria criada.');
      setLoading(false);
      return;
    }

    const { error } = await updateExpenseCategoryInSupabase({
      id: editingId,
      userId,
      name,
      keysCsv: keyInput,
    });
    if (error) {
      setLoading(false);
      onFeedback?.(error);
      return;
    }
    await reload();
    onCategoriesChanged?.();
    closeModal();
    onFeedback?.('Categoria atualizada.');
    setLoading(false);
  };

  const onDelete = async (category: ExpenseCategory) => {
    const { error } = await deleteExpenseCategoryFromSupabase({ id: category.id, userId });
    if (error) {
      onFeedback?.(error);
      return;
    }
    await reload();
    onCategoriesChanged?.();
    if (editingId === category.id) {
      closeModal();
    }
    onFeedback?.('Categoria removida.');
  };

  return (
    <>
      <Card>
        <CardTitle>Categorias</CardTitle>
        {categories.length === 0 ? (
          <Muted>Nenhuma categoria cadastrada.</Muted>
        ) : (
          <List>
            {categories.map((category) => (
              <Li key={category.id}>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <Amount>{category.name}</Amount>
                  {category.keys.length > 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.35rem',
                        marginTop: '0.35rem',
                        alignItems: 'center',
                      }}
                    >
                      {category.keys.map((key, i) => (
                        <EditedHint
                          key={`${category.id}-key-${i}-${key}`}
                          style={{ marginLeft: 0, marginTop: 0 }}
                        >
                          {key}
                        </EditedHint>
                      ))}
                    </div>
                  ) : null}
                </div>
                <RowActions onClick={(e) => e.stopPropagation()}>
                  <SelectButton type="button" onClick={() => openEditModal(category)} aria-label="Editar categoria">
                    <IconEdit />
                  </SelectButton>
                  <GhostButton type="button" onClick={() => void onDelete(category)} aria-label="Excluir categoria">
                    <IconTrash />
                  </GhostButton>
                </RowActions>
              </Li>
            ))}
          </List>
        )}
        <Toolbar>
          <PrimaryButton type="button" onClick={openAddModal}>
            Adicionar categoria
          </PrimaryButton>
        </Toolbar>
      </Card>

      {modalOpen && (
        <EditModalOverlay
          role="dialog"
          aria-modal="true"
          aria-label={editingId == null ? 'Nova categoria' : 'Editar categoria'}
          onClick={closeModal}
        >
          <FormModalCard onClick={(e) => e.stopPropagation()}>
            <LocationModalClose type="button" aria-label="Fechar" onClick={closeModal}>
              ×
            </LocationModalClose>
            <FormModalTitle>{editingId == null ? 'Nova categoria' : 'Editar categoria'}</FormModalTitle>
            <Help style={{ marginBottom: '0.85rem' }}>
              Nome e uma ou mais keys separadas por vírgula (usadas na classificação por voz).
            </Help>
            <Field
              type="text"
              placeholder="Nome (ex.: Alimentação)"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            <Field
              type="text"
              placeholder="Keys (ex.: alimentacao, mercado, comida)"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              <CancelButton type="button" onClick={closeModal}>
                Cancelar
              </CancelButton>
              <PrimaryButton
                type="button"
                onClick={() => void handleModalSubmit()}
                disabled={loading}
                style={{ flex: 1, minWidth: '140px' }}
              >
                {loading ? 'A guardar…' : editingId == null ? 'Adicionar' : 'Guardar'}
              </PrimaryButton>
            </div>
          </FormModalCard>
        </EditModalOverlay>
      )}
    </>
  );
}
