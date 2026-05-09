/**
 * Netlify Function: migrate
 * POST /.netlify/functions/migrate
 *
 * One-time import of existing bookings from base44 export.
 * Accepts an array of booking objects and stores them all in Netlify Blobs.
 * Admin token required.
 *
 * Body: { bookings: [...] }
 */

import { getStore } from '@netlify/blobs';

function res(body, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function adminOk(event) {
  const token =
    (event.headers || {})['x-admin-token'] ||
    (event.headers || {})['X-Admin-Token'] ||
    '';
  const expected =
    process.env.ADMIN_TOKEN ||
    process.env.VITE_ADMIN_PASSWORD ||
    '';
  return token === expected;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return res({});
  if (event.httpMethod !== 'POST') return res({ message: 'Method not allowed' }, 405);
  if (!adminOk(event)) return res({ message: 'Unauthorized' }, 401);

  try {
    const { bookings = [], announcements = [] } = JSON.parse(event.body || '{}');

    const bookingStore = getStore('bookings');
    const annStore     = getStore('announcements');

    let importedBookings = 0;
    let importedAnnouncements = 0;
    const errors = [];

    // Import bookings
    for (const b of bookings) {
      try {
        if (!b.id) b.id = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        // Skip announcements stored as bookings in old system
        if (b.service_category === 'announcement') {
          // Convert to announcement format
          const ann = {
            id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            message: b.notes || b.service_detail || '',
            type: b.service_detail || 'info',
            created_date: b.created_date || new Date().toISOString(),
            updated_date: b.updated_date || new Date().toISOString(),
          };
          if (ann.message) {
            await annStore.setJSON(ann.id, ann);
            importedAnnouncements++;
          }
          continue;
        }
        await bookingStore.setJSON(b.id, {
          ...b,
          updated_date: b.updated_date || new Date().toISOString(),
          created_date: b.created_date || new Date().toISOString(),
        });
        importedBookings++;
      } catch (err) {
        errors.push({ id: b.id, error: err.message });
      }
    }

    // Import standalone announcements
    for (const a of announcements) {
      try {
        if (!a.id) a.id = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        await annStore.setJSON(a.id, {
          ...a,
          updated_date: a.updated_date || new Date().toISOString(),
          created_date: a.created_date || new Date().toISOString(),
        });
        importedAnnouncements++;
      } catch (err) {
        errors.push({ id: a.id, error: err.message });
      }
    }

    return res({
      success: true,
      importedBookings,
      importedAnnouncements,
      errors,
    });

  } catch (err) {
    console.error('[migrate]', err);
    return res({ message: err.message || 'Internal server error' }, 500);
  }
};
