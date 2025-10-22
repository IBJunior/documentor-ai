// Fallback content extraction when Readability fails
// Uses simple DOM queries to extract text from common content containers

import type {
  ExtractionResult,
  PageLink,
  NavigationContext,
  PageHeading,
} from '../types/extraction';

// Extract links from navigation elements with deduplication and limits
function extractLinksFromElement(
  element: Element | null,
  baseUrl: string,
  maxLinks: number = 15
): PageLink[] {
  if (!element) return [];

  const links: PageLink[] = [];
  const seenUrls = new Set<string>();
  const anchors = element.querySelectorAll('a[href]');

  for (let i = 0; i < anchors.length && links.length < maxLinks; i++) {
    const anchor = anchors[i];
    const href = anchor.getAttribute('href');
    if (!href) continue;

    // Filter out unwanted links
    if (
      href.startsWith('javascript:') ||
      href.startsWith('mailto:') ||
      href === '#' ||
      href.startsWith('#')
    ) {
      continue;
    }

    // Convert relative URLs to absolute
    let absoluteUrl: string;
    try {
      absoluteUrl = new URL(href, baseUrl).href;
    } catch {
      continue; // Invalid URL
    }

    // Get link text
    const text = anchor.textContent?.trim() || '';
    if (!text) continue;

    // Deduplicate by URL
    if (seenUrls.has(absoluteUrl)) continue;
    seenUrls.add(absoluteUrl);

    links.push({
      url: absoluteUrl,
      text: text,
    });
  }

  return links;
}

function extractBreadcrumbs(document: Document, baseUrl: string): PageLink[] {
  const selectors = [
    'nav[aria-label*="breadcrumb" i]',
    'nav[aria-label*="Breadcrumb" i]',
    '[class*="breadcrumb" i]',
    '[id*="breadcrumb" i]',
    'ol[itemtype*="BreadcrumbList"]',
  ];

  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const links = extractLinksFromElement(element, baseUrl, 10);
        if (links.length > 0) return links;
      }
    } catch (e) {
      // Invalid selector, continue
    }
  }
  return [];
}

function extractMainNav(document: Document, baseUrl: string): PageLink[] {
  const selectors = [
    'nav[role="navigation"]',
    'header nav',
    'nav.navbar',
    'nav.main-nav',
    'nav.primary-nav',
    '[class*="main-nav" i]',
    '[class*="primary-nav" i]',
    'nav:not([aria-label*="breadcrumb" i])',
  ];

  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const links = extractLinksFromElement(element, baseUrl, 15);
        if (links.length > 0) return links;
      }
    } catch (e) {
      // Invalid selector, continue
    }
  }
  return [];
}

function extractSidebar(document: Document, baseUrl: string): PageLink[] {
  const selectors = [
    'aside',
    '[role="complementary"]',
    '.sidebar',
    '.side-nav',
    '.docs-nav',
    '.documentation-nav',
    '[class*="sidebar" i]',
    '[id*="sidebar" i]',
  ];

  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const links = extractLinksFromElement(element, baseUrl, 15);
        if (links.length > 0) return links;
      }
    } catch (e) {
      // Invalid selector, continue
    }
  }
  return [];
}

function extractTableOfContents(document: Document, baseUrl: string): PageLink[] {
  const selectors = [
    '#toc',
    '.toc',
    '#table-of-contents',
    '.table-of-contents',
    '[class*="toc" i]',
    '[id*="toc" i]',
    'nav[aria-label*="table of contents" i]',
  ];

  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const links = extractLinksFromElement(element, baseUrl, 15);
        if (links.length > 0) return links;
      }
    } catch (e) {
      // Invalid selector, continue
    }
  }
  return [];
}

function extractNavigationContext(document: Document): NavigationContext {
  const baseUrl = document.location.href;
  return {
    breadcrumbs: extractBreadcrumbs(document, baseUrl),
    mainNav: extractMainNav(document, baseUrl),
    sidebar: extractSidebar(document, baseUrl),
    tableOfContents: extractTableOfContents(document, baseUrl),
  };
}

function extractLinks(contentElement: Element, baseUrl: string): PageLink[] {
  const links: PageLink[] = [];
  const seenUrls = new Set<string>();

  // Find all anchor tags
  const anchors = contentElement.querySelectorAll('a[href]');

  anchors.forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (!href) return;

    // Filter out unwanted links
    if (
      href.startsWith('javascript:') ||
      href.startsWith('mailto:') ||
      href === '#' ||
      href.startsWith('#')
    ) {
      return;
    }

    // Convert relative URLs to absolute
    let absoluteUrl: string;
    try {
      absoluteUrl = new URL(href, baseUrl).href;
    } catch {
      return; // Invalid URL
    }

    // Get link text
    const text = anchor.textContent?.trim() || '';
    if (!text) return;

    // Deduplicate by URL
    if (seenUrls.has(absoluteUrl)) return;
    seenUrls.add(absoluteUrl);

    links.push({
      url: absoluteUrl,
      text: text,
    });
  });

  return links;
}

function extractPageArchitecture(document: Document): PageHeading[] {
  const architecture: PageHeading[] = [];
  const allHeadings = document.querySelectorAll('h1, h2, h3');

  let currentH1Entry: PageHeading | null = null;

  allHeadings.forEach((heading) => {
    const text = heading.textContent?.trim();
    if (!text) return;

    if (heading.tagName === 'H1') {
      // Create new h1 entry with empty children array
      currentH1Entry = { h1: text, children: [] };
      architecture.push(currentH1Entry);
    } else if ((heading.tagName === 'H2' || heading.tagName === 'H3') && currentH1Entry) {
      // Add h2 or h3 as child to current h1
      currentH1Entry.children.push({
        level: heading.tagName === 'H2' ? 2 : 3,
        text: text,
      });
    }
  });

  return architecture;
}

function extractContentFallback(): ExtractionResult | false {
  try {
    // Clone the document to avoid modifying the actual page
    const docClone = document.cloneNode(true) as Document;

    // Remove unwanted elements from clone
    docClone
      .querySelectorAll(
        'script, style, nav, header, footer, aside, .nav, .navbar, .menu, .sidebar, .advertisement, .ad, .cookie, .popup, .modal, [role="navigation"], [role="banner"], [role="complementary"]'
      )
      .forEach((el) => el.remove());

    // Try to find main content area - in order of priority
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.main-content',
      '.content',
      '#main',
      '#content',
      '.post-content',
      '.article-content',
      '.entry-content',
      'body',
    ];

    let contentElement: Element | null = null;

    for (const selector of contentSelectors) {
      contentElement = docClone.querySelector(selector);
      if (contentElement) {
        break;
      }
    }

    if (!contentElement) {
      return false;
    }

    // Extract links before converting to text
    const links = extractLinks(contentElement, document.location.href);

    // Extract text content
    let text = contentElement.textContent || '';

    // Clean up the text
    text = text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n') // Clean up multiple newlines
      .trim();

    // Check if we extracted meaningful content
    if (text.length < 100) {
      return false;
    }
    console.log('Extracted text :', text);

    // Extract navigation context from the original document
    const navigation = extractNavigationContext(document);

    // Extract page architecture (h1 and h2 headings)
    const architecture = extractPageArchitecture(document);

    return {
      title: document.title || '',
      content: text,
      links: links,
      navigation: navigation,
      architecture: architecture,
    };
  } catch (error) {
    console.error('Fallback extraction error:', error);
    return false;
  }
}

// Execute and return result
const result = extractContentFallback();
result;
