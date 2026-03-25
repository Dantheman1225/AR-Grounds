// functions/api/leads-list.js
// GET /api/leads-list
// Optional: ?status=new|quoted|booked|done

export async function onRequestGet({ request, env }) {
  // TODO: Add auth check
  // const token = request.headers.get('Authorization')
  // if (!token) return new Response('Unauthorized', { status: 401 })

  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  // TODO: Fetch from Supabase
  // let query = supabase.from('leads').select('*').order('created_at', { ascending: false })
  // if (status) query = query.eq('status', status)
  // const { data, error } = await query
  // if (error) throw error

  return new Response(JSON.stringify({ leads: [], total: 0 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
