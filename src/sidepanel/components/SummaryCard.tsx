import { useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MarkdownContent } from './MarkdownContent';

interface SummaryCardProps {
  content: string | null;
  label?: string;
  icon?: string;
  size?: 'default' | 'compact';
  truncateLength?: number; // Character length to truncate at (default: 500)
}

export function SummaryCard({
  content,
  label,
  icon,
  size = 'default',
  truncateLength = 500,
}: SummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) {
    return null;
  }

  const shouldTruncate = content.length > truncateLength;
  const displayContent =
    shouldTruncate && !isExpanded ? content.substring(0, truncateLength) + '...' : content;

  return (
    <div className="px-6 py-4">
      {/* Optional Label with Icon */}
      {(label || icon) && (
        <div className="flex items-center gap-2 mb-3">
          {icon && <span className="text-lg">{icon}</span>}
          {label && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{label}</h3>
          )}
        </div>
      )}

      {/* Markdown Content - Large for default, smaller for compact */}
      {size === 'compact' ? (
        <div
          className="prose prose-base dark:prose-invert max-w-none
            prose-h1:text-lg prose-h1:font-semibold
            prose-h2:text-base prose-h2:font-semibold
            prose-h3:text-sm prose-h3:font-semibold
            prose-headings:mt-4 prose-headings:mb-2
            prose-p:leading-relaxed
            prose-li:leading-relaxed
            prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
            prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(marked.parse(displayContent) as string),
          }}
        />
      ) : (
        <MarkdownContent content={displayContent} />
      )}

      {/* Read More / Read Less Button */}
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          {isExpanded ? (
            <>
              <span>Read less</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Read more</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
