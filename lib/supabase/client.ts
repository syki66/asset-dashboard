import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);

let supabaseBrowserClient: SupabaseClient | undefined;

export const getSupabaseBrowserClient = () => {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createClient(
      supabaseUrl,
      supabasePublishableKey,
      {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      },
    );
  }

  return supabaseBrowserClient;
};
