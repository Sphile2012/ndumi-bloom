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
async function request(path, options = {}, retries = 2) {
  const headers = { 'Content-Type': 'application/json' };

  // Attach admin token for all requests (needed for admin views and writes)
  const token = getAdminToken();
  if (token) headers['X-Admin-Token'] = token;

  Object.assign(headers, options.headers || {});

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, { ...options, headers });
      const raw = await res.text();
      let data = null;
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          const snippet = raw.slice(0, 120).replace(/\s+/g, ' ');
          const isHtml = /^\s*</.test(raw);
          throw Object.assign(
            new Error(
              isHtml
                ? 'API returned HTML instead of JSON (Netlify function may be missing or blocked). Check function deploy logs and netlify.toml redirects.'
                : `Invalid API response: ${snippet}`,
            ),
            { status: res.status },
          );
        }
      }

      if (!res.ok) {
        throw Object.assign(new Error(data?.message || res.statusText || 'Request failed'), {
          status: res.status,
          data,
        });
      }
      return data;
    } catch (err) {
      // Don't retry on 4xx client errors
      if (err.status >= 400 && err.status < 500) throw err;
      // Retry on network errors or 5xx
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

// ── Bookings ──────────────────────────────────────────────────────────────────
const Booking = {
  async filter(filters = {}) {
    const clean = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    );
    const qs = new URLSearchParams(clean).toString();
    const data = await request(`/bookings${qs ? `?${qs}` : ''}`);
    return Array.isArray(data) ? data : [];
  },
  create(data) {
    return request('/bookings', { method: 'POST', body: JSON.stringify(data) });
  },
  update(id, data) {
    return request(`/bookings?id=${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  delete(id) {
    return request(`/bookings?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};

// ── Users ─────────────────────────────────────────────────────────────────────
const User = {
  async list() {
    const data = await request('/users');
    return Array.isArray(data) ? data : [];
  },
  create(data) {
    return request('/users', { method: 'POST', body: JSON.stringify(data) });
  },
  update(id, data) {
    return request(`/users?id=${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  delete(id) {
    return request(`/users?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  /** Seed known users from old system (one-time) */
  seed() {
    return request('/seed-users', { method: 'POST' });
  },
};

// ── Announcements ─────────────────────────────────────────────────────────────
const Announcement = {
  async list() {
    const data = await request('/announcements');
    return Array.isArray(data) ? data : [];
  },
  create(data) {
    return request('/announcements', { method: 'POST', body: JSON.stringify(data) });
  },
  update(id, data) {
    return request(`/announcements?id=${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  delete(id) {
    return request(`/announcements?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
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
    const raw = await res.text();
    let data = {};
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          /^\s*</.test(raw)
            ? 'Login API returned HTML instead of JSON. Check Netlify function deployment.'
            : 'Invalid response from login.',
        );
      }
    }
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
