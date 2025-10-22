import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { clearPersona } from '../../persona-storage';

interface DangerZoneSectionProps {
  onToast: (message: string, type?: 'success' | 'error') => void;
}

export function DangerZoneSection({ onToast }: DangerZoneSectionProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    await clearPersona();
    onToast('Persona deleted successfully!');
    setShowDeleteConfirm(false);
    // Reload page to trigger onboarding
    window.location.reload();
  };

  return (
    <section className="border-2 border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-950">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Danger Zone</h3>
      </div>
      <p className="text-sm text-red-600 dark:text-red-400 mb-4">
        Deleting your persona will remove all your profile data, skills, and learning history. This
        action cannot be undone.
      </p>
      {showDeleteConfirm ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
            Are you sure? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Yes, delete my persona
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          Delete Persona
        </button>
      )}
    </section>
  );
}
