import { getStore } from '@netlify/blobs';

const STORE = 'announcements';

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
  const path = event.rawPath || event.path || '';
  const match = path.match(/\/announcements\/([^/?#]+)/);
  return match ? match[1] : null;
}

function isAdmin(event) {
  const h = event.headers || {};
  const token = h['x-admin-token'] || h['X-Admin-Token'] || '';
  const expected = process.env.ADMIN_TOKEN || '';
  if (!expected) return token.length > 0;
  return token === expected;
}

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return respond({});

  const method = event.httpMethod;
  const id = getId(event);

  try {
    const store = getStore(STORE);

    if (method === 'GET' && !id) {
      const { blobs } = await store.list();
      const items = await Promise.all(
        blobs.map(({ key }) => store.get(key, { type: 'json' }).catch(() => null))
      );
      const list = items
        .filter(Boolean)
        .sort((a, b) => (b.created_date || '') > (a.created_date || '') ? 1 : -1);
      return respond(list);
    }

    if (method === 'POST' && !id) {
      if (!isAdmin(event)) return respond({ message: 'Unauthorized' }, 401);
      const data = JSON.parse(event.body || '{}');
      if (!data.message?.trim()) return respond({ message: 'message is required' }, 400);
      const ann = {
        id: uid(),
        message: data.message.trim(),
        type: data.type || 'info',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      await store.setJSON(ann.id, ann);
      return respond(ann, 201);
    }

    if (method === 'PATCH' && id) {
      if (!isAdmin(event)) return respond({ message: 'Unauthorized' }, 401);
      const existing = await store.get(id, { type: 'json' });
      if (!existing) return respond({ message: 'Not found' }, 404);
      const updates = JSON.parse(event.body || '{}');
      const updated = { ...existing, ...updates, id, updated_date: new Date().toISOString() };
      await store.setJSON(id, updated);
      return respond(updated);
    }

    if (method === 'DELETE' && id) {
      if (!isAdmin(event)) return respond({ message: 'Unauthorized' }, 401);
      await store.delete(id);
      return respond({ success: true });
    }

    return respond({ message: 'Method not allowed' }, 405);

  } catch (err) {
    console.error('[announcements]', err.message, err.stack);
    return respond({ message: err.message || 'Internal server error' }, 500);
  }
};
