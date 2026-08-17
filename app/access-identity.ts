// Server-side identity for Grounds Command, backed by Cloudflare Access.
//
// Access handles authentication (proving who someone is). This module handles
// authorization (deciding what they may do) by verifying Access's signed
// assertion and mapping the email onto an owner/worker role.
//
// Why the JWT and not the email header: Cloudflare sets
// Cf-Access-Authenticated-User-Email on requests that pass Access, but that is
// a plain header. This Worker is reachable directly on workers.dev and through
// the argrounds.com proxy, so a client can send that header itself. Only
// Cf-Access-Jwt-Assertion is cryptographically signed, so that is what we
// check. See https://developers.cloudflare.com/cloudflare-one/ for the model.

export type CommandRole = "owner" | "worker";

export type Identity =
  | { status: "authenticated"; email: string; role: CommandRole }
  | { status: "anonymous"; reason: string }
  // Access is not configured yet, so nothing can be verified. The app stays
  // usable during setup rather than locking the owner out of their own tool.
  | { status: "unconfigured" };

type AccessEnv = {
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  OWNER_EMAILS?: string;
  WORKER_EMAILS?: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function parseEmailList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map(normalizeEmail)
    .filter(Boolean);
}

// --- JWKS -------------------------------------------------------------------

type CachedKeys = { keys: Map<string, CryptoKey>; fetchedAt: number };
const JWKS_TTL_MS = 60 * 60 * 1000;
const jwksCache = new Map<string, CachedKeys>();

async function getSigningKeys(teamDomain: string): Promise<Map<string, CryptoKey>> {
  const cached = jwksCache.get(teamDomain);
  if (cached && Date.now() - cached.fetchedAt < JWKS_TTL_MS) return cached.keys;

  const certsUrl = `https://${teamDomain}/cdn-cgi/access/certs`;
  const response = await fetch(certsUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch Access signing keys (HTTP ${response.status}).`);
  }
  const body = (await response.json()) as { keys?: JsonWebKey[] };
  const keys = new Map<string, CryptoKey>();

  for (const jwk of body.keys ?? []) {
    const kid = (jwk as { kid?: string }).kid;
    if (!kid) continue;
    const key = await crypto.subtle.importKey(
      "jwk",
      { ...jwk, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    keys.set(kid, key);
  }

  jwksCache.set(teamDomain, { keys, fetchedAt: Date.now() });
  return keys;
}

// --- JWT --------------------------------------------------------------------

// Backed by an explicit ArrayBuffer so the result satisfies BufferSource for
// crypto.subtle.verify - a plain Uint8Array is typed over ArrayBufferLike, which
// includes SharedArrayBuffer and is not accepted there.
function base64UrlToBytes(segment: string): Uint8Array<ArrayBuffer> {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJson(segment: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment)));
}

async function verifyAccessJwt(
  token: string,
  teamDomain: string,
  audience: string,
): Promise<{ email: string } | { error: string }> {
  const parts = token.split(".");
  if (parts.length !== 3) return { error: "assertion is not a JWT" };
  const [headerSegment, payloadSegment, signatureSegment] = parts;

  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = decodeJson(headerSegment);
    payload = decodeJson(payloadSegment);
  } catch {
    return { error: "assertion could not be decoded" };
  }

  if (header.alg !== "RS256") return { error: `unexpected algorithm ${String(header.alg)}` };
  const kid = typeof header.kid === "string" ? header.kid : "";
  if (!kid) return { error: "assertion has no key id" };

  const keys = await getSigningKeys(teamDomain);
  const key = keys.get(kid);
  if (!key) return { error: "assertion signed by an unknown key" };

  const valid = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    base64UrlToBytes(signatureSegment),
    new TextEncoder().encode(`${headerSegment}.${payloadSegment}`),
  );
  if (!valid) return { error: "assertion signature is invalid" };

  // Signature checked; now the claims. An unexpired, correctly-signed token for
  // a *different* application would otherwise be accepted here.
  const now = Math.floor(Date.now() / 1000);
  const exp = typeof payload.exp === "number" ? payload.exp : 0;
  if (!exp || exp < now) return { error: "assertion has expired" };
  const nbf = typeof payload.nbf === "number" ? payload.nbf : 0;
  if (nbf && nbf > now + 60) return { error: "assertion is not yet valid" };

  const issuer = typeof payload.iss === "string" ? payload.iss : "";
  if (issuer !== `https://${teamDomain}`) return { error: "assertion issuer does not match" };

  const audienceClaim = payload.aud;
  const audiences = Array.isArray(audienceClaim)
    ? audienceClaim.map(String)
    : typeof audienceClaim === "string"
      ? [audienceClaim]
      : [];
  if (!audiences.includes(audience)) return { error: "assertion is for a different application" };

  const email = typeof payload.email === "string" ? normalizeEmail(payload.email) : "";
  if (!email) return { error: "assertion carries no email" };

  return { email };
}

// --- Public API -------------------------------------------------------------

/**
 * Resolve the caller's identity from an Access assertion.
 *
 * Returns "unconfigured" when ACCESS_TEAM_DOMAIN or ACCESS_AUD is missing, so
 * the app keeps working while Access is still being set up. Enforcement begins
 * automatically once both are present - there is no separate switch to forget.
 */
export async function resolveIdentity(request: Request, env: AccessEnv): Promise<Identity> {
  const teamDomain = env.ACCESS_TEAM_DOMAIN?.trim();
  const audience = env.ACCESS_AUD?.trim();
  if (!teamDomain || !audience) return { status: "unconfigured" };

  const token =
    request.headers.get("Cf-Access-Jwt-Assertion") ??
    // Access also sets this cookie on browser navigations.
    (request.headers.get("Cookie") ?? "").match(/(?:^|;\s*)CF_Authorization=([^;]+)/)?.[1] ??
    "";
  if (!token) return { status: "anonymous", reason: "no Access assertion on the request" };

  let result: Awaited<ReturnType<typeof verifyAccessJwt>>;
  try {
    result = await verifyAccessJwt(token, teamDomain, audience);
  } catch (error) {
    return {
      status: "anonymous",
      reason: error instanceof Error ? error.message : "assertion could not be verified",
    };
  }
  if ("error" in result) return { status: "anonymous", reason: result.error };

  const owners = parseEmailList(env.OWNER_EMAILS);
  const workers = parseEmailList(env.WORKER_EMAILS);

  if (owners.includes(result.email)) {
    return { status: "authenticated", email: result.email, role: "owner" };
  }
  // With no owner list configured, anyone Access lets through is the owner -
  // correct for a single-operator business, and it avoids locking Danny out if
  // he turns on Access before setting OWNER_EMAILS.
  if (owners.length === 0) {
    return { status: "authenticated", email: result.email, role: "owner" };
  }
  if (workers.length === 0 || workers.includes(result.email)) {
    return { status: "authenticated", email: result.email, role: "worker" };
  }
  return { status: "anonymous", reason: `${result.email} is not on the access list` };
}

/** True when the caller may read operational data. */
export function canRead(identity: Identity): boolean {
  return identity.status === "authenticated" || identity.status === "unconfigured";
}

/** True when the caller may change operational data. */
export function canWrite(identity: Identity): boolean {
  if (identity.status === "unconfigured") return true;
  return identity.status === "authenticated";
}

/** True when the caller may see the owner workspace and overwrite whole state. */
export function isOwner(identity: Identity): boolean {
  if (identity.status === "unconfigured") return true;
  return identity.status === "authenticated" && identity.role === "owner";
}

export function denied(identity: Identity, action: string): Response {
  const reason = identity.status === "anonymous" ? identity.reason : "insufficient role";
  return Response.json(
    { error: `Not authorized to ${action}.`, reason },
    { status: identity.status === "anonymous" ? 401 : 403 },
  );
}
