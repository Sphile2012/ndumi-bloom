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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
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
  if (event.httpMethod !== 'POST') return respond({ message: 'Method not allowed' }, 405);
  if (!isAdmin(event)) return respond({ message: 'Unauthorized' }, 401);

  try {
    const { bookings = [], announcements = [] } = JSON.parse(event.body || '{}');
    const supabase = getSupabase();

    let importedBookings = 0;
    let importedAnnouncements = 0;
    const errors = [];

    // Import bookings
    for (const b of bookings) {
      try {
        if (b.service_category === 'announcement') {
          const ann = {
            id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            message: b.notes || b.service_detail || '',
            type: b.service_detail || 'info',
            created_date: b.created_date || new Date().toISOString(),
            updated_date: b.updated_date || new Date().toISOString(),
          };
          if (ann.message) {
            await supabase.from('announcements').upsert(ann, { onConflict: 'id' });
            importedAnnouncements++;
          }
          continue;
        }
        const booking = { ...b, id: b.id || uid() };
        await supabase.from('bookings').upsert(booking, { onConflict: 'id' });
        importedBookings++;
      } catch (err) {
        errors.push({ id: b.id, error: err.message });
      }
    }

    // Import announcements
    for (const a of announcements) {
      try {
        await supabase.from('announcements').upsert(a, { onConflict: 'id' });
        importedAnnouncements++;
      } catch (err) {
        errors.push({ id: a.id, error: err.message });
      }
    }

    return respond({ success: true, importedBookings, importedAnnouncements, errors });

  } catch (err) {
    console.error('[migrate]', err.message);
    return respond({ message: err.message || 'Internal server error' }, 500);
  }
};
