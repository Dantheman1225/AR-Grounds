function proofBucket() {
  const runtime = globalThis as typeof globalThis & {
    __GROUNDS_COMMAND_BUCKET__?: R2Bucket;
  };
  if (!runtime.__GROUNDS_COMMAND_BUCKET__) {
    throw new Error("Proof storage is unavailable.");
  }
  return runtime.__GROUNDS_COMMAND_BUCKET__;
}

function safeKey(value: string | null) {
  return value && value.startsWith("proof/") && !value.includes("..") ? value : null;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Choose a photo to upload." }, { status: 400 });
    if (!file.type.startsWith("image/")) return Response.json({ error: "Proof uploads must be images." }, { status: 415 });
    if (file.size > 12_000_000) return Response.json({ error: "Keep each photo under 12 MB." }, { status: 413 });

    const key = `proof/${Date.now()}-${crypto.randomUUID()}`;
    await proofBucket().put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { originalFilename: file.name.slice(0, 240) },
    });
    return Response.json({ key, filename: file.name, contentType: file.type, size: file.size });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to upload proof photo." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const key = safeKey(new URL(request.url).searchParams.get("key"));
    if (!key) return new Response("Invalid proof key.", { status: 400 });
    const object = await proofBucket().get(key);
    if (!object) return new Response("Photo not found.", { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "private, max-age=3600");
    return new Response(object.body, { headers });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Unable to load proof photo.", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const key = safeKey(new URL(request.url).searchParams.get("key"));
    if (!key) return Response.json({ error: "Invalid proof key." }, { status: 400 });
    await proofBucket().delete(key);
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete proof photo." }, { status: 500 });
  }
}
