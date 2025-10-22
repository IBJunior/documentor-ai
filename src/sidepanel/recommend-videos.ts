/**
 * AI-Powered YouTube Video Recommendation Module
 * Uses Chrome's LanguageModel with tool calling to recommend personalized videos
 */

import { searchYouTube, type YouTubeVideo } from './youtube-search';
import { getYouTubeApiKey } from './youtube-api-storage';
import { sidepanelLogger } from '../utils/logger';
import type { UserPersona } from '../types/persona';
import { getPersonaSummary } from './context';
import {
  VideoDataForModel,
  RecommendVideosResult,
  videoRecommendationSchema,
  VideoRecommendation,
  AIVideoRecommendation,
  querySchema,
} from '../types/video-recommendation';
import { checkLanguageModelAvailability } from '../utils/api-checker';
import {
  formatPrompt,
  QUERY_GENERATION_PROMPT_TEMPLATE,
  VIDEO_SELECTION_PROMPT_TEMPLATE,
} from './prompts';

// ============================================================================
// Data Formatting for Model
// ============================================================================

function formatPublishedDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function formatVideosForModel(videos: YouTubeVideo[]): VideoDataForModel[] {
  return videos.map((video) => ({
    id: video.id,
    title: video.title,
    description: video.description.slice(0, 200), // Truncate to 200 chars for AI analysis
  }));
}

// ============================================================================
// Main Recommendation Function
// ============================================================================

export async function recommendVideos(
  pageSummary: string,
  userPersona: UserPersona | null
): Promise<RecommendVideosResult> {
  const startTime = performance.now();
  sidepanelLogger.info('Starting video recommendation', { hasPersona: !!userPersona });

  const apiKey = await getYouTubeApiKey();
  if (!apiKey) {
    throw new Error('YouTube API key is required. Please add it in Settings.');
  }

  // Check LanguageModel availability before proceeding
  const { available, error } = await checkLanguageModelAvailability();
  if (available === 'unavailable') {
    throw new Error(
      error || 'LanguageModel API is not available. Please enable Chrome AI features.'
    );
  }

  // Get persona summary from context (loads from storage and formats)
  const personaText = await getPersonaSummary();

  let session: LanguageModelSession | null = null;

  try {
    // STEP 1: Generate search query using AI with structured output
    const step1Start = performance.now();
    sidepanelLogger.info('Step 1: Generating search query');

    const querySession = await LanguageModel.create();

    const queryPrompt = formatPrompt(QUERY_GENERATION_PROMPT_TEMPLATE, {
      PAGE_SUMMARY: pageSummary.substring(0, 500),
      USER_PERSONA: personaText,
    });

    const queryResponse = await querySession.prompt(queryPrompt, {
      responseConstraint: querySchema,
    });

    querySession.destroy();

    // Parse query response
    let searchQuery: string;
    if (typeof queryResponse === 'string') {
      const parsed = JSON.parse(queryResponse);
      searchQuery = parsed.query;
    } else {
      searchQuery = (queryResponse as any).query;
    }

    const step1Duration = (performance.now() - step1Start) / 1000;
    sidepanelLogger.info('Generated search query', {
      searchQuery,
      durationSeconds: step1Duration.toFixed(2),
    });
    console.log('🔍 Search query:', searchQuery);

    // STEP 2: Actually search YouTube (no tool, direct call)
    const step2Start = performance.now();
    sidepanelLogger.info('Step 2: Searching YouTube API');
    const searchResult = await searchYouTube(searchQuery.trim(), apiKey);

    if (!searchResult.success || searchResult.videos.length === 0) {
      throw new Error(searchResult.error || 'No videos found');
    }

    const step2Duration = (performance.now() - step2Start) / 1000;
    sidepanelLogger.info('YouTube search completed', {
      videosFound: searchResult.videos.length,
      durationSeconds: step2Duration.toFixed(2),
    });

    // STEP 3: Create video lookup map for later enrichment
    const videoMap = new Map<string, YouTubeVideo>();
    searchResult.videos.forEach((video) => {
      videoMap.set(video.id, video);
    });

    // STEP 4: Format videos for AI selection (minimal data)
    const formattedVideos = formatVideosForModel(searchResult.videos);

    // STEP 5: Ask AI to select and explain top 3
    const selectionPrompt = formatPrompt(VIDEO_SELECTION_PROMPT_TEMPLATE, {
      PAGE_SUMMARY: pageSummary,
      USER_PERSONA: personaText,
      SEARCH_QUERY: searchQuery,
      VIDEOS: JSON.stringify(formattedVideos, null, 2),
    });

    const step3Start = performance.now();
    sidepanelLogger.info('Step 3: Asking AI to select top 3 videos');

    session = await LanguageModel.create({
      initialPrompts: [{ role: 'system', content: selectionPrompt }],
    });

    const response = await session.prompt('Select and return the top 3 videos in JSON format.', {
      responseConstraint: videoRecommendationSchema,
    });

    sidepanelLogger.info('Received recommendation response', {
      responseType: typeof response,
      responsePreview:
        typeof response === 'string'
          ? response.substring(0, 500)
          : JSON.stringify(response).substring(0, 500),
      fullResponse: response,
    });

    // Parse response (handle both object and string)
    let aiRecommendations: AIVideoRecommendation[];

    if (Array.isArray(response)) {
      aiRecommendations = response as AIVideoRecommendation[];
    } else if (typeof response === 'string') {
      try {
        aiRecommendations = JSON.parse(response) as AIVideoRecommendation[];
      } catch (error) {
        sidepanelLogger.error('Failed to parse response', { error, response });
        throw new Error('Failed to parse AI response');
      }
    } else {
      throw new Error('Invalid response type from AI');
    }

    // Validate AI recommendations
    if (!Array.isArray(aiRecommendations) || aiRecommendations.length === 0) {
      throw new Error('No recommendations returned');
    }

    // Enrich AI recommendations with full video data from lookup map
    const recommendations: VideoRecommendation[] = aiRecommendations
      .map((aiRec) => {
        const video = videoMap.get(aiRec.id);
        if (!video) {
          sidepanelLogger.warn('Video not found in lookup map', { videoId: aiRec.id });
          return null;
        }
        return {
          id: video.id,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
          channelTitle: video.channelTitle,
          publishedAt: formatPublishedDate(video.publishedAt),
          videoUrl: video.videoUrl,
          reason: aiRec.reason,
        };
      })
      .filter((rec): rec is VideoRecommendation => rec !== null);

    // Validate enriched recommendations
    if (recommendations.length === 0) {
      throw new Error('Failed to enrich recommendations with video data');
    }

    // Log each recommendation for debugging
    sidepanelLogger.info('Parsed recommendations', {
      recommendedCount: recommendations.length,
      recommendations: recommendations.map((r) => ({
        id: r.id,
        title: r.title?.substring(0, 50),
        hasVideoUrl: !!r.videoUrl,
        hasThumbnail: !!r.thumbnailUrl,
        videoUrl: r.videoUrl,
        thumbnailUrl: r.thumbnailUrl,
      })),
    });

    const step3Duration = (performance.now() - step3Start) / 1000;
    const totalDuration = (performance.now() - startTime) / 1000;

    sidepanelLogger.info('Video recommendation complete', {
      recommendedCount: recommendations.length,
      step3DurationSeconds: step3Duration.toFixed(2),
      totalDurationSeconds: totalDuration.toFixed(2),
    });

    // Return recommendations directly - they already contain all display fields
    return {
      recommendations,
    };
  } catch (error) {
    sidepanelLogger.error('Video recommendation failed', { error });
    throw error;
  } finally {
    if (session) {
      session.destroy();
    }
  }
}
