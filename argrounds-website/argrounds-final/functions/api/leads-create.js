// functions/api/leads-create.js
// POST /api/leads-create
// Accepts: JSON body with lead data
// Returns: 201 with { id } on success

import { sendEmail } from './_email.js';

const SUPABASE_REST = (url) => `${url}/rest/v1/leads`;

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.phone && !body.name && !body.first_name) {
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

    const record = {
      name: `${body.first_name || ''} ${body.last_name || body.name || ''}`.trim() || 'Unknown',
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      service: body.service || null,
      timing: body.timing || null,
      message: body.message || null,
      status: 'new',
      source: body.source || 'quote_form',
      // Attribution
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
    };

    // Use Supabase REST API directly with service role key — bypasses RLS entirely
    const insertRes = await fetch(SUPABASE_REST(env.SUPABASE_URL), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(record),
    });

    if (!insertRes.ok) {
      const errBody = await insertRes.text();
      console.error('Supabase REST insert error:', insertRes.status, errBody);
      return new Response(JSON.stringify({ error: 'Database insert failed.', detail: errBody }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const inserted = await insertRes.json();
    const leadId = Array.isArray(inserted) ? inserted[0]?.id : inserted?.id;

    // Send email notifications (non-blocking — don't fail if email fails)
    try {
      await sendEmail(env, { type: 'NEW_LEAD_INTERNAL', lead: body });
      if (body.email) {
        await sendEmail(env, { type: 'NEW_LEAD_CUSTOMER_CONFIRMATION', lead: body });
      }
    } catch (emailErr) {
      console.error('Email sending failed, lead still captured:', emailErr.message);
    }

    return new Response(JSON.stringify({ success: true, message: 'Lead received.', id: leadId }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      },
    });

  } catch (err) {
    const msg = err?.message || String(err);
    console.error('leads-create error:', msg);
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
