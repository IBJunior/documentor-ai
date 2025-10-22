import { AlertCircle, FileText, Search, Zap, RotateCw, X } from 'lucide-react';

interface ContentTooLongErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function ContentTooLongError({
  message = "This content is too long for processing. We're currently working on supporting longer content. Please try with a shorter page or document.",
  onRetry,
}: ContentTooLongErrorProps) {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg border border-orange-200 dark:border-orange-800 p-6 space-y-4">
        {/* Error icon */}
        <div className="flex justify-center">
          <div className="relative">
            <AlertCircle className="w-12 h-12 text-orange-500 dark:text-orange-400" />
            <div className="absolute inset-0 animate-ping">
              <AlertCircle className="w-12 h-12 text-orange-500 dark:text-orange-400 opacity-20" />
            </div>
          </div>
        </div>

        {/* Error content */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Content Too Long
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        </div>

        {/* Suggestions - minimalist */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <FileText className="w-4 h-4 text-gray-500 dark:text-gray-500 flex-shrink-0" />
            <span>Try a shorter article or section</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Search className="w-4 h-4 text-gray-500 dark:text-gray-500 flex-shrink-0" />
            <span>Focus on a specific topic</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Zap className="w-4 h-4 text-gray-500 dark:text-gray-500 flex-shrink-0" />
            <span>Use Quick Scan instead</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              Try Again
            </button>
          )}
          <button
            onClick={() => window.close()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
