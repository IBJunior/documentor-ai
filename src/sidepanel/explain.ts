// Unified explanation module - handles both text and image explanations
import {
  createConversation,
  getConversation,
  addMessage,
  clearConversation,
  getMessages,
  type ChatMessage,
} from './conversation';
import { EXPLAINER_SYSTEM_PROMPT, formatPrompt, createImageMessage } from './prompts';
import { executePrompt } from './ai-session';
import { ensurePageSummary, formatPageArchitectureForAI } from './utils';
import { sidepanelLogger } from '../utils/logger';
import { ExplainOptions } from '../types/explain';
import { PageHeading } from '../types/extraction';

export const ELI_5_MESSAGE_PREFIX = "Can you explain this like I'm 5:\n\n";
export const EXPLAIN_MESSAGE_PREFIX = 'Can you explain this:\n\n';
export const IMAGE_EXPLANATION_PREFIX = 'Can you explain this image';

/**
 * Unified explanation function - handles both text and image explanations
 */
export async function explain(options: ExplainOptions): Promise<string> {
  const { context, content, action } = options;
  const { pageSummary, userPersona, pageTitle } = context;
  const startTime = Date.now();
  sidepanelLogger.info('Starting explanation', {
    action,
    hasText: !!content.text,
    hasImage: !!content.image,
  });
  sidepanelLogger.info('User persona', { userPersona });

  // Validate that either text or image is provided
  if (!content.text && !content.image) {
    throw new Error('Either text or image content must be provided');
  }

  // Ensure we have a summary (generate if needed)
  const finalSummary = await ensurePageSummary(pageSummary, pageTitle);

  // Create conversation ID
  const conversationId = `explain_${Date.now()}`;
  const storageData = await chrome.storage.session.get('pageArchitecture');
  const pageArchitecture = storageData.pageArchitecture as PageHeading[] | undefined;

  // Format architecture for AI model (limited to prevent token overflow)
  const formattedArchitecture = formatPageArchitectureForAI(pageArchitecture);
  // Format system prompt with user persona
  const systemMessage = formatPrompt(EXPLAINER_SYSTEM_PROMPT, {
    PAGE_SUMMARY: finalSummary,
    USER_PERSONA: userPersona || 'Not available',
    PAGE_ARCHITECTURE: formattedArchitecture || 'Not available',
  });
  sidepanelLogger.debug('System prompt', { systemMessage });

  // Initialize conversation
  await createConversation(conversationId, systemMessage);

  // Handle text-based content
  if (content.text) {
    // Prefix the message based on action type
    let userMessage: string;
    if (action === 'eli5') {
      userMessage = `${ELI_5_MESSAGE_PREFIX}${content.text}`;
    } else if (action === 'explain') {
      userMessage = `${EXPLAIN_MESSAGE_PREFIX}${content.text}`;
    } else {
      userMessage = content.text;
    }

    // Add user's message
    await addMessage(conversationId, {
      role: 'user',
      content: userMessage,
    });
  }
  // Handle image-based content
  else if (content.image) {
    await sidepanelLogger.info('Base64 image input', {
      base64Length: content.image.image.length,
    });

    // Create caption with image source
    let caption = IMAGE_EXPLANATION_PREFIX;
    if (content.image.imageAlt) {
      caption += `. Alt text: "${content.image.imageAlt}"`;
    }
    if (content.image.imageSrc) {
      caption += `\n\nImage source: ${content.image.imageSrc}`;
    }

    // Add user's image with caption
    const imageContent = createImageMessage(content.image.image, caption, content.image.imageSrc);

    await addMessage(conversationId, {
      role: 'user',
      content: imageContent,
    });
  }

  const endTime = Date.now();
  const duration = endTime - startTime;
  sidepanelLogger.info(`Explanation setup completed in ${duration / 1000} s`, {
    conversationId,
  });
  // Return conversationId immediately so UI can show user message
  return conversationId;
}

/**
 * Generate AI response for any explanation (text or image)
 */
export async function generateExplanationResponse(conversationId: string): Promise<void> {
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    throw new Error('Failed to retrieve conversation');
  }
  const startTime = Date.now();
  sidepanelLogger.info('Generating explanation response', {
    conversationId,
    messages: conversation.messages,
  });
  // Get AI response
  const response = await executePrompt(conversation.messages);
  const endTime = Date.now();
  const duration = endTime - startTime;
  sidepanelLogger.info(`Explanation response generated in ${duration / 1000} s`, {
    responseLength: response.length,
  });

  // Store assistant's response (this triggers storage listener in UI)
  await addMessage(conversationId, {
    role: 'assistant',
    content: response,
  });
}

/**
 * Ask follow-up question in any explanation conversation
 */
export async function askFollowUpQuestion(conversationId: string, question: string): Promise<void> {
  const startTime = Date.now();
  sidepanelLogger.info('Asking follow-up question', {
    conversationId,
    question,
  });
  // Retrieve existing conversation
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    throw new Error('No active conversation. Please start with an initial explanation first.');
  }

  // Add user's follow-up question immediately (triggers storage listener to show user message)
  await addMessage(conversationId, {
    role: 'user',
    content: question,
  });

  // Get updated conversation
  const updatedConversation = await getConversation(conversationId);
  if (!updatedConversation) {
    throw new Error('Failed to retrieve updated conversation');
  }

  // Get AI response with full conversation context
  const response = await executePrompt(updatedConversation.messages);

  // Store assistant's response (triggers storage listener to show AI response)
  await addMessage(conversationId, {
    role: 'assistant',
    content: response,
  });
  const endTime = Date.now();
  const duration = endTime - startTime;
  sidepanelLogger.info(`Follow-up response generated in ${duration / 1000} s`, {
    responseLength: response.length,
  });
}

/**
 * Reset/clear an explanation session
 */
export async function resetExplainSession(conversationId: string): Promise<void> {
  await clearConversation(conversationId);
}

/**
 * Get all messages from an explanation conversation
 */
export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  return getMessages(conversationId);
}
