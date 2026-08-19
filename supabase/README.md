# Supabase schema

The marketing site's Pages Functions (`argrounds-website/argrounds-final/functions/api/`)
read and write this project. Grounds Command does not — it uses Cloudflare D1
and R2 instead, so the two datastores are independent.

| | |
| --- | --- |
| Project ref | `eldlzdyqntbymmoxykff` |
| Organization | `Argrounds` |
| Region | `us-west-2` |
| Tables | `leads`, `customers`, `jobs`, `photos`, `payments` |

## Migrations

`migrations/20260414000000_baseline_schema.sql` is a retroactive baseline. The
tables were created by hand in the SQL editor months before any migration was
recorded, so the file was reconstructed from the live database on 2026-08-17 and
back-dated to the day the project was created. The remote project's migration
history therefore starts at `20260817130352`; the baseline is not recorded there.

That mismatch is safe to leave alone. Every statement in the baseline is
idempotent — `create table if not exists`, `create index if not exists`, and
policy creation guarded by `pg_policies` lookups — so `supabase db push` applying
it to the existing project changes nothing, and applying it to a fresh project
reproduces the schema before later migrations run.

Write new migrations as ordinary non-idempotent SQL. The guards exist only
because the baseline describes objects that already existed.

## Row level security

RLS is enabled on all five tables. Only `leads` has policies: `anon` may insert
(the public quote form), while `authenticated` and `service_role` have full
access.

`customers`, `jobs`, `photos` and `payments` deliberately have no policies, which
denies both `anon` and `authenticated`. The Pages Functions reach them with the
service-role key, which bypasses RLS, so deny-all costs the application nothing
while keeping customer contact details, job prices and payment records
unreachable from any browser-side key. The Supabase linter flags this as
`rls_enabled_no_policy` at INFO level — that finding is the intended posture.

Before adding a policy to any of those four tables, check whether Supabase Auth
signups are open. A permissive `authenticated` policy grants access to anyone who
can create an account, which is a different exposure from what the service-role
path allows.

## Known gaps

`auth.users` is empty, so no one can sign in. `/api/leads-list`, `/api/leads-update`
and `/api/leads-delete` verify a user session before acting and therefore return
401 for every caller until an admin user exists. `create-user.js` in the site
directory creates one.

Four API handlers are stubs that return success without writing anything:
`quotes-create.js`, `jobs-create.js`, `photos-upload.js` and
`payments-create-link.js`. Nothing in the site currently calls them, which is why
`customers`, `jobs`, `photos` and `payments` are all empty.
