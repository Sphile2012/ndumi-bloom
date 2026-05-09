/**
 * ndumie API client
 * Talks to Netlify Functions at /.netlify/functions/
 *
 * Payment: FNB bank transfer + WhatsApp proof of payment (no payment gateway)
 */

const BASE = '/.netlify/functions';

// ── Admin token ───────────────────────────────────────────────────────────────
function getAdminToken() {
  try {
    const s = JSON.parse(localStorage.getItem('bloom_admin_session'));
    // Use stored token, or fall back to env var, or default
    return s?.token || import.meta.env.VITE_ADMIN_PASSWORD || '';
  } catch {
    return import.meta.env.VITE_ADMIN_PASSWORD || '';
  }
}

// ── Core fetch ────────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };

  // Attach admin token for any write operation
  if (['POST', 'PATCH', 'DELETE'].includes(options.method)) {
    const token = getAdminToken();
    if (token) headers['X-Admin-Token'] = token;
  }

  Object.assign(headers, options.headers || {});

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message || 'Request failed'), {
      status: res.status,
      data: err,
    });
  }
  return res.json();
}

// ── Bookings ──────────────────────────────────────────────────────────────────
const Booking = {
  filter(filters = {}) {
    const clean = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    );
    const qs = new URLSearchParams(clean).toString();
    return request(`/bookings${qs ? `?${qs}` : ''}`);
  },
  create(data) {
    return request('/bookings', { method: 'POST', body: JSON.stringify(data) });
  },
  update(id, data) {
    return request(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  delete(id) {
    return request(`/bookings/${id}`, { method: 'DELETE' });
  },
};

// ── Users ─────────────────────────────────────────────────────────────────────
const User = {
  list() {
    return request('/users');
  },
  create(data) {
    return request('/users', { method: 'POST', body: JSON.stringify(data) });
  },
  update(id, data) {
    return request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  delete(id) {
    return request(`/users/${id}`, { method: 'DELETE' });
  },
  /** Seed known users from old system (one-time) */
  seed() {
    return request('/seed-users', { method: 'POST' });
  },
};

// ── Announcements ─────────────────────────────────────────────────────────────
const Announcement = {
  list() {
    return request('/announcements');
  },
  create(data) {
    return request('/announcements', { method: 'POST', body: JSON.stringify(data) });
  },
  update(id, data) {
    return request(`/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  delete(id) {
    return request(`/announcements/${id}`, { method: 'DELETE' });
  },
};

// ── Auth ──────────────────────────────────────────────────────────────────────
const auth = {
  /** Login with email only. Returns user object on success. */
  async login(email) {
    const res = await fetch(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  /** Returns the current admin session from localStorage, or rejects. */
  me() {
    try {
      const session = JSON.parse(localStorage.getItem('bloom_admin_session'));
      if (session?.role === 'admin') return Promise.resolve(session);
    } catch (_) {}
    return Promise.reject(new Error('Not authenticated'));
  },

  logout() {
    localStorage.removeItem('bloom_admin_session');
  },
};

// ── Export ────────────────────────────────────────────────────────────────────
export const ndumie = {
  entities: { Booking, Announcement, User },
  auth,
};
