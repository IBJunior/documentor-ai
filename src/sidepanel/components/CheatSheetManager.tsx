import { useState, useEffect } from 'react';
import { Download, Trash2, FolderDown } from 'lucide-react';
import {
  getSavedCheatSheets,
  deleteCheatSheet,
  exportCheatSheetAsFile,
  exportAllCheatSheets,
  clearAllCheatSheets,
} from '../cheat-sheet-storage';
import type { SavedCheatSheet } from '../cheat-sheet-storage';

interface CheatSheetManagerProps {
  onToast: (message: string, type?: 'success' | 'error') => void;
}

export function CheatSheetManager({ onToast }: CheatSheetManagerProps) {
  const [savedCheatSheets, setSavedCheatSheets] = useState<SavedCheatSheet[]>([]);
  const [showCheatSheetConfirm, setShowCheatSheetConfirm] = useState(false);

  // Load cheat sheets on mount
  useEffect(() => {
    getSavedCheatSheets().then(setSavedCheatSheets);
  }, []);

  const handleDeleteCheatSheet = async (id: string) => {
    const success = await deleteCheatSheet(id);
    if (success) {
      setSavedCheatSheets((prev) => prev.filter((sheet) => sheet.id !== id));
      onToast('Cheat sheet deleted successfully!');
    } else {
      onToast('Failed to delete cheat sheet', 'error');
    }
  };

  const handleExportCheatSheet = (cheatSheet: SavedCheatSheet) => {
    exportCheatSheetAsFile(cheatSheet);
    onToast('Cheat sheet exported successfully!');
  };

  const handleExportAllCheatSheets = async () => {
    try {
      await exportAllCheatSheets();
      onToast('All cheat sheets exported successfully!');
    } catch (error) {
      onToast((error as Error).message, 'error');
    }
  };

  const handleClearAllCheatSheets = async () => {
    if (!showCheatSheetConfirm) {
      setShowCheatSheetConfirm(true);
      return;
    }

    await clearAllCheatSheets();
    setSavedCheatSheets([]);
    setShowCheatSheetConfirm(false);
    onToast('All cheat sheets cleared successfully!');
  };

  return (
    <section className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Saved Cheat Sheets
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Your generated cheat sheets are automatically saved here. Export them individually or all at
        once.
      </p>

      {savedCheatSheets.length > 0 ? (
        <>
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleExportAllCheatSheets}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export All
            </button>
            {showCheatSheetConfirm ? (
              <>
                <button
                  onClick={() => setShowCheatSheetConfirm(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAllCheatSheets}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Yes, clear all
                </button>
              </>
            ) : (
              <button
                onClick={handleClearAllCheatSheets}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {savedCheatSheets.map((cheatSheet) => (
              <div
                key={cheatSheet.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {cheatSheet.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {cheatSheet.domain} • {new Date(cheatSheet.createdAt).toLocaleDateString()}
                      {cheatSheet.readingTime && ` • ${cheatSheet.readingTime}`}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleExportCheatSheet(cheatSheet)}
                      className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      title="Export"
                    >
                      <FolderDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCheatSheet(cheatSheet.id)}
                      className="p-1.5 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {cheatSheet.content.slice(0, 200)}...
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No cheat sheets saved yet. Generate a cheat sheet from any webpage to see it here!
        </p>
      )}
    </section>
  );
}
