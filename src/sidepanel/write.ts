import { checkWriterAvailability, waitForApiReady } from '../utils/api-checker';

export async function generateWriting(
  prompt: string,
  writerOptions?: WriterOptions
): Promise<string> {
  try {
    const options: WriterOptions = writerOptions || {
      tone: 'neutral',
      format: 'markdown',
      length: 'medium',
    };

    const { available } = await checkWriterAvailability();

    console.log('Writer availability:', available);

    if (available === 'unavailable') {
      return 'Writer API is not available. Please enable Chrome AI features.';
    }

    // Create session and wait for it to be ready if downloading
    const writer = await waitForApiReady(available, () => Writer.create(options));

    const result = await writer.write(prompt);
    writer.destroy();
    return result;
  } catch (e) {
    console.log('Writing generation failed');
    console.error(e);
    const error = e as Error;

    // Handle NotAllowedError specifically
    if (error.name === 'NotAllowedError' || error.message.includes('user gesture')) {
      return 'AI models need to be enabled. Please click the "Enable AI" button at the top of the page to download the required models.';
    }

    return 'Error: ' + error.message;
  }
}
