import { createClient } from '@supabase/supabase-js';

function uid() {
  return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function respond(body, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function getId(event) {
  // Check query params first (Netlify Functions don't support sub-path routing)
  const qs = event.queryStringParameters || {};
  if (qs.id) return qs.id;
  // Fallback: try path-based ID extraction
  const path = event.rawPath || event.path || '';
  const match = path.match(/\/users\/([^/?#]+)/);
  return match ? match[1] : null;
}

function isAdmin(event) {
  const h = event.headers || {};
  const token = h['x-admin-token'] || h['X-Admin-Token'] || '';
  const expected = process.env.ADMIN_TOKEN || process.env.VITE_ADMIN_PASSWORD || '';
  if (!expected) return token.length > 0;
  return token === expected;
}

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');
  return createClient(url, key);
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return respond({});

  const method = event.httpMethod;
  const id = getId(event);

  // Only require admin for write operations
  if (['POST', 'PATCH', 'DELETE'].includes(method) && !isAdmin(event)) {
    return respond({ message: 'Unauthorized' }, 401);
  }

  try {
    const supabase = getSupabase();

    if (method === 'GET' && !id) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('role', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return respond(data || []);
    }

    if (method === 'POST' && !id) {
      const body = JSON.parse(event.body || '{}');
      if (!body.email?.trim()) return respond({ message: 'email is required' }, 400);
      const user = {
        id: uid(),
        name: body.name || '',
        email: body.email.trim().toLowerCase(),
        role: body.role === 'admin' ? 'admin' : 'user',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      const { data, error } = await supabase.from('users').upsert(user, { onConflict: 'email' }).select().single();
      if (error) throw error;
      return respond(data, 201);
    }

    if (method === 'PATCH' && id) {
      const updates = JSON.parse(event.body || '{}');
      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_date: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return respond(data);
    }

    if (method === 'DELETE' && id) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      return respond({ success: true });
    }

    return respond({ message: 'Method not allowed' }, 405);

  } catch (err) {
    console.error('[users]', err.message);
    return respond({ message: err.message || 'Internal server error' }, 500);
  }
};
