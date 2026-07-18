import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const siteRoot = path.join(repoRoot, 'argrounds-website', 'argrounds-final');
const SITE_ORIGIN = 'https://argrounds.com';
const checkOnly = process.argv.includes('--check');

const utilityRoutes = new Set([
  '/404',
  '/thank-you',
  '/test_svg',
]);

const topLevelRoutes = new Set([
  '/about',
  '/contact',
  '/faq',
  '/gallery',
  '/quote',
]);

function walkHtml(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.wrangler') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkHtml(fullPath));
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

function routeFromFile(filePath) {
  const relative = path.relative(siteRoot, filePath).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'index.html'.length)}`;
  if (relative.endsWith('.html')) return `/${relative.slice(0, -'.html'.length)}`;
  return null;
}

function isNoindexRoute(route) {
  return route.startsWith('/admin/') || route === '/admin' || utilityRoutes.has(route);
}

function removeTag(html, pattern) {
  return html.replace(pattern, '');
}

function normalizeInternalLinks(html) {
  const routes = ['about', 'contact', 'faq', 'gallery', 'quote'];
  let output = html
    .replaceAll('href="/index.html"', 'href="/"')
    .replaceAll("href='/index.html'", "href='/'")
    .replaceAll('href="index.html"', 'href="/"')
    .replaceAll("href='index.html'", "href='/'");

  for (const route of routes) {
    output = output
      .replaceAll(`href="/${route}.html"`, `href="/${route}"`)
      .replaceAll(`href='/${route}.html'`, `href='/${route}'`)
      .replaceAll(`href="${route}.html"`, `href="/${route}"`)
      .replaceAll(`href='${route}.html'`, `href='/${route}'`);
  }

  return output;
}

function injectHeadMetadata(html, route) {
  let output = normalizeInternalLinks(html);

  output = removeTag(
    output,
    /\s*<link\b[^>]*\brel=["']canonical["'][^>]*>\s*/gi,
  );
  output = removeTag(
    output,
    /\s*<meta\b[^>]*\bproperty=["']og:url["'][^>]*>\s*/gi,
  );
  output = removeTag(
    output,
    /\s*<meta\b[^>]*\bname=["']robots["'][^>]*>\s*/gi,
  );

  const noindex = isNoindexRoute(route);
  const metadata = noindex
    ? '  <meta name="robots" content="noindex,nofollow,noarchive">\n'
    : [
        `  <link rel="canonical" href="${SITE_ORIGIN}${route}">`,
        `  <meta property="og:url" content="${SITE_ORIGIN}${route}">`,
      ].join('\n') + '\n';

  return output.replace(/<\/head>/i, `${metadata}</head>`);
}

if (!fs.existsSync(siteRoot)) {
  console.error(`Site root not found: ${siteRoot}`);
  process.exit(1);
}

const changed = [];
for (const filePath of walkHtml(siteRoot)) {
  const route = routeFromFile(filePath);
  if (!route) continue;

  const normalizedRoute = topLevelRoutes.has(route.replace(/\/$/, ''))
    ? route.replace(/\/$/, '')
    : route;
  const original = fs.readFileSync(filePath, 'utf8');
  const next = injectHeadMetadata(original, normalizedRoute);

  if (next !== original) {
    changed.push(path.relative(repoRoot, filePath).split(path.sep).join('/'));
    if (!checkOnly) fs.writeFileSync(filePath, next, 'utf8');
  }
}

if (checkOnly && changed.length) {
  console.error('Static SEO normalization is required for:');
  for (const file of changed) console.error(`- ${file}`);
  process.exit(1);
}

console.log(
  changed.length
    ? `${checkOnly ? 'Would normalize' : 'Normalized'} ${changed.length} HTML files.`
    : 'Static SEO metadata is already normalized.',
);
