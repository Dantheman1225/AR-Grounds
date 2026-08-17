import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const ignoredDirectories = new Set([
  '.git',
  '.wrangler',
  'node_modules',
  'dist',
  'coverage',
  '.next',
]);

const ignoredExtensions = new Set([
  '.avif', '.bmp', '.gif', '.ico', '.jpeg', '.jpg', '.pdf', '.png',
  '.svgz', '.webp', '.woff', '.woff2', '.zip',
]);

const allowedSecretTemplates = new Set([
  '.dev.vars.example',
  '.env.example',
  '.env.sample',
  '.env.template',
]);

const forbiddenSecretFiles = new Set([
  '.dev.vars',
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.env.test',
]);

const failures = [];

function relative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    inspectFile(fullPath);
  }
}

function inspectFile(filePath) {
  const fileName = path.basename(filePath);
  const filePathRelative = relative(filePath);

  if (forbiddenSecretFiles.has(fileName) && !allowedSecretTemplates.has(fileName)) {
    failures.push(`${filePathRelative}: committed environment/secret file`);
    return;
  }

  if (ignoredExtensions.has(path.extname(fileName).toLowerCase())) return;

  const stat = fs.statSync(filePath);
  if (stat.size > 1_000_000) return;

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return;
  }

  inspectJwtTokens(filePathRelative, content);
  inspectKnownSecretFormats(filePathRelative, content);
}

function inspectJwtTokens(filePathRelative, content) {
  const jwtPattern = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{20,}/g;

  for (const token of content.match(jwtPattern) || []) {
    try {
      const encodedPayload = token.split('.')[1];
      const padded = encodedPayload.padEnd(
        encodedPayload.length + ((4 - (encodedPayload.length % 4)) % 4),
        '='
      );
      const payload = JSON.parse(
        Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
      );

      if (payload?.role === 'service_role') {
        failures.push(`${filePathRelative}: embedded Supabase service-role JWT`);
      }
    } catch {
      // Ignore malformed JWT-like text. Other checks still run.
    }
  }
}

function inspectKnownSecretFormats(filePathRelative, content) {
  const patterns = [
    {
      name: 'private key block',
      regex: new RegExp(['-----BEGIN ', '(?:RSA |EC |OPENSSH )?', 'PRIVATE KEY-----'].join('')),
    },
    {
      name: 'Stripe live secret key',
      regex: new RegExp(['sk', '_live_', '[A-Za-z0-9]{16,}'].join('')),
    },
    {
      name: 'Resend API key',
      regex: new RegExp(['re', '_[A-Za-z0-9]{20,}'].join('')),
    },
    {
      name: 'GitHub personal access token',
      regex: new RegExp(['gh', '[pousr]_', '[A-Za-z0-9]{30,}'].join('')),
    },
  ];

  for (const { name, regex } of patterns) {
    if (regex.test(content)) {
      failures.push(`${filePathRelative}: possible ${name}`);
    }
  }
}

walk(repoRoot);

if (failures.length > 0) {
  console.error('\nSecurity check failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('\nRemove the secret, rotate it if it was real, and keep only sanitized example files.\n');
  process.exit(1);
}

console.log('Security check passed: no committed secret files or high-risk credential formats found.');
