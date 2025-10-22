export interface VideoRecommendation {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  videoUrl: string;
  reason: string;
}

export interface RecommendVideosResult {
  recommendations: VideoRecommendation[];
}

// ============================================================================
// Response Schema for Structured Output
// ============================================================================

export const videoRecommendationSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['id', 'reason'],
    additionalProperties: false,
    properties: {
      id: {
        type: 'string',
        description: 'YouTube video ID',
      },
      reason: {
        type: 'string',
        description:
          "Short, friendly explanation why this video matches the user's needs (15-20 words max)",
      },
    },
  },
  maxItems: 3,
  minItems: 1,
};

export const querySchema = {
  type: 'object',
  required: ['query'],
  properties: {
    query: {
      type: 'string',
      description: 'A concise YouTube search query (3-6 words) to find educational videos',
    },
  },
};

// Interface for AI model response (minimal data)
export interface AIVideoRecommendation {
  id: string;
  reason: string;
}

export interface VideoDataForModel {
  id: string;
  title: string;
  description: string;
}
