/**
 * Netlify Function: seed-users
 * POST /.netlify/functions/seed-users
 * Seeds all known users into Netlify Blobs. Safe to run multiple times.
 */

import { getStore } from '@netlify/blobs';

const STORE = 'users';

const KNOWN_USERS = [
  // ── Admins ──────────────────────────────────────────────────────────────
  { name: 'Phunyezwa Mjoli',       email: 'phunyezwamjoli3@gmail.com',        role: 'admin' },
  { name: 'bloomskillsandbeauty',  email: 'bloomskillsandbeauty@icloud.com',  role: 'admin' },
  { name: 'Thobani Mkhize',        email: 'thobsin.e@gmail.com',              role: 'admin' },
  // ── Users ────────────────────────────────────────────────────────────────
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

function json(body, status = 200) {
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
  const h = event.headers || {};
  const token = h['x-admin-token'] || h['X-Admin-Token'] || '';
  const expected = process.env.ADMIN_TOKEN || 'bloom2024';
  // Accept token if it matches, OR if no ADMIN_TOKEN env var is set (open during setup)
  if (!process.env.ADMIN_TOKEN) return token.length > 0;
  return token === expected;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json({});
  if (event.httpMethod !== 'POST') return json({ message: 'Method not allowed' }, 405);
  if (!adminOk(event)) return json({ message: 'Unauthorized' }, 401);

  try {
    const store = getStore(STORE);
    const seeded = [];

    for (const u of KNOWN_USERS) {
      const id = `usr_${u.email.replace(/[^a-z0-9]/gi, '_')}`;
      const user = {
        id,
        name: u.name,
        email: u.email.toLowerCase(),
        role: u.role,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      await store.setJSON(id, user);
      seeded.push(user);
    }

    return json({ success: true, seeded });
  } catch (err) {
    console.error('[seed-users]', err);
    return json({ message: err.message || 'Internal server error' }, 500);
  }
};
