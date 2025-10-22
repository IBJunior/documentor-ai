// Cheat Sheet Storage Module
// Handles saving, retrieving, and managing cheat sheets

export interface SavedCheatSheet {
  id: string;
  title: string;
  content: string;
  url: string;
  domain: string;
  createdAt: string;
  readingTime?: string;
}

const STORAGE_KEY = 'savedCheatSheets';

/**
 * Save a cheat sheet to storage
 */
export async function saveCheatSheet(
  title: string,
  content: string,
  url: string,
  readingTime?: string
): Promise<string> {
  const cheatSheet: SavedCheatSheet = {
    id: generateCheatSheetId(),
    title: title || 'Untitled Cheat Sheet',
    content,
    url,
    domain: getDomainFromUrl(url),
    createdAt: new Date().toISOString(),
    readingTime,
  };

  const existingCheatSheets = await getSavedCheatSheets();
  const updatedCheatSheets = [cheatSheet, ...existingCheatSheets];

  await chrome.storage.local.set({ [STORAGE_KEY]: updatedCheatSheets });
  return cheatSheet.id;
}

/**
 * Get all saved cheat sheets
 */
export async function getSavedCheatSheets(): Promise<SavedCheatSheet[]> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] || [];
}

/**
 * Delete a cheat sheet by ID
 */
export async function deleteCheatSheet(id: string): Promise<boolean> {
  const cheatSheets = await getSavedCheatSheets();
  const filteredCheatSheets = cheatSheets.filter((sheet) => sheet.id !== id);

  if (filteredCheatSheets.length === cheatSheets.length) {
    return false; // Cheat sheet not found
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: filteredCheatSheets });
  return true;
}

/**
 * Clear all saved cheat sheets
 */
export async function clearAllCheatSheets(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}

/**
 * Export a cheat sheet as a markdown file
 */
export function exportCheatSheetAsFile(cheatSheet: SavedCheatSheet): void {
  const filename = sanitizeFilename(`${cheatSheet.title}.md`);
  const content = formatCheatSheetForExport(cheatSheet);

  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

/**
 * Export all cheat sheets as a single markdown file
 */
export async function exportAllCheatSheets(): Promise<void> {
  const cheatSheets = await getSavedCheatSheets();

  if (cheatSheets.length === 0) {
    throw new Error('No cheat sheets to export');
  }

  const content = [
    '# My Cheat Sheets Collection',
    '',
    `Generated on: ${new Date().toLocaleDateString()}`,
    `Total cheat sheets: ${cheatSheets.length}`,
    '',
    '---',
    '',
    ...cheatSheets.map((sheet) => formatCheatSheetForExport(sheet, true)).join('\n\n---\n\n'),
  ].join('\n');

  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-cheat-sheets-collection.md';
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

/**
 * Generate a unique ID for a cheat sheet
 */
function generateCheatSheetId(): string {
  return Date.now().toString(36);
}

/**
 * Extract domain from URL
 */
function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

/**
 * Sanitize filename for download
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9\-_.]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Format cheat sheet content for export
 */
function formatCheatSheetForExport(cheatSheet: SavedCheatSheet, includeMetadata = true): string {
  const parts: string[] = [];

  if (includeMetadata) {
    parts.push(`## ${cheatSheet.title}`);
    parts.push('');
    parts.push(`**Source:** ${cheatSheet.url}`);
    parts.push(`**Domain:** ${cheatSheet.domain}`);
    parts.push(`**Created:** ${new Date(cheatSheet.createdAt).toLocaleDateString()}`);
    if (cheatSheet.readingTime) {
      parts.push(`**Reading Time:** ${cheatSheet.readingTime}`);
    }
    parts.push('');
  }

  parts.push(cheatSheet.content);

  return parts.join('\n');
}
