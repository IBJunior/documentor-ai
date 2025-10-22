import { useState, useEffect } from 'react';
import { Lightbulb, ExternalLink, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { PageLink, NavigationContext } from '../../types/extraction';
import { recommendLinks, type RecommendedLink } from '../recommend';
import { getPersonaSummary } from '../context';

interface LearnMoreResourcesProps {
  links: PageLink[];
  pageSummary: string;
  maxLinks?: number;
  setLearningResourcesDuration?: (duration: number) => void;
}

export function LearnMoreResources({
  links,
  pageSummary,
  maxLinks = 10,
  setLearningResourcesDuration,
}: LearnMoreResourcesProps) {
  const [recommendedLinks, setRecommendedLinks] = useState<RecommendedLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch AI recommendations when component mounts
  useEffect(() => {
    async function fetchRecommendations() {
      const startTime = Date.now();
      if (links.length === 0 || !pageSummary) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const userPersona = await getPersonaSummary();

        // Fetch navigation context from storage
        const storageData = await chrome.storage.session.get(['pageNavigation']);
        const navigation = storageData.pageNavigation as NavigationContext | undefined;

        const recommendations = await recommendLinks(pageSummary, userPersona, links, navigation);
        setRecommendedLinks(recommendations);
      } catch (e) {
        console.error('Failed to generate link recommendations:', e);
        setError((e as Error).message);
        // Fallback: use original links
        setRecommendedLinks([]);
      } finally {
        setIsLoading(false);
        const endTime = Date.now();
        const duration = endTime - startTime;
        if (setLearningResourcesDuration) {
          setLearningResourcesDuration(Math.floor(duration / 1000));
        }
        // Log duration
        console.debug(`Learning resources fetched in ${duration / 1000} s`);
      }
    }

    fetchRecommendations();
  }, [links, pageSummary]);

  // Handle empty state
  if (links.length === 0) {
    return null;
  }

  // Determine which links to display
  const linksToDisplay = error || recommendedLinks.length === 0 ? links : recommendedLinks;
  const displayLinks = isExpanded ? linksToDisplay : linksToDisplay.slice(0, maxLinks);
  const hasMoreLinks = linksToDisplay.length > maxLinks;

  // Truncate URL for display
  function truncateUrl(url: string, maxLength: number = 50): string {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  }

  return (
    <div className="px-6 py-4">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="w-5 h-5 text-primary-500 animate-spin flex-shrink-0" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Curating personalized recommendations...
          </p>
        </div>
      )}

      {/* Links List */}
      {!isLoading && (
        <>
          <div className="space-y-3">
            {displayLinks.map((link, index) => {
              // Check if this is a recommended link or original link
              const isRecommended = 'why' in link;
              const recommendedLink = link as RecommendedLink;
              const originalLink = link as PageLink;

              return (
                <a
                  key={index}
                  href={isRecommended ? recommendedLink.url : originalLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    {/* Link Title */}
                    <div className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {isRecommended ? recommendedLink.title : originalLink.text}
                    </div>

                    {/* Recommendation Reason */}
                    {isRecommended && (
                      <div className="flex items-start gap-2 mb-2 text-sm text-gray-700 dark:text-gray-300">
                        <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>{recommendedLink.why}</span>
                      </div>
                    )}

                    {/* URL */}
                    <div className="text-sm text-gray-500 dark:text-gray-500 truncate">
                      {truncateUrl(isRecommended ? recommendedLink.url : originalLink.url)}
                    </div>
                  </div>

                  {/* External Link Icon */}
                  <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 flex-shrink-0 mt-1 transition-colors" />
                </a>
              );
            })}
          </div>

          {/* Show More/Less Buttons */}
          {hasMoreLinks && !isExpanded && (
            <button
              className="flex items-center gap-2 mt-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              onClick={() => setIsExpanded(true)}
            >
              <ChevronDown className="w-4 h-4" />
              <span>
                Show {linksToDisplay.length - maxLinks} more{' '}
                {linksToDisplay.length - maxLinks === 1 ? 'link' : 'links'}
              </span>
            </button>
          )}

          {isExpanded && hasMoreLinks && (
            <button
              className="flex items-center gap-2 mt-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronUp className="w-4 h-4" />
              <span>Show less</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
