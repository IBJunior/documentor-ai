import { useState } from 'react';
import { AlertTriangle, Info, X, RotateCw, Download } from 'lucide-react';
import type { AllApiStatus } from '../../utils/api-checker';
import { triggerModelDownloads } from '../../utils/api-checker';
import { sidepanelLogger } from '../../utils/logger';

interface ApiStatusBannerProps {
  apiStatus: AllApiStatus;
  onRecheck: () => void;
}

export function ApiStatusBanner({ apiStatus, onRecheck }: ApiStatusBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  // Don't show banner if all APIs are available
  if (apiStatus.allAvailable) {
    sidepanelLogger.debug('ApiStatusBanner: Not showing - all APIs available');
    return null;
  }

  // Don't show if dismissed and at least one API is available
  if (isDismissed && apiStatus.anyAvailable) {
    sidepanelLogger.debug('ApiStatusBanner: Not showing - dismissed and some APIs available');
    return null;
  }

  const isCritical = !apiStatus.anyAvailable;
  const canDismiss = apiStatus.anyAvailable;

  // Handle enabling AI models
  async function handleEnableAI() {
    setIsEnabling(true);
    try {
      const result = await triggerModelDownloads();
      if (result.success) {
        console.log('Model downloads triggered successfully');
        // Wait a bit for downloads to start, then recheck
        setTimeout(() => {
          onRecheck();
          setIsEnabling(false);
        }, 1000);
      } else {
        console.error('Some models failed to download:', result.errors);
        setIsEnabling(false);
        // Still recheck to update status
        onRecheck();
      }
    } catch (error) {
      console.error('Failed to trigger downloads:', error);
      setIsEnabling(false);
    }
  }

  const getAffectedFeatures = () => {
    const features: string[] = [];

    if (apiStatus.languageModel.available === 'unavailable') {
      features.push(
        'AI Explanations',
        'Deep Analysis',
        'Reading Suggestions',
        'Video Recommendations'
      );
    }
    if (apiStatus.summarizer.available === 'unavailable') {
      features.push('Page Summary', 'Quick Scan');
    }
    if (apiStatus.writer.available === 'unavailable') {
      features.push('Cheat Sheet Generation');
    }

    // Remove duplicates
    return [...new Set(features)];
  };

  const getDownloadingApis = () => {
    const downloading: string[] = [];

    if (apiStatus.languageModel.available === 'downloading') {
      downloading.push('Prompt API');
    }
    if (apiStatus.summarizer.available === 'downloading') {
      downloading.push('Summarizer API');
    }
    if (apiStatus.writer.available === 'downloading') {
      downloading.push('Writer API');
    }

    return downloading;
  };

  const getApisNeedingDownload = () => {
    const needDownload: string[] = [];

    if (apiStatus.languageModel.available === 'downloadable') {
      needDownload.push('Prompt API');
    }
    if (apiStatus.summarizer.available === 'downloadable') {
      needDownload.push('Summarizer API');
    }
    if (apiStatus.writer.available === 'downloadable') {
      needDownload.push('Writer API');
    }

    return needDownload;
  };

  const affectedFeatures = getAffectedFeatures();
  const downloadingApis = getDownloadingApis();
  const apisNeedingDownload = getApisNeedingDownload();
  const showEnableButton = apisNeedingDownload.length > 0;

  // Log banner state for debugging
  sidepanelLogger.info('ApiStatusBanner rendering:', {
    showEnableButton,
    isCritical,
    canDismiss,
    apisNeedingDownload,
    apiStatuses: {
      languageModel: apiStatus.languageModel.available,
      summarizer: apiStatus.summarizer.available,
      writer: apiStatus.writer.available,
    },
  });

  return (
    <div
      className={`
        mx-4 my-4 rounded-lg border p-4
        ${
          isCritical
            ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
            : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isCritical ? (
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          ) : (
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-semibold mb-1 ${
              isCritical ? 'text-red-800 dark:text-red-300' : 'text-blue-800 dark:text-blue-300'
            }`}
          >
            {showEnableButton
              ? 'AI Models Need to be Downloaded'
              : isCritical
                ? 'Chrome AI APIs Not Available'
                : 'Some Chrome AI APIs Not Available'}
          </h3>

          <div
            className={`text-xs space-y-1 ${
              isCritical ? 'text-red-700 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'
            }`}
          >
            {showEnableButton && (
              <p>
                {apisNeedingDownload.join(', ')} need
                {apisNeedingDownload.length === 1 ? 's' : ''} to be downloaded. Click "Enable AI" to
                start the download. This is a one-time setup.
              </p>
            )}

            {downloadingApis.length > 0 && !showEnableButton && (
              <p>Downloading: {downloadingApis.join(', ')}. Please wait...</p>
            )}

            {affectedFeatures.length > 0 && !showEnableButton && !isCritical && (
              <p>Affected features: {affectedFeatures.join(', ')}</p>
            )}

            {isCritical && (
              <p>
                Sorry for the inconvenience. All AI features are currently unavailable in your
                browser.
              </p>
            )}

            {!showEnableButton && (
              <p>
                To use this extension, enable Chrome's built-in AI features.{' '}
                <a
                  href="https://developer.chrome.com/docs/ai/built-in"
                  className="underline hover:no-underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {showEnableButton ? (
            <button
              onClick={handleEnableAI}
              disabled={isEnabling}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white text-xs font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              {isEnabling ? 'Enabling...' : 'Enable AI'}
            </button>
          ) : (
            <button
              onClick={onRecheck}
              disabled={apiStatus.isChecking}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  isCritical
                    ? 'bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300'
                    : 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300'
                }
              `}
            >
              <RotateCw className="w-3.5 h-3.5" />
              {apiStatus.isChecking ? 'Checking...' : 'Check Again'}
            </button>
          )}

          {canDismiss && !showEnableButton && (
            <button
              onClick={() => setIsDismissed(true)}
              className={`
                p-1 rounded transition-colors cursor-pointer
                ${
                  isCritical
                    ? 'hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400'
                    : 'hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400'
                }
              `}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
