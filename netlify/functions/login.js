import { createClient } from '@supabase/supabase-js';

function respond(body, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');
  return createClient(url, key);
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return respond({});
  if (event.httpMethod !== 'POST') return respond({ message: 'Method not allowed' }, 405);

  try {
    const { email } = JSON.parse(event.body || '{}');
    if (!email?.trim()) return respond({ message: 'Email is required' }, 400);

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !data) return respond({ message: 'This email is not registered.' }, 401);
    if (data.role !== 'admin') return respond({ message: 'Access denied. Admin accounts only.' }, 403);

    // Issue API token from server so production builds do not depend on VITE_ADMIN_PASSWORD.
    const token = process.env.ADMIN_TOKEN || '';
    return respond({ id: data.id, name: data.name, email: data.email, role: data.role, token });

  } catch (err) {
    console.error('[login]', err.message);
    return respond({ message: err.message || 'Internal server error' }, 500);
  }
};
