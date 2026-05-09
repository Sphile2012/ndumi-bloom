import { createClient } from '@supabase/supabase-js';

function uid() {
  return `bk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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
  const path = event.rawPath || event.path || '';
  const match = path.match(/\/bookings\/([^/?#]+)/);
  return match ? match[1] : null;
}

function isAdmin(event) {
  const h = event.headers || {};
  const token = h['x-admin-token'] || h['X-Admin-Token'] || '';
  const expected = process.env.ADMIN_TOKEN || '';
  if (!expected) return token.length > 0;
  return token === expected;
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');
  return createClient(url, key);
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return respond({});

  const method = event.httpMethod;
  const id = getId(event);

  try {
    const supabase = getSupabase();

    if (method === 'GET' && !id) {
      const qs = event.queryStringParameters || {};
      let query = supabase.from('bookings').select('*').order('preferred_date', { ascending: false });
      Object.entries(qs).forEach(([k, v]) => { query = query.eq(k, v); });
      const { data, error } = await query;
      if (error) throw error;
      return respond(data || []);
    }

    if (method === 'POST' && !id) {
      const data = JSON.parse(event.body || '{}');
      if (!data.client_name?.trim() || !data.client_phone?.trim()) {
        return respond({ message: 'client_name and client_phone are required' }, 400);
      }
      const booking = {
        ...data,
        id: uid(),
        status: data.status || 'pending',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      const { data: created, error } = await supabase.from('bookings').insert(booking).select().single();
      if (error) throw error;
      return respond(created, 201);
    }

    if (method === 'PATCH' && id) {
      if (!isAdmin(event)) return respond({ message: 'Unauthorized' }, 401);
      const updates = JSON.parse(event.body || '{}');
      const { data: updated, error } = await supabase
        .from('bookings')
        .update({ ...updates, updated_date: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return respond(updated);
    }

    if (method === 'DELETE' && id) {
      if (!isAdmin(event)) return respond({ message: 'Unauthorized' }, 401);
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
      return respond({ success: true });
    }

    return respond({ message: 'Method not allowed' }, 405);

  } catch (err) {
    console.error('[bookings]', err.message);
    return respond({ message: err.message || 'Internal server error' }, 500);
  }
};
