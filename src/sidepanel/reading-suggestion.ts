import { sidepanelLogger } from '../utils/logger';
import { SHOULD_READ_PROMPT_TEMPLATE, formatPrompt } from './prompts';
import { checkLanguageModelAvailability } from '../utils/api-checker';

export interface ShouldReadRecommendation {
  action: 'should' | 'shouldnt';
  why: string;
  sections?: string[];
}

export const shouldReadSchema = {
  type: 'object',
  required: ['action', 'why'],
  additionalProperties: false,
  properties: {
    action: {
      type: 'string',
      enum: ['should', 'shouldnt'],
      description: 'Whether the user should read this documentation now',
    },
    why: {
      type: 'string',
      description: 'Specific, actionable explanation (40-50 words, 2-3 sentences)',
    },
    sections: {
      type: 'array',
      items: { type: 'string' },
      description: 'Optional: Recommended sections to focus on (from page architecture)',
    },
  },
};

let session: LanguageModelSession | null = null;

export async function analyzeIfShouldRead(
  pageSummary: string,
  pageArchitecture: string,
  userPersona: string
): Promise<ShouldReadRecommendation> {
  sidepanelLogger.info('Starting should-read analysis');

  const prompt = formatPrompt(SHOULD_READ_PROMPT_TEMPLATE, {
    PAGE_SUMMARY: pageSummary,
    PAGE_ARCHITECTURE: pageArchitecture,
    USER_PERSONA: userPersona,
  });
  // sidepanelLogger.debug('Should-read prompt:', prompt);

  const response = await runPrompt(prompt, { outputLanguage: 'en' }, shouldReadSchema);

  if (typeof response === 'object' && !Array.isArray(response)) {
    return response as ShouldReadRecommendation;
  }

  if (typeof response === 'string') {
    try {
      sidepanelLogger.debug('Raw AI response string:', response);
      const parsed = JSON.parse(response) as ShouldReadRecommendation;
      sidepanelLogger.debug('Parsed AI response object:', parsed);
      return parsed;
    } catch (error) {
      sidepanelLogger.error('Failed to parse AI response:', error);
      throw new Error('Failed to parse AI response: ' + (error as Error).message);
    }
  }

  throw new Error('Invalid response type from AI service');
}

async function runPrompt(
  prompt: string,
  params: LanguageModelOptions,
  schema: unknown
): Promise<string | ShouldReadRecommendation> {
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
    }) as Promise<string | ShouldReadRecommendation>;
  } catch (e) {
    console.log('Prompt failed');
    console.error(e);
    console.log('Prompt:', prompt);
    // Reset session
    if (session) {
      session.destroy();
    }
    session = null;
    throw e;
  }
}
