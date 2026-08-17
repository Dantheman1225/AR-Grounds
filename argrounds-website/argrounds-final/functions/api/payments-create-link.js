// functions/api/payments-create-link.js
// POST /api/payments-create-link
// Saves a Stripe payment link to a job record

export async function onRequestPost({ request, env }) {
  const body = await request.json();
  // TODO:
  // supabase.from('jobs').update({ stripe_link: body.stripe_link }).eq('id', body.job_id)
  // supabase.from('payments').insert([{ job_id: body.job_id, amount: body.amount, stripe_link: body.stripe_link, status: 'sent' }])
  return new Response(JSON.stringify({ success: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
}
