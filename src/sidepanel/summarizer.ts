import { sidepanelLogger } from '../utils/logger';
import { checkSummarizerAvailability, waitForApiReady } from '../utils/api-checker';

export async function generateSummary(text: string, options: SummarizerOptions): Promise<string> {
  try {
    const { available } = await checkSummarizerAvailability();

    sidepanelLogger.info('Summarizer availability:', available);

    if (available === 'unavailable') {
      return 'Summarizer API is not available. Please enable Chrome AI features.';
    }

    // Create session and wait for it to be ready if downloading
    const summarizer = await waitForApiReady(available, () => Summarizer.create(options));

    sidepanelLogger.info('Generating summary with options:', options);
    sidepanelLogger.debug('Summarizer Input Usage Quota:', summarizer.inputQuota);
    const textToken = await summarizer.measureInputUsage(text, options);
    sidepanelLogger.debug('Text To Summarize Tokens:', textToken);
    sidepanelLogger.debug('Text to summarize length:', text.length);
    const summary = await summarizer.summarize(text);
    summarizer.destroy();
    return summary;
  } catch (e) {
    sidepanelLogger.error('Summary generation failed', e);
    const error = e as Error;

    // Handle NotAllowedError specifically
    if (error.name === 'NotAllowedError' || error.message.includes('user gesture')) {
      return 'AI models need to be enabled. Please click the "Enable AI" button at the top of the page to download the required models.';
    }

    return 'Error: ' + error.message;
  }
}
