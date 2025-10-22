// Conversation management module
// Handles storage and retrieval of conversation data

export interface ContentPart {
  type: 'text' | 'image';
  value: string; // For text: the text content. For image: base64 data URL
  src?: string; // Optional image source URL for display purposes
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

export interface Conversation {
  id: string;
  messages: ChatMessage[];
}

// Storage keys
const STORAGE_KEY_PREFIX = 'conversation_';

function getStorageKey(conversationId: string): string {
  return `${STORAGE_KEY_PREFIX}${conversationId}`;
}

/**
 * Creates a new conversation with an initial system message
 */
export async function createConversation(
  conversationId: string,
  systemMessage: string
): Promise<void> {
  const messages: ChatMessage[] = [{ role: 'system', content: systemMessage }];

  const conversation: Conversation = { id: conversationId, messages };

  await chrome.storage.session.set({
    [getStorageKey(conversationId)]: conversation,
  });
}

/**
 * Retrieves a conversation by ID
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const data = await chrome.storage.session.get(getStorageKey(conversationId));
  return data[getStorageKey(conversationId)] || null;
}

/**
 * Adds a message to an existing conversation
 */
export async function addMessage(conversationId: string, message: ChatMessage): Promise<void> {
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }

  conversation.messages.push(message);

  await chrome.storage.session.set({
    [getStorageKey(conversationId)]: conversation,
  });
}

/**
 * Clears a conversation from storage
 */
export async function clearConversation(conversationId: string): Promise<void> {
  await chrome.storage.session.remove(getStorageKey(conversationId));
}

/**
 * Gets all messages from a conversation
 */
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const conversation = await getConversation(conversationId);
  return conversation?.messages || [];
}
