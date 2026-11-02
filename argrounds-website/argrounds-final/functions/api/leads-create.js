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

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse(env, { error: 'Invalid request.' }, { status: 400 });
    }
    if (body._gotcha) return jsonResponse(env, { success: true }, { status: 201 });
    for (const value of Object.values(body)) {
      if (value != null && (typeof value !== 'string' || value.length > 10000)) {
        return jsonResponse(env, { error: 'Invalid form field.' }, { status: 400 });
      }
    }

    // Validate required fields
    const nameValue = `${body.first_name || ''} ${body.last_name || body.name || ''}`.trim();
    if (!nameValue || !body.phone || body.phone.replace(/\D/g, '').length < 10) {
      return jsonResponse(env, { error: 'Name and phone are required.' }, { status: 400 });
    }
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return jsonResponse(env, { error: 'Enter a valid email address.' }, { status: 400 });
    }

    const supabaseUrl = env.SUPABASE_URL?.trim();
    const supabaseKey = (env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    const record = {
      id: crypto.randomUUID(),
      name: nameValue,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      service: body.service || body.subject || null,
      size: body.size || null,
      timing: body.timing || null,
      message: body.message || null,
      status: 'new',
      source: body.subject ? 'contact_form' : (body.source || 'quote_form'),
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

    // Public form submissions need INSERT only. Returning the row also requires
    // SELECT and fails RLS for public keys. Keep customer records private.
    let stored = false;
    try {
      if (!supabaseUrl || !supabaseKey) throw new Error('Database configuration missing');
      const insertRes = await fetch(SUPABASE_REST(supabaseUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          ...(supabaseKey.startsWith('eyJ') ? { Authorization: `Bearer ${supabaseKey}` } : {}),
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(record),
        signal: AbortSignal.timeout(10000),
      });
      stored = insertRes.ok;
      if (!stored) console.error('Supabase REST insert error:', insertRes.status);
    } catch {
      console.error('Database unavailable for request:', record.id);
    }

    // A saved request is never described as lost if email fails. The client
    // shows a call/text fallback instead of inviting a duplicate submission.
    let notificationSent = false;
    let confirmationSent = false;
    try {
      notificationSent = !!(await sendEmail(env, {
        type: 'NEW_LEAD_INTERNAL', lead: { ...record, storage_saved: stored },
      }));
    } catch (emailErr) {
      console.error('Internal notification failed for request:', record.id);
    }
    if (notificationSent && record.email) {
      try {
        confirmationSent = !!(await sendEmail(env, { type: 'NEW_LEAD_CUSTOMER_CONFIRMATION', lead: record }));
      } catch {
        console.error('Customer confirmation failed for saved request:', record.id);
      }
    }
    if (!stored && !notificationSent) {
      return jsonResponse(env, { error: 'Unable to receive the request. Please call or text us.' }, { status: 503 });
    }
    return jsonResponse(env, {
      success: true, captured: stored, id: record.id,
      notification_sent: notificationSent, confirmation_sent: confirmationSent,
    }, { status: stored ? 201 : 202 });

  } catch (err) {
    const msg = err?.message || String(err);
    console.error('leads-create error:', msg);
    return jsonResponse(env, { error: 'Unable to save the request.' }, { status: err instanceof SyntaxError ? 400 : 500 });
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
