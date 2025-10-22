import {
  serviceWorkerLogger,
  handleStoreLogMessage,
  handleGetLogsMessage,
  handleClearLogsMessage,
} from '../utils/logger';
import type { ExtractionResult } from '../types/extraction';
import type { ExtractedCodeBlock } from '../scripts/extract-code-blocks';

// Import logger to expose global debug functions in service worker
import '../utils/logger';

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => serviceWorkerLogger.error('Failed to set panel behavior', error));
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle logging messages using utility functions
  handleStoreLogMessage(message);

  if (handleGetLogsMessage(message, sendResponse)) {
    return true; // Keep message channel open for async response
  }

  handleClearLogsMessage(message);

  if (message.type === 'OPEN_SIDEPANEL_WITH_CONTENT') {
    // Store the selected content and action with window ID
    if (sender.tab?.windowId) {
      chrome.storage.session.set({
        selectionAction: message.action,
        selectionText: message.selectedText,
        selectionWindowId: sender.tab.windowId,
      });

      // Open the side panel
      chrome.sidePanel.open({ windowId: sender.tab.windowId });
    }
  }

  if (message.type === 'OPEN_SIDEPANEL_WITH_IMAGE') {
    // Store the image data (base64) with type metadata and window ID
    if (sender.tab?.windowId) {
      chrome.storage.session.set({
        selectionAction: 'explain-image',
        imageData: message.imageData,
        imageBlobType: message.imageBlobType,
        imageSrc: message.imageSrc,
        imageAlt: message.imageAlt,
        selectionWindowId: sender.tab.windowId,
      });

      // Open the side panel
      chrome.sidePanel.open({ windowId: sender.tab.windowId });
    }
  }

  if (message.type === 'EXTRACT_PAGE_CONTENT') {
    // Extract content from the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id) {
        const result = await getPageContent(tabs[0].id);
        sendResponse(result);
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
    return true; // Keep the message channel open for async response
  }

  if (message.type === 'EXTRACT_PAGE_CONTENT_WITH_CODE') {
    // Extract content with code blocks preserved (always uses fallback extractor)
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id) {
        const result = await getPageContentWithCode(tabs[0].id);
        sendResponse(result);
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
    return true; // Keep the message channel open for async response
  }

  if (message.type === 'EXTRACT_CODE_BLOCKS') {
    // Extract code blocks from HTML elements for AI language identification
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id) {
        const result = await extractCodeBlocks(tabs[0].id);
        sendResponse(result);
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
    return true; // Keep the message channel open for async response
  }
});

async function getPageContent(tabId: number): Promise<{ success: boolean; error?: string }> {
  const tab = await chrome.tabs.get(tabId);
  if (!tab.url?.startsWith('http')) {
    return { success: false, error: 'Not a valid webpage (must be http or https)' };
  }

  try {
    // First, try Readability extraction
    const injection = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['scripts/extract-content.js'],
    });
    await serviceWorkerLogger.debug('Readability result', {
      hasResult: !!injection[0]?.result,
      resultType: typeof injection[0]?.result,
      tabId,
    });

    if (injection[0]?.result && injection[0].result !== false) {
      const result = injection[0].result as ExtractionResult;
      chrome.storage.session.set({
        pageTitle: result.title,
        pageContent: result.content,
        pageLinks: result.links,
        pageNavigation: result.navigation,
        pageArchitecture: result.architecture,
      });
      await serviceWorkerLogger.info('Readability extraction successful', {
        resultType: typeof injection[0].result,
        linksCount: result.links.length,
        tabId,
      });
      return { success: true };
    }

    // If Readability failed, try fallback extraction
    await serviceWorkerLogger.warn('Readability failed, trying fallback extraction...', { tabId });
    const fallbackInjection = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['scripts/extract-content-fallback.js'],
    });
    await serviceWorkerLogger.debug('Fallback result', {
      hasResult: !!fallbackInjection[0]?.result,
      resultType: typeof fallbackInjection[0]?.result,
      tabId,
    });

    if (fallbackInjection[0]?.result && fallbackInjection[0].result !== false) {
      const result = fallbackInjection[0].result as ExtractionResult;
      chrome.storage.session.set({
        pageTitle: result.title,
        pageContent: result.content,
        pageLinks: result.links,
        pageNavigation: result.navigation,
        pageArchitecture: result.architecture,
      });
      await serviceWorkerLogger.info('Fallback extraction successful', {
        linksCount: result.links.length,
        tabId,
      });
      return { success: true };
    }

    // Both methods failed
    await serviceWorkerLogger.error('Both extraction methods failed', { tabId });
    return { success: false, error: 'Could not extract readable content from this page' };
  } catch (error) {
    await serviceWorkerLogger.error('Failed to extract content', {
      error: (error as Error).message,
      tabId,
    });
    return { success: false, error: 'Failed to extract content: ' + (error as Error).message };
  }
}

async function getPageContentWithCode(
  tabId: number
): Promise<{ success: boolean; error?: string }> {
  const tab = await chrome.tabs.get(tabId);
  if (!tab.url?.startsWith('http')) {
    return { success: false, error: 'Not a valid webpage (must be http or https)' };
  }

  try {
    // Always use fallback extraction to preserve code blocks
    await serviceWorkerLogger.info('Extracting page content with code blocks...', { tabId });
    const fallbackInjection = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['scripts/extract-content-fallback.js'],
    });

    await serviceWorkerLogger.debug('Fallback extraction result (with code)', {
      hasResult: !!fallbackInjection[0]?.result,
      resultType: typeof fallbackInjection[0]?.result,
      tabId,
    });

    if (fallbackInjection[0]?.result && fallbackInjection[0].result !== false) {
      const result = fallbackInjection[0].result as ExtractionResult;
      // Store in separate key to avoid overwriting main content
      chrome.storage.session.set({
        pageContentWithCode: result.content,
      });
      await serviceWorkerLogger.info('Content extraction with code blocks successful', {
        contentLength: result.content.length,
        tabId,
      });
      return { success: true };
    }

    // Extraction failed
    await serviceWorkerLogger.error('Failed to extract content with code blocks', { tabId });
    return { success: false, error: 'Could not extract content from this page' };
  } catch (error) {
    await serviceWorkerLogger.error('Failed to extract content with code', {
      error: (error as Error).message,
      tabId,
    });
    return { success: false, error: 'Failed to extract content: ' + (error as Error).message };
  }
}

async function extractCodeBlocks(tabId: number): Promise<{ success: boolean; error?: string }> {
  const tab = await chrome.tabs.get(tabId);
  if (!tab.url?.startsWith('http')) {
    return { success: false, error: 'Not a valid webpage (must be http or https)' };
  }

  try {
    await serviceWorkerLogger.info('Extracting code blocks from page...', { tabId });
    const injection = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['scripts/extract-code-blocks.js'],
    });

    await serviceWorkerLogger.debug('Code block extraction result', {
      hasResult: !!injection[0]?.result,
      resultType: typeof injection[0]?.result,
      tabId,
    });

    if (injection[0]?.result && Array.isArray(injection[0].result)) {
      const codeBlocks = injection[0].result as ExtractedCodeBlock[];

      // Store in session storage
      chrome.storage.session.set({
        extractedCodeBlocks: codeBlocks,
      });

      await serviceWorkerLogger.info('Code block extraction successful', {
        blocksFound: codeBlocks.length,
        tabId,
      });

      return { success: true };
    }

    // No code blocks found or invalid result
    await serviceWorkerLogger.info('No code blocks found on page', { tabId });
    chrome.storage.session.set({ extractedCodeBlocks: [] });
    return { success: true };
  } catch (error) {
    await serviceWorkerLogger.error('Failed to extract code blocks', {
      error: (error as Error).message,
      tabId,
    });
    return { success: false, error: 'Failed to extract code blocks: ' + (error as Error).message };
  }
}
