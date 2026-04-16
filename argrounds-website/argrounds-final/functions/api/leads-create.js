// functions/api/leads-create.js
// POST /api/leads-create
// Accepts: JSON body with lead data
// Returns: 201 with { id } on success

import { sendEmail } from './_email.js';

const SUPABASE_REST = (url) => `${url}/rest/v1/leads`;

function jsonResponse(env, body, { status = 200, extraHeaders = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': env?.ALLOWED_ORIGIN || '*',
      ...extraHeaders,
    },
  });
}

function safeJwtRole(jwt) {
  try {
    const token = (jwt || '').trim();
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr);
    return payload?.role || null;
  } catch {
    return null;
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    // Validate required fields
    const nameValue = `${body.first_name || ''} ${body.last_name || body.name || ''}`.trim();
    if (!nameValue || !body.phone) {
      return jsonResponse(env, { error: 'Name and phone are required.' }, { status: 400 });
    }

    const supabaseUrl = env.SUPABASE_URL?.trim();
    const supabaseKey = (env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    const keyRole = safeJwtRole(supabaseKey);
    const keySource = env.SUPABASE_ANON_KEY ? 'anon' : 'service_role';

    if (!supabaseUrl || !supabaseKey) {
      return jsonResponse(
        env,
        { error: 'Missing env vars: SUPABASE_URL and (SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY) must be set in Cloudflare.' },
        { status: 503 }
      );
    }

    const record = {
      name: nameValue,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      service: body.service || null,
      size: body.size || null,
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
    const insertRes = await fetch(SUPABASE_REST(supabaseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(record),
    });

    if (!insertRes.ok) {
      const errBody = await insertRes.text();
      console.error('Supabase REST insert error:', insertRes.status, errBody);

      // Propagate upstream error code where possible (keep 5xx for true upstream errors)
      const status = insertRes.status >= 400 && insertRes.status < 600 ? insertRes.status : 500;
      return jsonResponse(
        env,
        {
          error: 'Database insert failed.',
          upstream_status: insertRes.status,
          key_source: keySource,
          key_role: keyRole,
          detail: errBody,
        },
        { status }
      );
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

    return jsonResponse(env, { success: true, message: 'Lead received.', id: leadId }, { status: 201 });

  } catch (err) {
    const msg = err?.message || String(err);
    console.error('leads-create error:', msg);
    return jsonResponse(env, { error: 'Server error.', detail: msg }, { status: 500 });
  }
}

// Handle CORS preflight
export async function onRequestOptions({ env }) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': env?.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
