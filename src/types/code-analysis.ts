// Type definitions for code frequency analysis feature

export interface CodeLanguageInfo {
  language: string;
  count: number;
}

export interface CodeAnalysisResult {
  languages: CodeLanguageInfo[];
  totalCodeBlocks: number;
  hasCodeExamples: boolean;
}

// ============================================================================
// Extracted Code Block (from HTML)
// ============================================================================

export interface ExtractedCodeBlock {
  code: string;
  hint?: string; // Language hint from HTML class (e.g., "javascript", "python")
}

// ============================================================================
// AI Response Types (for language identification)
// ============================================================================

export interface AILanguageIdentificationResponse {
  language: string;
}

// ============================================================================
// Response Schema for Structured Output
// ============================================================================

export const languageIdentificationSchema = {
  type: 'object',
  required: ['language'],
  additionalProperties: false,
  properties: {
    language: {
      type: 'string',
      description:
        'Programming language name (e.g., JavaScript, Python, TypeScript, Bash, JSON, HTML, CSS, etc.)',
    },
  },
};
