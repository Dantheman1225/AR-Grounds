// functions/api/contact.js
// POST /api/contact
// Saves a general contact form submission

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    if (!body.name || !body.message) {
      return new Response(JSON.stringify({ error: 'Name and message are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: Insert into leads table with source: 'contact'
    // const { error } = await supabase.from('leads').insert([{
    //   name: body.name,
    //   phone: body.phone || null,
    //   email: body.email || null,
    //   message: body.message,
    //   service: body.subject || null,
    //   status: 'new',
    //   source: 'contact',
    // }])
    // if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      },
    });
  } catch (err) {
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
