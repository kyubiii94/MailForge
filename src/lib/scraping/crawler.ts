import * as cheerio from 'cheerio';

/**
 * Crawl a website's main pages and extract content.
 * Uses fetch + Cheerio for static HTML parsing (MVP).
 */
export async function crawlMainPages(siteUrl: string): Promise<CrawledPage[]> {
  const baseUrl = new URL(siteUrl).origin;
  const pages: CrawledPage[] = [];
  const visited = new Set<string>();

  console.log(`[Crawler] Starting crawl for ${siteUrl}`);

  // Crawl the homepage first
  const homepage = await fetchAndParse(siteUrl);
  if (homepage) {
    pages.push(homepage);
    visited.add(siteUrl);
    console.log(`[Crawler] Homepage OK: ${siteUrl} (${homepage.textContent.length} chars text, ${homepage.cssContent.length} CSS blocks)`);
  } else {
    console.warn(`[Crawler] Failed to fetch homepage: ${siteUrl}`);
    return pages;
  }

  // Discover internal links from homepage
  const discoveredLinks = extractInternalLinks(homepage.html, baseUrl);

  // Priority paths for brand analysis
  const targetPaths = [
    '/about', '/a-propos', '/qui-sommes-nous', '/notre-histoire',
    '/products', '/produits', '/services', '/solutions', '/offres',
    '/contact', '/nous-contacter',
    '/pricing', '/tarifs', '/prix',
    '/team', '/equipe', '/notre-equipe',
    '/blog', '/actualites', '/news',
    '/values', '/nos-valeurs', '/mission',
  ];

  // Also extract links from nav/header menus (high-value pages)
  const navLinks = extractNavLinks(homepage.html, baseUrl);
  const allLinks = Array.from(new Set([...navLinks, ...discoveredLinks]));

  // Prioritize links that match known brand-relevant paths
  const priorityLinks = allLinks.filter((link) =>
    targetPaths.some((path) => link.toLowerCase().includes(path))
  );
  // Then add remaining nav links (likely important pages)
  const otherNavLinks = navLinks.filter((l) => !priorityLinks.includes(l));
  const orderedLinks = [...priorityLinks, ...otherNavLinks];

  const MAX_SECONDARY_PAGES = 6;
  let crawled = 0;

  for (const link of orderedLinks) {
    if (crawled >= MAX_SECONDARY_PAGES) break;
    if (visited.has(link)) continue;
    visited.add(link);

    const page = await fetchAndParse(link);
    if (page) {
      pages.push(page);
      crawled++;
      console.log(`[Crawler] Page ${crawled}/${MAX_SECONDARY_PAGES}: ${link} (${page.textContent.length} chars)`);
    } else {
      console.warn(`[Crawler] Failed to fetch: ${link}`);
    }
  }

  console.log(`[Crawler] Done: ${pages.length} pages crawled for ${baseUrl}`);
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

    // Extract CSS and stylesheet links BEFORE removing elements from the DOM
    const cssContent: string[] = [];
    $('style').each((_, el) => {
      cssContent.push($(el).text());
    });
    const styleLinks: string[] = [];
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        styleLinks.push(href.startsWith('http') ? href : new URL(href, url).href);
      }
    });

    // Extract inline style attributes from key elements
    $('[style]').each((_, el) => {
      const style = $(el).attr('style');
      if (style) cssContent.push(`inline { ${style} }`);
    });

    // Now remove non-content elements for clean text extraction
    $('script, style, noscript, iframe, .cookie-banner, .cookie-consent, #cookie').remove();

    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();

    // Fetch external stylesheets (up to 12 for better palette/theme coverage)
    const MAX_STYLESHEETS = 12;
    for (const styleLink of styleLinks.slice(0, MAX_STYLESHEETS)) {
      try {
        const cssRes = await fetch(styleLink, { signal: AbortSignal.timeout(5000) });
        if (cssRes.ok) {
          cssContent.push(await cssRes.text());
        }
      } catch (err) {
        console.warn(`[Crawler] Failed to fetch stylesheet ${styleLink}:`, err instanceof Error ? err.message : err);
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
  } catch (error) {
    console.error(`[Crawler] Error fetching ${url}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Extract links from nav/header menus (typically the most important pages).
 */
function extractNavLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: Set<string> = new Set();

  $('nav a[href], header a[href], [role="navigation"] a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href === '/' || href === '#') return;
    try {
      const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
      if (fullUrl.startsWith(baseUrl)) links.add(fullUrl);
    } catch { /* skip invalid */ }
  });

  return Array.from(links);
}

/**
 * Extract all internal links from HTML.
 */
function extractInternalLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: Set<string> = new Set();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href === '/' || href === '#') return;

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
