import { MousePointer2, Image, FileText } from 'lucide-react';

interface FeatureHintsCardsProps {
  variant?: 'default' | 'compact';
}

export function FeatureHintsCards({ variant = 'default' }: FeatureHintsCardsProps) {
  const isCompact = variant === 'compact';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Text Selection Feature */}
      <div
        className={`flex flex-col items-center ${isCompact ? 'p-4' : 'p-6'} border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50`}
      >
        <div
          className={`${isCompact ? 'w-12 h-12' : 'w-14 h-14'} rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 ${isCompact ? 'mb-3' : 'mb-4'}`}
        >
          <FileText className={isCompact ? 'w-6 h-6' : 'w-7 h-7'} />
        </div>
        <h4
          className={`${isCompact ? 'text-sm' : 'text-base'} font-semibold text-gray-900 dark:text-gray-100 ${isCompact ? 'mb-2' : 'mb-3'}`}
        >
          Explain Selected Text
        </h4>
        <div
          className={`text-left ${isCompact ? 'text-xs space-y-1.5' : 'text-sm space-y-2'} text-gray-700 dark:text-gray-300 w-full`}
        >
          <div className="flex items-start gap-2">
            <MousePointer2
              className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400`}
            />
            <span>
              <strong>Select text</strong> on any {isCompact ? 'page' : 'documentation page'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span
              className={`${isCompact ? 'w-3.5 h-3.5 text-[10px]' : 'w-4 h-4'} mt-0.5 flex-shrink-0 text-center font-bold text-blue-600 dark:text-blue-400`}
            >
              2
            </span>
            <span>
              Click <strong>"Explain like I'm 5"</strong> {isCompact ? '' : 'in the popup menu'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span
              className={`${isCompact ? 'w-3.5 h-3.5 text-[10px]' : 'w-4 h-4'} mt-0.5 flex-shrink-0 text-center font-bold text-blue-600 dark:text-blue-400`}
            >
              3
            </span>
            <span>Ask follow-up questions{isCompact ? '!' : ' anytime!'}</span>
          </div>
        </div>
      </div>

      {/* Image Explanation Feature */}
      <div
        className={`flex flex-col items-center ${isCompact ? 'p-4' : 'p-6'} border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50`}
      >
        <div
          className={`${isCompact ? 'w-12 h-12' : 'w-14 h-14'} rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 ${isCompact ? 'mb-3' : 'mb-4'}`}
        >
          <Image className={isCompact ? 'w-6 h-6' : 'w-7 h-7'} />
        </div>
        <h4
          className={`${isCompact ? 'text-sm' : 'text-base'} font-semibold text-gray-900 dark:text-gray-100 ${isCompact ? 'mb-2' : 'mb-3'}`}
        >
          Explain Images
        </h4>
        <div
          className={`text-left ${isCompact ? 'text-xs space-y-1.5' : 'text-sm space-y-2'} text-gray-700 dark:text-gray-300 w-full`}
        >
          <div className="flex items-start gap-2">
            <MousePointer2
              className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} mt-0.5 flex-shrink-0 text-purple-600 dark:text-purple-400`}
            />
            <span>
              <strong>Hover</strong> over any image {isCompact ? '' : 'or diagram'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span
              className={`${isCompact ? 'w-3.5 h-3.5 text-[10px]' : 'w-4 h-4'} mt-0.5 flex-shrink-0 text-center font-bold text-purple-600 dark:text-purple-400`}
            >
              2
            </span>
            <span>
              Click the <strong>"Explain this image"</strong> button
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span
              className={`${isCompact ? 'w-3.5 h-3.5 text-[10px]' : 'w-4 h-4'} mt-0.5 flex-shrink-0 text-center font-bold text-purple-600 dark:text-purple-400`}
            >
              3
            </span>
            <span>Ask questions about {isCompact ? 'it!' : 'the image!'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
