import { Loader2, FileText, Network, BookOpen } from 'lucide-react';
import { useQuickScanState } from '../hooks/useQuickScanState';
import { useShouldRead } from '../hooks/useShouldRead';
import { PageHeader } from './PageHeader';
import { SummaryCard } from './SummaryCard';
import { PageArchitecture } from './PageArchitecture';
import { ShouldIReadThis } from './ShouldIReadThis';
import { LearnMoreResources } from './LearnMoreResources';
import { ContentTooLongError } from './ContentTooLongError';
import { useState } from 'react';

interface QuickScanDisplayProps {
  isActive?: boolean;
}

export function QuickScanDisplay({ isActive }: QuickScanDisplayProps) {
  const {
    summary,
    pageTitle,
    readingTime,
    pageLinks,
    pageArchitecture,
    isLoading,
    loadingStatusMessage,
    error,
    restart,
    isContentTooLong,
    scanDuration,
  } = useQuickScanState({ isActive });
  const {
    recommendation,
    isLoading: isRecommendationLoading,
    error: recommendationError,
    shouldReadDuration,
  } = useShouldRead(summary || '');
  const [learningResourcesDuration, setLearningResourcesDuration] = useState<number>(0);

  // Show error if present
  if (error && !summary) {
    return (
      <div className="p-6">
        {isContentTooLong ? (
          <ContentTooLongError />
        ) : (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}
      </div>
    );
  }

  // Show loading state with animated spinner
  if (isLoading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">{loadingStatusMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with title, reading time, and restart button */}
      <PageHeader
        title={pageTitle}
        readingTime={readingTime}
        onRestart={restart}
        scanDuration={scanDuration + shouldReadDuration + learningResourcesDuration}
        restartTitle="Restart Quick Scan"
      />

      {/* Section 1: What This Page Covers */}
      <div className="section-connector mb-4">
        <div className="flex items-center gap-2 mb-2 px-6 ">
          <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            What This Page Covers
          </h2>
        </div>
      </div>
      <SummaryCard content={summary} />

      {/* Section 2: Should You Read This? - uses component's own dynamic heading */}
      <ShouldIReadThis
        recommendation={recommendation}
        isLoading={isRecommendationLoading}
        error={recommendationError}
      />

      {/* Conditional sections - only show if user should read this */}
      {recommendation?.action === 'should' && (
        <>
          {/* Section 3: Page Structure */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            {' '}
            <div className="section-connector mt-6 mb-4">
              <div className="flex items-center gap-2 mb-2 px-6 ">
                <Network className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Here's How It's Structured
                </h2>
              </div>
            </div>
            <PageArchitecture architecture={pageArchitecture} />
          </div>

          {/* Section 4: Learn More Resources */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="section-connector mt-6 mb-4">
              <div className="flex items-center gap-2 mb-2 px-6 ">
                <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Learn More
                </h2>
              </div>
            </div>
            <LearnMoreResources
              links={pageLinks}
              pageSummary={summary || ''}
              setLearningResourcesDuration={setLearningResourcesDuration}
            />
          </div>
        </>
      )}
    </div>
  );
}
