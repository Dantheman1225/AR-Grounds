// functions/api/leads-create.js
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

    // TODO: Insert into Supabase
    // const { data, error } = await supabase.from('leads').insert([{
    //   name: `${body.first_name || ''} ${body.last_name || body.name || ''}`.trim(),
    //   phone: body.phone,
    //   email: body.email || null,
    //   address: body.address || null,
    //   service: body.service || null,
    //   timing: body.timing || null,
    //   message: body.message || null,
    //   status: 'new',
    //   source: 'quote_form',
    // }]).select('id').single()
    // if (error) throw error

    return new Response(JSON.stringify({ success: true, message: 'Lead received.' }), {
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
