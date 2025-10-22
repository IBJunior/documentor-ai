/**
 * YouTube Data API v3 integration for searching videos
 * Official API documentation: https://developers.google.com/youtube/v3/docs/search/list
 */

// TypeScript interfaces for YouTube Data API v3 responses
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  videoUrl: string;
}

export interface YouTubeSearchResult {
  success: boolean;
  videos: YouTubeVideo[];
  error?: string;
}

interface YouTubeAPIResponse {
  items?: Array<{
    id: {
      kind: string;
      videoId: string;
    };
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        medium: {
          url: string;
        };
      };
      channelTitle: string;
      publishedAt: string;
    };
  }>;
  error?: {
    code: number;
    message: string;
    errors: Array<{
      reason: string;
      message: string;
    }>;
  };
}

/**
 * Search YouTube for videos using the official YouTube Data API v3
 * @param query - The search query string
 * @param apiKey - YouTube Data API v3 key
 * @returns Promise with search results containing top 3 videos
 */
export async function searchYouTube(query: string, apiKey: string): Promise<YouTubeSearchResult> {
  if (!query.trim()) {
    return {
      success: false,
      videos: [],
      error: 'Please enter a search query',
    };
  }

  if (!apiKey.trim()) {
    return {
      success: false,
      videos: [],
      error: 'YouTube API key is required. Please add it in Settings.',
    };
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: '3',
      key: apiKey,
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
    );

    const data: YouTubeAPIResponse = await response.json();

    // Handle API errors
    if (data.error) {
      let errorMessage = data.error.message;

      // Provide user-friendly error messages
      if (data.error.code === 403) {
        if (data.error.errors[0]?.reason === 'quotaExceeded') {
          errorMessage = 'YouTube API quota exceeded. Please try again tomorrow.';
        } else {
          errorMessage = 'Invalid API key. Please check your settings.';
        }
      } else if (data.error.code === 400) {
        errorMessage = 'Invalid request. Please check your API key.';
      }

      return {
        success: false,
        videos: [],
        error: errorMessage,
      };
    }

    // Parse and format results
    if (!data.items || data.items.length === 0) {
      return {
        success: true,
        videos: [],
        error: 'No videos found for this query',
      };
    }

    const videos: YouTubeVideo[] = data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    return {
      success: true,
      videos,
    };
  } catch (error) {
    console.error('YouTube search error:', error);
    return {
      success: false,
      videos: [],
      error: error instanceof Error ? error.message : 'Failed to search YouTube. Please try again.',
    };
  }
}
