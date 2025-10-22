import { generateSummary } from './summarizer';
import { sidepanelLogger } from '../utils/logger';
import type { PageHeading } from '../types/extraction';

/**
 * Ensures a page summary exists, generating one if not provided
 * @param pageSummary - Existing summary or empty string
 * @returns The final summary (either provided or generated)
 */
export async function ensurePageSummary(
  pageSummary: string,
  pageTitle: string = 'Not available'
): Promise<string> {
  // If summary already provided, return it
  if (pageSummary) {
    return pageSummary;
  }

  sidepanelLogger.debug('No summary provided, extracting content and generating summary...');
  const startTime = Date.now();

  // Extract page content
  const extractResponse = await chrome.runtime.sendMessage({
    type: 'EXTRACT_PAGE_CONTENT',
  });

  if (!extractResponse?.success) {
    sidepanelLogger.warn('Content extraction failed, proceeding without summary');
    return '';
  }

  // Get the extracted content from storage
  const data = await chrome.storage.session.get('pageContent');
  const pageContent = data.pageContent || '';

  if (!pageContent) {
    sidepanelLogger.warn('No page content found');
    return '';
  }

  sidepanelLogger.debug('Generating summary from page content...');
  const summary = await generateSummary(pageContent, {
    sharedContext: `This is a website about ${pageTitle}`,
    type: 'key-points',
    format: 'markdown',
    length: 'short',
  });
  sidepanelLogger.debug('Summary generated successfully');
  const endTime = Date.now();
  const duration = endTime - startTime;
  sidepanelLogger.info(`Page summary generated in ${duration / 1000} s`, {
    summaryLength: summary.length,
  });

  return summary;
}

/**
 * Calculate estimated reading time for text content
 * @param text - The text content to analyze
 * @returns Formatted reading time string (e.g., "5 min read", "< 1 min read")
 */
export function calculateReadingTime(text: string): string {
  // Average reading speed: 238 words per minute Round to 220 for simplicity
  const wordsPerMinute = 220;

  // Count words by splitting on whitespace
  const words = text.trim().split(/\s+/).length;

  // Calculate time in minutes
  const minutes = words / wordsPerMinute;

  // Format output
  if (minutes < 1) {
    return '< 1 min read';
  }

  const roundedMinutes = Math.round(minutes);
  return `${roundedMinutes} min read`;
}

/**
 * Formats page architecture for AI model consumption
 * Limits content to prevent token overflow while preserving full text
 * @param architecture - Array of PageHeading objects from content extraction
 * @returns Formatted string for AI prompts, or "Not available" if none
 */
export function formatPageArchitectureForAI(architecture?: PageHeading[]): string {
  if (!architecture || architecture.length === 0) {
    return 'Not available';
  }

  // Don't format if only one h1 with no children (not meaningful)
  if (architecture.length === 1 && architecture[0].children.length === 0) {
    return 'Not available';
  }

  const lines: string[] = [];
  const MAX_H1_SECTIONS = 5;
  const MAX_CHILDREN_PER_H1 = 15;

  // Limit to first 5 h1 sections
  const limitedArchitecture = architecture.slice(0, MAX_H1_SECTIONS);

  limitedArchitecture.forEach((heading) => {
    // Add h1 heading (full text)
    lines.push(`# ${heading.h1}`);

    // Limit children to 15 per h1
    const limitedChildren = heading.children.slice(0, MAX_CHILDREN_PER_H1);

    limitedChildren.forEach((child) => {
      if (child.level === 2) {
        lines.push(`  - ${child.text}`);
      } else {
        // h3 with extra indentation
        lines.push(`    - ${child.text}`);
      }
    });

    // Add note if children were truncated
    if (heading.children.length > MAX_CHILDREN_PER_H1) {
      lines.push(`  ... and ${heading.children.length - MAX_CHILDREN_PER_H1} more sections`);
    }
  });

  return lines.join('\n');
}
