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
  // Check query params first (Netlify Functions don't support sub-path routing)
  const qs = event.queryStringParameters || {};
  if (qs.id) return qs.id;
  // Fallback: try path-based ID extraction
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
  if (event.httpMethod === 'OPTIONS') {
    return respond({});
  }

  const method = event.httpMethod;
  const id = getId(event);

  try {
    // Validate Supabase configuration
    const supabase = getSupabase();

    if (method === 'GET' && !id) {
      const qs = event.queryStringParameters || {};
      let query = supabase.from('bookings').select('*').order('preferred_date', { ascending: false });
      // Apply filters from query params (skip 'id' as it's used for entity routing)
      Object.entries(qs).forEach(([k, v]) => {
        if (k !== 'id') query = query.eq(k, v);
      });
      const { data, error } = await query;
      if (error) {
        console.error('[bookings] GET error:', error.message);
        throw error;
      }
      // Always return an array, even if empty
      return respond(Array.isArray(data) ? data : []);
    }

    if (method === 'POST' && !id) {
      const body = event.body || '{}';
      let data;
      try {
        data = JSON.parse(body);
      } catch (parseError) {
        console.error('[bookings] POST JSON parse error:', parseError.message);
        return respond({ message: 'Invalid JSON in request body' }, 400);
      }
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
      if (error) {
        console.error('[bookings] POST insert error:', error.message);
        throw error;
      }
      return respond(created, 201);
    }

    if (method === 'PATCH' && id) {
      if (!isAdmin(event)) return respond({ message: 'Unauthorized' }, 401);
      const body = event.body || '{}';
      let updates;
      try {
        updates = JSON.parse(body);
      } catch (parseError) {
        console.error('[bookings] PATCH JSON parse error:', parseError.message);
        return respond({ message: 'Invalid JSON in request body' }, 400);
      }
      const { data: updated, error } = await supabase
        .from('bookings')
        .update({ ...updates, updated_date: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('[bookings] PATCH update error:', error.message);
        throw error;
      }
      return respond(updated);
    }

    if (method === 'DELETE' && id) {
      if (!isAdmin(event)) return respond({ message: 'Unauthorized' }, 401);
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) {
        console.error('[bookings] DELETE error:', error.message);
        throw error;
      }
      return respond({ success: true });
    }

    return respond({ message: 'Method not allowed' }, 405);

  } catch (err) {
    console.error('[bookings] handler error:', err.message, err);
    const errorMessage = err.message || 'Internal server error';
    // Provide more specific error messages for common issues
    if (errorMessage.includes('env vars') || errorMessage.includes('SUPABASE')) {
      return respond({ message: 'Server configuration error: Supabase environment variables are not set.' }, 500);
    }
    return respond({ message: errorMessage }, 500);
  }
};
