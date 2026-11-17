import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const siteRoot = path.join(repoRoot, 'argrounds-website', 'argrounds-final');
const sitemapPath = path.join(siteRoot, 'sitemap.xml');
const robotsPath = path.join(siteRoot, 'robots.txt');
const middlewarePath = path.join(siteRoot, 'functions', '_middleware.js');

const excludedFiles = new Set([
  '404.html',
  'thank-you.html',
  'test_svg.html',
]);

const errors = [];
const warnings = [];

function isHtmlSnippet(filename) {
  return filename.endsWith('-snippet.html');
}

function walkHtml(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.wrangler') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'admin') continue;
      files.push(...walkHtml(fullPath));
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.html') &&
      !isHtmlSnippet(entry.name)
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

function routeFromFile(filePath) {
  const relative = path.relative(siteRoot, filePath).split(path.sep).join('/');
  if (excludedFiles.has(relative)) return null;

  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) {
    return `/${relative.slice(0, -'index.html'.length)}`;
  }
  if (relative.endsWith('.html')) {
    return `/${relative.slice(0, -'.html'.length)}`;
  }
  return null;
}

function getTagContent(html, pattern) {
  const match = html.match(pattern);
  return match?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '';
}

function extractSitemapUrls(xml) {
  return [...xml.matchAll(/<loc>(https:\/\/argrounds\.com[^<]*)<\/loc>/g)].map((match) => match[1]);
}

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

// Ignore examples in scripts/comments; check actual customer-facing anchors.
function markupOnly(html) {
  return html.replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}

function decodeAttribute(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const hex = entity.toLowerCase().startsWith('&#x');
    const code = parseInt(entity.slice(hex ? 3 : 2, -1), hex ? 16 : 10);
    return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

function resolvePage(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  const target = path.resolve(siteRoot, `.${decoded}`);
  if (target !== siteRoot && !target.startsWith(siteRoot + path.sep)) return null;
  return [target, `${target}.html`, path.join(target, 'index.html')]
    .find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || null;
}

function checkNavigation(html, route, relative) {
  const markup = markupOnly(html);
  const base = new URL(route, 'https://argrounds.com');
  for (const match of markup.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)) {
    const href = decodeAttribute(match[2]);
    let url;
    try { url = new URL(href, base); } catch {
      errors.push(`${relative}: invalid link ${href}`);
      continue;
    }
    if (!['http:', 'https:'].includes(url.protocol) ||
        !['argrounds.com', 'www.argrounds.com'].includes(url.hostname)) continue;
    const target = resolvePage(url.pathname);
    if (!target) {
      errors.push(`${relative}: missing internal destination ${href}`);
      continue;
    }
    if (url.hash && target.endsWith('.html')) {
      let fragment;
      try { fragment = decodeURIComponent(url.hash.slice(1)); } catch {
        errors.push(`${relative}: invalid fragment ${href}`);
        continue;
      }
      // Text fragments do not refer to element IDs.
      fragment = fragment.split(':~:text=')[0];
      if (!fragment) continue;
      const targetMarkup = markupOnly(fs.readFileSync(target, 'utf8'));
      const ids = [...targetMarkup.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)]
        .map((entry) => decodeAttribute(entry[2]));
      const names = [...targetMarkup.matchAll(/<a\b[^>]*\bname\s*=\s*(["'])(.*?)\1/gi)]
        .map((entry) => decodeAttribute(entry[2]));
      if (!ids.includes(fragment) && !names.includes(fragment)) {
        errors.push(`${relative}: missing fragment target ${href}`);
      }
    }
  }

  const footer = markup.match(/<footer\b[\s\S]*?<div\b[^>]*class=["'][^"']*\bfooter-brand\b[^"']*["'][^>]*>\s*<a\b[^>]*href=(["'])(.*?)\1/i);
  if (footer) {
    let home;
    try { home = new URL(decodeAttribute(footer[2]), base); } catch { return; }
    if (home.origin !== base.origin || home.pathname !== '/' || home.search || home.hash) {
      errors.push(`${relative}: footer brand must link directly to /, found ${footer[2]}`);
    }
  }
}

if (!fs.existsSync(siteRoot)) {
  console.error(`Site root not found: ${siteRoot}`);
  process.exit(1);
}

const htmlFiles = walkHtml(siteRoot);
const publicPages = new Map();
const titles = new Map();

for (const filePath of htmlFiles) {
  const route = routeFromFile(filePath);
  if (!route) continue;

  const html = fs.readFileSync(filePath, 'utf8');
  const relative = path.relative(repoRoot, filePath).split(path.sep).join('/');
  checkNavigation(html, route, relative);
  const title = getTagContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = getTagContent(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  ) || getTagContent(
    html,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i,
  );
  const h1 = getTagContent(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);

  if (!title) errors.push(`${relative}: missing or empty <title>`);
  if (!description) errors.push(`${relative}: missing meta description`);
  if (!h1) errors.push(`${relative}: missing or empty <h1>`);
  if (/name=["']robots["'][^>]+noindex/i.test(html)) {
    errors.push(`${relative}: public page contains noindex`);
  }

  if (title) {
    const existing = titles.get(title) || [];
    existing.push(relative);
    titles.set(title, existing);
  }

  if (publicPages.has(route)) {
    errors.push(`Duplicate public route ${route}: ${publicPages.get(route)} and ${relative}`);
  }
  publicPages.set(route, relative);
}

for (const [title, files] of titles.entries()) {
  if (files.length > 1) warnings.push(`Duplicate title "${title}" in ${files.join(', ')}`);
}

const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
const sitemapUrls = extractSitemapUrls(sitemapXml);
const sitemapSet = new Set(sitemapUrls);
const expectedUrls = new Set([...publicPages.keys()].map((route) => `https://argrounds.com${route}`));

if (sitemapUrls.length !== sitemapSet.size) {
  errors.push('sitemap.xml contains duplicate <loc> entries');
}

for (const url of sorted(expectedUrls)) {
  if (!sitemapSet.has(url)) errors.push(`sitemap.xml is missing ${url}`);
}

for (const url of sorted(sitemapSet)) {
  if (!expectedUrls.has(url)) errors.push(`sitemap.xml contains non-public or unknown URL ${url}`);
  if (url.endsWith('.html') || url.includes('/admin/')) {
    errors.push(`sitemap.xml contains a non-canonical URL ${url}`);
  }
}

const robots = fs.readFileSync(robotsPath, 'utf8');
if (!robots.includes('Sitemap: https://argrounds.com/sitemap.xml')) {
  errors.push('robots.txt does not advertise the production sitemap URL');
}

const middleware = fs.readFileSync(middlewarePath, 'utf8');
const middlewareRequirements = [
  'link[rel="canonical"]',
  'meta[property="og:url"]',
  'script[type="application/ld+json"]',
  'X-Robots-Tag',
  'BreadcrumbList',
  'LocalBusiness',
  'Service',
  'Article',
];
for (const requirement of middlewareRequirements) {
  if (!middleware.includes(requirement)) {
    errors.push(`SEO middleware is missing required behavior: ${requirement}`);
  }
}

for (const warning of warnings) console.warn(`WARNING: ${warning}`);

if (errors.length) {
  console.error('\nSEO validation failed:\n');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`SEO validation passed for ${publicPages.size} public pages and ${sitemapSet.size} sitemap URLs.`);
