import { Loader2, FileText, Network, Code, Video, BookOpen } from 'lucide-react';
import { useDeepAnalysisState } from '../hooks/useDeepAnalysisState';
import { useShouldRead } from '../hooks/useShouldRead';
import { PageHeader } from './PageHeader';
import { SummaryCard } from './SummaryCard';
// import { ShouldIReadThis } from './ShouldIReadThis';
import { VideoRecommendations } from './VideoRecommendations';
import { LearnMoreResources } from './LearnMoreResources';
import type { UserPersona } from '../../types/persona';
import { ContentTooLongError } from './ContentTooLongError';
import { PageArchitecture } from './PageArchitecture';
import { CodeFrequency } from './CodeFrequency';
import { useState } from 'react';

interface DeepAnalysisDisplayProps {
  userPersona: UserPersona | null;
  isActive?: boolean;
}

export function DeepAnalysisDisplay({ userPersona, isActive }: DeepAnalysisDisplayProps) {
  const {
    summary,
    pageTitle,
    readingTime,
    pageLinks,
    isLoading,
    loadingStatusMessage,
    error,
    restart,
    pageArchitecture,
    scanDuration,
    isContentTooLong,
    codeAnalysisDuration,
    setCodeAnalysisDuration,
  } = useDeepAnalysisState({ isActive });
  const {
    recommendation,
    // isLoading: isRecommendationLoading,
    shouldReadDuration,
    // error: recommendationError,
  } = useShouldRead(summary || '');
  const [learningResourcesDuration, setLearningResourcesDuration] = useState<number>(0);
  const [videoRecommendationDuration, setVideoRecommendationDuration] = useState<number>(0);

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
        scanDuration={
          scanDuration +
          learningResourcesDuration +
          shouldReadDuration +
          videoRecommendationDuration +
          codeAnalysisDuration
        }
        restartTitle="Restart Deep Analysis"
      />

      {/* Section 1: Overview */}
      <div className="section-connector mb-4">
        <div className="flex items-center gap-2 mb-2 px-6">
          <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Overview</h2>
        </div>
      </div>
      <SummaryCard content={summary} />

      {/* Section 2: Structure & Code Patterns - grouped technical section */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="section-connector mt-6 mb-4">
          <div className="flex items-center gap-2 mb-2 px-6">
            <Network className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Structure & Code Patterns
            </h2>
          </div>
        </div>

        {/* Page Architecture */}
        <PageArchitecture architecture={pageArchitecture} />

        {/* Code Examples sub-section */}
        <>
          <div className="section-connector mt-6 mb-4">
            <div className="flex items-center gap-2 mb-2 px-6">
              <Code className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Code Examples
              </h3>
            </div>
          </div>
          <CodeFrequency updateCodeAnalysisDuration={setCodeAnalysisDuration} />
        </>
      </div>

      {/* Section 3: Should I Read This - uses component's own dynamic heading */}
      {/* <ShouldIReadThis
        recommendation={recommendation}
        isLoading={isRecommendationLoading}
        error={recommendationError}
      /> */}

      {/* Conditional sections - only if user should read this */}
      {recommendation?.action === 'should' && (
        <>
          {/* Section 4: Recommended Videos */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="section-connector mt-6 mb-4">
              <div className="flex items-center gap-2 mb-2 px-6">
                <Video className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Recommended Videos
                </h2>
              </div>
            </div>
            <VideoRecommendations
              pageSummary={summary || ''}
              userPersona={userPersona}
              updateVideoRecommendationsDuration={setVideoRecommendationDuration}
            />
          </div>

          {/* Section 5: Related Reading */}
          {videoRecommendationDuration > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <div className="section-connector mt-6 mb-4">
                <div className="flex items-center gap-2 mb-2 px-6">
                  <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Related Reading
                  </h2>
                </div>
              </div>
              <LearnMoreResources
                links={pageLinks}
                pageSummary={summary || ''}
                setLearningResourcesDuration={setLearningResourcesDuration}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
