const SITE_ORIGIN = 'https://argrounds.com';

// Grounds Command runs as a separate Cloudflare Worker (it needs D1, R2 and
// server rendering). Proxying it from here keeps the address bar on
// argrounds.com/admin-command instead of bouncing to another hostname.
//
// Doing this in one function rather than a dozen dashboard Worker routes also
// keeps the path list reviewable in the repo, next to the site it has to
// coexist with.
const COMMAND_ORIGIN = 'https://command.argrounds.com';

// Exact page routes owned by the Worker, plus their aliases.
const COMMAND_ROUTES = new Set([
  '/admin-command',
  '/admincommand',
  '/worker-command',
  '/workercommand',
  '/worker',
  '/field',
  '/field-command',
  '/workspace',
]);

// Directory prefixes the Worker serves. Its hashed JS/CSS is emitted under
// /command-assets/ specifically so it does not collide with this site's
// /assets/ (brand, gallery, hero images) - see build.assetsDir in
// vite.config.ts. /api/ entries are listed individually because this site owns
// /api/leads-create, /api/contact and friends.
const COMMAND_PREFIXES = [
  '/command-assets/',
  '/brand/',
  '/maps/',
  '/api/state',
  '/api/proof',
  '/api/live/',
];

function isCommandPath(pathname) {
  if (COMMAND_ROUTES.has(pathname)) return true;
  for (const route of COMMAND_ROUTES) {
    if (pathname.startsWith(`${route}/`)) return true;
  }
  return COMMAND_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
const SOCIAL_IMAGE = `${SITE_ORIGIN}/assets/images/hero/hero-1.png`;
const BUSINESS_ID = `${SITE_ORIGIN}/#business`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

const CLEAN_FILE_ROUTES = new Set([
  '/about',
  '/contact',
  '/faq',
  '/gallery',
  '/quote',
]);

const DIRECTORY_ROUTES = new Set([
  '/services',
  '/services/driveway-cleaning',
  '/services/sidewalk-walkway-cleaning',
  '/services/patio-paver-cleaning',
  '/services/deck-cleaning',
  '/services/fence-cleaning',
  '/services/porch-entryway-cleaning',
  '/services/storefront-entry-cleaning',
  '/learning-center',
  '/learning-center/what-is-pressure-washing',
  '/learning-center/pressure-washing-vs-power-washing',
  '/learning-center/what-surfaces-can-be-pressure-washed',
  '/learning-center/how-often-should-you-clean-a-driveway',
  '/learning-center/why-sidewalks-turn-black',
  '/learning-center/how-to-improve-curb-appeal-with-pressure-washing',
]);

const PAGE_TITLES = new Map([
  ['/', 'Grounds Maintenance'],
  ['/about', 'About Grounds Maintenance'],
  ['/contact', 'Contact Grounds Maintenance'],
  ['/faq', 'Frequently Asked Questions'],
  ['/gallery', 'Before and After Gallery'],
  ['/quote', 'Request a Free Quote'],
  ['/services/', 'Pressure Washing Services'],
  ['/services/driveway-cleaning/', 'Driveway Cleaning'],
  ['/services/sidewalk-walkway-cleaning/', 'Sidewalk and Walkway Cleaning'],
  ['/services/patio-paver-cleaning/', 'Patio and Paver Cleaning'],
  ['/services/deck-cleaning/', 'Deck Cleaning'],
  ['/services/fence-cleaning/', 'Fence Cleaning'],
  ['/services/porch-entryway-cleaning/', 'Porch and Entryway Cleaning'],
  ['/services/storefront-entry-cleaning/', 'Storefront and Entry Cleaning'],
  ['/learning-center/', 'Pressure Washing Learning Center'],
  ['/learning-center/what-is-pressure-washing/', 'What Is Pressure Washing?'],
  ['/learning-center/pressure-washing-vs-power-washing/', 'Pressure Washing vs. Power Washing'],
  ['/learning-center/what-surfaces-can-be-pressure-washed/', 'What Surfaces Can Be Pressure Washed?'],
  ['/learning-center/how-often-should-you-clean-a-driveway/', 'How Often Should You Clean a Driveway?'],
  ['/learning-center/why-sidewalks-turn-black/', 'Why Sidewalks Turn Black'],
  ['/learning-center/how-to-improve-curb-appeal-with-pressure-washing/', 'How to Improve Curb Appeal With Pressure Washing'],
]);

function normalizePath(pathname) {
  let path = pathname || '/';

  if (path === '/index.html') return '/';
  if (path.endsWith('/index.html')) {
    path = path.slice(0, -'index.html'.length);
  } else if (path.endsWith('.html')) {
    path = path.slice(0, -'.html'.length);
  }

  if (path.length > 1 && path.endsWith('/')) {
    const withoutSlash = path.slice(0, -1);
    if (CLEAN_FILE_ROUTES.has(withoutSlash)) return withoutSlash;
  }

  if (DIRECTORY_ROUTES.has(path)) return `${path}/`;
  if (DIRECTORY_ROUTES.has(path.replace(/\/$/, ''))) {
    return `${path.replace(/\/$/, '')}/`;
  }

  return path || '/';
}

function escapeAttribute(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function isPrivateOrUtilityPath(pathname, status) {
  return (
    status >= 400 ||
    pathname.startsWith('/admin/') ||
    pathname === '/admin' ||
    pathname === '/thank-you' ||
    pathname === '/thank-you.html' ||
    pathname === '/test_svg' ||
    pathname === '/test_svg.html'
  );
}

function humanizeSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getPageTitle(pathname) {
  if (PAGE_TITLES.has(pathname)) return PAGE_TITLES.get(pathname);
  const slug = pathname.split('/').filter(Boolean).at(-1);
  return slug ? humanizeSlug(slug) : 'Grounds Maintenance';
}

function buildBreadcrumb(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${SITE_ORIGIN}/`,
    },
  ];

  let partial = '';
  segments.forEach((segment, index) => {
    partial += `/${segment}`;
    const normalized = normalizePath(partial);
    const isLast = index === segments.length - 1;
    const name =
      segment === 'services'
        ? 'Services'
        : segment === 'learning-center'
          ? 'Learning Center'
          : isLast
            ? getPageTitle(pathname)
            : humanizeSlug(segment);

    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name,
      item: `${SITE_ORIGIN}${normalized}`,
    });
  });

  return {
    '@type': 'BreadcrumbList',
    '@id': `${SITE_ORIGIN}${pathname}#breadcrumb`,
    itemListElement: items,
  };
}

function buildStructuredData(pathname) {
  const canonicalUrl = `${SITE_ORIGIN}${pathname}`;
  const title = getPageTitle(pathname);
  const graph = [
    {
      '@type': 'LocalBusiness',
      '@id': BUSINESS_ID,
      name: 'Grounds Maintenance',
      url: `${SITE_ORIGIN}/`,
      telephone: '+1-501-961-0788',
      image: SOCIAL_IMAGE,
      priceRange: '$$',
      areaServed: [
        { '@type': 'City', name: 'Little Rock' },
        { '@type': 'City', name: 'North Little Rock' },
        { '@type': 'City', name: 'Sherwood' },
        { '@type': 'AdministrativeArea', name: 'Central Arkansas' },
      ],
      sameAs: [
        'https://www.facebook.com/share/17FhywEE3p/?mibextid=wwXIfr',
        'https://www.instagram.com/ground_maintenance',
        'https://www.tiktok.com/@grounds_maintenance',
        'https://youtube.com/@grounds_maintenance',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: `${SITE_ORIGIN}/`,
      name: 'Grounds Maintenance',
      publisher: { '@id': BUSINESS_ID },
      inLanguage: 'en-US',
    },
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: title,
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': BUSINESS_ID },
      breadcrumb: { '@id': `${canonicalUrl}#breadcrumb` },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: SOCIAL_IMAGE,
      },
      inLanguage: 'en-US',
    },
    buildBreadcrumb(pathname),
  ];

  if (pathname.startsWith('/services/') && pathname !== '/services/') {
    graph.push({
      '@type': 'Service',
      '@id': `${canonicalUrl}#service`,
      name: title,
      serviceType: title,
      url: canonicalUrl,
      provider: { '@id': BUSINESS_ID },
      areaServed: { '@type': 'AdministrativeArea', name: 'Central Arkansas' },
    });
  }

  if (pathname.startsWith('/learning-center/') && pathname !== '/learning-center/') {
    graph.push({
      '@type': 'Article',
      '@id': `${canonicalUrl}#article`,
      headline: title,
      mainEntityOfPage: { '@id': `${canonicalUrl}#webpage` },
      publisher: { '@id': BUSINESS_ID },
      image: SOCIAL_IMAGE,
      inLanguage: 'en-US',
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c');
}

class RemoveElementHandler {
  element(element) {
    element.remove();
  }
}

class HeadMetadataHandler {
  constructor({ canonicalUrl, noindex, pathname }) {
    this.canonicalUrl = canonicalUrl;
    this.noindex = noindex;
    this.pathname = pathname;
  }

  element(element) {
    if (this.noindex) {
      element.append(
        '<meta name="robots" content="noindex,nofollow,noarchive">',
        { html: true },
      );
      return;
    }

    const canonical = escapeAttribute(this.canonicalUrl);
    const socialImage = escapeAttribute(SOCIAL_IMAGE);
    const structuredData = buildStructuredData(this.pathname);

    element.append(
      [
        `<link rel="canonical" href="${canonical}">`,
        `<meta property="og:url" content="${canonical}">`,
        `<meta property="og:image" content="${socialImage}">`,
        '<meta property="og:image:alt" content="Grounds Maintenance pressure washing and exterior property services in Central Arkansas">',
        '<meta name="twitter:card" content="summary_large_image">',
        `<meta name="twitter:image" content="${socialImage}">`,
        `<script type="application/ld+json">${structuredData}</script>`,
      ].join(''),
      { html: true },
    );
  }
}

export async function onRequest(context) {
  const requestUrl = new URL(context.request.url);
  const normalizedPath = normalizePath(requestUrl.pathname);

  if (requestUrl.hostname === 'www.argrounds.com') {
    requestUrl.hostname = 'argrounds.com';
    requestUrl.protocol = 'https:';
    requestUrl.pathname = normalizedPath;
    return Response.redirect(requestUrl.toString(), 301);
  }

  // Hand Grounds Command paths to the Worker before any normalization or SEO
  // rewriting runs - those rules are written for the marketing pages and would
  // mangle an app route. The request is forwarded whole, so method, headers and
  // body survive for the API endpoints.
  if (isCommandPath(requestUrl.pathname)) {
    const target = new URL(requestUrl.pathname + requestUrl.search, COMMAND_ORIGIN);
    const forwarded = new Request(target, context.request);
    // Strip any client-supplied Access identity headers. Cloudflare sets these
    // on requests that pass Access, but a caller can send them too, and this
    // proxy would otherwise pass them straight through as if they were genuine.
    // The signed CF_Authorization cookie and Cf-Access-Jwt-Assertion survive,
    // and the Worker verifies that signature itself.
    forwarded.headers.delete('Cf-Access-Authenticated-User-Email');
    forwarded.headers.delete('Cf-Access-Authenticated-User-Id');
    const upstream = await fetch(forwarded);
    const proxied = new Response(upstream.body, upstream);
    proxied.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return proxied;
  }

  if (requestUrl.pathname !== normalizedPath) {
    requestUrl.pathname = normalizedPath;
    return Response.redirect(requestUrl.toString(), 301);
  }

  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.toLowerCase().includes('text/html')) {
    return response;
  }

  const noindex = isPrivateOrUtilityPath(normalizedPath, response.status);
  const canonicalUrl = `${SITE_ORIGIN}${normalizedPath}`;

  const transformed = new HTMLRewriter()
    .on('link[rel="canonical"]', new RemoveElementHandler())
    .on('meta[property="og:url"]', new RemoveElementHandler())
    .on('meta[property="og:image"]', new RemoveElementHandler())
    .on('meta[property="og:image:alt"]', new RemoveElementHandler())
    .on('meta[name="twitter:card"]', new RemoveElementHandler())
    .on('meta[name="twitter:image"]', new RemoveElementHandler())
    .on('meta[name="robots"]', new RemoveElementHandler())
    .on('script[type="application/ld+json"]', new RemoveElementHandler())
    .on('head', new HeadMetadataHandler({ canonicalUrl, noindex, pathname: normalizedPath }))
    .transform(response);

  const headers = new Headers(transformed.headers);
  if (noindex) {
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  } else {
    headers.set('Link', `<${canonicalUrl}>; rel="canonical"`);
  }

  return new Response(transformed.body, {
    status: transformed.status,
    statusText: transformed.statusText,
    headers,
  });
}
