import { sidepanelLogger } from '../../utils/logger';

export const MAX_QUOTA_THRESHOLD = 0.7; // 70% of the input quota
export const MIN_SUPPORTED_LENGTH = 4000; // Minimum content length to validate, we assume shorter content is always valid
/**
 * Generic content validation for AI APIs that extend AISession
 */
export async function validateContentLength<TOptions, TSession extends AISession>(
  content: string,
  apiFactory: {
    availability(): Promise<AICapabilityAvailability>;
    create(options?: TOptions): Promise<TSession>;
  },
  options?: TOptions,
  defaultOptions?: TOptions
): Promise<{
  isValid: boolean;
  message?: string;
  tokens?: number;
  quota?: number;
}> {
  if (content.length < MIN_SUPPORTED_LENGTH) {
    return {
      isValid: true,
    };
  }
  try {
    const finalOptions = options || defaultOptions;

    const availability = await apiFactory.availability();

    if (availability === 'unavailable') {
      return {
        isValid: false,
        message: `${apiFactory.constructor.name || 'API'} is not available`,
      };
    }

    let session: TSession;

    if (availability === 'available') {
      session = await apiFactory.create(finalOptions);
    } else {
      // The API can be used after the model is downloaded (downloading state)
      session = await apiFactory.create(finalOptions);
      await session.ready;
    }

    const inputQuota = session.inputQuota;
    const contentTokens = (await session.measureInputUsage(content, finalOptions)) as number;
    const threshold = inputQuota * MAX_QUOTA_THRESHOLD;

    sidepanelLogger.info('Content validation', { contentTokens, inputQuota, threshold });

    // Clean up the session
    session.destroy();

    if (contentTokens > threshold) {
      return {
        isValid: false,
        message: `This content is too long for processing. We're currently working on supporting longer content. Please try with a shorter page or document.`,
        tokens: contentTokens,
        quota: inputQuota,
      };
    }

    return {
      isValid: true,
      tokens: contentTokens,
      quota: inputQuota,
    };
  } catch (e) {
    sidepanelLogger.error('Content length validation failed:', e);
    return {
      isValid: false,
      message: 'Error validating content length: ' + (e as Error).message,
    };
  }
}

/**
 * Validate content length for Summarizer API
 */
export async function validateSummarizerContent(
  text: string,
  summarizerOptions: SummarizerOptions
): Promise<{
  isValid: boolean;
  message?: string;
  tokens?: number;
  quota?: number;
}> {
  const defaultOptions: SummarizerOptions = {
    sharedContext: 'this is a website',
    type: 'key-points',
    format: 'markdown',
    length: 'short',
  };

  return validateContentLength(text, Summarizer, summarizerOptions, defaultOptions);
}

/**
 * Validate content length for Writer API
 */
export async function validateWriterContent(
  prompt: string,
  writerOptions?: WriterOptions
): Promise<{
  isValid: boolean;
  message?: string;
  tokens?: number;
  quota?: number;
}> {
  if (prompt.length < MIN_SUPPORTED_LENGTH) {
    return {
      isValid: true,
    };
  }
  const defaultOptions: WriterOptions = {
    tone: 'neutral',
    format: 'markdown',
    length: 'medium',
  };

  return validateContentLength(prompt, Writer, writerOptions, defaultOptions);
}

/**
 * Validate content length for Prompt API
 */
export async function validateLanguageModelContent(
  prompt: string,
  options?: LanguageModelPromptOptions
): Promise<{
  isValid: boolean;
  message?: string;
  tokens?: number;
  quota?: number;
}> {
  if (prompt.length < MIN_SUPPORTED_LENGTH) {
    return {
      isValid: true,
    };
  }
  return validateContentLength(prompt, LanguageModel, options, {});
}
