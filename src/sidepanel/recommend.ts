import { sidepanelLogger } from '../utils/logger';
import type { PageLink, NavigationContext } from '../types/extraction';
import { checkLanguageModelAvailability } from '../utils/api-checker';
import { RECOMMENDER_PROMPT_TEMPLATE, formatPrompt } from './prompts';

export interface RecommendedLink {
  title: string;
  url: string;
  why: string;
  order: number;
}

export const recommendationSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['title', 'url', 'why', 'order'],
    additionalProperties: false,
    properties: {
      title: {
        type: 'string',
        description: 'Clear, appealing title rewritten by AI to describe the resource',
      },
      url: {
        type: 'string',
        description: 'Original URL from the page (must be exact match)',
      },
      why: {
        type: 'string',
        description: 'Short, enthusiastic friend-style recommendation (10-15 words max)',
      },
      order: {
        type: 'number',
        description: 'Importance order (1 = most important)',
      },
    },
  },
};

// Filter out promotional and marketing links
function isRelevantDocumentationLink(url: string): boolean {
  const urlLower = url.toLowerCase();

  // Common promotional/marketing URL patterns to exclude
  const excludePatterns = [
    '/pricing',
    '/plans',
    '/buy',
    '/purchase',
    '/enterprise',
    '/products',
    '/solutions',
    '/demo',
    '/trial',
    '/signup',
    '/sign-up',
    '/about',
    '/company',
    '/careers',
    '/jobs',
    '/contact',
    '/contact-us',
    '/case-studies',
    '/customers',
    '/testimonials',
    '/webinar',
    '/event',
    '/newsletter',
    '/download',
    '/get-started',
    '/start-free',
  ];

  // Check if URL contains any exclude patterns
  for (const pattern of excludePatterns) {
    if (urlLower.includes(pattern)) {
      return false;
    }
  }

  return true;
}

function getRecommenderPrompt(
  pageSummary: string,
  userPersona: string,
  links: PageLink[],
  navigation?: NavigationContext
): string {
  const MAX_LINKS = 10;

  // Filter content links for relevance first (these are HIGHEST priority)
  const relevantContentLinks = links.filter((link) => isRelevantDocumentationLink(link.url));

  // Start with content links - take up to MAX_LINKS
  const selectedLinks: Array<{ link: PageLink; category: string }> = relevantContentLinks
    .slice(0, MAX_LINKS)
    .map((link) => ({ link, category: 'Content' }));

  // If we need more links to reach 10, add navigation links in priority order
  if (selectedLinks.length < MAX_LINKS && navigation) {
    const seenUrls = new Set(selectedLinks.map(({ link }) => link.url));

    // Priority order: breadcrumbs > TOC > sidebar > mainNav
    const navSources = [
      { links: navigation.breadcrumbs, category: 'Breadcrumb' },
      { links: navigation.tableOfContents, category: 'Table of Contents' },
      { links: navigation.sidebar, category: 'Sidebar' },
      { links: navigation.mainNav, category: 'Main Navigation' },
    ];

    // Fill remaining slots with navigation links
    for (const source of navSources) {
      for (const link of source.links) {
        // Stop if we've reached the limit
        if (selectedLinks.length >= MAX_LINKS) break;

        // Skip if URL already seen or not relevant
        if (seenUrls.has(link.url) || !isRelevantDocumentationLink(link.url)) {
          continue;
        }

        selectedLinks.push({ link, category: source.category });
        seenUrls.add(link.url);
      }

      // Stop if we've reached the limit
      if (selectedLinks.length >= MAX_LINKS) break;
    }
  }

  // Format links for the prompt with category labels
  const linksText = selectedLinks
    .map(({ link, category }, index) => `${index + 1}. [${category}] "${link.text}" - ${link.url}`)
    .join('\n');

  return formatPrompt(RECOMMENDER_PROMPT_TEMPLATE, {
    PAGE_SUMMARY: pageSummary,
    USER_PERSONA: userPersona,
    LINKS: linksText,
  });
}

export async function recommendLinks(
  pageSummary: string,
  userPersona: string,
  links: PageLink[],
  navigation?: NavigationContext
): Promise<RecommendedLink[]> {
  if (links.length === 0) {
    sidepanelLogger.info('No links to recommend');
    return [];
  }

  sidepanelLogger.info(`Starting link recommendation for ${links.length} links`);

  const prompt = getRecommenderPrompt(pageSummary, userPersona, links, navigation);
  sidepanelLogger.debug('Recommender prompt:', prompt);

  const response = (await runPromptGeneric(
    prompt,
    { outputLanguage: 'en' },
    recommendationSchema
  )) as string | RecommendedLink[];

  if (Array.isArray(response)) {
    return response as RecommendedLink[];
  }

  if (typeof response === 'string') {
    try {
      sidepanelLogger.debug('Raw AI response string:', response);
      const parsed = JSON.parse(response) as RecommendedLink[];
      sidepanelLogger.debug('Parsed AI response object:', parsed);

      // Validate it's an array
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      return parsed;
    } catch (error) {
      sidepanelLogger.error('Failed to parse AI response:', error);
      throw new Error('Failed to parse AI response: ' + (error as Error).message);
    }
  }

  throw new Error('Invalid response type from AI service');
}

let session: LanguageModelSession | null = null;

async function reset(): Promise<void> {
  if (session) {
    session.destroy();
  }
  session = null;
}

// Generic prompt runner that can handle recommendation response type
async function runPromptGeneric(
  prompt: string,
  params: LanguageModelOptions,
  schema: unknown
): Promise<string | RecommendedLink[]> {
  try {
    if (!session) {
      // Check LanguageModel availability before creating session
      const { available, error } = await checkLanguageModelAvailability();
      if (available === 'unavailable') {
        throw new Error(
          error || 'LanguageModel API is not available. Please enable Chrome AI features.'
        );
      }
      session = await LanguageModel.create(params);
    }
    return session.prompt(prompt, {
      responseConstraint: schema,
    }) as Promise<string | RecommendedLink[]>;
  } catch (e) {
    console.log('Prompt failed');
    console.error(e);
    console.log('Prompt:', prompt);
    // Reset session
    reset();
    throw e;
  }
}
