import { useState, useEffect } from 'react';
import { generateSummary } from '../summarizer';
import { calculateReadingTime } from '../utils';
import type { PageLink, PageHeading } from '../../types/extraction';
import { validateSummarizerContent } from '../utils/content-validation';
import { sidepanelLogger } from '../../utils/logger';

interface PageScanOptions {
  length: 'short' | 'long' | 'medium';
  type?: 'tldr' | 'key-points' | 'teaser' | 'headline';
  isActive?: boolean;
  scanningMessage?: string;
  extractCodeBlocks?: boolean; // Enable code block extraction (for Deep Analysis)
}

export function usePageScanState(options: PageScanOptions) {
  const { length, isActive = true, type, scanningMessage, extractCodeBlocks = false } = options;
  const [summary, setSummary] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  const [readingTime, setReadingTime] = useState<string | null>(null);
  const [pageLinks, setPageLinks] = useState<PageLink[]>([]);
  const [pageArchitecture, setPageArchitecture] = useState<PageHeading[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatusMessage, setLoadingStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isContentTooLong, setIsContentTooLong] = useState(false);
  const [scanDuration, setScanDuration] = useState<number>(0);

  async function handleScan() {
    try {
      setIsLoading(true);
      setError(null);
      // Track start time for duration calculation
      const startTime = Date.now();

      // Stage 1: Extract page content
      setLoadingStatusMessage('Speed-reading the page...');

      const extractResponse = await chrome.runtime.sendMessage({
        type: 'EXTRACT_PAGE_CONTENT',
      });

      if (!extractResponse?.success) {
        setError("Failed to extract page content. Please make sure you're on a readable webpage.");
        setIsLoading(false);
        return;
      }

      // Also extract content with code blocks preserved (for Deep Analysis code frequency feature)
      // Only runs if extractCodeBlocks option is enabled
      if (extractCodeBlocks) {
        chrome.runtime
          .sendMessage({
            type: 'EXTRACT_PAGE_CONTENT_WITH_CODE',
          })
          .catch((err) => {
            sidepanelLogger.warn('Failed to extract content with code blocks', { error: err });
          });
      }

      // Get page content, title, links, and architecture from storage
      const data = await chrome.storage.session.get([
        'pageContent',
        'pageTitle',
        'pageLinks',
        'pageArchitecture',
      ]);
      const pageContent = data.pageContent || '';
      const title = data.pageTitle || 'Not available';
      const links = data.pageLinks || [];
      const architecture = data.pageArchitecture || [];

      if (pageContent.length === 0) {
        setError("No page content available. Please make sure you're on a readable webpage.");
        setIsLoading(false);
        return;
      }

      // Set page title, reading time, links, and architecture
      setPageTitle(title);
      setReadingTime(calculateReadingTime(pageContent));
      setPageLinks(links);
      setPageArchitecture(architecture);

      // Stage 2: Generate summary
      setLoadingStatusMessage(scanningMessage || '🧠 Summarizing the page with AI...');

      const options: SummarizerOptions = {
        sharedContext: `This is a website about: ${title}`,
        type: type || 'key-points',
        format: 'markdown',
        length: length,
      };

      // Validate content length using API quota
      const validation = await validateSummarizerContent(pageContent, options);

      if (!validation.isValid) {
        setIsContentTooLong(true);
        setError(validation.message || 'Content validation failed');
        setIsLoading(false);
        return;
      }

      // Generate summary with persona context
      const summaryResult = await generateSummary(pageContent, options);

      setSummary(summaryResult);
      const endTime = Date.now();
      const duration = endTime - startTime;
      setScanDuration(Math.floor(duration / 1000)); // in seconds
      sidepanelLogger.info(`Page scan completed in ${duration / 1000} s`);

      // Store summary in session storage for use by other components (e.g., explanations)
      await chrome.storage.session.set({ pageSummary: summaryResult });

      setIsLoading(false);
    } catch (e) {
      setError('Failed to generate scan: ' + (e as Error).message);
      setIsLoading(false);
    }
  }

  // Restart function: reset all state and re-trigger scan
  function restart() {
    setSummary(null);
    setPageTitle(null);
    setReadingTime(null);
    setPageLinks([]);
    setPageArchitecture([]);
    setIsLoading(false);
    setLoadingStatusMessage('');
    setError(null);
    setIsContentTooLong(false);
    // Trigger scan after state reset
    setTimeout(() => handleScan(), 0);
  }

  // Auto-trigger scan when component becomes active
  useEffect(() => {
    if (isActive && !summary && !isLoading && !error) {
      handleScan();
    }
  }, [isActive]); // Trigger when isActive changes

  return {
    // State
    summary,
    pageTitle,
    readingTime,
    pageLinks,
    pageArchitecture,
    isLoading,
    loadingStatusMessage,
    error,
    isContentTooLong,
    scanDuration,

    // Actions
    handleScan,
    restart,
  };
}
