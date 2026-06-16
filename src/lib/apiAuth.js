import { createClient } from '@supabase/supabase-js';

export async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return { user: null, error: 'Oturum gerekli. Lutfen giris yapin.' };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { user: null, error: 'Gecersiz veya suresi dolmus oturum.' };
  }

  return { user: data.user, token };
}

export function unauthorizedResponse(message) {
  return Response.json({ success: false, error: message }, { status: 401 });
}
