import { upsertUserSettings } from './settingsApi';

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_DATA_URL_CHARS = 3_500_000;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Não foi possível ler o ficheiro.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converte a imagem em data URL (`data:image/...;base64,...`) e grava em `user_settings.avatar_data`.
 * Requer coluna `avatar_data` tipo `text` (ver README).
 */
export async function saveProfileAvatarFromFile(
  userId: string,
  file: File
): Promise<{ dataUrl: string | null; error: string | null }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { dataUrl: null, error: 'Use uma imagem JPEG, PNG, GIF ou WebP.' };
  }
  if (file.size > MAX_BYTES) {
    return { dataUrl: null, error: 'A imagem deve ter no máximo 2 MB.' };
  }

  let dataUrl: string;
  try {
    dataUrl = await readFileAsDataUrl(file);
  } catch {
    return { dataUrl: null, error: 'Não foi possível ler o ficheiro.' };
  }

  if (dataUrl.length > MAX_DATA_URL_CHARS) {
    return { dataUrl: null, error: 'Imagem demasiado grande após codificação.' };
  }

  const { error } = await upsertUserSettings(userId, { avatar_data: dataUrl });
  if (error) {
    return { dataUrl: null, error };
  }

  return { dataUrl, error: null };
}
