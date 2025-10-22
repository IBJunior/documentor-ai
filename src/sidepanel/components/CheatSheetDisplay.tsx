import { useState } from 'react';
import { Save, Download, Loader2 } from 'lucide-react';
import { useCheatSheetState } from '../hooks/useCheatSheetState';
import { PageHeader } from './PageHeader';
import { SummaryCard } from './SummaryCard';
import { exportCheatSheetAsFile, saveCheatSheet } from '../cheat-sheet-storage';
import type { SavedCheatSheet } from '../cheat-sheet-storage';
import { ContentTooLongError } from './ContentTooLongError';

interface CheatSheetDisplayProps {
  isActive?: boolean;
}

export function CheatSheetDisplay({ isActive }: CheatSheetDisplayProps) {
  const {
    cheatSheet,
    pageTitle,
    readingTime,
    isLoading,
    loadingStatusMessage,
    error,
    currentUrl,
    restart,
    cheatSheetDuration,
    isContentTooLong,
  } = useCheatSheetState({ isActive });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!cheatSheet || !pageTitle || !currentUrl) return;

    setIsExporting(true);
    try {
      const cheatSheetData: SavedCheatSheet = {
        id: Date.now().toString(),
        title: pageTitle,
        content: cheatSheet,
        url: currentUrl,
        domain: new URL(currentUrl).hostname.replace('www.', ''),
        createdAt: new Date().toISOString(),
        readingTime: readingTime || undefined,
      };

      exportCheatSheetAsFile(cheatSheetData);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveCheatSheet = async () => {
    if (cheatSheet && pageTitle && currentUrl) {
      try {
        await saveCheatSheet(pageTitle, cheatSheet, currentUrl, readingTime || undefined);
      } catch (error) {
        console.error('Failed to auto-save cheat sheet:', error);
      }
    }
  };

  // Show error if present
  if (error && !cheatSheet) {
    return (
      <div className="p-6">
        {isContentTooLong ? (
          <ContentTooLongError />
        ) : (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}
      </div>
    );
  }

  // Show loading state with animated spinner
  if (isLoading && !cheatSheet) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">{loadingStatusMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Header with title, reading time, and restart button */}
      <PageHeader
        title={pageTitle}
        readingTime={readingTime}
        onRestart={restart}
        scanDuration={cheatSheetDuration}
        restartTitle="Restart Cheat Sheet"
      />

      {/* Action Buttons - Top Position for Quick Access */}
      {cheatSheet && (
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={handleSaveCheatSheet}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-700"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export as Markdown</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Cheat Sheet content with compact headings */}
      <SummaryCard content={cheatSheet} size="compact" />
    </>
  );
}
