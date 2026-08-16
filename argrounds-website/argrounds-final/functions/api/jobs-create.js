// functions/api/jobs-create.js
// POST /api/jobs-create or PUT /api/jobs-create?id=xxx

export async function onRequestPost({ request, env }) {
  const body = await request.json();
  // TODO: supabase.from('jobs').insert([{ customer_id, service, status:'scheduled', price, notes, stripe_link }])
  return new Response(JSON.stringify({ success: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
}
