import { useState, useEffect } from 'react';
import { Loader2, Lightbulb } from 'lucide-react';
import { recommendVideos } from '../recommend-videos';
import type { UserPersona } from '../../types/persona';
import { VideoRecommendation } from '../../types/video-recommendation';
import { sidepanelLogger } from '../../utils/logger';

interface VideoRecommendationsProps {
  pageSummary: string;
  userPersona: UserPersona | null;
  updateVideoRecommendationsDuration?: (duration: number) => void;
}

export function VideoRecommendations({
  pageSummary,
  userPersona,
  updateVideoRecommendationsDuration,
}: VideoRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<VideoRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecommendations() {
      const startTime = Date.now();
      if (!pageSummary) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await recommendVideos(pageSummary, userPersona);
        console.log('VideoRecommendations: Received recommendations', {
          count: result.recommendations.length,
          recommendations: result.recommendations.map((r) => ({
            id: r.id,
            title: r.title,
            videoUrl: r.videoUrl,
            thumbnailUrl: r.thumbnailUrl,
            channelTitle: r.channelTitle,
            publishedAt: r.publishedAt,
            reason: r.reason?.substring(0, 50),
          })),
        });
        setRecommendations(result.recommendations);
      } catch (err) {
        console.error('Failed to get video recommendations:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load recommendations';
        setError(errorMessage);
      } finally {
        const endTime = Date.now();
        const duration = endTime - startTime;
        if (updateVideoRecommendationsDuration) {
          updateVideoRecommendationsDuration(Math.floor(duration / 1000));
        }
        // Log duration
        sidepanelLogger.debug(`Video recommendations completed in ${duration / 1000} s`);
        setIsLoading(false);
      }
    }

    loadRecommendations();
  }, [pageSummary, userPersona]);

  // Don't render anything if no summary
  if (!pageSummary) {
    return null;
  }

  return (
    <div className="px-6 py-4">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="w-5 h-5 text-primary-500 animate-spin flex-shrink-0" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI is finding the best videos for you...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
          {error}
          {error.includes('API key') && <span> Open Settings to add your YouTube API key.</span>}
        </div>
      )}

      {/* Video Cards */}
      {!isLoading && !error && recommendations.length > 0 && (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="flex flex-col gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer"
              onClick={() => window.open(rec.videoUrl, '_blank')}
            >
              {/* AI Recommendation Reason */}
              <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">{rec.reason}</p>
              </div>

              {/* Video Info */}
              <div className="flex gap-3">
                {/* Thumbnail */}
                <img
                  src={rec.thumbnailUrl}
                  alt={rec.title}
                  className="w-40 h-[90px] object-cover rounded-lg flex-shrink-0"
                />

                {/* Video Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    {rec.title}
                  </h4>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {rec.channelTitle}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{rec.publishedAt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && recommendations.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-600 dark:text-gray-400">
          No video recommendations available at this time.
        </div>
      )}
    </div>
  );
}
