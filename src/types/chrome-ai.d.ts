// Type definitions for Chrome's Built-in AI APIs (Gemini Nano)
// https://github.com/explainers-by-googlers/prompt-api
// https://github.com/explainers-by-googlers/writing-assistance-apis

declare global {
  interface Window {
    ai?: {
      languageModel?: {
        availability(): Promise<AICapabilityAvailability>;
        create(options?: LanguageModelOptions): Promise<LanguageModelSession>;
      };
      summarizer?: {
        availability(): Promise<AICapabilityAvailability>;
        create(options?: SummarizerOptions): Promise<SummarizerSession>;
      };
      writer?: {
        availability(): Promise<AICapabilityAvailability>;
        create(options?: WriterOptions): Promise<WriterSession>;
      };
    };
  }

  // Language Model API
  interface LanguageModel {
    availability(): Promise<AICapabilityAvailability>;
    create(options?: LanguageModelOptions): Promise<LanguageModelSession>;
  }

  interface LanguageModelOptions {
    signal?: AbortSignal;
    monitor?: (monitor: AICreateMonitor) => void;
    systemPrompt?: string;
    initialPrompts?: Array<LanguageModelPrompt>;
    topK?: number;
    temperature?: number;
    outputLanguage?: string;
    expectedInputs?: Array<{ type: 'text' | 'image' }>;
    tools?: Array<LanguageModelTool>;
  }

  interface LanguageModelTool {
    name: string;
    description: string;
    inputSchema: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
    execute: (args: any) => Promise<string>;
  }

  interface LanguageModelPromptContentPart {
    type: 'text' | 'image';
    value: string | Blob;
  }

  interface LanguageModelPrompt {
    role: 'system' | 'user' | 'assistant';
    content: string | LanguageModelPromptContentPart[];
  }

  interface LanguageModelSession extends AISession {
    prompt(
      input: string | Array<{ role: 'user'; content: LanguageModelPromptContentPart[] }>,
      options?: LanguageModelPromptOptions
    ): Promise<string>;
    promptStreaming(input: string, options?: LanguageModelPromptOptions): ReadableStream;
    countPromptTokens(input: string, options?: LanguageModelPromptOptions): Promise<number>;
    tokensSoFar: number;
    maxTokens: number;
    tokensLeft: number;
    topK: number;
    temperature: number;
    clone(): Promise<LanguageModelSession>;
    destroy(): void;
  }

  interface LanguageModelPromptOptions {
    signal?: AbortSignal;
    responseConstraint?: unknown;
  }

  // Common AI Session interface
  interface AISession {
    measureInputUsage(input: string, options: any): unknown;
    inputQuota: number;
    ready: Promise<void>;
    addEventListener(
      type: 'downloadprogress',
      listener: (event: DownloadProgressEvent) => void
    ): void;
    removeEventListener(
      type: 'downloadprogress',
      listener: (event: DownloadProgressEvent) => void
    ): void;
    destroy(): void;
  }

  // Summarizer API
  interface Summarizer {
    availability(): Promise<AICapabilityAvailability>;
    create(options?: SummarizerOptions): Promise<SummarizerSession>;
  }

  interface SummarizerOptions {
    signal?: AbortSignal;
    monitor?: (monitor: AICreateMonitor) => void;
    sharedContext?: string;
    type?: 'tldr' | 'key-points' | 'teaser' | 'headline';
    format?: 'plain-text' | 'markdown';
    length?: 'short' | 'medium' | 'long';
  }

  interface SummarizerSession extends AISession {
    summarize(input: string, options?: SummarizerSummarizeOptions): Promise<string>;
    summarizeStreaming(input: string, options?: SummarizerSummarizeOptions): ReadableStream;
  }

  interface SummarizerSummarizeOptions {
    signal?: AbortSignal;
    context?: string;
  }

  // Writer API
  interface Writer {
    availability(): Promise<AICapabilityAvailability>;
    create(options?: WriterOptions): Promise<WriterSession>;
  }

  interface WriterOptions {
    signal?: AbortSignal;
    monitor?: (monitor: AICreateMonitor) => void;
    sharedContext?: string;
    tone?: 'formal' | 'neutral' | 'casual';
    format?: 'plain-text' | 'markdown';
    length?: 'short' | 'medium' | 'long';
  }

  interface WriterSession extends AISession {
    write(input: string, options?: WriterWriteOptions): Promise<string>;
    writeStreaming(input: string, options?: WriterWriteOptions): ReadableStream;
  }

  interface WriterWriteOptions {
    signal?: AbortSignal;
    context?: string;
  }

  interface DownloadProgressEvent extends Event {
    loaded: number;
    total: number;
  }

  // Common types
  type AICapabilityAvailability = 'downloadable' | 'available' | 'unavailable' | 'downloading';

  interface AICreateMonitor extends EventTarget {
    addEventListener(
      type: 'downloadprogress',
      listener: (event: DownloadProgressEvent) => void
    ): void;
    removeEventListener(
      type: 'downloadprogress',
      listener: (event: DownloadProgressEvent) => void
    ): void;
  }

  // Global variables (Chrome's implementation)
  const LanguageModel: LanguageModel;
  const Summarizer: Summarizer;
  const Writer: Writer;
}

export {};
