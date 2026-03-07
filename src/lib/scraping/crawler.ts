import * as cheerio from 'cheerio';

/**
 * Crawl a website's main pages and extract content.
 * Uses fetch + Cheerio for static HTML parsing (MVP).
 */
export async function crawlMainPages(siteUrl: string): Promise<CrawledPage[]> {
  const baseUrl = new URL(siteUrl).origin;
  const pages: CrawledPage[] = [];

  // Crawl the homepage first
  const homepage = await fetchAndParse(siteUrl);
  if (homepage) {
    pages.push(homepage);
  }

  // Discover internal links to key pages
  const targetPaths = ['/about', '/a-propos', '/qui-sommes-nous', '/products', '/produits', '/services'];
  const discoveredLinks = homepage
    ? extractInternalLinks(homepage.html, baseUrl)
    : [];

  const priorityLinks = discoveredLinks.filter((link) =>
    targetPaths.some((path) => link.toLowerCase().includes(path))
  ).slice(0, 3);

  // Crawl discovered priority pages
  for (const link of priorityLinks) {
    const page = await fetchAndParse(link);
    if (page) {
      pages.push(page);
    }
  }

  return pages;
}

export interface CrawledPage {
  url: string;
  html: string;
  textContent: string;
  title: string;
  cssContent: string[];
  imageUrls: string[];
  metaDescription: string;
}

/**
 * Fetch a URL and parse it with Cheerio.
 */
async function fetchAndParse(url: string): Promise<CrawledPage | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; MailForgeBot/1.0; +https://mailforge.ai)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, nav, footer, cookie banners
    $('script, style, nav, footer, .cookie-banner, .cookie-consent, #cookie, noscript, iframe').remove();

    const textContent = $('body').text().replace(/\s+/g, ' ').trim();
    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || '';

    // Extract CSS (inline styles and linked stylesheets)
    const cssContent: string[] = [];
    $('style').each((_, el) => {
      cssContent.push($(el).text());
    });
    // Extract link[rel=stylesheet] hrefs for further fetching
    const styleLinks: string[] = [];
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        styleLinks.push(href.startsWith('http') ? href : new URL(href, url).href);
      }
    });

    // Fetch external stylesheets (up to 12 for better palette/theme coverage)
    const MAX_STYLESHEETS = 12;
    for (const styleLink of styleLinks.slice(0, MAX_STYLESHEETS)) {
      try {
        const cssRes = await fetch(styleLink, { signal: AbortSignal.timeout(5000) });
        if (cssRes.ok) {
          cssContent.push(await cssRes.text());
        }
      } catch {
        // Skip failed CSS fetches
      }
    }

    // Extract image URLs
    const baseUrl = new URL(url).origin;
    const imageUrls: string[] = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) {
        const fullUrl = src.startsWith('http') ? src : new URL(src, baseUrl).href;
        imageUrls.push(fullUrl);
      }
    });

    return { url, html, textContent, title, cssContent, imageUrls, metaDescription };
  } catch {
    return null;
  }
}

/**
 * Extract internal links from HTML.
 */
function extractInternalLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: Set<string> = new Set();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    try {
      const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
      if (fullUrl.startsWith(baseUrl)) {
        links.add(fullUrl);
      }
    } catch {
      // Invalid URL, skip
    }
  });

  return Array.from(links);
}

/**
 * Extract clean text content from a URL (for Module 02, Option C).
 * Removes navigation, footer, sidebars, and other non-content elements.
 */
export async function extractTextFromUrl(url: string): Promise<{
  title: string;
  content: string;
  metaDescription: string;
}> {
  const page = await fetchAndParse(url);
  if (!page) {
    throw new Error(`Failed to fetch content from ${url}`);
  }

  const $ = cheerio.load(page.html);

  // More aggressive content cleaning
  $('nav, footer, header, aside, .sidebar, .nav, .footer, .header, .menu, .cookie, .popup, .modal, .ad, .advertisement, [role="navigation"], [role="banner"], [role="complementary"]').remove();

  // Try to find main content area
  const mainContent =
    $('main').text() ||
    $('article').text() ||
    $('[role="main"]').text() ||
    $('.content, .main-content, #content, #main').text() ||
    $('body').text();

  return {
    title: page.title,
    content: mainContent.replace(/\s+/g, ' ').trim(),
    metaDescription: page.metaDescription,
  };
}
