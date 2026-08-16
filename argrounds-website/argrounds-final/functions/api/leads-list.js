// functions/api/leads-list.js
// GET /api/leads-list
// Optional: ?status=new|quoted|booked|done

import { createClient } from '@supabase/supabase-js';

export async function onRequestGet({ request, env }) {
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Database configuration missing.' }), { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Verify token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    let query = supabase.from('leads').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (status) {
      query = query.eq('status', status);
    }

    const { data: leads, count, error } = await query;
    if (error) throw error;

    return new Response(JSON.stringify({ leads, total: count }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*'
      },
    });
  } catch (err) {
    console.error('List leads error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}

export async function onRequestOptions({ env }) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
