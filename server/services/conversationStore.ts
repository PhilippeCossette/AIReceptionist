import type { ChatMessage } from "../services/aiSercvice.ts";

interface ConversationEntry {
  messages: ChatMessage[];
  lastActivity: number;
}

const conversations = new Map<string, ConversationEntry>();
const CONVERSATION_TTL_MS = 30 * 60 * 1000; // 30 min idle = fresh thread next time
const MAX_HISTORY = 20; // cap tokens/cost on very long back-and-forths

export function getConversation(phoneNumber: string): ConversationEntry {
  const existing = conversations.get(phoneNumber);
  if (existing && Date.now() - existing.lastActivity < CONVERSATION_TTL_MS) {
    return existing;
  }
  const fresh: ConversationEntry = { messages: [], lastActivity: Date.now() };
  conversations.set(phoneNumber, fresh);
  return fresh;
}

export function appendMessage(
  phoneNumber: string,
  role: ChatMessage["role"],
  content: string,
) {
  const entry = getConversation(phoneNumber);
  entry.messages.push({ role, content });
  entry.lastActivity = Date.now();
  if (entry.messages.length > MAX_HISTORY) {
    entry.messages = entry.messages.slice(-MAX_HISTORY);
  }
}
