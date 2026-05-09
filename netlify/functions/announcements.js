/**
 * Netlify Function: announcements
 * GET    /.netlify/functions/announcements
 * POST   /.netlify/functions/announcements
 * PATCH  /.netlify/functions/announcements/:id
 * DELETE /.netlify/functions/announcements/:id
 */

import { getStore } from '@netlify/blobs';

const STORE = 'announcements';

function uid() {
  return `ann_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function res(body, status = 200) {
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

/**
 * Extract the :id segment after the function name.
 * Works for both Netlify Functions v1 and v2 path formats.
 */
function getId(event) {
  const path = event.rawPath || event.path || '';
  // Match anything after /announcements/
  const match = path.match(/\/announcements\/([^/?]+)/);
  return match ? match[1] : null;
}

function adminOk(event) {
  const h = event.headers || {};
  const token = h['x-admin-token'] || h['X-Admin-Token'] || '';
  const expected = process.env.ADMIN_TOKEN || 'bloom2024';
  if (!process.env.ADMIN_TOKEN) return token.length > 0;
  return token === expected;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return res({});

  const store  = getStore(STORE);
  const id     = getId(event);
  const method = event.httpMethod;

  try {

    /* ── GET /announcements ──────────────────────────────────────────── */
    if (method === 'GET' && !id) {
      const { blobs } = await store.list();
      const rows = await Promise.all(
        blobs.map(({ key }) => store.get(key, { type: 'json' }).catch(() => null))
      );
      const list = rows
        .filter(Boolean)
        .sort((a, b) => (b.created_date || '') > (a.created_date || '') ? 1 : -1);
      return res(list);
    }

    /* ── POST /announcements ─────────────────────────────────────────── */
    if (method === 'POST' && !id) {
      if (!adminOk(event)) return res({ message: 'Unauthorized' }, 401);
      const data = JSON.parse(event.body || '{}');
      if (!data.message?.trim()) return res({ message: 'message is required' }, 400);
      const ann = {
        id: uid(),
        message: data.message.trim(),
        type: data.type || 'info',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      await store.setJSON(ann.id, ann);
      return res(ann, 201);
    }

    /* ── PATCH /announcements/:id ────────────────────────────────────── */
    if (method === 'PATCH' && id) {
      if (!adminOk(event)) return res({ message: 'Unauthorized' }, 401);
      const existing = await store.get(id, { type: 'json' });
      if (!existing) return res({ message: 'Not found' }, 404);
      const updates = JSON.parse(event.body || '{}');
      const updated = { ...existing, ...updates, id, updated_date: new Date().toISOString() };
      await store.setJSON(id, updated);
      return res(updated);
    }

    /* ── DELETE /announcements/:id ───────────────────────────────────── */
    if (method === 'DELETE' && id) {
      if (!adminOk(event)) return res({ message: 'Unauthorized' }, 401);
      await store.delete(id);
      return res({ success: true });
    }

    return res({ message: 'Method not allowed' }, 405);

  } catch (err) {
    console.error('[announcements]', err);
    return res({ message: err.message || 'Internal server error' }, 500);
  }
};
