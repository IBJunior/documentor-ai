import { useState } from 'react';
import { Settings as SettingsIcon, X } from 'lucide-react';
import type { UserPersona } from '../../types/persona';
import { CheatSheetManager } from './CheatSheetManager';
import { ProfileSection } from './settings/ProfileSection';
import { DataManagementSection } from './settings/DataManagementSection';
import { YouTubeIntegrationSection } from './settings/YouTubeIntegrationSection';
import { PrivacySection } from './settings/PrivacySection';
import { DangerZoneSection } from './settings/DangerZoneSection';

interface SettingsProps {
  persona: UserPersona | null;
  onPersonaUpdate: (persona: UserPersona) => void;
  onClose: () => void;
  onEditPersona: () => void;
}

export function Settings({ persona, onPersonaUpdate, onClose, onEditPersona }: SettingsProps) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (!persona) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400">No persona data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
          aria-label="Close settings"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {toast && (
        <div
          className={`
            mx-6 mt-4 p-4 rounded-lg text-sm font-medium
            ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                : 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
            }
          `}
        >
          {toast.message}
        </div>
      )}

      <div className="p-6 space-y-6">
        <ProfileSection persona={persona} onEditPersona={onEditPersona} />

        <DataManagementSection
          persona={persona}
          onPersonaUpdate={onPersonaUpdate}
          onToast={showToast}
        />

        <YouTubeIntegrationSection onToast={showToast} />

        <CheatSheetManager onToast={showToast} />

        <PrivacySection />

        <DangerZoneSection onToast={showToast} />
      </div>
    </div>
  );
}
