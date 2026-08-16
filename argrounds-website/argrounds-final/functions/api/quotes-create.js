// functions/api/quotes-create.js
// POST /api/quotes-create
// Creates a quote for a lead and updates lead status

export async function onRequestPost({ request, env }) {
  const body = await request.json();
  // TODO:
  // supabase.from('leads').update({ status:'quoted' }).eq('id', body.lead_id)
  return new Response(JSON.stringify({ success: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
}
