import { useState, useRef } from 'react';
import {
  explain,
  generateExplanationResponse,
  askFollowUpQuestion,
  ELI_5_MESSAGE_PREFIX,
  EXPLAIN_MESSAGE_PREFIX,
  IMAGE_EXPLANATION_PREFIX,
} from '../explain';
import { addMessage, ChatMessage } from '../conversation';
import { createImageMessage } from '../prompts';
import { getPersonaSummary } from '../context';
import { sidepanelLogger } from '../../utils/logger';

export function useExplanationState() {
  const [selectionAction, setSelectionAction] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);
  const [loadingStatusMessage, setLoadingStatusMessage] = useState<string>('');
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [firstMessage, setFirstMessage] = useState<ChatMessage | null>(null);

  // Ref to track conversationId synchronously (avoids stale closure issues)
  const conversationIdRef = useRef<string | null>(null);

  // Helper function to create message content
  function createMessageContent(
    action: string,
    selectedText?: string,
    imageBase64?: string,
    imageSrc?: string,
    imageAlt?: string
  ): ChatMessage {
    if (selectedText) {
      let messageContent: string;
      if (action === 'eli5') {
        messageContent = `${ELI_5_MESSAGE_PREFIX}${selectedText}`;
      } else if (action === 'explain') {
        messageContent = `${EXPLAIN_MESSAGE_PREFIX}${selectedText}`;
      } else {
        messageContent = selectedText;
      }
      return { role: 'user', content: messageContent };
    } else if (imageBase64) {
      let caption = IMAGE_EXPLANATION_PREFIX;
      if (imageAlt) {
        caption += `. Alt text: "${imageAlt}"`;
      }
      if (imageSrc) {
        caption += `\n\nImage source: ${imageSrc}`;
      }

      const imageContent = createImageMessage(imageBase64, caption, imageSrc);
      return { role: 'user', content: imageContent };
    } else {
      throw new Error('No content provided for message creation');
    }
  }

  async function handleExplainAction(
    action: string,
    selectedText?: string,
    imageBase64?: string,
    imageSrc?: string,
    imageAlt?: string
  ) {
    try {
      setIsExplanationLoading(true);
      setExplanationError(null);

      let currentConversationId = conversationIdRef.current;

      console.log('handleExplainAction - conversationIdRef.current:', conversationIdRef.current);
      console.log('handleExplainAction - action:', action);

      // If there's an existing conversation, add message to it
      if (conversationIdRef.current) {
        console.log('Adding to existing conversation:', conversationIdRef.current);

        const message = createMessageContent(action, selectedText, imageBase64, imageSrc, imageAlt);
        setFirstMessage(message);
        setLoadingStatusMessage('🤔 Brewing up an answer...');
        await addMessage(conversationIdRef.current, message);
      } else {
        // No existing conversation - create a new one
        console.log('Creating new conversation');
        const data = await chrome.storage.session.get(['pageUrl', 'pageSummary', 'pageTitle']);
        const pageUrl = data.pageUrl || '';
        const pageSummary = data.pageSummary || '';
        const pageTitle = data.pageTitle || '';

        // Set first message immediately for display
        const message = createMessageContent(action, selectedText, imageBase64, imageSrc, imageAlt);
        setFirstMessage(message);

        // Show appropriate status based on whether summary exists
        if (!pageSummary) {
          setLoadingStatusMessage('Speed-reading the docs...');
        } else {
          setLoadingStatusMessage('Warming up the AI...');
        }

        // Get persona summary for AI context
        const userPersona = await getPersonaSummary();

        currentConversationId = await explain({
          context: {
            pageUrl,
            pageSummary,
            pageTitle,
            userPersona,
          },
          content: selectedText
            ? { text: selectedText }
            : imageBase64
              ? {
                  image: {
                    image: imageBase64,
                    imageAlt,
                    imageSrc,
                  },
                }
              : (() => {
                  throw new Error('No content provided for explanation');
                })(),
          action:
            action === 'eli5' || action === 'explain' || action === 'explain-image'
              ? action
              : undefined,
        });

        // Update both state and ref
        setConversationId(currentConversationId);
        conversationIdRef.current = currentConversationId;
      }

      // Generate AI response asynchronously
      if (currentConversationId) {
        const startTime = Date.now();
        setLoadingStatusMessage('🤔 Brewing up an answer...');
        await generateExplanationResponse(currentConversationId);
        const endTime = Date.now();
        const duration = endTime - startTime;
        sidepanelLogger.info(
          `[useExplanationState] Explanation generation completed in ${duration / 1000} s`
        );
      }
    } catch (error) {
      setExplanationError('Failed to generate explanation: ' + (error as Error).message);
      console.error('Explain error:', error);
    } finally {
      setIsExplanationLoading(false);
    }
  }

  async function handleStartChat(message: string) {
    const startTime = Date.now();

    try {
      setIsExplanationLoading(true);
      setExplanationError(null);
      setSelectionAction('general-chat');
      sidepanelLogger.info('Starting new chat with message:', { message });

      setFirstMessage({ role: 'user', content: message });
      // Get page context
      const data = await chrome.storage.session.get(['pageUrl', 'pageSummary', 'pageTitle']);
      const pageUrl = data.pageUrl || '';
      const pageSummary = data.pageSummary || '';
      const pageTitle = data.pageTitle || '';

      // Show appropriate status based on whether summary exists
      if (!pageSummary) {
        setLoadingStatusMessage('Speed-reading the docs...');
      } else {
        setLoadingStatusMessage('Warming up the AI...');
      }

      // Get persona summary for AI context
      const userPersona = await getPersonaSummary();

      // Create new conversation with the first message
      const newConversationId = await explain({
        context: {
          pageUrl,
          pageSummary,
          pageTitle,
          userPersona,
        },
        content: { text: message },
        action: undefined,
      });

      // Update both state and ref
      setConversationId(newConversationId);
      conversationIdRef.current = newConversationId;

      // Generate AI response
      setLoadingStatusMessage('🤔 Brewing up an answer...');
      await generateExplanationResponse(newConversationId);
    } catch (error) {
      setExplanationError('Failed to start chat: ' + (error as Error).message);
      console.error('Start chat error:', error);
    } finally {
      setIsExplanationLoading(false);
      const endTime = Date.now();
      const duration = endTime - startTime;
      sidepanelLogger.info(`[useExplanationState] New chat started in ${duration / 1000} s`);
    }
  }

  async function handleAskFollowUp(question: string) {
    if (!conversationId) {
      setExplanationError('No active conversation');
      return;
    }

    try {
      setIsExplanationLoading(true);
      setExplanationError(null);
      setLoadingStatusMessage('🤔 Brewing up an answer...');

      // Use unified follow-up handler (works for both text and image)
      await askFollowUpQuestion(conversationId, question);

      // Messages will be updated via storage listener in AskMeTab
    } catch (error) {
      setExplanationError('Failed to get response: ' + (error as Error).message);
      console.error('Follow-up question error:', error);
    } finally {
      setIsExplanationLoading(false);
    }
  }

  return {
    // State
    selectionAction,
    conversationId,
    isExplanationLoading,
    loadingStatusMessage,
    explanationError,
    firstMessage,

    // Actions
    setSelectionAction,
    handleExplainAction,
    handleStartChat,
    handleAskFollowUp,
  };
}
