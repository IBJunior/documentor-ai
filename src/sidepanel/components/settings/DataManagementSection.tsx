import { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import type { UserPersona } from '../../../types/persona';
import { exportPersona, importPersona } from '../../persona-storage';

interface DataManagementSectionProps {
  persona: UserPersona;
  onPersonaUpdate: (persona: UserPersona) => void;
  onToast: (message: string, type?: 'success' | 'error') => void;
}

export function DataManagementSection({
  persona,
  onPersonaUpdate,
  onToast,
}: DataManagementSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (!persona) {
      onToast('No persona to export', 'error');
      return;
    }
    exportPersona(persona);
    onToast('Persona exported successfully!');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importPersona(file);
      onPersonaUpdate(imported);
      onToast('Persona imported successfully!');
    } catch (error) {
      onToast(`Import failed: ${(error as Error).message}`, 'error');
    }

    // Reset file input
    e.target.value = '';
  };

  return (
    <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Data Management
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Your persona is automatically synced across all your Chrome browsers. Export for backup or
        to share across different accounts.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Export Persona
        </button>
        <button
          onClick={handleImportClick}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          Import Persona
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </section>
  );
}
