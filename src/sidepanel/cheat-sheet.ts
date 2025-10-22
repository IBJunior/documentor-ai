import { PageLink } from '../types/extraction';
import { getPersonaSummary } from './context';
import { CHEAT_SHEET_PROMPT_TEMPLATE, formatPrompt } from './prompts';
import { validateWriterContent } from './utils/content-validation';
import { generateWriting } from './write';

export async function generateCheatSheet(
  pageContent: string,
  pageLinks: PageLink[]
): Promise<string> {
  const userPersona = await getPersonaSummary();
  const cheatSheetPrompt = getCheatSheetPrompt(pageContent, pageLinks);
  return await generateWriting(cheatSheetPrompt, {
    sharedContext: userPersona,
    tone: 'neutral',
    format: 'markdown',
    length: 'medium',
  });
}

export async function validateCheatSheetPrompt(
  pageContent: string,
  pageLinks: PageLink[]
): Promise<{
  isValid: boolean;
  message?: string;
  tokens?: number;
  quota?: number;
}> {
  const userPersona = await getPersonaSummary();
  const cheatSheetPrompt = getCheatSheetPrompt(pageContent, pageLinks);
  return validateWriterContent(cheatSheetPrompt, {
    sharedContext: userPersona,
    tone: 'neutral',
    format: 'markdown',
    length: 'medium',
  });
}

export function getCheatSheetPrompt(pageContent: string, pageLinks: PageLink[]): string {
  return formatPrompt(CHEAT_SHEET_PROMPT_TEMPLATE, {
    PAGE_CONTENT: pageContent,
    LINKS:
      pageLinks.length > 0
        ? pageLinks.map((link) => `- [${link.text}](${link.url})`).join('\n')
        : 'None',
  });
}
