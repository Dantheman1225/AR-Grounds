const SITE_ORIGIN = 'https://argrounds.com';
const SOCIAL_IMAGE = `${SITE_ORIGIN}/assets/images/hero/hero-1.png`;

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

class RemoveElementHandler {
  element(element) {
    element.remove();
  }
}

class HeadMetadataHandler {
  constructor({ canonicalUrl, noindex }) {
    this.canonicalUrl = canonicalUrl;
    this.noindex = noindex;
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

    element.append(
      [
        `<link rel="canonical" href="${canonical}">`,
        `<meta property="og:url" content="${canonical}">`,
        `<meta property="og:image" content="${socialImage}">`,
        '<meta property="og:image:alt" content="Grounds Maintenance pressure washing and exterior property services in Central Arkansas">',
        '<meta name="twitter:card" content="summary_large_image">',
        `<meta name="twitter:image" content="${socialImage}">`,
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
    .on('head', new HeadMetadataHandler({ canonicalUrl, noindex }))
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
