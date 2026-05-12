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
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function getId(event) {
  // Check query params first (Netlify Functions don't support sub-path routing)
  const qs = event.queryStringParameters || {};
  if (qs.id) return qs.id;
  // Fallback: try path-based ID extraction
  const path = event.rawPath || event.path || '';
  const match = path.match(/\/bookings\/([^/?#]+)/);
  return match ? match[1] : null;
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
  if (event.httpMethod === 'OPTIONS') {
    return respond({});
  }

  const method = event.httpMethod;
  const id = getId(event);

  try {
    // Validate Supabase configuration early
    let supabase;
    try {
      supabase = getSupabase();
    } catch (configError) {
      console.error('[bookings] Configuration error:', configError.message);
      return respond({ message: configError.message }, 500);
    }

    if (method === 'GET' && !id) {
      try {
        const qs = event.queryStringParameters || {};
        let query = supabase.from('bookings').select('*').order('preferred_date', { ascending: false });
        // Apply filters from query params (skip 'id' as it's used for entity routing)
        Object.entries(qs).forEach(([k, v]) => {
          if (k !== 'id' && v !== undefined && v !== null) {
            query = query.eq(k, v);
          }
        });
        const { data, error } = await query;
        if (error) {
          console.error('[bookings] GET error:', error.message, error.details);
          throw new Error(`Database query failed: ${error.message}`);
        }
        // Always return an array, even if empty or null
        const responseData = Array.isArray(data) ? data : [];
        console.log(`[bookings] GET success: ${responseData.length} bookings returned`);
        return respond(responseData);
      } catch (queryError) {
        console.error('[bookings] GET query error:', queryError);
        return respond({ message: `Failed to fetch bookings: ${queryError.message}` }, 500);
      }
    }

    if (method === 'POST' && !id) {
      try {
        const body = event.body || '{}';
        let data;
        try {
          data = JSON.parse(body);
        } catch (parseError) {
          console.error('[bookings] POST JSON parse error:', parseError.message);
          return respond({ message: 'Invalid JSON in request body' }, 400);
        }
        
        // Validate required fields
        if (!data.client_name?.trim()) {
          return respond({ message: 'client_name is required and cannot be empty' }, 400);
        }
        if (!data.client_phone?.trim()) {
          return respond({ message: 'client_phone is required and cannot be empty' }, 400);
        }
        
        const booking = {
          ...data,
          id: uid(),
          status: data.status || 'pending',
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
        };
        
        const { data: created, error } = await supabase.from('bookings').insert(booking).select().single();
        if (error) {
          console.error('[bookings] POST insert error:', error.message, error.details);
          throw new Error(`Failed to create booking: ${error.message}`);
        }
        console.log(`[bookings] POST success: booking ${created.id} created`);
        return respond(created, 201);
      } catch (createError) {
        console.error('[bookings] POST create error:', createError);
        return respond({ message: createError.message || 'Failed to create booking' }, 500);
      }
    }

    if (method === 'PATCH' && id) {
      try {
        if (!isAdmin(event)) {
          console.warn('[bookings] PATCH unauthorized attempt');
          return respond({ message: 'Unauthorized' }, 401);
        }
        
        const body = event.body || '{}';
        let updates;
        try {
          updates = JSON.parse(body);
        } catch (parseError) {
          console.error('[bookings] PATCH JSON parse error:', parseError.message);
          return respond({ message: 'Invalid JSON in request body' }, 400);
        }
        
        // Add updated timestamp
        const updateData = { ...updates, updated_date: new Date().toISOString() };
        
        const { data: updated, error } = await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
          
        if (error) {
          console.error('[bookings] PATCH update error:', error.message, error.details);
          throw new Error(`Failed to update booking: ${error.message}`);
        }
        
        if (!updated) {
          return respond({ message: 'Booking not found' }, 404);
        }
        
        console.log(`[bookings] PATCH success: booking ${id} updated`);
        return respond(updated);
      } catch (updateError) {
        console.error('[bookings] PATCH update error:', updateError);
        return respond({ message: updateError.message || 'Failed to update booking' }, 500);
      }
    }

    if (method === 'DELETE' && id) {
      try {
        if (!isAdmin(event)) {
          console.warn('[bookings] DELETE unauthorized attempt');
          return respond({ message: 'Unauthorized' }, 401);
        }
        
        // First check if booking exists
        const { data: existingBooking, error: checkError } = await supabase
          .from('bookings')
          .select('id')
          .eq('id', id)
          .single();
          
        if (checkError) {
          if (checkError.code === 'PGRST116') {
            return respond({ message: 'Booking not found' }, 404);
          }
          throw checkError;
        }
        
        if (!existingBooking) {
          return respond({ message: 'Booking not found' }, 404);
        }
        
        const { error } = await supabase.from('bookings').delete().eq('id', id);
        if (error) {
          console.error('[bookings] DELETE error:', error.message, error.details);
          throw new Error(`Failed to delete booking: ${error.message}`);
        }
        
        console.log(`[bookings] DELETE success: booking ${id} deleted`);
        return respond({ success: true, message: 'Booking deleted successfully' });
      } catch (deleteError) {
        console.error('[bookings] DELETE error:', deleteError);
        return respond({ message: deleteError.message || 'Failed to delete booking' }, 500);
      }
    }

    return respond({ message: 'Method not allowed' }, 405);

  } catch (err) {
    console.error('[bookings] Unhandled error:', err.message, err);
    const errorMessage = err.message || 'Internal server error';
    
    // Provide more specific error messages for common issues
    if (errorMessage.includes('env vars') || errorMessage.includes('SUPABASE')) {
      return respond({ message: 'Server configuration error: Supabase environment variables are not set.' }, 500);
    }
    
    return respond({ message: errorMessage }, 500);
  }
};
