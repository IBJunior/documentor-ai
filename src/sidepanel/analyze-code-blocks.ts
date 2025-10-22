/**
 * AI-Powered Code Block Analysis Module
 * Uses Chrome's LanguageModel to identify programming languages in code blocks
 */

import { sidepanelLogger } from '../utils/logger';
import {
  languageIdentificationSchema,
  type CodeAnalysisResult,
  type AILanguageIdentificationResponse,
  type CodeLanguageInfo,
  type ExtractedCodeBlock,
} from '../types/code-analysis';
import { checkLanguageModelAvailability } from '../utils/api-checker';
import { formatPrompt, LANGUAGE_IDENTIFICATION_PROMPT_TEMPLATE } from './prompts';
import { validateLanguageModelContent } from './utils/content-validation';

// ============================================================================
// Helper Functions
// ============================================================================

// TODO Temporary before implementing better solution
/**
 * Normalize language hint from HTML class names
 * e.g., "js" -> "JavaScript", "py" -> "Python"
 */
function normalizeLanguageHint(hint: string | undefined): string {
  if (!hint) return 'None';

  const normalized = hint.toLowerCase().trim();

  // Map common abbreviations to full names
  const languageMap: Record<string, string> = {
    js: 'JavaScript',
    javascript: 'JavaScript',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    py: 'Python',
    python: 'Python',
    java: 'Java',
    cpp: 'C / C++',
    'c++': 'C / C++',
    c: 'C / C++',
    cs: 'C#',
    csharp: 'C#',
    go: 'Go',
    golang: 'Go',
    rs: 'Rust',
    rust: 'Rust',
    rb: 'Ruby',
    ruby: 'Ruby',
    php: 'PHP',
    swift: 'Swift',
    kt: 'Kotlin',
    kotlin: 'Kotlin',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    yml: 'YAML',
    yaml: 'YAML',
    xml: 'XML',
    sql: 'SQL',
    sh: 'Bash',
    bash: 'Bash',
    shell: 'Bash',
    zsh: 'Bash',
    powershell: 'PowerShell',
    ps1: 'PowerShell',
    r: 'R',
    scala: 'Scala',
    dart: 'Dart',
    md: 'Markdown',
    markdown: 'Markdown',
  };

  return languageMap[normalized] || hint;
}

/**
 * Identify language for a single code block using AI
 */
async function identifyLanguage(
  session: LanguageModelSession,
  codeBlock: ExtractedCodeBlock
): Promise<string> {
  const { code, hint } = codeBlock;

  // Truncate very long code blocks (keep first 1000 chars for identification)
  const truncatedCode = code.length > 1000 ? code.substring(0, 1000) + '\n...' : code;

  const normalizedHint = normalizeLanguageHint(hint);

  // Format prompt with code and hint
  const prompt = formatPrompt(LANGUAGE_IDENTIFICATION_PROMPT_TEMPLATE, {
    CODE_SNIPPET: truncatedCode,
    LANGUAGE_HINT: normalizedHint,
  });

  const options = {
    responseConstraint: languageIdentificationSchema,
  };

  try {
    // Validate content (should always pass since we're truncating)
    const validation = await validateLanguageModelContent(prompt, options);
    if (!validation.isValid) {
      sidepanelLogger.warn('Code snippet too long, skipping', {
        codeLength: code.length,
        truncatedLength: truncatedCode.length,
      });
      return 'Plain Text';
    }

    // Request language identification from AI
    const response = await session.prompt(prompt, options);

    // Parse response
    let aiResponse: AILanguageIdentificationResponse;

    if (typeof response === 'string') {
      try {
        aiResponse = JSON.parse(response) as AILanguageIdentificationResponse;
      } catch (error) {
        sidepanelLogger.warn('Failed to parse AI response, using hint or fallback', {
          error,
          hint: normalizedHint,
        });
        return normalizedHint !== 'None' ? normalizedHint : 'Plain Text';
      }
    } else {
      aiResponse = response as AILanguageIdentificationResponse;
    }

    return aiResponse.language || 'Plain Text';
  } catch (error) {
    sidepanelLogger.warn('Language identification failed, using hint or fallback', {
      error,
      hint: normalizedHint,
    });
    return normalizedHint !== 'None' ? normalizedHint : 'Plain Text';
  }
}

// ============================================================================
// Main Analysis Function
// ============================================================================

export async function analyzeCodeBlocks(
  codeBlocks: ExtractedCodeBlock[]
): Promise<CodeAnalysisResult> {
  const startTime = performance.now();
  sidepanelLogger.info('Starting code block analysis', {
    totalBlocks: codeBlocks.length,
  });

  // If no code blocks, return empty result
  if (!codeBlocks || codeBlocks.length === 0) {
    sidepanelLogger.info('No code blocks to analyze');
    return {
      languages: [],
      totalCodeBlocks: 0,
      hasCodeExamples: false,
    };
  }

  // Check LanguageModel availability before proceeding
  const { available, error } = await checkLanguageModelAvailability();
  if (available === 'unavailable') {
    throw new Error(
      error || 'LanguageModel API is not available. Please enable Chrome AI features.'
    );
  }

  let session: LanguageModelSession | null = null;

  try {
    // Create AI session
    session = await LanguageModel.create();

    // Identify language for each code block
    const identifiedLanguages: string[] = [];

    for (let i = 0; i < codeBlocks.length; i++) {
      const codeBlock = codeBlocks[i];
      sidepanelLogger.debug(`Identifying language for code block ${i + 1}/${codeBlocks.length}`, {
        hint: codeBlock.hint,
        codePreview: codeBlock.code.substring(0, 100),
      });

      const language = await identifyLanguage(session, codeBlock);
      identifiedLanguages.push(language);

      sidepanelLogger.debug(`Identified language: ${language}`, {
        blockIndex: i,
        hint: codeBlock.hint,
      });
    }

    // Count occurrences of each language programmatically
    const languageCounts = new Map<string, number>();

    for (const language of identifiedLanguages) {
      languageCounts.set(language, (languageCounts.get(language) || 0) + 1);
    }

    // Convert to array and sort by count (descending)
    const languages: CodeLanguageInfo[] = Array.from(languageCounts.entries())
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);

    const totalDuration = (performance.now() - startTime) / 1000;

    sidepanelLogger.info('Code block analysis complete', {
      hasCodeExamples: true,
      totalCodeBlocks: codeBlocks.length,
      languagesFound: languages.length,
      durationSeconds: totalDuration.toFixed(2),
    });

    return {
      languages,
      totalCodeBlocks: codeBlocks.length,
      hasCodeExamples: true,
    };
  } catch (error) {
    sidepanelLogger.error('Code block analysis failed', { error });
    throw error;
  } finally {
    if (session) {
      session.destroy();
    }
  }
}
