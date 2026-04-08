import type { ExpenseCategory } from '../types/expenseCategory';

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

function normalizeForComparison(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export async function classifyExpenseCategoryWithChatGpt(input: {
  transcript: string;
  categories: ExpenseCategory[];
}): Promise<ExpenseCategory | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) return null;
  if (input.categories.length === 0) return null;

  const categoriesPrompt = input.categories
    .map((category) => `- ${category.name}: [${category.keys.join(', ')}]`)
    .join('\n');

  console.log('categoriesPrompt', categoriesPrompt);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'Você classifica gastos em categorias. Responda APENAS com o nome exato de uma categoria da lista.',
        },
        {
          role: 'user',
          content: `Fala do gasto: "${input.transcript}"\n\nCategorias disponíveis:\n${categoriesPrompt}\n\nResponda somente com o nome exato de uma categoria da lista.`,
        },
      ],
    }),
  });
  console.log('response', response);
  // if (!response.ok) return null;
  const data = (await response.json()) as OpenAIChatCompletionResponse;
  console.log('data', data);
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) return null;

  const normalizedRaw = normalizeForComparison(raw);
  return (
    input.categories.find((category) => normalizeForComparison(category.name) === normalizedRaw) ??
    null
  );
}
