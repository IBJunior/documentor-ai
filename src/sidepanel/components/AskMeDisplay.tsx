import { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowUp, Loader2 } from 'lucide-react';
import { getConversationMessages } from '../explain';
import { MarkdownContent } from './MarkdownContent';
import { FeatureHintsCards } from './FeatureHintsCards';
import type { ChatMessage } from '../conversation';

interface AskMeDisplayProps {
  isActive: boolean;
  action: string | null;
  conversationId: string | null;
  isLoading: boolean;
  loadingStatusMessage?: string;
  error: string | null;
  onStartChat: (message: string) => Promise<void>;
  onAskFollowUp: (question: string) => Promise<void>;
  firstMessage?: ChatMessage | null;
}

export function AskMeDisplay({
  isActive: _isActive,
  action,
  conversationId,
  isLoading,
  loadingStatusMessage,
  error,
  onStartChat,
  onAskFollowUp,
  firstMessage,
}: AskMeDisplayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [isChatModeEnabled, setIsChatModeEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from storage when conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadMessages();
    } else {
      console.log('First message:', firstMessage);
      if (firstMessage) {
        setMessages([firstMessage]);
      } else {
        setMessages([]);
      }
    }
  }, [conversationId, firstMessage]); // Remove input dependency

  // Listen for storage changes to update messages in real-time
  useEffect(() => {
    if (!conversationId) return;

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      namespace: string
    ) => {
      if (namespace === 'session') {
        const conversationKey = `conversation_${conversationId}`;
        if (changes[conversationKey]) {
          loadMessages();
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [conversationId]);

  async function loadMessages() {
    if (!conversationId) return;

    try {
      const loadedMessages = await getConversationMessages(conversationId);
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show empty state if no action or conversation and chat mode not enabled
  if (!action && !conversationId && !isChatModeEnabled) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Sparkles className="w-16 h-16 text-primary-500 dark:text-primary-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
          AI Documentation Assistant
        </h3>
        <p className="text-base text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          Break down complex documentation with AI assistance:
        </p>

        {/* Feature hints cards */}
        <div className="w-full max-w-2xl mb-8">
          <FeatureHintsCards variant="default" />
        </div>

        <button
          onClick={() => setIsChatModeEnabled(true)}
          className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 border border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
        >
          Start a free-form chat
          <span className="text-xs">→</span>
        </button>
      </div>
    );
  }

  // Filter out system messages for display
  const displayMessages = messages.filter((msg) => msg.role !== 'system');

  const handleSend = async () => {
    if (!input.trim() || isAsking) return;

    const question = input.trim();
    setInput('');

    setIsAsking(true);

    try {
      // If no conversation exists, start a new chat
      if (!conversationId) {
        // Show user message immediately
        setMessages([{ role: 'user', content: question }]);
        await onStartChat(question);
        setIsChatModeEnabled(false); // Reset chat mode after starting
      } else {
        // Add user message immediately for follow-ups
        setMessages((prev) => [...prev, { role: 'user', content: question }]);
        await onAskFollowUp(question);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsAsking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper function to render message content
  const renderMessageContent = (msg: ChatMessage) => {
    // Handle string content (text-only messages)
    if (typeof msg.content === 'string') {
      if (msg.role === 'assistant') {
        return <MarkdownContent content={msg.content} />;
      }
      return <div className="text-lg">{msg.content}</div>;
    }

    // Handle multimodal content (array of ContentParts)
    return (
      <div className="space-y-2">
        {msg.content.map((part, partIdx) => {
          if (part.type === 'text') {
            return (
              <div key={partIdx} className="text-lg">
                {part.value}
              </div>
            );
          } else if (part.type === 'image') {
            const imageUrl = part.src || part.value;
            return (
              <img
                key={partIdx}
                src={imageUrl}
                alt="Uploaded image"
                className="max-w-full rounded-lg mt-2 shadow-sm"
              />
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[600px]">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {displayMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-lg break-words ${
                msg.role === 'user'
                  ? 'bg-primary-500 dark:bg-primary-600 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-700'
              }`}
            >
              {renderMessageContent(msg)}
            </div>
          </div>
        ))}

        {(isLoading || isAsking) && !firstMessage && (
          <div className="flex w-full justify-start">
            <div className="max-w-[80%] px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-lg">{loadingStatusMessage || 'Thinking...'}</span>
              </div>
            </div>
          </div>
        )}

        {(isLoading || isAsking) && firstMessage && messages.length > 0 && (
          <div className="flex w-full justify-start">
            <div className="max-w-[80%] px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-lg">{loadingStatusMessage || 'Thinking...'}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-l-4 border-red-500 rounded-r-lg text-sm">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus-within:border-primary-500 dark:focus-within:border-primary-400 transition-colors min-h-[52px]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={conversationId ? 'Ask a follow-up question...' : 'Type your message...'}
            rows={2}
            disabled={isAsking || isLoading}
            className="w-full px-4 py-3.5 pr-14 bg-transparent text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none max-h-[120px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isAsking || isLoading}
            className="absolute right-2.5 bottom-2.5 h-9 w-9 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500 dark:disabled:hover:bg-primary-600 flex items-center justify-center"
            aria-label="Send message"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
