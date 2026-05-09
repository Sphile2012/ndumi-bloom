/**
 * Netlify Function: users
 * GET    /.netlify/functions/users          - list all users (admin only)
 * POST   /.netlify/functions/users          - create user (admin only)
 * PATCH  /.netlify/functions/users/:id      - update user role (admin only)
 * DELETE /.netlify/functions/users/:id      - delete user (admin only)
 *
 * Storage: Netlify Blobs
 */

import { getStore } from '@netlify/blobs';

const STORE = 'users';

function uid() {
  return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function json(body, status = 200) {
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

function getSegment(event) {
  const path = event.rawPath || event.path || '';
  const match = path.match(/\/users\/([^/?]+)/);
  return match ? match[1] : null;
}

function adminOk(event) {
  const headers = event.headers || {};
  const token = headers['x-admin-token'] || headers['X-Admin-Token'] || '';
  const expected = process.env.ADMIN_TOKEN || 'bloom2024';
  if (!process.env.ADMIN_TOKEN) return token.length > 0;
  return token === expected;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json({});
  if (!adminOk(event)) return json({ message: 'Unauthorized' }, 401);

  const store = getStore(STORE);
  const id = getSegment(event);
  const method = event.httpMethod;

  try {
    /* ── GET /users ──────────────────────────────────────────────────── */
    if (method === 'GET' && !id) {
      const { blobs } = await store.list();
      const rows = await Promise.all(
        blobs.map(({ key }) => store.get(key, { type: 'json' }).catch(() => null))
      );
      const list = rows
        .filter(Boolean)
        .sort((a, b) => {
          // admins first, then by name
          if (a.role === 'admin' && b.role !== 'admin') return -1;
          if (b.role === 'admin' && a.role !== 'admin') return 1;
          return (a.name || '').localeCompare(b.name || '');
        });
      return json(list);
    }

    /* ── POST /users ─────────────────────────────────────────────────── */
    if (method === 'POST' && !id) {
      const data = JSON.parse(event.body || '{}');
      if (!data.email?.trim()) return json({ message: 'email is required' }, 400);
      const user = {
        id: uid(),
        name: data.name || '',
        email: data.email.trim().toLowerCase(),
        role: data.role === 'admin' ? 'admin' : 'user',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      await store.setJSON(user.id, user);
      return json(user, 201);
    }

    /* ── PATCH /users/:id ────────────────────────────────────────────── */
    if (method === 'PATCH' && id) {
      const existing = await store.get(id, { type: 'json' });
      if (!existing) return json({ message: 'User not found' }, 404);
      const updates = JSON.parse(event.body || '{}');
      const updated = {
        ...existing,
        ...updates,
        id,
        updated_date: new Date().toISOString(),
      };
      await store.setJSON(id, updated);
      return json(updated);
    }

    /* ── DELETE /users/:id ───────────────────────────────────────────── */
    if (method === 'DELETE' && id) {
      await store.delete(id);
      return json({ success: true });
    }

    return json({ message: 'Method not allowed' }, 405);

  } catch (err) {
    console.error('[users fn]', err);
    return json({ message: err.message || 'Internal server error' }, 500);
  }
};
