# Grounds Command

Grounds Command is the operations dashboard for Grounds Maintenance LLC's
Arkansas site work. It tracks routes, site maps, visits, proof photos, QC,
crew assignments, pesticide planning, service tickets, invoice/payment status,
and live weather/finance placeholders.

This project was exported from ChatGPT Sites as a full-stack
[vinext](https://github.com/cloudflare/vinext) app. It is not a plain static
GitHub Pages site. To run it live from GitHub, deploy it to a Node/Cloudflare
Workers-compatible host and provide the Cloudflare D1 binding named `DB`.

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
- Seed route, site, crew, inventory, visit, proof, and payment state lives under
  `lib/`.
- Site map images live under `public/maps/`.
- The current D1 schema and seed-state storage code live under `db/` and
  `drizzle/`.
- `.openai/hosting.json` declares the ChatGPT Sites logical D1/R2 bindings.
- `vite.config.ts` simulates declared bindings for local development.
- `app/chatgpt-auth.ts` provides optional ChatGPT sign-in helpers for Sites.

## Deployment Notes

For a GitHub-backed production move, use a host that can run the included
Cloudflare Worker output from `npm run build`. The build emits
`dist/server/index.js` and expects a callable `fetch(request, env, ctx)` export.

Minimum setup:

1. Install Node.js `>=22.13.0`.
2. Run `npm ci`.
3. Run `npm test`.
4. Configure a Cloudflare D1 database binding named `DB`.
5. Deploy the built Worker artifact from `dist/`.

GitHub Pages alone will not run the API routes, D1 persistence, proof endpoints,
or live weather routes in this app.

## ARgrounds.com Route Plan

When this app is mounted on ARgrounds.com, the intended command entry points are:

| URL path | Purpose |
| --- | --- |
| `/admin-command` | Owner/admin command center |
| `/admincommand` | Alias for `/admin-command` |
| `/worker-command` | Worker/field command center |
| `/workercommand` | Alias for `/worker-command` |
| `/worker` | Alias for `/worker-command` |
| `/field` | Alias for `/worker-command` |
| `/field-command` | Alias for `/worker-command` |

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Diagnostic Commands

- `npm run install:ci`: perform the one bounded lockfile install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build and validate the deployable Sites artifact
- `npm run start`: start the built Vinext application
- `npm test`: build, validate, and verify the rendered development-preview metadata
- `npm run validate:artifact`: recheck an existing artifact's manifest and ESM `default.fetch` export
- `npm run db:generate`: generate Drizzle migrations after schema changes

Use build and validation commands for targeted diagnosis after a remote failure, not as part of the normal checkpoint path.

The timeout defaults can be overridden for a controlled canary with `SITES_INSTALL_TIMEOUT`, `SITES_INSTALL_KILL_AFTER`, `SITES_BUILD_TIMEOUT`, and `SITES_BUILD_KILL_AFTER`. A timeout fails the command; the helpers never retry an unchanged install or build.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
