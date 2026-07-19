import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const siteRoot = path.join(repoRoot, 'argrounds-website', 'argrounds-final');
const homepagePath = path.join(siteRoot, 'index.html');
const stylesheetPath = path.join(siteRoot, 'css', 'home-v2.css');

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const homepage = fs.readFileSync(homepagePath, 'utf8');
const stylesheet = fs.readFileSync(stylesheetPath, 'utf8');

assert(/<body\b[^>]*class=["'][^"']*\bhome-v2\b/i.test(homepage), 'Homepage must use the home-v2 body class.');
assert(homepage.includes('/css/home-v2.css'), 'Homepage must load /css/home-v2.css.');
assert((homepage.match(/<h1\b/gi) || []).length === 1, 'Homepage must contain exactly one H1.');
assert(homepage.includes('id="quoteForm"'), 'Homepage quote form is missing #quoteForm.');
assert(homepage.includes('id="submitBtn"'), 'Homepage quote form is missing #submitBtn.');
assert(homepage.includes('id="formSuccess"'), 'Homepage quote form is missing #formSuccess.');
assert(homepage.includes('/js/main.js'), 'Homepage must load main.js.');
assert(homepage.includes('/js/quote-form.js'), 'Homepage must load quote-form.js.');
assert(stylesheet.includes('.home-v2 .home-hero'), 'Homepage stylesheet is missing the scoped hero rules.');
assert(stylesheet.includes('@media (prefers-reduced-motion: reduce)'), 'Homepage stylesheet must support reduced motion.');

for (const field of ['first_name', 'last_name', 'phone', 'address', 'service']) {
  assert(new RegExp(`name=["']${field}["']`).test(homepage), `Homepage quote form is missing ${field}.`);
}

const forbiddenClaims = [
  '50+ happy homeowners',
  'Sarah M.',
  'Satisfaction guarantee',
  'hero-carousel',
  'carousel-slide',
];
for (const claim of forbiddenClaims) {
  assert(!homepage.includes(claim), `Homepage contains removed or unsupported content: ${claim}`);
}

const assetUrls = new Set([
  ...[...homepage.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/gi)].map((match) => match[1]),
  ...[...stylesheet.matchAll(/url\(["']?(\/assets\/[^"')]+)["']?\)/gi)].map((match) => match[1]),
]);

for (const url of assetUrls) {
  const filePath = path.join(siteRoot, decodeURIComponent(url.slice(1)));
  assert(fs.existsSync(filePath), `Referenced asset does not exist: ${url}`);
}

const imageTags = [...homepage.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
assert(imageTags.length > 0, 'Homepage must contain images.');
for (const tag of imageTags) {
  assert(/\balt=["'][^"']*["']/i.test(tag), `Image is missing an alt attribute: ${tag.slice(0, 120)}`);
}

if (errors.length) {
  console.error('\nHomepage validation failed:\n');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Homepage validation passed with ${assetUrls.size} verified assets and ${imageTags.length} images.`);
