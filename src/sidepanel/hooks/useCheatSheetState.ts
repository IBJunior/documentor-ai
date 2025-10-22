import { useState, useEffect } from 'react';
import { calculateReadingTime } from '../utils';
import type { PageLink } from '../../types/extraction';
import { sidepanelLogger } from '../../utils/logger';
import { generateCheatSheet, validateCheatSheetPrompt } from '../cheat-sheet';

interface CheatSheetOptions {
  isActive?: boolean;
}

export function useCheatSheetState(options: CheatSheetOptions = {}) {
  const { isActive = true } = options;
  const [cheatSheet, setCheatSheet] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  const [readingTime, setReadingTime] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatusMessage, setLoadingStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isContentTooLong, setIsContentTooLong] = useState(false);
  const [cheatSheetDuration, setCheatSheetDuration] = useState<number>(0);

  async function handleGenerateCheatSheet() {
    try {
      const startTime = Date.now();
      setIsLoading(true);
      setError(null);

      // Stage 1: Extract page content
      setLoadingStatusMessage('📖 Reading the page content...');

      const extractResponse = await chrome.runtime.sendMessage({
        type: 'EXTRACT_PAGE_CONTENT',
      });

      if (!extractResponse?.success) {
        setError("Failed to extract page content. Please make sure you're on a readable webpage.");
        setIsLoading(false);
        return;
      }

      // Get page content, title, and links from storage
      const data = await chrome.storage.session.get(['pageContent', 'pageTitle', 'pageLinks']);
      const pageContent = data.pageContent || '';
      const title = data.pageTitle || '';
      const pageLinks: PageLink[] = data.pageLinks || [];

      if (pageContent.length === 0) {
        setError("No page content available. Please make sure you're on a readable webpage.");
        setIsLoading(false);
        return;
      }

      // Set page title, reading time, and current URL
      setPageTitle(title);
      setReadingTime(calculateReadingTime(pageContent));

      // Get current tab URL
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTabUrl = tabs[0]?.url || '';
      setCurrentUrl(currentTabUrl);
      sidepanelLogger.info('Current tab URL:', currentTabUrl);

      // Stage 2: Generate cheat sheet
      setLoadingStatusMessage('📝 Creating your cheat sheet...');

      // Validate prompt length before generation
      setLoadingStatusMessage('🔍 Validating content length...');

      const validation = await validateCheatSheetPrompt(pageContent, pageLinks);

      if (!validation.isValid) {
        setIsContentTooLong(true);
        setError(validation.message || 'Prompt is too long for cheat sheet generation.');
        setIsLoading(false);
        return;
      }

      // Continue with generation
      setLoadingStatusMessage('📝 Creating your cheat sheet...');

      // Generate cheat sheet
      const cheatSheetResult = await generateCheatSheet(pageContent, pageLinks);

      setCheatSheet(cheatSheetResult);

      const endTime = Date.now();
      const duration = endTime - startTime;
      setCheatSheetDuration(Math.floor(duration / 1000)); // in seconds
      sidepanelLogger.info(`Cheat sheet generation completed in ${duration / 1000} s`);
      setIsLoading(false);
    } catch (e) {
      setError('Failed to generate cheat sheet: ' + (e as Error).message);
      sidepanelLogger.error('Cheat sheet generation error:', e);
      setIsLoading(false);
    }
  }

  // Restart function: reset all state and re-trigger cheat sheet generation
  function restart() {
    setCheatSheet(null);
    setPageTitle(null);
    setReadingTime(null);
    setCurrentUrl(null);
    setIsLoading(false);
    setLoadingStatusMessage('');
    setError(null);
    setIsContentTooLong(false);
    // Trigger generation after state reset
    setTimeout(() => handleGenerateCheatSheet(), 0);
  }

  // Auto-trigger cheat sheet generation when component becomes active
  useEffect(() => {
    if (isActive && !cheatSheet && !isLoading && !error) {
      handleGenerateCheatSheet();
    }
  }, [isActive]); // Trigger when isActive changes

  return {
    // State
    cheatSheet,
    pageTitle,
    readingTime,
    currentUrl,
    isLoading,
    loadingStatusMessage,
    error,
    isContentTooLong,
    cheatSheetDuration,

    // Actions
    handleGenerateCheatSheet,
    restart,
  };
}
