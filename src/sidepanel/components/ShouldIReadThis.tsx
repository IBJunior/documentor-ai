import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { ShouldReadRecommendation } from '../reading-suggestion';

interface ShouldIReadThisProps {
  recommendation: ShouldReadRecommendation | null;
  isLoading: boolean;
  error: string | null;
}

export function ShouldIReadThis({ recommendation, isLoading, error }: ShouldIReadThisProps) {
  // Show loading state
  if (isLoading && !recommendation) {
    return (
      <div className="px-6 py-4 border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 p-4 border-l-4 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-r-lg">
          <Loader2 className="w-5 h-5 text-gray-500 animate-spin flex-shrink-0" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Analyzing if this is worth reading...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !recommendation) {
    return null; // Silently fail - this is not critical
  }

  // Don't render anything if no recommendation
  if (!recommendation) {
    return null;
  }

  const isShould = recommendation.action === 'should';

  return (
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
      <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Header with Icon and Title */}
        <div className="flex items-center gap-2 mb-3">
          {isShould ? (
            <CheckCircle className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          )}
          <h3
            className={`text-lg font-semibold ${
              isShould
                ? 'text-primary-700 dark:text-primary-300'
                : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {isShould ? 'Worth Reading' : 'Consider Skipping'}
          </h3>
        </div>

        {/* Subtle Separator */}
        <div className="border-t border-gray-200 dark:border-gray-700 mb-3" />

        {/* Recommendation Reason - Regular text for clean look */}
        <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
          {recommendation.why}
        </p>
      </div>
    </div>
  );
}
