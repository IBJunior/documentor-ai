import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { analyzeCodeBlocks } from '../analyze-code-blocks';
import type { CodeAnalysisResult, ExtractedCodeBlock } from '../../types/code-analysis';
import { sidepanelLogger } from '../../utils/logger';

interface CodeFrequencyProps {
  updateCodeAnalysisDuration?: (duration: number) => void;
}

export function CodeFrequency({ updateCodeAnalysisDuration }: CodeFrequencyProps) {
  const [analysis, setAnalysis] = useState<CodeAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadCodeAnalysis() {
      const startTime = Date.now();

      setIsLoading(true);

      try {
        // Step 1: Trigger code block extraction from the active tab
        sidepanelLogger.info('Triggering code block extraction...');
        const extractResponse = await chrome.runtime.sendMessage({
          type: 'EXTRACT_CODE_BLOCKS',
        });

        if (!extractResponse?.success) {
          sidepanelLogger.warn('Code block extraction failed or no code blocks found');
          setAnalysis({ languages: [], totalCodeBlocks: 0, hasCodeExamples: false });
          return;
        }

        // Step 2: Wait a bit for extraction to complete and storage to update
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Step 3: Get extracted code blocks from storage
        const data = await chrome.storage.session.get(['extractedCodeBlocks']);
        const extractedCodeBlocks = data.extractedCodeBlocks as ExtractedCodeBlock[] | undefined;

        if (!extractedCodeBlocks || extractedCodeBlocks.length === 0) {
          sidepanelLogger.info('No code blocks found on page');
          setAnalysis({ languages: [], totalCodeBlocks: 0, hasCodeExamples: false });
          return;
        }

        sidepanelLogger.info('Code blocks extracted', {
          count: extractedCodeBlocks.length,
          blocksWithHints: extractedCodeBlocks.filter((b) => b.hint).length,
        });

        // Step 4: Analyze code blocks with AI (identify languages)
        const result = await analyzeCodeBlocks(extractedCodeBlocks);

        sidepanelLogger.info('Code analysis complete', {
          hasCodeExamples: result.hasCodeExamples,
          totalCodeBlocks: result.totalCodeBlocks,
          languagesFound: result.languages.length,
        });

        setAnalysis(result);
      } catch (err) {
        // Log error but don't show to user - code analysis is optional
        console.error('Failed to analyze code blocks:', err);
        sidepanelLogger.error('Code analysis failed', { error: err });
        // Set empty result to hide the component
        setAnalysis({ languages: [], totalCodeBlocks: 0, hasCodeExamples: false });
      } finally {
        const endTime = Date.now();
        const duration = endTime - startTime;
        if (updateCodeAnalysisDuration) {
          updateCodeAnalysisDuration(Math.floor(duration / 1000));
        }
        sidepanelLogger.debug(`Code analysis completed in ${duration / 1000} s`);
        setIsLoading(false);
      }
    }

    loadCodeAnalysis();
  }, []);

  // Don't render anything if not loading and no code examples found
  if (!isLoading && (!analysis || !analysis.hasCodeExamples || analysis.totalCodeBlocks === 0)) {
    return <div>No code examples found</div>;
  }

  return (
    <div className="px-6 py-4">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="w-5 h-5 text-primary-500 animate-spin flex-shrink-0" />
          <p className="text-sm text-gray-600 dark:text-gray-400">AI is analyzing code blocks...</p>
        </div>
      )}

      {/* Content */}
      {!isLoading && analysis && analysis.hasCodeExamples && (
        <div className="space-y-4">
          {/* Summary Card - Minimal Design */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {analysis.totalCodeBlocks} code{' '}
              {analysis.totalCodeBlocks === 1 ? 'example' : 'examples'} found
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              This documentation includes practical code samples you can learn from.
            </div>
          </div>

          {/* Language Badges */}
          {analysis.languages.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Programming Languages:
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.languages.map((lang) => (
                  <div
                    key={lang.language}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-full"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {lang.language}
                    </span>
                    <span className="px-2 py-0.5 bg-primary-600 dark:bg-primary-500 text-white text-xs font-semibold rounded-full">
                      {lang.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
