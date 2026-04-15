// functions/api/leads-create.js
// POST /api/leads-create
// Accepts: JSON body with lead data
// Returns: 201 with { id } on success

import { createClient } from '@supabase/supabase-js';
import { sendEmail } from './_email.js';

// POST /api/leads-create
// Accepts: JSON body with lead data
// Returns: 201 with { id } on success

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.phone && !body.name) {
      return new Response(JSON.stringify({ error: 'Name and phone are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing env vars: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in Cloudflare.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase with Service Role Key — persistSession:false required for RLS bypass
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Insert into Supabase
    const { data: insertedLead, error } = await supabase.from('leads').insert([{
      name: `${body.first_name || ''} ${body.last_name || body.name || ''}`.trim(),
      phone: body.phone,
      email: body.email || null,
      address: body.address || null,
      service: body.service || null,
      timing: body.timing || null,
      message: body.message || null,
      status: 'new',
      source: body.source || 'quote_form',
      
      // Attribution data
      landing_page: body.landing_page || null,
      referrer: body.referrer || null,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      utm_term: body.utm_term || null,
      utm_content: body.utm_content || null,
      gclid: body.gclid || null,
      fbclid: body.fbclid || null,
      client_id: body.client_id || null,
      session_id: body.session_id || null,
      user_agent: request.headers.get('user-agent') || body.user_agent || null,
      page_path: body.page_path || null,
    }]).select('id').single();

    if (error) {
      console.error('Supabase Insert Error:', error);
      throw error;
    }

    // Send Emails asynchronously
    try {
      await sendEmail(env, {
        type: 'NEW_LEAD_INTERNAL',
        lead: body,
      });

      if (body.email) {
        await sendEmail(env, {
          type: 'NEW_LEAD_CUSTOMER_CONFIRMATION',
          lead: body,
        });
      }
    } catch (emailErr) {
      console.error('Email sending failed, but lead captured:', emailErr);
    }

    return new Response(JSON.stringify({ success: true, message: 'Lead received.', id: insertedLead.id }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      },
    });
  } catch (err) {
    const msg = err?.message || String(err);
    console.error('Server error:', msg);
    return new Response(JSON.stringify({ error: 'Server error.', detail: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
