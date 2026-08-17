// functions/api/contact.js
// POST /api/contact
// Saves a general contact form submission

import { createClient } from '@supabase/supabase-js';
import { sendEmail } from './_email.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    if (!body.name || !body.message) {
      return new Response(JSON.stringify({ error: 'Name and message are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Database configuration missing.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: insertedLead, error } = await supabase.from('leads').insert([{
      name: body.name.trim(),
      phone: body.phone || null,
      email: body.email || null,
      message: body.message,
      service: body.subject || null,
      status: 'new',
      source: body.source || 'contact',
      
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

    if (error) throw error;

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
      console.error('Email sending failed:', emailErr);
    }

    return new Response(JSON.stringify({ success: true, id: insertedLead.id }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      },
    });
  } catch (err) {
    console.error('Server error:', err);
    return new Response(JSON.stringify({ error: 'Server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
