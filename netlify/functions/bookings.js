/**
 * Netlify Function: bookings
 * GET    /.netlify/functions/bookings          - list / filter bookings
 * POST   /.netlify/functions/bookings          - create booking (public)
 * PATCH  /.netlify/functions/bookings/:id      - update booking  (admin)
 * DELETE /.netlify/functions/bookings/:id      - delete booking  (admin)
 */

import { getStore } from '@netlify/blobs';

const STORE = 'bookings';

function uid() {
  return `bk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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

function getId(event) {
  const path = event.rawPath || event.path || '';
  const match = path.match(/\/bookings\/([^/?]+)/);
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

  const method = event.httpMethod;
  const id     = getId(event);

  let store;
  try {
    store = getStore(STORE);
  } catch (err) {
    console.error('[bookings] Failed to get store:', err);
    return res({ message: 'Storage unavailable. Please try again.' }, 503);
  }
  try {

    /* ── GET /bookings ─────────────────────────────────────────────── */
    if (method === 'GET' && !id) {
      const { blobs } = await store.list();
      const rows = await Promise.all(
        blobs.map(({ key }) => store.get(key, { type: 'json' }).catch(() => null))
      );
      let list = rows.filter(Boolean);

      const qs = event.queryStringParameters || {};
      if (Object.keys(qs).length) {
        list = list.filter(b =>
          Object.entries(qs).every(([k, v]) => String(b[k]) === String(v))
        );
      }

      list.sort((a, b) => {
        if (b.preferred_date !== a.preferred_date)
          return b.preferred_date > a.preferred_date ? 1 : -1;
        return (b.created_date || '') > (a.created_date || '') ? 1 : -1;
      });

      return res(list);
    }

    /* ── POST /bookings ────────────────────────────────────────────── */
    if (method === 'POST' && !id) {
      let data;
      try {
        data = JSON.parse(event.body || '{}');
      } catch {
        return res({ message: 'Invalid request body' }, 400);
      }

      if (!data.client_name?.trim() || !data.client_phone?.trim()) {
        return res({ message: 'client_name and client_phone are required' }, 400);
      }

      const booking = {
        ...data,
        id: uid(),
        status: data.status || 'pending',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };

      await store.setJSON(booking.id, booking);
      console.log('[bookings] Created:', booking.id);
      return res(booking, 201);
    }

    /* ── PATCH /bookings/:id ───────────────────────────────────────── */
    if (method === 'PATCH' && id) {
      if (!adminOk(event)) return res({ message: 'Unauthorized' }, 401);
      const existing = await store.get(id, { type: 'json' });
      if (!existing) return res({ message: 'Booking not found' }, 404);
      const updates = JSON.parse(event.body || '{}');
      const updated = {
        ...existing,
        ...updates,
        id,
        updated_date: new Date().toISOString(),
      };
      await store.setJSON(id, updated);
      return res(updated);
    }

    /* ── DELETE /bookings/:id ──────────────────────────────────────── */
    if (method === 'DELETE' && id) {
      if (!adminOk(event)) return res({ message: 'Unauthorized' }, 401);
      await store.delete(id);
      return res({ success: true });
    }

    return res({ message: 'Method not allowed' }, 405);

  } catch (err) {
    console.error('[bookings] Error:', err.message, err.stack);
    return res({ message: err.message || 'Internal server error' }, 500);
  }
};
