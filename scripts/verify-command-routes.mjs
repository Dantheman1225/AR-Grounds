#!/usr/bin/env node
// Checks that the deployed argrounds.com actually sends the Grounds Command
// entry points to command.argrounds.com.
//
// This exists because the failure it catches is invisible in the repo. The
// command-path branch in functions/_middleware.js only takes effect when the
// *site* is redeployed; deploying the grounds-command Worker does not touch it.
// While the site lags, /admin-command quietly returns the marketing 404 even
// though main looks correct.
//
// Usage: node scripts/verify-command-routes.mjs [--site https://argrounds.com]

const SITE = process.argv.includes('--site')
  ? process.argv[process.argv.indexOf('--site') + 1]
  : 'https://argrounds.com';

const COMMAND_HOST = 'command.argrounds.com';

// One representative of each kind the middleware routes: a page, an alias, a
// hashed asset, and the two API endpoints the Worker owns.
const COMMAND_PATHS = [
  '/admin-command',
  '/admincommand',
  '/worker-command',
  '/worker',
  '/field',
  '/field-command',
  '/workercommand',
  '/workspace',
  '/command-assets/probe.js',
  '/api/state',
  '/api/proof',
];

// Must keep being served by the site itself.
const SITE_PATHS = ['/', '/about', '/services/', '/quote'];

async function head(url) {
  const res = await fetch(url, { method: 'GET', redirect: 'manual' });
  return { status: res.status, location: res.headers.get('location') };
}

let failures = 0;

function report(ok, line) {
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${line}`);
}

for (const path of COMMAND_PATHS) {
  let result;
  try {
    result = await head(`${SITE}${path}`);
  } catch (error) {
    report(false, `${path} -> request failed: ${error.message}`);
    continue;
  }

  const { status, location } = result;
  if (status < 300 || status > 399 || !location) {
    const hint = status === 404
      ? ' (the site is serving its own 404 - redeploy the site so the current _middleware.js ships)'
      : '';
    report(false, `${path} -> ${status}, expected a redirect${hint}`);
    continue;
  }

  const host = new URL(location, `${SITE}${path}`).host;
  report(host === COMMAND_HOST, `${path} -> ${status} ${host}`);
}

for (const path of SITE_PATHS) {
  let result;
  try {
    result = await head(`${SITE}${path}`);
  } catch (error) {
    report(false, `${path} -> request failed: ${error.message}`);
    continue;
  }

  const { status, location } = result;
  const host = location ? new URL(location, `${SITE}${path}`).host : null;
  // A marketing page must not be handed to the command host. Its own trailing
  // slash normalization redirects are fine.
  report(host !== COMMAND_HOST, `${path} -> ${status}${host ? ` ${host}` : ''}`);
}

console.log(
  failures === 0
    ? `\nAll ${COMMAND_PATHS.length + SITE_PATHS.length} routes behave as expected on ${SITE}.`
    : `\n${failures} route(s) wrong on ${SITE}.`,
);

process.exit(failures === 0 ? 0 : 1);
