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

function walkHtml(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.wrangler') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'admin') continue;
      files.push(...walkHtml(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
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
