import { Clock, RotateCcw, Timer } from 'lucide-react';

interface PageHeaderProps {
  title: string | null;
  readingTime: string | null;
  scanDuration?: number | null;
  onRestart?: () => void;
  restartTitle?: string;
}

export function PageHeader({
  title,
  readingTime,
  scanDuration,
  onRestart,
  restartTitle,
}: PageHeaderProps) {
  if (!title) {
    return null;
  }

  return (
    <div className="px-6 py-4  border-gray-200 dark:border-gray-700">
      {/* Page Title */}
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{title}</h2>

      {/* Metadata Row */}
      {readingTime && (
        <div className="flex items-center gap-3 flex-wrap">
          {/* Reading Time Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
            <Clock className="w-4 h-4" />
            <span>{readingTime}</span>
          </div>

          {/* Scan Duration Badge */}
          {scanDuration !== null && scanDuration !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
              <Timer className="w-4 h-4" />
              <span>{scanDuration}s</span>
            </div>
          )}

          {/* Restart Button */}
          {onRestart && (
            <button
              onClick={onRestart}
              title={restartTitle || 'Restart'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restart</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
