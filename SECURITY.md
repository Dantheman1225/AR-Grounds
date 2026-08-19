# Security Policy

## Secret handling

Never commit credentials, private keys, production passwords, `.env` files, `.dev.vars`, or Cloudflare/Wrangler temporary state.

Use the sanitized template at:

`argrounds-website/argrounds-final/.dev.vars.example`

Copy it to `.dev.vars` only on your local machine and replace the placeholders there. Production secrets belong in the Cloudflare Pages encrypted environment settings.

## Required incident response for the exposed Supabase key

A Supabase service-role key was committed to this public repository in
`argrounds-website/argrounds-final/.dev.vars` (added 2026-04-14, removed
2026-07-17 in 72c9795).

**The credential is still readable.** Deleting the file removed it from the
working tree only. The blob remains reachable from history, and this repository
is public, so anyone can still recover the key from any clone until history is
rewritten. Treat the key as compromised regardless of how long ago it was
removed.

Remaining actions, in order:

1. Rotate the Supabase service-role key in the Supabase project settings.
2. Replace `SUPABASE_SERVICE_ROLE_KEY` in Cloudflare Pages with the rotated key.
3. Redeploy and test quote submission and admin operations.
4. Revoke the old key and confirm it no longer works.
5. Rewrite the repository history with `git filter-repo` or BFG Repo-Cleaner to remove `.dev.vars` and the hardcoded credential from every commit.
6. Force-push the cleaned branches only after making a backup and coordinating with anyone who has a clone.
7. Review Supabase logs and data for unexpected access while the key was exposed.

Rotation is what actually ends the exposure; the history rewrite in steps 5 and
6 only stops the old value from being handed to new readers. Do step 1 first,
and do not treat the rewrite as a substitute for it — forks, clones, caches and
any copy already taken keep the old blob.

A service-role key bypasses row level security entirely, so the exposed value
carried full read and write access to every table in the project.

## Automated checks

Every pull request and push to `main` runs:

- `node scripts/security-check.mjs`
- `npm audit --omit=dev --audit-level=high`

The repository check blocks committed environment files and several high-risk credential formats, including Supabase service-role JWTs.

## Reporting a vulnerability

Do not open a public issue containing credentials, customer information, or exploit details. Contact the repository owner privately and rotate any exposed credential immediately.
