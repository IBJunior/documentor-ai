// AI session management and prompt execution
import type { ChatMessage, ContentPart } from './conversation';
import { sidepanelLogger } from '../utils/logger';
import { checkLanguageModelAvailability } from '../utils/api-checker';

/**
 * Checks if a message contains image content
 */
function hasImageContent(messages: ChatMessage[]): boolean {
  return messages.some((msg) => {
    if (Array.isArray(msg.content)) {
      return msg.content.some((part) => part.type === 'image');
    }
    return false;
  });
}

/**
 * Converts ChatMessage content to the format expected by LanguageModel
 * For image parts, converts base64 data URL back to Blob
 */
async function formatPromptContent(
  content: string | ContentPart[]
): Promise<string | Array<{ type: 'text' | 'image'; value: string | Blob }>> {
  if (typeof content === 'string') {
    return content;
  }

  // Process all parts, converting base64 images to Blobs
  const formattedParts = await Promise.all(
    content.map(async (part) => {
      if (part.type === 'image') {
        // Convert base64 data URL to Blob
        const response = await fetch(part.value);
        const blob = await response.blob();
        await sidepanelLogger.debug('Reconstructed blob from base64', {
          type: blob.type,
          size: blob.size,
        });
        return {
          type: part.type,
          value: blob,
        };
      }
      return {
        type: part.type,
        value: part.value,
      };
    })
  );

  return formattedParts;
}

/**
 * Executes a prompt with the LanguageModel API
 * Automatically detects if images are present and configures session accordingly
 */
export async function executePrompt(messages: ChatMessage[]): Promise<string> {
  let session: LanguageModelSession | null = null;
  await sidepanelLogger.info('LanguageModel Input', {
    messages,
    messageCount: messages.length,
  });
  try {
    // Check LanguageModel availability
    const { available, error } = await checkLanguageModelAvailability();

    if (available === 'unavailable') {
      throw new Error(
        error || 'LanguageModel API is not available. Please enable Chrome AI features.'
      );
    }

    const hasImages = hasImageContent(messages);

    await sidepanelLogger.debug('LanguageModel Input', {
      hasImages,
      messageCount: messages.length,
    });

    // Create session with appropriate configuration
    const sessionOptions: any = {};

    // Add expectedInputs if images are present
    if (hasImages) {
      sessionOptions.expectedInputs = [{ type: 'image' }];
    }

    await sidepanelLogger.info('LanguageModel: Creating session...');
    session = await LanguageModel.create(sessionOptions);
    await sidepanelLogger.info('LanguageModel: Session created successfully');

    // Format all messages for prompt (async to handle blob reconstruction)
    const formattedMessages = await Promise.all(
      messages.map(async (msg) => {
        const formattedContent = await formatPromptContent(msg.content);

        // Log image blobs specifically
        if (Array.isArray(formattedContent)) {
          formattedContent.forEach((part, idx) => {
            if (part.type === 'image' && part.value instanceof Blob) {
              sidepanelLogger.debug(`Message has image at index ${idx}`, {
                type: part.value.type,
                size: part.value.size,
                isBlob: part.value instanceof Blob,
              });
            }
          });
        }

        return {
          role: msg.role,
          content: formattedContent,
        };
      })
    );

    await sidepanelLogger.debug('Formatted messages for prompt', {
      messageCount: formattedMessages.length,
    });

    // Pass all messages to prompt
    const response: string = await session.prompt(formattedMessages as any);

    await sidepanelLogger.info('LanguageModel Output received', {
      responseType: typeof response,
      responseLength: response.length,
    });

    if (typeof response !== 'string') {
      throw new Error('Invalid response type from AI service');
    }

    return response;
  } catch (e) {
    const error = e as Error;
    await sidepanelLogger.error('Prompt failed', {
      error: e,
      messageCount: messages.length,
    });

    // Handle NotAllowedError with a more helpful message
    if (error.name === 'NotAllowedError' || error.message.includes('user gesture')) {
      throw new Error(
        'AI models need to be enabled. Please click the "Enable AI" button at the top of the page to download the required models.'
      );
    }

    throw e;
  } finally {
    if (session) {
      session.destroy();
    }
  }
}
