import { useState, useEffect } from 'react';
import { Youtube, Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { getYouTubeApiKey, saveYouTubeApiKey, clearYouTubeApiKey } from '../../youtube-api-storage';

interface YouTubeIntegrationSectionProps {
  onToast: (message: string, type?: 'success' | 'error') => void;
}

export function YouTubeIntegrationSection({ onToast }: YouTubeIntegrationSectionProps) {
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Load YouTube API key status on mount
  useEffect(() => {
    getYouTubeApiKey().then((key) => {
      setHasApiKey(key.length > 0);
      setYoutubeApiKey(key);
    });
  }, []);

  const handleSaveApiKey = async () => {
    if (!youtubeApiKey.trim()) {
      onToast('Please enter an API key', 'error');
      return;
    }

    await saveYouTubeApiKey(youtubeApiKey);
    setHasApiKey(true);
    onToast('YouTube API key saved successfully!');
  };

  const handleClearApiKey = async () => {
    await clearYouTubeApiKey();
    setYoutubeApiKey('');
    setHasApiKey(false);
    onToast('YouTube API key cleared');
  };

  return (
    <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
      <div className="flex items-center gap-2 mb-2">
        <Youtube className="w-5 h-5 text-red-600 dark:text-red-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          YouTube Integration
        </h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Enable video recommendations by adding your YouTube Data API v3 key.{' '}
        <a
          href="https://console.cloud.google.com/apis/credentials"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300"
        >
          Get an API key here
        </a>{' '}
        (free: 10,000 units/day)
      </p>
      {hasApiKey && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg mb-3">
          <span className="text-green-700 dark:text-green-300 text-sm font-medium">
            ✓ API key is configured
          </span>
        </div>
      )}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={youtubeApiKey}
            onChange={(e) => setYoutubeApiKey(e.target.value)}
            placeholder="Enter your YouTube API key"
            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 text-sm font-mono placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
          />
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            title={showApiKey ? 'Hide API key' : 'Show API key'}
          >
            {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveApiKey}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save API Key
          </button>
          {hasApiKey && (
            <button
              onClick={handleClearApiKey}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear API Key
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
