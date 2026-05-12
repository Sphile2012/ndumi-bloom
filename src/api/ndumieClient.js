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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const res = await fetch(`${BASE}${path}`, { 
        ...options, 
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Check for empty response
      const raw = await res.text();
      let data = null;
      
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch (parseError) {
          const snippet = raw.slice(0, 120).replace(/\s+/g, ' ');
          const isHtml = /^\s*</.test(raw);
          const error = new Error(
            isHtml
              ? 'API returned HTML instead of JSON (Netlify function may be missing or blocked). Check function deploy logs and netlify.toml redirects.'
              : `Invalid API response: ${snippet}`,
          );
          Object.assign(error, { status: res.status, rawResponse: raw });
          throw error;
        }
      }

      if (!res.ok) {
        const error = new Error(data?.message || res.statusText || 'Request failed');
        Object.assign(error, { 
          status: res.status, 
          data,
          url: `${BASE}${path}`
        });
        throw error;
      }
      
      // Validate response data structure for array endpoints
      if (path.includes('/bookings') && !path.includes('?id=') && !Array.isArray(data)) {
        console.warn('Bookings endpoint returned non-array data:', data);
        return []; // Return empty array instead of invalid data
      }
      
      return data;
    } catch (err) {
      // Don't retry on client errors (4xx) or abort errors
      if ((err.status >= 400 && err.status < 500) || err.name === 'AbortError') {
        throw err;
      }
      
      // Retry on network errors or 5xx
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
        console.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries + 1}):`, err.message);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      // Final attempt failed, add more context to error
      if (err.name === 'AbortError') {
        err.message = 'Request timeout - please check your connection and try again';
      }
      
      // Add more detailed error information for debugging
      if (!err.status) {
        err.message = `Network error: ${err.message}. Please check your internet connection.`;
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
    try {
      const data = await request(`/bookings${qs ? `?${qs}` : ''}`);
      // Always return a valid array, even if response is malformed
      if (!Array.isArray(data)) {
        console.warn('Booking.filter received non-array data:', data);
        return [];
      }
      // Filter out invalid entries
      return data.filter(booking => {
        if (!booking || typeof booking !== 'object') {
          console.warn('Invalid booking entry in filter response:', booking);
          return false;
        }
        return booking.id && booking.client_name;
      });
    } catch (err) {
      console.error('Booking.filter error:', err);
      // Return empty array on error to prevent UI crashes
      return [];
    }
  },
  async create(data) {
    try {
      // Validate input data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid booking data: must be an object');
      }
      if (!data.client_name?.trim()) {
        throw new Error('Client name is required');
      }
      if (!data.client_phone?.trim()) {
        throw new Error('Client phone is required');
      }
      
      const result = await request('/bookings', { method: 'POST', body: JSON.stringify(data) });
      return result;
    } catch (err) {
      console.error('Booking.create error:', err);
      throw err;
    }
  },
  async update(id, data) {
    try {
      if (!id) {
        throw new Error('Booking ID is required for update');
      }
      if (!data || typeof data !== 'object') {
        throw new Error('Update data must be an object');
      }
      
      const result = await request(`/bookings?id=${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) });
      return result;
    } catch (err) {
      console.error('Booking.update error:', err);
      throw err;
    }
  },
  async delete(id) {
    try {
      if (!id) {
        throw new Error('Booking ID is required for deletion');
      }
      
      const result = await request(`/bookings?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      return result;
    } catch (err) {
      console.error('Booking.delete error:', err);
      throw err;
    }
  },
};

// ── Users ─────────────────────────────────────────────────────────────────────
const User = {
  async list() {
    try {
      const data = await request('/users');
      // Always return a valid array, even if response is malformed
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('User.list error:', err);
      throw err;
    }
  },
  async create(data) {
    try {
      const result = await request('/users', { method: 'POST', body: JSON.stringify(data) });
      return result;
    } catch (err) {
      console.error('User.create error:', err);
      throw err;
    }
  },
  async update(id, data) {
    try {
      const result = await request(`/users?id=${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) });
      return result;
    } catch (err) {
      console.error('User.update error:', err);
      throw err;
    }
  },
  async delete(id) {
    try {
      const result = await request(`/users?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      return result;
    } catch (err) {
      console.error('User.delete error:', err);
      throw err;
    }
  },
  /** Seed known users from old system (one-time) */
  async seed() {
    try {
      const result = await request('/seed-users', { method: 'POST' });
      return result;
    } catch (err) {
      console.error('User.seed error:', err);
      throw err;
    }
  },
};

// ── Announcements ─────────────────────────────────────────────────────────────
const Announcement = {
  async list() {
    try {
      const data = await request('/announcements');
      // Always return a valid array, even if response is malformed
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Announcement.list error:', err);
      throw err;
    }
  },
  async create(data) {
    try {
      const result = await request('/announcements', { method: 'POST', body: JSON.stringify(data) });
      return result;
    } catch (err) {
      console.error('Announcement.create error:', err);
      throw err;
    }
  },
  async update(id, data) {
    try {
      const result = await request(`/announcements?id=${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) });
      return result;
    } catch (err) {
      console.error('Announcement.update error:', err);
      throw err;
    }
  },
  async delete(id) {
    try {
      const result = await request(`/announcements?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      return result;
    } catch (err) {
      console.error('Announcement.delete error:', err);
      throw err;
    }
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
