# Grounds Command

Grounds Command is the operations dashboard for Grounds Maintenance LLC's Arkansas site work. It tracks routes, site maps, visits, proof photos, QC, crew assignments, pesticide planning, service tickets, invoice/payment status, and live weather/finance placeholders.

This project was exported from ChatGPT Sites as a full-stack [vinext](https://github.com/cloudflare/vinext) app. It is not a plain static GitHub Pages site. To run it live from GitHub, deploy it to a Node/Cloudflare Workers-compatible host and provide the Cloudflare D1 binding named `DB`.

## Public Access Policy

Grounds Command must never depend on a ChatGPT login gate.

Do not add `requireChatGPTUser`, `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, or any OpenAI workspace-auth gate back into this project.

The app's own route code stays anonymous-compatible:

- `/` opens the main Grounds Command dashboard.
- `/admin-command` opens the owner/admin command center.
- `/worker-command` opens the worker/field command center.
- Alias routes redirect straight into those command pages.

Authentication is supplied by Cloudflare Access in front of the deployed
hostname, and authorization by `app/access-identity.ts` — see **Access control**
under Deployment Notes. A sign-in prompt on a deployed preview is that gate, not
a workspace-auth gate in the route code.

## Prerequisites

- Node.js `>=22.13.0`
- Linux with `flock`, `curl`, and GNU `timeout`

## Sites Lifecycle

The Sites lifecycle CLI runs the locked dependency install before returning this checkout. Edit the source under `app/`, then checkpoint when a coherent milestone is ready to inspect or share. The remote Sites builder runs `npm run build` against the pushed commit. Do not repeat install or build as a normal pre-checkpoint step.

This starter does not use `wrangler.jsonc`.

`install:ci` is intentionally a single, non-retrying `npm ci`. It refuses a concurrent install for the same project, consumes a matching image-seeded npm cache with `--prefer-offline` while retaining registry fallback for a missing cache object, otherwise downloads and verifies the complete vinext tarball recorded in `package-lock.json`, limits npm to one socket, and terminates a stalled install. `build` applies a short timeout and then validates the Sites artifact. These helpers target Linux and use GNU `timeout`; they are not native macOS scripts.

Scripts that need writable project-scoped home, npm, XDG, and temporary paths use `scripts/sites-env.sh`. The `dev` and `start` scripts honor the caller's runtime environment and keep Wrangler logs inside the checkout. The generated `.sites-runtime/` directory is disposable and ignored by Git.

## Included Shape

- Main dashboard code lives under `app/`.
- Seed route, site, crew, inventory, visit, proof, and payment state lives under `lib/`.
- Site map images live under `public/maps/`.
- The current D1 schema and seed-state storage code live under `db/` and `drizzle/`.
- `.openai/hosting.json` declares the ChatGPT Sites logical D1/R2 bindings for the exported project.
- `vite.config.ts` simulates declared bindings for local development.

## Deployment Notes

For a GitHub-backed production move, use a host that can run the included Cloudflare Worker output from `npm run build`. The build emits `dist/server/index.js` and expects a callable `fetch(request, env, ctx)` export.

Minimum setup:

1. Install Node.js `>=22.13.0`.
2. Run `npm ci`.
3. Run `npm test`.
4. Configure a Cloudflare D1 database binding named `DB`.
5. Deploy the built Worker artifact from `dist/`.

GitHub Pages alone will not run the API routes, D1 persistence, proof endpoints, or live weather routes in this app.

### Deploying to Cloudflare Workers

One-time, from the Cloudflare account that owns argrounds.com:

```bash
npx wrangler d1 create grounds-command
npx wrangler r2 bucket create grounds-command-proof
```

`d1 create` prints a database id. Export it (and keep it out of Git — it belongs
in CI secrets or your shell profile, not a committed file):

```bash
export CLOUDFLARE_D1_DATABASE_ID="<id printed above>"
npm run deploy:cf
```

`db/state.ts` runs `CREATE TABLE IF NOT EXISTS` on every read and write, so a
brand-new empty database self-initializes — there is no migration step before
the first deploy.

**Where the deploy config actually lives.** `wrangler deploy` does not read a
`wrangler.jsonc` at the repo root — `@cloudflare/vite-plugin` generates
`dist/server/wrangler.json` from the `config` block in `vite.config.ts`, and that
generated file is what ships. Adding a second root-level config silently
*merges*, producing duplicate `DB`/`BUCKET` bindings. Change bindings in
`vite.config.ts` only. Verify any change with:

```bash
npm run build:cf && npx wrangler deploy --dry-run
```

which prints the resolved binding table (`DB`, `BUCKET`, `IMAGES`, `ASSETS`).

`npm run build` is the ChatGPT Sites path — it wraps `vinext build` in the Sites
lifecycle helpers and needs GNU `timeout` plus the `SITES_*` environment. Use
`npm run build:cf` for Cloudflare; it calls `vinext build` directly.

**Access control.** Two layers guard the command routes.

Cloudflare Access is the edge gate. An Access application covers all of
`command.argrounds.com`, so every path on that hostname — pages, `/api/state`,
`/api/proof` — redirects to the `grounds-crew` Access login until the visitor
holds a valid session.

`app/access-identity.ts` is the authorization layer inside the Worker. It
verifies the signed `Cf-Access-Jwt-Assertion` (RS256 against the team JWKS,
then issuer, audience and expiry) rather than trusting the plain
`Cf-Access-Authenticated-User-Email` header, because a caller can send that
header themselves. `OWNER_EMAILS` gets the owner workspace and is the only role
allowed to `PUT /api/state`; `WORKER_EMAILS` gets the field workspace and may
read state and upload proof photos.

**Enforcement is opt-in through configuration, and it fails open.** With
`ACCESS_TEAM_DOMAIN` or `ACCESS_AUD` unset, identity resolves to
`unconfigured` and every route stays open — deliberately, so a missing variable
cannot lock the owner out of a live tool. Setting both begins enforcement.
Set these on the `grounds-command` Worker:

| Variable | Value |
| --- | --- |
| `ACCESS_TEAM_DOMAIN` | `grounds-crew.cloudflareaccess.com` |
| `ACCESS_AUD` | the Access application's Application Audience tag |
| `OWNER_EMAILS` | comma-separated owner addresses |
| `WORKER_EMAILS` | comma-separated field-crew addresses |

Read the AUD tag from the Access application in Zero Trust → Access →
Applications; it is also the `aud` claim in the login redirect from
`command.argrounds.com`. It identifies an application rather than
authenticating anything, but the Worker must pin it, because an unexpired
assertion minted for a *different* Access application would otherwise verify
against the same team JWKS and pass.

Because Access cannot cover `workers.dev`, disable the workers.dev route on
`grounds-command` — otherwise that hostname reaches the dashboard with no edge
gate at all, and with the variables above unset it reaches it with no
authorization either.

## ARgrounds.com Route Plan

The marketing site owns `argrounds.com`; Grounds Command runs on
`command.argrounds.com`. `functions/_middleware.js` on the site redirects the
command entry points to that hostname, so the paths below keep working as
bookmarks and printed links:

| URL path | Purpose |
| --- | --- |
| `/` | Marketing homepage (the site, not the dashboard) |
| `/admin-command` | Owner/admin command center |
| `/admincommand` | Alias for `/admin-command` |
| `/worker-command` | Worker/field command center |
| `/workercommand` | Alias for `/worker-command` |
| `/worker` | Alias for `/worker-command` |
| `/field` | Alias for `/worker-command` |
| `/field-command` | Alias for `/worker-command` |
| `/workspace` | Alias for the command app |

The same redirect covers the Worker's own subresources and endpoints —
`/command-assets/`, `/brand/`, `/maps/`, `/api/state`, `/api/proof` and
`/api/live/` — because the site owns `/assets/` and its own `/api/` handlers.

These redirects live in the site's Pages Functions, so a change to that path
list only takes effect once the **site** is redeployed. Deploying the
`grounds-command` Worker does not update them.

## Diagnostic Commands

- `npm run install:ci`: perform the one bounded lockfile install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build and validate the deployable Sites artifact
- `npm run start`: start the built Vinext application
- `npm test`: build, validate, and verify the rendered development-preview metadata
- `npm run validate:artifact`: recheck an existing artifact's manifest and ESM `default.fetch` export
- `npm run db:generate`: generate Drizzle migrations after schema changes
- `node scripts/verify-command-routes.mjs`: check that the deployed argrounds.com
  really sends the command entry points to `command.argrounds.com`

Run `verify-command-routes.mjs` after deploying the site. The redirects live in
the site's Pages Functions, so a correct `_middleware.js` on `main` proves
nothing about production — while the site lags, `/admin-command` returns the
marketing 404 and nothing in the repo looks wrong.

Use build and validation commands for targeted diagnosis after a remote failure, not as part of the normal checkpoint path.

The timeout defaults can be overridden for a controlled canary with `SITES_INSTALL_TIMEOUT`, `SITES_INSTALL_KILL_AFTER`, `SITES_BUILD_TIMEOUT`, and `SITES_BUILD_KILL_AFTER`. A timeout fails the command; the helpers never retry an unchanged install or build.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
