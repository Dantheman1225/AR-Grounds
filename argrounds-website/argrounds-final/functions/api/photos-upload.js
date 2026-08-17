// functions/api/photos-upload.js
// POST /api/photos-upload (multipart/form-data)
// Uploads a photo to Supabase Storage

export async function onRequestPost({ request, env }) {
  // TODO:
  // 1. Parse multipart: const formData = await request.formData()
  // 2. Get file: const file = formData.get('file')
  // 3. Upload: supabase.storage.from('photos').upload(`jobs/${jobId}/${file.name}`, file)
  // 4. Save record: supabase.from('photos').insert([{ job_id, storage_path, type, label }])
  return new Response(JSON.stringify({ success: true, url: null }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}
