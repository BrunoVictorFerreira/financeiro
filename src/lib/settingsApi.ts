import { supabase } from './supabaseClient';

/** Tabela `user_settings` — ver README. */
export type UserSettingsRow = {
  user_id: string;
  daily_reminder_enabled: boolean;
  last_daily_reminder_shown_day: string | null;
  updated_at: string | null;
};

export async function fetchUserSettings(userId: string): Promise<UserSettingsRow | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('user_id, daily_reminder_enabled, last_daily_reminder_shown_day, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as UserSettingsRow;
}

export async function upsertUserSettings(
  userId: string,
  patch: Partial<Pick<UserSettingsRow, 'daily_reminder_enabled' | 'last_daily_reminder_shown_day'>>
): Promise<{ error: string | null }> {
  const existing = await fetchUserSettings(userId);
  const row: Record<string, unknown> = {
    user_id: userId,
    daily_reminder_enabled: patch.daily_reminder_enabled ?? existing?.daily_reminder_enabled ?? false,
    last_daily_reminder_shown_day:
      patch.last_daily_reminder_shown_day !== undefined
        ? patch.last_daily_reminder_shown_day
        : (existing?.last_daily_reminder_shown_day ?? null),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('user_settings').upsert(row, { onConflict: 'user_id' });
  return { error: error?.message ?? null };
}
