/**
 * Storage utilities for YouTube API key management
 * Stores API key in chrome.storage.local for persistence
 */

const YOUTUBE_API_KEY_STORAGE_KEY = 'youtube_api_key';

/**
 * Save YouTube API key to storage
 * @param apiKey - The YouTube Data API v3 key
 */
export async function saveYouTubeApiKey(apiKey: string): Promise<void> {
  await chrome.storage.local.set({
    [YOUTUBE_API_KEY_STORAGE_KEY]: apiKey.trim(),
  });
}

/**
 * Retrieve YouTube API key from storage
 * @returns The stored API key, or empty string if not found
 */
export async function getYouTubeApiKey(): Promise<string> {
  const result = await chrome.storage.local.get(YOUTUBE_API_KEY_STORAGE_KEY);
  return result[YOUTUBE_API_KEY_STORAGE_KEY] || '';
}

/**
 * Check if YouTube API key is configured
 * @returns True if API key exists in storage
 */
export async function hasYouTubeApiKey(): Promise<boolean> {
  const apiKey = await getYouTubeApiKey();
  return apiKey.length > 0;
}

/**
 * Clear YouTube API key from storage
 */
export async function clearYouTubeApiKey(): Promise<void> {
  await chrome.storage.local.remove(YOUTUBE_API_KEY_STORAGE_KEY);
}
