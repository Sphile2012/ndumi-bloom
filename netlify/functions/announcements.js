import { createClient } from '@supabase/supabase-js';

function uid() {
  return `ann_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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
  const match = path.match(/\/announcements\/([^/?#]+)/);
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
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_SECRET_KEY;
  
  if (!url || (!key && !secretKey)) throw new Error('Supabase env vars not set');
  
  // Use secret key if available for admin operations, otherwise use anon key
  const clientKey = secretKey || key;
  return createClient(url, clientKey);
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return respond({});

  const method = event.httpMethod;
  const id = getId(event);

  try {
    const supabase = getSupabase();

    if (method === 'GET' && !id) {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_date', { ascending: false });
      if (error) throw error;
      return respond(data || []);
    }

    if (method === 'POST' && !id) {
      if (!isAdmin(event)) return respond({ message: 'Unauthorized' }, 401);
      const body = JSON.parse(event.body || '{}');
      if (!body.message?.trim()) return respond({ message: 'message is required' }, 400);
      const ann = {
        id: uid(),
        message: body.message.trim(),
        type: body.type || 'info',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      const { data, error } = await supabase.from('announcements').insert(ann).select().single();
      if (error) throw error;
      return respond(data, 201);
    }

    if (method === 'PATCH' && id) {
      if (!isAdmin(event)) return respond({ message: 'Unauthorized' }, 401);
      const updates = JSON.parse(event.body || '{}');
      const { data, error } = await supabase
        .from('announcements')
        .update({ ...updates, updated_date: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return respond(data);
    }

    if (method === 'DELETE' && id) {
      if (!isAdmin(event)) return respond({ message: 'Unauthorized' }, 401);
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      return respond({ success: true });
    }

    return respond({ message: 'Method not allowed' }, 405);

  } catch (err) {
    console.error('[announcements]', err.message);
    return respond({ message: err.message || 'Internal server error' }, 500);
  }
};
