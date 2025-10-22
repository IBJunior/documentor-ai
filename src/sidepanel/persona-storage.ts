// User Persona Storage Module
// Handles saving, loading, and exporting/importing persona data

import type { UserPersona } from '../types/persona';

const PERSONA_STORAGE_KEY = 'userPersona';

/**
 * Save persona to Chrome storage (sync with fallback to local)
 */
export async function savePersona(persona: UserPersona): Promise<void> {
  persona.updatedAt = new Date().toISOString();

  try {
    // Try sync storage first (auto-syncs across Chrome browsers)
    await chrome.storage.sync.set({
      [PERSONA_STORAGE_KEY]: persona,
    });
  } catch (error) {
    console.warn('Sync storage full or unavailable, using local storage:', error);
    // Fallback to local storage
    await chrome.storage.local.set({
      [PERSONA_STORAGE_KEY]: persona,
    });
  }
}

/**
 * Load persona from Chrome storage (checks both sync and local)
 */
export async function loadPersona(): Promise<UserPersona | null> {
  // Try sync storage first
  const syncData = await chrome.storage.sync.get(PERSONA_STORAGE_KEY);
  if (syncData[PERSONA_STORAGE_KEY]) {
    return syncData[PERSONA_STORAGE_KEY] as UserPersona;
  }

  // Fallback to local storage
  const localData = await chrome.storage.local.get(PERSONA_STORAGE_KEY);
  if (localData[PERSONA_STORAGE_KEY]) {
    return localData[PERSONA_STORAGE_KEY] as UserPersona;
  }

  return null;
}

/**
 * Check if persona exists
 */
export async function hasPersona(): Promise<boolean> {
  const persona = await loadPersona();
  return persona !== null;
}

/**
 * Clear persona from storage (for reset/logout)
 */
export async function clearPersona(): Promise<void> {
  await chrome.storage.sync.remove(PERSONA_STORAGE_KEY);
  await chrome.storage.local.remove(PERSONA_STORAGE_KEY);
}

/**
 * Export persona as JSON file download
 */
export function exportPersona(persona: UserPersona): void {
  // Create clean export (remove pending updates, clean sensitive data)
  const exportData = {
    ...persona,
    suggestedUpdates: persona.suggestedUpdates.filter((u) => u.status === 'accepted'),
    exportedAt: new Date().toISOString(),
    exportVersion: '1.0',
  };

  // Convert to JSON
  const json = JSON.stringify(exportData, null, 2);

  // Create blob
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Trigger download
  const a = document.createElement('a');
  a.href = url;
  const timestamp = new Date().toISOString().split('T')[0];
  a.download = `documentor-persona-${timestamp}.json`;
  document.body.appendChild(a);
  a.click();

  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('Persona exported successfully');
}

/**
 * Import persona from JSON file
 */
export async function importPersona(file: File): Promise<UserPersona> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content);

        // Validate structure
        if (!validatePersonaStructure(imported)) {
          throw new Error('Invalid persona file structure');
        }

        // Migrate if needed (version compatibility)
        const migrated = migratePersonaVersion(imported);

        // Update timestamps
        migrated.updatedAt = new Date().toISOString();

        // Save to storage
        await savePersona(migrated);

        resolve(migrated);
      } catch (error) {
        reject(new Error(`Failed to import persona: ${(error as Error).message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Validate persona structure
 */
function validatePersonaStructure(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    data.version &&
    data.profile &&
    Array.isArray(data.skills) &&
    Array.isArray(data.learningGoals) &&
    data.preferredLearningStyle &&
    data.usage
  );
}

/**
 * Migrate persona to current version
 */
function migratePersonaVersion(data: any): UserPersona {
  // Future: handle version migrations
  // For now, just return as-is if valid
  return data as UserPersona;
}

/**
 * Create a minimal default persona (for skip flow)
 */
export function createMinimalPersona(): UserPersona {
  const now = new Date().toISOString();

  return {
    version: '1.0',
    createdAt: now,
    updatedAt: now,
    profile: {
      role: 'other',
    },
    skills: [],
    learningGoals: [],
    preferredLearningStyle: 'mixed',
    usage: {
      totalDocsAnalyzed: 0,
      topicsExplored: [],
      lastActiveDate: now,
      firstUseDate: now,
      skillLevelUps: [],
    },
    suggestedUpdates: [],
  };
}
