import { createClient } from '@supabase/supabase-js';

const KNOWN_USERS = [
  { name: 'Phunyezwa Mjoli',       email: 'phunyezwamjoli3@gmail.com',        role: 'admin' },
  { name: 'bloomskillsandbeauty',  email: 'bloomskillsandbeauty@icloud.com',  role: 'admin' },
  { name: 'Thobani Mkhize',        email: 'thobsin.e@gmail.com',              role: 'admin' },
  { name: 'job3.sithole',          email: 'job3.sithole@gmail.com',           role: 'user' },
  { name: 'amanda23phiwe',         email: 'amanda23phiwe@gmail.com',          role: 'user' },
  { name: 'Nokhwezi Andiswa',      email: 'andiswanokhwezi80@gmail.com',      role: 'user' },
  { name: 'asimthandezondi1',      email: 'asimthandezondi1@gmail.com',       role: 'user' },
  { name: 'iyohzondo',             email: 'iyohzondo@gmail.com',              role: 'user' },
  { name: 'Luyanda Mkhize',        email: 'luyandamkhize55@gmail.com',        role: 'user' },
  { name: 'Andile Majola',         email: 'majolaandile82@gmail.com',         role: 'user' },
  { name: 'Nondumiso Majola',      email: 'majolanondumiso88@gmail.com',      role: 'user' },
  { name: 'mthembulungile05',      email: 'mthembulungile05@gmail.com',       role: 'user' },
  { name: 'Nondumiso Mchunu',      email: 'nondudu96@gmail.com',              role: 'user' },
  { name: 'Pinky Sekhosana',       email: 'pinkysekhosana49@gmail.com',       role: 'user' },
  { name: 'Phunyezwa Mjoli',       email: 'poomeigh503@gmail.com',            role: 'user' },
  { name: 'sinenhlanhlazikalala',  email: 'sinenhlanhlazikalala@icloud.com',  role: 'user' },
  { name: 'Thobeka Mchunu',        email: 'thobecingwane2002@gmail.com',      role: 'user' },
  { name: 'yamkela8946',           email: 'yamkela8946@gmail.com',            role: 'user' },
];

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
    const supabase = getSupabase();
    const users = KNOWN_USERS.map(u => ({
      id: `usr_${u.email.replace(/[^a-z0-9]/gi, '_')}`,
      name: u.name,
      email: u.email.toLowerCase(),
      role: u.role,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('users')
      .upsert(users, { onConflict: 'email' })
      .select();

    if (error) throw error;
    return respond({ success: true, seeded: data });

  } catch (err) {
    console.error('[seed-users]', err.message);
    return respond({ message: err.message || 'Internal server error' }, 500);
  }
};
