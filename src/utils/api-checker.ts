/**
 * Centralized API availability checker for Chrome's Built-in AI APIs
 * Checks LanguageModel (Prompt API), Summarizer, and Writer availability
 */

import { sidepanelLogger } from './logger';

export interface ApiAvailabilityStatus {
  available: AICapabilityAvailability;
  error?: string;
  needsUserGesture?: boolean; // True if 'after-download' state
}

export interface AllApiStatus {
  languageModel: ApiAvailabilityStatus;
  summarizer: ApiAvailabilityStatus;
  writer: ApiAvailabilityStatus;
  allAvailable: boolean;
  anyAvailable: boolean;
  needsUserGesture: boolean; // True if any API needs user gesture to download
  isChecking: boolean;
}

function checkNeedsGesture(status: AICapabilityAvailability): boolean {
  return status === 'downloadable';
}

/**
 * Check LanguageModel (Prompt API) availability
 */
export async function checkLanguageModelAvailability(): Promise<ApiAvailabilityStatus> {
  try {
    sidepanelLogger.info('Checking LanguageModel availability...');
    const availability = await LanguageModel.availability();

    const needsUserGesture = checkNeedsGesture(availability);
    return {
      available: availability,
      needsUserGesture,
    };
  } catch (error) {
    sidepanelLogger.error('LanguageModel availability check failed:', error);
    return {
      available: 'unavailable',
      error: (error as Error).message,
      needsUserGesture: false,
    };
  }
}

/**
 * Check Summarizer API availability
 */
export async function checkSummarizerAvailability(): Promise<ApiAvailabilityStatus> {
  try {
    sidepanelLogger.info('Checking Summarizer availability...');
    const availability = await Summarizer.availability();

    const needsUserGesture = checkNeedsGesture(availability);

    return {
      available: availability,
      needsUserGesture,
    };
  } catch (error) {
    sidepanelLogger.error('Summarizer availability check failed:', error);
    return {
      available: 'unavailable',
      error: (error as Error).message,
      needsUserGesture: false,
    };
  }
}

/**
 * Check Writer API availability
 */
export async function checkWriterAvailability(): Promise<ApiAvailabilityStatus> {
  try {
    sidepanelLogger.info('Checking Writer availability...');
    const availability = await Writer.availability();

    const needsUserGesture = checkNeedsGesture(availability);

    return {
      available: availability,
      needsUserGesture,
    };
  } catch (error) {
    sidepanelLogger.error('Writer availability check failed:', error);
    return {
      available: 'unavailable',
      error: (error as Error).message,
      needsUserGesture: false,
    };
  }
}

/**
 * Check all APIs at once
 */
export async function checkAllAPIs(): Promise<AllApiStatus> {
  sidepanelLogger.info('=== Starting API availability check for all APIs ===');

  const [languageModel, summarizer, writer] = await Promise.all([
    checkLanguageModelAvailability(),
    checkSummarizerAvailability(),
    checkWriterAvailability(),
  ]);

  const allAvailable =
    languageModel.available === 'available' &&
    summarizer.available === 'available' &&
    writer.available === 'available';

  const anyAvailable =
    languageModel.available !== 'unavailable' ||
    summarizer.available !== 'unavailable' ||
    writer.available !== 'unavailable';

  const needsUserGesture =
    languageModel.needsUserGesture === true ||
    summarizer.needsUserGesture === true ||
    writer.needsUserGesture === true;

  const result = {
    languageModel,
    summarizer,
    writer,
    allAvailable,
    anyAvailable,
    needsUserGesture,
    isChecking: false,
  };

  return result;
}

/**
 * Trigger model downloads for all APIs with user gesture
 * This must be called from a user interaction (button click) to work
 */
export async function triggerModelDownloads(): Promise<{
  success: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  sidepanelLogger.info('=== Downloading models ===');

  // Try to create sessions for each API to trigger downloads
  try {
    const languageSession = await LanguageModel.create();
    languageSession.destroy();
  } catch (error) {
    sidepanelLogger.error('✗ Failed to trigger LanguageModel download:', error);
    errors.push(`LanguageModel: ${(error as Error).message}`);
  }

  try {
    const summarizerSession = await Summarizer.create();
    summarizerSession.destroy();
  } catch (error) {
    sidepanelLogger.error('✗ Failed to trigger Summarizer download:', error);
    errors.push(`Summarizer: ${(error as Error).message}`);
  }

  try {
    const writerSession = await Writer.create();
    writerSession.destroy();
  } catch (error) {
    sidepanelLogger.error('✗ Failed to trigger Writer download:', error);
    errors.push(`Writer: ${(error as Error).message}`);
  }

  const result = {
    success: errors.length === 0,
    errors,
  };

  return result;
}

/**
 * Wait for API to be ready after checking availability
 * Handles 'downloading' and 'after-download' states
 */
export async function waitForApiReady<T extends AISession>(
  availability: AICapabilityAvailability,
  createSession: () => Promise<T>
): Promise<T> {
  const session = await createSession();

  if (availability === 'downloading') {
    // Wait for download to complete
    session.addEventListener('downloadprogress', (e) => {
      console.log(`API downloading: ${(e.loaded * 100).toFixed(1)}%`);
    });
    await session.ready;
    console.log('API model ready');
  }

  return session;
}
