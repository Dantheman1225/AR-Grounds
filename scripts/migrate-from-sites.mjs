#!/usr/bin/env node
// Migrate Grounds Command off ChatGPT Sites onto the Cloudflare deployment.
//
// Two things have to move, and only one of them is in Git:
//   1. Operations state - a single JSON blob (one D1 row, owner_states/primary).
//      Read with GET /api/state, written with PUT /api/state.
//   2. Proof photos - R2 objects keyed proof/<timestamp>-<uuid>. Referenced by
//      key from the state JSON but stored as binaries, so they are NOT in Git
//      and are the only thing genuinely lost if Sites is retired first.
//
// Usage:
//   node scripts/migrate-from-sites.mjs \
//     --from https://<sites-host> \
//     --to   https://command.argrounds.com
//
//   --dry-run   report what would move, change nothing
//   --state-only / --photos-only   run one half
//   --backup <path>   where to write the state snapshot (default: ./grounds-command-backup-<ts>.json)
//
// If the destination sits behind Cloudflare Access (it should), create a
// service token and pass its credentials so this script can get through:
//   export CF_ACCESS_CLIENT_ID=...   CF_ACCESS_CLIENT_SECRET=...
// Same for the source if the Sites project is access-restricted:
//   export SOURCE_COOKIE='<cookie header copied from a logged-in browser session>'

import { writeFile } from "node:fs/promises";

function parseArgs(argv) {
  const args = { dryRun: false, stateOnly: false, photosOnly: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--state-only") args.stateOnly = true;
    else if (arg === "--photos-only") args.photosOnly = true;
    else if (arg === "--from") args.from = argv[++i];
    else if (arg === "--to") args.to = argv[++i];
    else if (arg === "--backup") args.backup = argv[++i];
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function usage() {
  console.log(
    [
      "Usage: node scripts/migrate-from-sites.mjs --from <sites-url> --to <cloudflare-url>",
      "",
      "  --dry-run       Report what would move without changing anything",
      "  --state-only    Migrate the operations state only",
      "  --photos-only   Migrate proof photos only",
      "  --backup <path> Where to write the state snapshot",
      "",
      "Env: CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET for a destination behind",
      "     Cloudflare Access; SOURCE_COOKIE for a restricted source.",
    ].join("\n"),
  );
}

function destHeaders(extra = {}) {
  const headers = { ...extra };
  if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
    headers["CF-Access-Client-Id"] = process.env.CF_ACCESS_CLIENT_ID;
    headers["CF-Access-Client-Secret"] = process.env.CF_ACCESS_CLIENT_SECRET;
  }
  return headers;
}

function sourceHeaders(extra = {}) {
  const headers = { ...extra };
  if (process.env.SOURCE_COOKIE) headers.Cookie = process.env.SOURCE_COOKIE;
  return headers;
}

// An Access-protected endpoint answers an unauthenticated request with a login
// redirect or an HTML challenge, not an error. Without this check the script
// would happily parse the login page as state and report success.
async function readJson(response, what) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `${what}: expected JSON but received "${contentType || "no content-type"}" ` +
        `(HTTP ${response.status}). This usually means an authentication wall - ` +
        `set CF_ACCESS_CLIENT_ID/SECRET or SOURCE_COOKIE.`,
    );
  }
  return response.json();
}

// Proof keys live at unknown depths in the state tree, so walk the whole thing
// rather than assuming a shape. Matches the key format written by
// app/api/proof/route.ts.
function collectProofKeys(node, found = new Set()) {
  if (typeof node === "string") {
    if (/^proof\/\d+-[0-9a-f-]{36}$/i.test(node)) found.add(node);
    return found;
  }
  if (Array.isArray(node)) {
    for (const item of node) collectProofKeys(item, found);
    return found;
  }
  if (node && typeof node === "object") {
    for (const value of Object.values(node)) collectProofKeys(value, found);
  }
  return found;
}

async function fetchState(from) {
  const response = await fetch(new URL("/api/state", from), {
    headers: sourceHeaders(),
  });
  if (!response.ok) throw new Error(`GET ${from}/api/state failed: HTTP ${response.status}`);
  const body = await readJson(response, "GET /api/state");
  if (!body || typeof body !== "object" || !("state" in body)) {
    throw new Error("GET /api/state did not return a { state } object.");
  }
  return body.state;
}

async function pushState(to, state) {
  const response = await fetch(new URL("/api/state", to), {
    method: "PUT",
    headers: destHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ state }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`PUT ${to}/api/state failed: HTTP ${response.status} ${detail.slice(0, 200)}`);
  }
  await readJson(response, "PUT /api/state");
}

async function migratePhoto(key, from, to) {
  const source = await fetch(new URL(`/api/proof?key=${encodeURIComponent(key)}`, from), {
    headers: sourceHeaders(),
  });
  if (!source.ok) return { key, ok: false, reason: `source HTTP ${source.status}` };

  const contentType = source.headers.get("content-type") ?? "application/octet-stream";
  const blob = await source.blob();

  // POST /api/proof mints a fresh key, so the upload lands under a new name and
  // the state's existing reference would dangle. Re-key the state instead of
  // pretending the copy preserved the original key.
  const form = new FormData();
  form.append("file", blob, key.split("/").pop() ?? "proof.jpg");

  const upload = await fetch(new URL("/api/proof", to), {
    method: "POST",
    headers: destHeaders(),
    body: form,
  });
  if (!upload.ok) return { key, ok: false, reason: `destination HTTP ${upload.status}` };

  const result = await upload.json().catch(() => null);
  if (!result?.key) return { key, ok: false, reason: "destination returned no key" };
  return { key, ok: true, newKey: result.key, bytes: blob.size, contentType };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return usage();
  if (!args.from || !args.to) {
    usage();
    throw new Error("Both --from and --to are required.");
  }

  console.log(`Source:      ${args.from}`);
  console.log(`Destination: ${args.to}`);
  if (args.dryRun) console.log("Mode:        DRY RUN (nothing will be written)\n");

  console.log("Reading operations state from source...");
  const state = await fetchState(args.from);

  const backupPath =
    args.backup ?? `./grounds-command-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  await writeFile(backupPath, JSON.stringify({ state }, null, 2), "utf8");
  const sizeKb = (JSON.stringify(state).length / 1024).toFixed(1);
  console.log(`  Saved a ${sizeKb} KB snapshot to ${backupPath}`);

  const proofKeys = [...collectProofKeys(state)];
  console.log(`  Found ${proofKeys.length} proof photo reference(s)\n`);

  const keyRemap = new Map();

  if (!args.stateOnly && proofKeys.length > 0) {
    console.log(`Copying ${proofKeys.length} proof photo(s)...`);
    if (args.dryRun) {
      for (const key of proofKeys) console.log(`  would copy ${key}`);
    } else {
      let done = 0;
      for (const key of proofKeys) {
        const result = await migratePhoto(key, args.from, args.to);
        done += 1;
        if (result.ok) {
          keyRemap.set(result.key, result.newKey);
          console.log(`  [${done}/${proofKeys.length}] ${key} -> ${result.newKey} (${result.bytes} bytes)`);
        } else {
          console.error(`  [${done}/${proofKeys.length}] FAILED ${key}: ${result.reason}`);
        }
      }
    }
    console.log("");
  }

  if (!args.photosOnly) {
    // Rewrite the copied photos' keys before pushing, so references resolve.
    let payload = state;
    if (keyRemap.size > 0) {
      let serialized = JSON.stringify(state);
      for (const [oldKey, newKey] of keyRemap) {
        serialized = serialized.split(JSON.stringify(oldKey).slice(1, -1)).join(newKey);
      }
      payload = JSON.parse(serialized);
      console.log(`Re-pointed ${keyRemap.size} photo reference(s) to their new keys.`);
    }

    console.log("Writing operations state to destination...");
    if (args.dryRun) {
      console.log("  would PUT /api/state");
    } else {
      await pushState(args.to, payload);
      console.log("  Done.");
    }
  }

  console.log("\nMigration complete. Before retiring the Sites project, confirm on the");
  console.log("destination that routes, sites, crews, visits and payments all render,");
  console.log("and that proof photos load. Keep the snapshot above until you have.");
}

main().catch((error) => {
  console.error(`\nMigration failed: ${error.message}`);
  process.exitCode = 1;
});
